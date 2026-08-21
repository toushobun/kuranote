#!/usr/bin/env bash
set -euo pipefail

if ! supabase db reset > /tmp/issue-574-pr1-db-reset.log 2>&1; then
  cat /tmp/issue-574-pr1-db-reset.log >&2
  exit 1
fi
echo "ok - supabase db reset 与 seed 回放成功"

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
readonly account_id="00000000-0000-4000-8000-000000000043"
readonly expense_category_id="00000000-0000-4000-8000-000000005021"
readonly income_category_id="00000000-0000-4000-8000-000000005002"
readonly edit_target_id="57430000-0000-4000-8000-000000000001"
readonly edit_income_id="57430000-0000-4000-8000-000000000002"
readonly edit_new_income_id="57430000-0000-4000-8000-000000000003"
readonly clear_target_id="57430000-0000-4000-8000-000000000004"
readonly clear_income_id="57430000-0000-4000-8000-000000000005"
readonly clear_new_income_id="57430000-0000-4000-8000-000000000006"
readonly edit_lock_marker="/tmp/issue-574-edit-locked"
readonly edit_release_marker="/tmp/issue-574-edit-release"
readonly clear_lock_marker="/tmp/issue-574-clear-locked"
readonly clear_release_marker="/tmp/issue-574-clear-release"

a_pid=""
b_pid=""
old_account_balance=""
merchant_id=""
cleanup() {
  docker exec "${db_container}" touch \
    "${edit_release_marker}" "${clear_release_marker}" >/dev/null 2>&1 || true
  [[ -n "${a_pid}" ]] && kill "${a_pid}" 2>/dev/null || true
  [[ -n "${b_pid}" ]] && kill "${b_pid}" 2>/dev/null || true
  docker exec "${db_container}" rm -f \
    "${edit_lock_marker}" "${edit_release_marker}" \
    "${clear_lock_marker}" "${clear_release_marker}" >/dev/null 2>&1 || true
  if [[ -n "${old_account_balance}" ]]; then
    psql_in_db >/dev/null 2>&1 <<SQL || true
begin;
delete from public.transaction_item_reimbursement_link
where target_expense_item_id in ('${edit_target_id}', '${clear_target_id}');
delete from public.transaction_item
where id in (
  '${edit_target_id}', '${edit_income_id}', '${edit_new_income_id}',
  '${clear_target_id}', '${clear_income_id}', '${clear_new_income_id}'
);
delete from public.transaction_record
where id::text like '57431000-0000-4000-8000-%';
update public.account
set current_balance = '${old_account_balance}'::numeric
where id = '${account_id}' and ledger_id = '${ledger_id}';
commit;
SQL
  fi
}
trap cleanup EXIT

old_account_balance="$(psql_in_db -A -t -c "select current_balance from public.account where id = '${account_id}' and ledger_id = '${ledger_id}';" | tr -d '\r')"

psql_in_db >/dev/null <<SQL
begin;
update public.ledger
set transaction_item_special_status_enabled = true
where id = '${ledger_id}';

insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, created_by, updated_by
)
select
  ('57431000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
  source_record.ledger_id,
  'normal',
  'active',
  '2099-03-02 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
  source_record.merchant_id,
  'Issue 574 PR1 并发测试 ' || sequence_number,
  '${user_id}',
  '${user_id}'
from public.transaction_record source_record
cross join generate_series(1, 6) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
  id, ledger_id, transaction_record_id, account_id, category_id,
  amount, discount_amount, balance_delta, sort_order,
  created_by, updated_by, created_at, updated_at, special_status
) values
  ('${edit_target_id}', '${ledger_id}', '57431000-0000-4000-8000-000000000001', '${account_id}', '${expense_category_id}', 100, 0, -100, 0, '${user_id}', '${user_id}', '2090-01-01', '2090-01-01', 'pending_reimbursement'),
  ('${edit_income_id}', '${ledger_id}', '57431000-0000-4000-8000-000000000002', '${account_id}', '${income_category_id}', 40, 0, 40, 0, '${user_id}', '${user_id}', '2090-01-01', '2090-01-01', null),
  ('${edit_new_income_id}', '${ledger_id}', '57431000-0000-4000-8000-000000000003', '${account_id}', '${income_category_id}', 30, 0, 30, 0, '${user_id}', '${user_id}', '2090-01-01', '2090-01-01', null),
  ('${clear_target_id}', '${ledger_id}', '57431000-0000-4000-8000-000000000004', '${account_id}', '${expense_category_id}', 100, 0, -100, 0, '${user_id}', '${user_id}', '2090-01-01', '2090-01-01', 'pending_reimbursement'),
  ('${clear_income_id}', '${ledger_id}', '57431000-0000-4000-8000-000000000005', '${account_id}', '${income_category_id}', 40, 0, 40, 0, '${user_id}', '${user_id}', '2090-01-01', '2090-01-01', null),
  ('${clear_new_income_id}', '${ledger_id}', '57431000-0000-4000-8000-000000000006', '${account_id}', '${income_category_id}', 30, 0, 30, 0, '${user_id}', '${user_id}', '2090-01-01', '2090-01-01', null);

select public.apply_transaction_item_links(
  '${ledger_id}', '${edit_income_id}',
  jsonb_build_object('reimbursementItemId', '${edit_target_id}'), '${user_id}'
);
select public.apply_transaction_item_links(
  '${ledger_id}', '${clear_income_id}',
  jsonb_build_object('reimbursementItemId', '${clear_target_id}'), '${user_id}'
);
commit;
SQL

merchant_id="$(psql_in_db -A -t -c "select merchant_id from public.transaction_record where id = '57431000-0000-4000-8000-000000000002';" | tr -d '\r')"
if [[ -z "${merchant_id}" ]]; then
  echo "无法读取并发测试用商户。" >&2
  exit 1
fi

docker exec "${db_container}" rm -f \
  "${edit_lock_marker}" "${edit_release_marker}" \
  "${clear_lock_marker}" "${clear_release_marker}"

# 场景 1：公开原子编辑 RPC 持有 ledger/target 锁时，正式 update_transaction 新建关联只能等待。
psql_in_db > /tmp/issue-574-edit-a.log 2>&1 <<SQL &
begin;
set application_name = 'issue_574_edit_a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.update_linked_transaction_item(
  '${ledger_id}',
  '57431000-0000-4000-8000-000000000002',
  '${edit_income_id}',
  '2090-01-01 00:00:00+00',
  50,
  '${account_id}',
  '${income_category_id}'
);
\! touch ${edit_lock_marker}
\! while [ ! -f ${edit_release_marker} ]; do sleep 0.1; done
commit;
SQL
a_pid=$!

for _ in $(seq 1 50); do
  if docker exec "${db_container}" test -f "${edit_lock_marker}"; then
    break
  fi
  sleep 0.1
done
if ! docker exec "${db_container}" test -f "${edit_lock_marker}"; then
  cat /tmp/issue-574-edit-a.log >&2 || true
  echo "关联编辑事务未进入持锁阶段。" >&2
  exit 1
fi

psql_in_db > /tmp/issue-574-edit-b.log 2>&1 <<SQL &
begin;
set application_name = 'issue_574_edit_b';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.update_transaction(
  '${ledger_id}',
  '57431000-0000-4000-8000-000000000003',
  'income',
  now(),
  jsonb_build_array(
    jsonb_build_object(
      'id', '${edit_new_income_id}',
      'amount', 30,
      'categoryId', '${income_category_id}',
      'reimbursementItemId', '${edit_target_id}'
    )
  ),
  '${account_id}',
  '${merchant_id}',
  'Issue 574 PR1 并发新建关联'
);
commit;
SQL
b_pid=$!

blocked=false
for _ in $(seq 1 50); do
  wait_event="$(psql_in_db -A -t -c "select coalesce(wait_event_type, '') || ':' || coalesce(wait_event, '') from pg_stat_activity where application_name = 'issue_574_edit_b';" | tr -d '\r')"
  if [[ "${wait_event}" == Lock:* ]]; then
    blocked=true
    break
  fi
  sleep 0.1
done
if [[ "${blocked}" != "true" ]]; then
  cat /tmp/issue-574-edit-a.log >&2 || true
  cat /tmp/issue-574-edit-b.log >&2 || true
  echo "新建关联 RPC 没有在编辑事务持锁期间等待统一账本锁。" >&2
  exit 1
fi
echo "ok - 编辑 RPC ↔ 新建关联 RPC 按统一锁顺序串行等待"

docker exec "${db_container}" touch "${edit_release_marker}"
wait "${a_pid}"
a_pid=""
if ! wait "${b_pid}"; then
  cat /tmp/issue-574-edit-b.log >&2 || true
  echo "编辑锁释放后新建关联 RPC 应成功，不应出现 deadlock。" >&2
  exit 1
fi
b_pid=""

edit_result="$(psql_in_db -A -t -c "select count(*)::text || '/' || coalesce(sum(reimbursement_amount),0)::text from public.transaction_item_reimbursement_link where target_expense_item_id = '${edit_target_id}';" | tr -d '\r')"
if [[ "${edit_result}" != "2/80.00" ]]; then
  echo "编辑并发场景期望 2 条关联合计 80.00，实际 ${edit_result}" >&2
  exit 1
fi
echo "ok - 编辑并发场景最终关联数据一致"

# 场景 2：正式 update_transaction 清关联先拿 ledger，另一个 update_transaction 新建关联只能等待。
psql_in_db > /tmp/issue-574-clear-a.log 2>&1 <<SQL &
begin;
set application_name = 'issue_574_clear_a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.update_transaction(
  '${ledger_id}',
  '57431000-0000-4000-8000-000000000005',
  'income',
  now(),
  jsonb_build_array(
    jsonb_build_object(
      'id', '${clear_income_id}',
      'amount', 40,
      'categoryId', '${income_category_id}'
    )
  ),
  '${account_id}',
  '${merchant_id}',
  'Issue 574 PR1 并发清关联'
);
\! touch ${clear_lock_marker}
\! while [ ! -f ${clear_release_marker} ]; do sleep 0.1; done
commit;
SQL
a_pid=$!

for _ in $(seq 1 50); do
  if docker exec "${db_container}" test -f "${clear_lock_marker}"; then
    break
  fi
  sleep 0.1
done
if ! docker exec "${db_container}" test -f "${clear_lock_marker}"; then
  cat /tmp/issue-574-clear-a.log >&2 || true
  echo "清关联 RPC 未进入持锁阶段。" >&2
  exit 1
fi

psql_in_db > /tmp/issue-574-clear-b.log 2>&1 <<SQL &
begin;
set application_name = 'issue_574_clear_b';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.update_transaction(
  '${ledger_id}',
  '57431000-0000-4000-8000-000000000006',
  'income',
  now(),
  jsonb_build_array(
    jsonb_build_object(
      'id', '${clear_new_income_id}',
      'amount', 30,
      'categoryId', '${income_category_id}',
      'reimbursementItemId', '${clear_target_id}'
    )
  ),
  '${account_id}',
  '${merchant_id}',
  'Issue 574 PR1 并发新建关联'
);
commit;
SQL
b_pid=$!

blocked=false
for _ in $(seq 1 50); do
  wait_event="$(psql_in_db -A -t -c "select coalesce(wait_event_type, '') || ':' || coalesce(wait_event, '') from pg_stat_activity where application_name = 'issue_574_clear_b';" | tr -d '\r')"
  if [[ "${wait_event}" == Lock:* ]]; then
    blocked=true
    break
  fi
  sleep 0.1
done
if [[ "${blocked}" != "true" ]]; then
  cat /tmp/issue-574-clear-a.log >&2 || true
  cat /tmp/issue-574-clear-b.log >&2 || true
  echo "新建关联 RPC 没有在清关联事务持锁期间等待统一账本锁。" >&2
  exit 1
fi
echo "ok - 清关联 RPC ↔ 新建关联 RPC 按统一锁顺序串行等待"

docker exec "${db_container}" touch "${clear_release_marker}"
wait "${a_pid}"
a_pid=""
if ! wait "${b_pid}"; then
  cat /tmp/issue-574-clear-b.log >&2 || true
  echo "清关联锁释放后新建关联 RPC 应成功，不应出现 deadlock。" >&2
  exit 1
fi
b_pid=""

clear_result="$(psql_in_db -A -t -c "select count(*)::text || '/' || coalesce(sum(reimbursement_amount),0)::text from public.transaction_item_reimbursement_link where target_expense_item_id = '${clear_target_id}';" | tr -d '\r')"
if [[ "${clear_result}" != "1/30.00" ]]; then
  echo "清关联并发场景期望仅保留新关联 1/30.00，实际 ${clear_result}" >&2
  exit 1
fi
clear_status="$(psql_in_db -A -t -c "select special_status::text from public.transaction_item where id = '${clear_target_id}';" | tr -d '\r')"
if [[ "${clear_status}" != "pending_reimbursement" ]]; then
  echo "清关联并发场景最终状态应为 pending_reimbursement，实际 ${clear_status}" >&2
  exit 1
fi
echo "ok - 清关联并发场景最终关联和三态一致"
