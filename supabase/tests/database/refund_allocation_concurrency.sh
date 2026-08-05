#!/usr/bin/env bash
set -euo pipefail

readonly target_id="57230000-0000-4000-8000-000000000001"
readonly income_a_id="57230000-0000-4000-8000-000000000002"
readonly income_b_id="57230000-0000-4000-8000-000000000003"
readonly lock_marker="/tmp/refund-allocation-a-locked"

db_container="$(docker ps --filter 'name=supabase_db_' --format '{{.Names}}' | head -n 1)"
if [[ -z "${db_container}" ]]; then
  echo "找不到本地 Supabase 数据库容器。" >&2
  exit 1
fi

psql_in_db() {
  docker exec -i "${db_container}" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"
}

a_pid=""
b_pid=""
ledger_id=""
old_enabled=""
cleanup() {
  [[ -n "${a_pid}" ]] && kill "${a_pid}" 2>/dev/null || true
  [[ -n "${b_pid}" ]] && kill "${b_pid}" 2>/dev/null || true
  docker exec "${db_container}" rm -f "${lock_marker}" >/dev/null 2>&1 || true
  if [[ -n "${ledger_id}" ]]; then
    psql_in_db >/dev/null 2>&1 <<SQL || true
begin;
delete from public.transaction_item_refund_link where refunded_item_id = '${target_id}';
delete from public.transaction_item where id in ('${target_id}', '${income_a_id}', '${income_b_id}');
set local session_replication_role = replica;
update public.ledger set transaction_item_special_status_enabled = ${old_enabled:-true} where id = '${ledger_id}';
set local session_replication_role = origin;
commit;
SQL
  fi
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

psql_in_db >/dev/null <<SQL
begin;
update public.ledger set transaction_item_special_status_enabled = true where id = '${ledger_id}';
insert into public.transaction_item (
  id, ledger_id, transaction_record_id, account_id, category_id, amount,
  discount_amount, balance_delta, note, sort_order, created_by, updated_by
) values
  ('${target_id}', '${ledger_id}', '${expense_record_id}', '${account_id}', '${expense_category_id}', 100, 0, -100, null, 5791, '${user_id}', '${user_id}'),
  ('${income_a_id}', '${ledger_id}', '${income_record_id}', '${account_id}', '${income_category_id}', 60, 0, 60, null, 5792, '${user_id}', '${user_id}'),
  ('${income_b_id}', '${ledger_id}', '${income_record_id}', '${account_id}', '${income_category_id}', 60, 0, 60, null, 5793, '${user_id}', '${user_id}');
commit;
SQL

docker exec "${db_container}" rm -f "${lock_marker}"

psql_in_db > /tmp/refund-allocation-a.log 2>&1 <<SQL &
begin;
set application_name = 'refund_allocation_a';
select public.apply_transaction_item_links(
  '${ledger_id}',
  '${income_a_id}',
  jsonb_build_object('refundAllocations', jsonb_build_array(jsonb_build_object('refundedItemId', '${target_id}', 'refundAmount', 60))),
  '${user_id}'
);
\! touch ${lock_marker}
select pg_sleep(3);
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
  jsonb_build_object('refundAllocations', jsonb_build_array(jsonb_build_object('refundedItemId', '${target_id}', 'refundAmount', 60))),
  '${user_id}'
);
commit;
SQL
b_pid=$!

blocked=false
for _ in $(seq 1 30); do
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
  echo "第二笔退款没有等待目标明细写锁。" >&2
  exit 1
fi
echo "ok - 第二笔并发退款等待目标明细写锁"

wait "${a_pid}"
a_pid=""
if wait "${b_pid}"; then
  cat /tmp/refund-allocation-b.log >&2
  echo "第二笔超额退款不应成功。" >&2
  exit 1
fi
b_pid=""

if ! grep -q 'refund_amount_exceeded' /tmp/refund-allocation-b.log; then
  cat /tmp/refund-allocation-b.log >&2
  echo "第二笔退款未以 refund_amount_exceeded 失败。" >&2
  exit 1
fi
echo "ok - 第二笔并发退款在锁释放后拒绝超额"

result="$(psql_in_db -A -t -c "select count(*)::text || '/' || coalesce(sum(refund_amount), 0)::text from public.transaction_item_refund_link where refunded_item_id = '${target_id}';" | tr -d '\r')"
if [[ "${result}" != "1/60.00" ]]; then
  echo "期望最终关联为 1/60.00，实际为 ${result}" >&2
  exit 1
fi
echo "ok - 并发退款最终未超过可退金额"
