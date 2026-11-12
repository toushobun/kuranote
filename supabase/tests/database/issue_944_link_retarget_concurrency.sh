#!/usr/bin/env bash
set -euo pipefail

# #944：两笔退款并发从 A→B / B→A 交叉改选，验证锁等待而非死锁。
# 使用 seed 现有原支出 9240、9242 和退款收入 9241、9243。
if ! supabase db reset > /tmp/issue-944-retarget-db-reset.log 2>&1; then
  cat /tmp/issue-944-retarget-db-reset.log >&2
  exit 1
fi

readonly ledger_id="00000000-0000-4000-8000-000000000032"
readonly income_a_id="00000000-0000-4000-8000-000000009241"
readonly record_a_id="00000000-0000-4000-8000-000000009038"
readonly income_b_id="00000000-0000-4000-8000-000000009243"
readonly record_b_id="00000000-0000-4000-8000-000000009040"
readonly expense_a_id="00000000-0000-4000-8000-000000009240"
readonly expense_b_id="00000000-0000-4000-8000-000000009242"
readonly lock_marker="/tmp/issue-944-retarget-a-locked"
readonly release_marker="/tmp/issue-944-retarget-a-release"

project_id="$(sed -n 's/^[[:space:]]*project_id[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' supabase/config.toml | head -n 1)"
if [[ -z "$project_id" ]]; then
  echo "无法读取本地 Supabase project_id。" >&2
  exit 1
fi
readonly project_id
readonly db_container="supabase_db_$project_id"

if [[ "$(docker inspect -f '{{.State.Running}}' "$db_container" 2>/dev/null || true)" != "true" ]]; then
  echo "找不到运行中的 Supabase DB 容器：$db_container" >&2
  exit 1
fi

psql_in_db() {
  docker exec -i "$db_container" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

a_pid=""
b_pid=""
cleanup() {
  docker exec "$db_container" touch "$release_marker" >/dev/null 2>&1 || true
  if [[ -n "$a_pid" ]]; then kill "$a_pid" 2>/dev/null || true; fi
  if [[ -n "$b_pid" ]]; then kill "$b_pid" 2>/dev/null || true; fi
  docker exec "$db_container" rm -f "$lock_marker" "$release_marker" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker exec "$db_container" rm -f "$lock_marker" "$release_marker"

run_retarget() {
  local app_name="$1"
  local source_id="$2"
  local record_id="$3"
  local new_target_id="$4"
  local pause_after_update="$5"

  {
    cat <<SQL
begin;
set application_name = '$app_name';
set statement_timeout = '20s';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000034","role":"authenticated"}',
  true
);
select public.update_linked_transaction_edit(
  '$ledger_id',
  '$record_id',
  (select transaction_at from public.transaction_record where id = '$record_id'),
  (select merchant_id from public.transaction_record where id = '$record_id'),
  (select note from public.transaction_record where id = '$record_id'),
  (select jsonb_build_array(jsonb_build_object(
    'transactionItemId', id,
    'expectedUpdatedAt', updated_at,
    'amount', amount,
    'categoryId', category_id,
    'refundedItemId', '$new_target_id'
  )) from public.transaction_item where id = '$source_id'),
  tests.current_transaction_payments('$record_id'),
  (select updated_at from public.transaction_record where id = '$record_id')
);
SQL
    if [[ "$pause_after_update" == "yes" ]]; then
      cat <<SQL
\! touch $lock_marker
\! while [ ! -f $release_marker ]; do sleep 0.1; done
SQL
    fi
    printf 'commit;\n'
  } | psql_in_db
}

# 会话 A：先将全额退款 9241 的目标从 9240 改为 9242，随后保持事务持锁。
run_retarget issue_944_retarget_a "$income_a_id" "$record_a_id" "$expense_b_id" yes \
  > /tmp/issue-944-retarget-a.log 2>&1 &
a_pid=$!

marker_found=false
for _ in $(seq 1 50); do
  if docker exec "$db_container" test -f "$lock_marker"; then
    marker_found=true
    break
  fi
  sleep 0.1
done
if [[ "$marker_found" != "true" ]]; then
  cat /tmp/issue-944-retarget-a.log >&2 || true
  echo "会话 A 未成功完成换目标并持锁。" >&2
  exit 1
fi

# 会话 B：将部分退款 9243 的目标从 9242 改为 9240；两边新旧 UUID 顺序相反。
run_retarget issue_944_retarget_b "$income_b_id" "$record_b_id" "$expense_a_id" no \
  > /tmp/issue-944-retarget-b.log 2>&1 &
b_pid=$!

blocked=false
for _ in $(seq 1 50); do
  wait_event="$(psql_in_db -A -t -c "select coalesce(wait_event_type, '') from pg_stat_activity where application_name = 'issue_944_retarget_b' limit 1;" | tr -d '\r')"
  if [[ "$wait_event" == "Lock" ]]; then
    blocked=true
    break
  fi
  sleep 0.1
done
if [[ "$blocked" != "true" ]]; then
  cat /tmp/issue-944-retarget-a.log >&2 || true
  cat /tmp/issue-944-retarget-b.log >&2 || true
  echo "会话 B 未在会话 A 提交之前等待统一锁，无法证明交叉换绑串行。" >&2
  exit 1
fi
echo "ok - 交叉换绑时第二会话等待持锁事务"

docker exec "$db_container" touch "$release_marker"
if ! wait "$a_pid"; then
  cat /tmp/issue-944-retarget-a.log >&2 || true
  echo "会话 A 换绑失败。" >&2
  exit 1
fi
a_pid=""
if ! wait "$b_pid"; then
  cat /tmp/issue-944-retarget-b.log >&2 || true
  echo "会话 B 应在会话 A 提交后成功，而不是 deadlock。" >&2
  exit 1
fi
b_pid=""

read -r a_target b_target a_remaining b_remaining < <(
  psql_in_db -A -t -F ' ' -c "
    select
      (select refunded_item_id::text from public.transaction_item_refund_link
       where refund_income_item_id = '$income_a_id'),
      (select refunded_item_id::text from public.transaction_item_refund_link
       where refund_income_item_id = '$income_b_id'),
      to_char(public.calculate_transaction_item_remaining_offset_amount('$ledger_id', '$expense_a_id'), 'FM999999990.00'),
      to_char(public.calculate_transaction_item_remaining_offset_amount('$ledger_id', '$expense_b_id'), 'FM999999990.00');"
)
if [[ "$a_target" != "$expense_b_id" || "$b_target" != "$expense_a_id" ||
      "$a_remaining" != "1700.00" || "$b_remaining" != "2600.00" ]]; then
  echo "并发换绑结果不一致：A=$a_target B=$b_target 旧目标余量=$a_remaining 新目标余量=$b_remaining" >&2
  exit 1
fi
echo "ok - 交叉换绑全部完成，新旧原支出剩余核销金额均正确，无死锁"

trap - EXIT
cleanup
