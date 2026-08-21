#!/usr/bin/env bash
set -euo pipefail

if ! supabase db reset > /tmp/issue-574-convert-db-reset.log 2>&1; then
  cat /tmp/issue-574-convert-db-reset.log >&2
  exit 1
fi
echo "ok - 类型转换并发测试完成 db reset 与 seed 回放"

project_id="$(sed -n 's/^[[:space:]]*project_id[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' supabase/config.toml | head -n 1)"
if [[ -z "${project_id}" ]]; then
  echo "无法从 supabase/config.toml 读取 project_id。" >&2
  exit 1
fi
readonly db_container="supabase_db_${project_id}"
if [[ "$(docker inspect -f '{{.State.Running}}' "${db_container}" 2>/dev/null || true)" != "true" ]]; then
  echo "找不到当前项目的本地 Supabase 数据库容器：${db_container}。" >&2
  exit 1
fi

psql_in_db() {
  docker exec -i "${db_container}" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

readonly ledger_id="00000000-0000-4000-8000-000000000032"
readonly user_id="00000000-0000-4000-8000-000000000031"
readonly from_account_id="00000000-0000-4000-8000-000000000043"
readonly to_account_id="00000000-0000-4000-8000-000000000044"
readonly income_category_id="00000000-0000-4000-8000-000000005002"
readonly merchant_id="00000000-0000-4000-8000-000000001013"
readonly record_id="57493000-0000-4000-8000-000000000001"
readonly from_item_id="57494000-0000-4000-8000-000000000001"
readonly to_item_id="57494000-0000-4000-8000-000000000002"
readonly gate_locked_marker="/tmp/issue-574-convert-gate-locked"
readonly gate_release_marker="/tmp/issue-574-convert-gate-release"

gate_pid=""
convert_pid=""
cleanup() {
  docker exec "${db_container}" touch "${gate_release_marker}" >/dev/null 2>&1 || true
  [[ -n "${convert_pid}" ]] && kill "${convert_pid}" 2>/dev/null || true
  [[ -n "${gate_pid}" ]] && kill "${gate_pid}" 2>/dev/null || true
  [[ -n "${convert_pid}" ]] && wait "${convert_pid}" 2>/dev/null || true
  [[ -n "${gate_pid}" ]] && wait "${gate_pid}" 2>/dev/null || true
  docker exec "${db_container}" rm -f \
    "${gate_locked_marker}" "${gate_release_marker}" >/dev/null 2>&1 || true
  psql_in_db >/dev/null 2>&1 <<SQL || true
delete from public.transaction_item
where id in ('${from_item_id}', '${to_item_id}');
delete from public.transaction_record
where id = '${record_id}';
SQL
}
trap cleanup EXIT

docker exec "${db_container}" rm -f "${gate_locked_marker}" "${gate_release_marker}"

psql_in_db >/dev/null <<SQL
insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, created_by, updated_by
) values (
  '${record_id}', '${ledger_id}', 'transfer', 'active',
  '2099-03-10 00:00:00+00', null,
  'Issue 574 PR1 类型转换锁顺序', '${user_id}', '${user_id}'
);

insert into public.transaction_item (
  id, ledger_id, transaction_record_id, account_id, category_id,
  amount, discount_amount, balance_delta, note, sort_order,
  created_by, updated_by
) values
  (
    '${from_item_id}', '${ledger_id}', '${record_id}', '${from_account_id}', null,
    10, 0, -10, null, 0, '${user_id}', '${user_id}'
  ),
  (
    '${to_item_id}', '${ledger_id}', '${record_id}', '${to_account_id}', null,
    10, 0, 10, null, 1, '${user_id}', '${user_id}'
  );
SQL

psql_in_db > /tmp/issue-574-convert-gate.log 2>&1 <<SQL &
begin;
set application_name = 'issue_574_convert_gate';
select 1
from public.ledger
where id = '${ledger_id}'
for update;
\! touch ${gate_locked_marker}
\! while [ ! -f ${gate_release_marker} ]; do sleep 0.1; done
commit;
SQL
gate_pid=$!

for _ in $(seq 1 50); do
  if docker exec "${db_container}" test -f "${gate_locked_marker}"; then
    break
  fi
  sleep 0.1
done
if ! docker exec "${db_container}" test -f "${gate_locked_marker}"; then
  cat /tmp/issue-574-convert-gate.log >&2 || true
  echo "类型转换并发测试的 ledger 闸门未进入持锁阶段。" >&2
  exit 1
fi

psql_in_db > /tmp/issue-574-convert-request.log 2>&1 <<SQL &
begin;
set application_name = 'issue_574_convert_request';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.convert_transaction_type_with_special_status(
  '${ledger_id}',
  '${record_id}',
  'income',
  '2099-03-10 00:01:00+00',
  'Issue 574 PR1 类型转换 ledger-first',
  '${from_account_id}',
  '${merchant_id}',
  jsonb_build_array(
    jsonb_build_object(
      'amount', 10,
      'categoryId', '${income_category_id}'
    )
  ),
  null,
  null,
  null
);
commit;
SQL
convert_pid=$!

blocked_by_gate=false
for _ in $(seq 1 50); do
  blocked_by_gate="$(psql_in_db -A -t -c "
    select exists (
      select 1
      from pg_catalog.pg_stat_activity waiter
      cross join lateral unnest(pg_catalog.pg_blocking_pids(waiter.pid)) blocker_pid
      join pg_catalog.pg_stat_activity blocker on blocker.pid = blocker_pid
      where waiter.application_name = 'issue_574_convert_request'
        and waiter.wait_event_type = 'Lock'
        and blocker.application_name = 'issue_574_convert_gate'
    );
  " | tr -d '\r')"
  if [[ "${blocked_by_gate}" == "t" ]]; then
    break
  fi
  sleep 0.1
done
if [[ "${blocked_by_gate}" != "t" ]]; then
  cat /tmp/issue-574-convert-request.log >&2 || true
  echo "类型转换复合 RPC 没有先等待 ledger 闸门。" >&2
  exit 1
fi
echo "ok - 类型转换复合 RPC 在进入内部转换前先等待 ledger 锁"

# 关键断言：convert 会话等待 ledger 时不能已经持有 transaction_record。
# 旧实现会先进入 convert_transaction_type，拿到 record/account 后才在后续 update_transaction
# 等 ledger，因此这里的 NOWAIT 会稳定失败；修复后应立即成功。
if ! psql_in_db >/tmp/issue-574-convert-probe.log 2>&1 <<SQL
begin;
select 1
from public.transaction_record
where id = '${record_id}'
  and ledger_id = '${ledger_id}'
for update nowait;
rollback;
SQL
then
  cat /tmp/issue-574-convert-probe.log >&2 || true
  echo "类型转换等待 ledger 时不应提前占用 transaction_record。" >&2
  exit 1
fi
echo "ok - 类型转换等待 ledger 时尚未取得 transaction_record 锁"

# 不让测试转换真正落库。终止阻塞中的 psql 会让数据库连接关闭并回滚事务，
# 随后释放 ledger 闸门；trap 仍负责任何异常路径下的兜底清理。
kill "${convert_pid}" 2>/dev/null || true
wait "${convert_pid}" 2>/dev/null || true
convert_pid=""
docker exec "${db_container}" touch "${gate_release_marker}"
wait "${gate_pid}"
gate_pid=""

record_type="$(psql_in_db -A -t -c "select type from public.transaction_record where id = '${record_id}';" | tr -d '\r')"
if [[ "${record_type}" != "transfer" ]]; then
  echo "被终止的类型转换必须完整回滚，实际记录类型：${record_type}" >&2
  exit 1
fi
echo "ok - 被终止的并发类型转换完整回滚"
