#!/usr/bin/env bash
set -euo pipefail

# Issue #598 PR6：显式回放 migrations + seed，确保当前报销关联结构下 seed 可正常落库。
if ! supabase db reset > /tmp/issue-598-db-reset.log 2>&1; then
  cat /tmp/issue-598-db-reset.log >&2
  exit 1
fi
echo "ok - supabase db reset 与 seed 回放成功"

readonly target_id="57230000-0000-4000-8000-000000000001"
readonly income_a_id="57230000-0000-4000-8000-000000000002"
readonly income_b_id="57230000-0000-4000-8000-000000000003"
readonly lock_marker="/tmp/refund-allocation-a-locked"
readonly release_marker="/tmp/refund-allocation-a-release"
readonly mixed_target_id="59897000-0000-4000-8000-000000000001"
readonly mixed_refund_income_id="59897000-0000-4000-8000-000000000002"
readonly mixed_reimbursement_income_id="59897000-0000-4000-8000-000000000003"
readonly mixed_lock_marker="/tmp/refund-reimbursement-a-locked"
readonly mixed_release_marker="/tmp/refund-reimbursement-a-release"

project_id="$(sed -n 's/^[[:space:]]*project_id[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' supabase/config.toml | head -n 1)"
if [[ -z "${project_id}" ]]; then
  echo "无法从 supabase/config.toml 读取 project_id。" >&2
  exit 1
fi
readonly project_id
readonly db_container="supabase_db_${project_id}"
if [[ "$(docker inspect -f '{{.State.Running}}' "${db_container}" 2>/dev/null || true)" != "true" ]]; then
  echo "找不到当前项目的本地 Supabase 数据库容器：${db_container}。" >&2
  exit 1
fi

psql_in_db() {
  docker exec -i "${db_container}" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

a_pid=""
b_pid=""
ledger_id=""
old_enabled=""
restore_fixture() {
  if [[ -z "${ledger_id}" ]]; then
    return 0
  fi

  psql_in_db <<SQL
begin;
delete from public.transaction_item_reimbursement_link where target_expense_item_id = '${mixed_target_id}';
delete from public.transaction_item_refund_link where refunded_item_id in ('${target_id}', '${mixed_target_id}');
delete from public.transaction_item where id in (
  '${target_id}', '${income_a_id}', '${income_b_id}',
  '${mixed_target_id}', '${mixed_refund_income_id}', '${mixed_reimbursement_income_id}'
);
set local session_replication_role = replica;
update public.ledger set transaction_item_special_status_enabled = '${old_enabled}'::boolean where id = '${ledger_id}';
set local session_replication_role = origin;
commit;
SQL
}

cleanup() {
  # 若测试在锁等待阶段异常退出，先释放容器内的等待门闩，再回收客户端进程。
  docker exec "${db_container}" touch "${release_marker}" "${mixed_release_marker}" >/dev/null 2>&1 || true
  [[ -n "${a_pid}" ]] && kill "${a_pid}" 2>/dev/null || true
  [[ -n "${b_pid}" ]] && kill "${b_pid}" 2>/dev/null || true
  docker exec "${db_container}" rm -f \
    "${lock_marker}" "${release_marker}" \
    "${mixed_lock_marker}" "${mixed_release_marker}" >/dev/null 2>&1 || true
  restore_fixture >/dev/null 2>&1 || true
}
trap cleanup EXIT

read -r ledger_id account_id expense_record_id expense_category_id income_record_id income_category_id user_id old_enabled < <(
  psql_in_db -A -t -F ' ' -c "
    select e.ledger_id, e.account_id, e.transaction_record_id, ec.id,
           i.transaction_record_id, ic.id, e.created_by,
           l.transaction_item_special_status_enabled
    from public.transaction_item e
    join public.category ec on ec.id = e.category_id and ec.ledger_id = e.ledger_id and ec.type = 'expense'
    join public.transaction_record er on er.id = e.transaction_record_id and er.ledger_id = e.ledger_id and er.status = 'active'
    join public.ledger l on l.id = e.ledger_id
    join lateral (
      select candidate.* from public.transaction_item candidate
      join public.category category on category.id = candidate.category_id and category.ledger_id = candidate.ledger_id and category.type = 'income'
      join public.transaction_record record on record.id = candidate.transaction_record_id and record.ledger_id = candidate.ledger_id and record.status = 'active'
      where candidate.ledger_id = e.ledger_id limit 1
    ) i on true
    join public.category ic on ic.id = i.category_id and ic.ledger_id = i.ledger_id
    limit 1;"
)
if [[ "${old_enabled}" != "t" && "${old_enabled}" != "f" ]]; then
  echo "无法读取账本特殊状态开关原始值：${old_enabled}" >&2
  exit 1
fi

psql_in_db >/dev/null <<SQL
begin;
update public.ledger set transaction_item_special_status_enabled = true where id = '${ledger_id}';
insert into public.transaction_item (
  id, ledger_id, transaction_record_id, account_id, category_id, amount,
  discount_amount, balance_delta, note, sort_order, special_status,
  created_by, updated_by
) values
  ('${target_id}', '${ledger_id}', '${expense_record_id}', '${account_id}', '${expense_category_id}', 100, 0, -100, null, 5791, null, '${user_id}', '${user_id}'),
  ('${income_a_id}', '${ledger_id}', '${income_record_id}', '${account_id}', '${income_category_id}', 60, 0, 60, null, 5792, null, '${user_id}', '${user_id}'),
  ('${income_b_id}', '${ledger_id}', '${income_record_id}', '${account_id}', '${income_category_id}', 60, 0, 60, null, 5793, null, '${user_id}', '${user_id}'),
  ('${mixed_target_id}', '${ledger_id}', '${expense_record_id}', '${account_id}', '${expense_category_id}', 100, 0, -100, null, 5794, 'pending_reimbursement', '${user_id}', '${user_id}'),
  ('${mixed_refund_income_id}', '${ledger_id}', '${income_record_id}', '${account_id}', '${income_category_id}', 60, 0, 60, null, 5795, null, '${user_id}', '${user_id}'),
  ('${mixed_reimbursement_income_id}', '${ledger_id}', '${income_record_id}', '${account_id}', '${income_category_id}', 60, 0, 60, null, 5796, null, '${user_id}', '${user_id}');
commit;
SQL

docker exec "${db_container}" rm -f \
  "${lock_marker}" "${release_marker}" \
  "${mixed_lock_marker}" "${mixed_release_marker}"

# 两笔正式退款 RPC 同时竞争同一目标，第二笔必须等待，并在首笔提交后完整写入自身收入金额。
psql_in_db > /tmp/refund-allocation-a.log 2>&1 <<SQL &
begin;
set application_name = 'refund_allocation_a';
select public.apply_transaction_item_links(
  '${ledger_id}',
  '${income_a_id}',
  jsonb_build_object('refundedItemId', '${target_id}'),
  '${user_id}'
);
\! touch ${lock_marker}
\! while [ ! -f ${release_marker} ]; do sleep 0.1; done
commit;
SQL
a_pid=$!

marker_found=false
for _ in $(seq 1 50); do
  if docker exec "${db_container}" test -f "${lock_marker}"; then
    marker_found=true
    break
  fi
  sleep 0.1
done
if [[ "${marker_found}" != "true" ]]; then
  cat /tmp/refund-allocation-a.log >&2 || true
  echo "第一笔退款未建立关联。" >&2
  exit 1
fi

psql_in_db > /tmp/refund-allocation-b.log 2>&1 <<SQL &
begin;
set application_name = 'refund_allocation_b';
select public.apply_transaction_item_links(
  '${ledger_id}',
  '${income_b_id}',
  jsonb_build_object('refundedItemId', '${target_id}'),
  '${user_id}'
);
commit;
SQL
b_pid=$!

blocked=false
for _ in $(seq 1 50); do
  wait_event="$(psql_in_db -A -t -c "select coalesce(wait_event_type, '') || ':' || coalesce(wait_event, '') from pg_stat_activity where application_name = 'refund_allocation_b';" | tr -d '\r')"
  if [[ "${wait_event}" == Lock:* ]]; then
    blocked=true
    break
  fi
  sleep 0.1
done
if [[ "${blocked}" != "true" ]]; then
  cat /tmp/refund-allocation-a.log >&2 || true
  cat /tmp/refund-allocation-b.log >&2 || true
  echo "第二笔退款在首笔事务提交前没有发生锁等待。" >&2
  exit 1
fi
echo "ok - 第二笔并发退款在首笔事务提交前发生锁等待"

docker exec "${db_container}" touch "${release_marker}"
wait "${a_pid}"
a_pid=""
if ! wait "${b_pid}"; then
  cat /tmp/refund-allocation-b.log >&2 || true
  echo "第二笔退款应在锁释放后按完整收入金额成功建立关联。" >&2
  exit 1
fi
b_pid=""

result="$(psql_in_db -A -t -c "select count(*)::text || '/' || coalesce(sum(refund_amount), 0)::text from public.transaction_item_refund_link where refunded_item_id = '${target_id}';" | tr -d '\r')"
if [[ "${result}" != "2/120.00" ]]; then
  echo "期望最终关联为 2/120.00，实际为 ${result}" >&2
  exit 1
fi
income_b_net="$(psql_in_db -A -t -c "select to_char(business_net_amount, 'FM999999990.00') from public.transaction_item_with_refund where id = '${income_b_id}';" | tr -d '\r')"
if [[ "${income_b_net}" != "0.00" ]]; then
  echo "第二笔退款应完整核销 60.00 且不保留净收益，实际净收益为 ${income_b_net}" >&2
  exit 1
fi
echo "ok - 两笔并发退款均完整核销，最终核销 120.00"

# 正式退款 RPC 与正式报销 RPC 同时竞争同一待报销目标，验证真实入口会串行完成两个完整关联。
psql_in_db > /tmp/refund-reimbursement-a.log 2>&1 <<SQL &
begin;
set application_name = 'refund_reimbursement_a';
select public.apply_transaction_item_links(
  '${ledger_id}',
  '${mixed_refund_income_id}',
  jsonb_build_object('refundedItemId', '${mixed_target_id}'),
  '${user_id}'
);
\! touch ${mixed_lock_marker}
\! while [ ! -f ${mixed_release_marker} ]; do sleep 0.1; done
commit;
SQL
a_pid=$!

mixed_marker_found=false
for _ in $(seq 1 50); do
  if docker exec "${db_container}" test -f "${mixed_lock_marker}"; then
    mixed_marker_found=true
    break
  fi
  sleep 0.1
done
if [[ "${mixed_marker_found}" != "true" ]]; then
  cat /tmp/refund-reimbursement-a.log >&2 || true
  echo "正式退款 RPC 未建立并发测试关联。" >&2
  exit 1
fi

psql_in_db > /tmp/refund-reimbursement-b.log 2>&1 <<SQL &
begin;
set application_name = 'refund_reimbursement_b';
select public.apply_transaction_item_links(
  '${ledger_id}',
  '${mixed_reimbursement_income_id}',
  jsonb_build_object('reimbursementItemId', '${mixed_target_id}'),
  '${user_id}'
);
commit;
SQL
b_pid=$!

mixed_blocked=false
for _ in $(seq 1 50); do
  wait_event="$(psql_in_db -A -t -c "select coalesce(wait_event_type, '') || ':' || coalesce(wait_event, '') from pg_stat_activity where application_name = 'refund_reimbursement_b';" | tr -d '\r')"
  if [[ "${wait_event}" == Lock:* ]]; then
    mixed_blocked=true
    break
  fi
  sleep 0.1
done
if [[ "${mixed_blocked}" != "true" ]]; then
  cat /tmp/refund-reimbursement-a.log >&2 || true
  cat /tmp/refund-reimbursement-b.log >&2 || true
  echo "正式报销 RPC 在并发退款事务提交前没有发生锁等待。" >&2
  exit 1
fi
echo "ok - 正式退款与报销 RPC 在同一目标上发生并发锁等待"

docker exec "${db_container}" touch "${mixed_release_marker}"
wait "${a_pid}"
a_pid=""
if ! wait "${b_pid}"; then
  cat /tmp/refund-reimbursement-b.log >&2 || true
  echo "正式报销 RPC 应在退款事务提交后按完整收入金额成功建立关联。" >&2
  exit 1
fi
b_pid=""

read -r mixed_refund_amount mixed_reimbursement_amount mixed_remaining mixed_status mixed_target_net mixed_refund_net mixed_reimbursement_net < <(
  psql_in_db -A -t -F ' ' -c "
    select
      to_char(coalesce((
        select sum(link.refund_amount)
        from public.transaction_item_refund_link link
        where link.refunded_item_id = '${mixed_target_id}'
      ), 0), 'FM999999990.00'),
      to_char(coalesce((
        select sum(link.reimbursement_amount)
        from public.transaction_item_reimbursement_link link
        where link.target_expense_item_id = '${mixed_target_id}'
      ), 0), 'FM999999990.00'),
      to_char(public.calculate_transaction_item_remaining_offset_amount('${ledger_id}', '${mixed_target_id}'), 'FM999999990.00'),
      (select item.special_status::text from public.transaction_item item where item.id = '${mixed_target_id}'),
      to_char((select item.business_net_amount from public.transaction_item_with_refund item where item.id = '${mixed_target_id}'), 'FM999999990.00'),
      to_char((select item.business_net_amount from public.transaction_item_with_refund item where item.id = '${mixed_refund_income_id}'), 'FM999999990.00'),
      to_char((select item.business_net_amount from public.transaction_item_with_refund item where item.id = '${mixed_reimbursement_income_id}'), 'FM999999990.00');"
)

if [[ "${mixed_refund_amount}" != "60.00" \
   || "${mixed_reimbursement_amount}" != "60.00" \
   || "${mixed_remaining}" != "-20.00" \
   || "${mixed_status}" != "reimbursement_surplus" \
   || "${mixed_target_net}" != "0.00" \
   || "${mixed_refund_net}" != "0.00" \
   || "${mixed_reimbursement_net}" != "0.00" ]]; then
  echo "正式退款/报销并发结果异常：refund=${mixed_refund_amount}, reimbursement=${mixed_reimbursement_amount}, remaining=${mixed_remaining}, status=${mixed_status}, targetNet=${mixed_target_net}, refundNet=${mixed_refund_net}, reimbursementNet=${mixed_reimbursement_net}" >&2
  exit 1
fi
echo "ok - 正式退款与报销 RPC 并发后均完整核销并进入核销结余状态"

# 正常成功路径必须严格验证 fixture 清理与账本开关恢复；异常退出才由 trap 做 best-effort 清理。
restore_fixture >/dev/null
restored_enabled="$(psql_in_db -A -t -c "select transaction_item_special_status_enabled from public.ledger where id = '${ledger_id}';" | tr -d '\r')"
if [[ "${restored_enabled}" != "${old_enabled}" ]]; then
  echo "账本特殊状态开关未恢复：expected=${old_enabled}, actual=${restored_enabled}" >&2
  exit 1
fi
fixture_count="$(psql_in_db -A -t -c "
  select
    (select count(*) from public.transaction_item_reimbursement_link where target_expense_item_id = '${mixed_target_id}')
    + (select count(*) from public.transaction_item_refund_link where refunded_item_id in ('${target_id}', '${mixed_target_id}'))
    + (select count(*) from public.transaction_item where id in (
        '${target_id}', '${income_a_id}', '${income_b_id}',
        '${mixed_target_id}', '${mixed_refund_income_id}', '${mixed_reimbursement_income_id}'
      ));" | tr -d '\r')"
if [[ "${fixture_count}" != "0" ]]; then
  echo "并发测试 fixture 清理不完整：remaining=${fixture_count}" >&2
  exit 1
fi
ledger_id=""
trap - EXIT
docker exec "${db_container}" rm -f \
  "${lock_marker}" "${release_marker}" \
  "${mixed_lock_marker}" "${mixed_release_marker}"
echo "ok - 并发测试 fixture 清理完成且账本开关已恢复"
