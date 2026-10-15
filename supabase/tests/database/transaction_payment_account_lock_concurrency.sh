#!/usr/bin/env bash
# #911：两个事务以相反方向在同两个账户之间切换付款账户时，账户按 UUID 一次性加锁，不会死锁。
set -euo pipefail

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
readonly merchant_id="00000000-0000-4000-8000-000000001001"
readonly expense_category_id="00000000-0000-4000-8000-000000005021"
# account_a < account_b（UUID 顺序）
readonly account_a="00000000-0000-4000-8000-000000000043"
readonly account_b="00000000-0000-4000-8000-000000000044"
readonly note_prefix="#911 账户锁并发"
readonly gate_lock_marker="/tmp/issue-911-gate-locked"
readonly gate_release_marker="/tmp/issue-911-gate-release"

gate_pid=""
a_pid=""
b_pid=""
balances_before=""

cleanup() {
  docker exec "${db_container}" touch "${gate_release_marker}" >/dev/null 2>&1 || true
  for pid in "${gate_pid}" "${a_pid}" "${b_pid}"; do
    [[ -n "${pid}" ]] && kill "${pid}" 2>/dev/null || true
  done
  docker exec "${db_container}" rm -f "${gate_lock_marker}" "${gate_release_marker}" >/dev/null 2>&1 || true
  psql_in_db >/dev/null 2>&1 <<SQL || true
begin;
delete from public.transaction_payment p using public.transaction_record tr
where tr.id = p.transaction_record_id and tr.note like '${note_prefix}%';
delete from public.transaction_item ti using public.transaction_record tr
where tr.id = ti.transaction_record_id and tr.note like '${note_prefix}%';
delete from public.transaction_record where note like '${note_prefix}%';
select set_config('app.allow_account_balance_update', 'true', true);
update public.account a
set current_balance = b.balance
from (values ${balances_before:-(null::uuid, null::numeric)}) b(id, balance)
where a.id = b.id;
commit;
SQL
}
trap cleanup EXIT

balances_before="$(psql_in_db -A -t -c "select string_agg(format('(%L::uuid, %s)', id, current_balance), ', ') from public.account where id in ('${account_a}', '${account_b}');" | tr -d '\r')"

# 付款账户：记录 1 在 A，记录 2 在 B。
psql_in_db >/dev/null <<SQL
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.create_transaction(
  '${ledger_id}', 'expense', '2099-05-01 00:00:00+00',
  jsonb_build_array(jsonb_build_object('amount', 100, 'categoryId', '${expense_category_id}')),
  jsonb_build_array(jsonb_build_object('accountId', '${account_a}')),
  '${merchant_id}', '${note_prefix} 1'
);
select public.create_transaction(
  '${ledger_id}', 'expense', '2099-05-01 00:01:00+00',
  jsonb_build_array(jsonb_build_object('amount', 40, 'categoryId', '${expense_category_id}')),
  jsonb_build_array(jsonb_build_object('accountId', '${account_b}')),
  '${merchant_id}', '${note_prefix} 2'
);
commit;
SQL

record_1="$(psql_in_db -A -t -c "select id from public.transaction_record where note = '${note_prefix} 1';" | tr -d '\r')"
record_2="$(psql_in_db -A -t -c "select id from public.transaction_record where note = '${note_prefix} 2';" | tr -d '\r')"
balances_after_setup="$(psql_in_db -A -t -c "select string_agg(current_balance::text, '/' order by id) from public.account where id in ('${account_a}', '${account_b}');" | tr -d '\r')"

docker exec "${db_container}" rm -f "${gate_lock_marker}" "${gate_release_marker}"

# 闸门会话先持有账户 A 的行锁（与 RPC 相同的 NO KEY UPDATE），让两个编辑事务都在加账户锁阶段排队。
psql_in_db > /tmp/issue-911-gate.log 2>&1 <<SQL &
begin;
set application_name = 'issue_911_gate';
select 1 from public.account where id = '${account_a}' for no key update;
\! touch ${gate_lock_marker}
\! while [ ! -f ${gate_release_marker} ]; do sleep 0.1; done
commit;
SQL
gate_pid=$!

for _ in $(seq 1 50); do
  docker exec "${db_container}" test -f "${gate_lock_marker}" && break
  sleep 0.1
done
if ! docker exec "${db_container}" test -f "${gate_lock_marker}"; then
  cat /tmp/issue-911-gate.log >&2 || true
  echo "闸门会话未取得账户 A 的行锁。" >&2
  exit 1
fi

# 记录 1：A → B；记录 2：B → A。两笔都需要锁「旧 ∪ 新」= {A, B}。
update_payment_account() {
  local app_name="$1" record_id="$2" amount="$3" target_account="$4" note="$5"
  psql_in_db <<SQL
begin;
set application_name = '${app_name}';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"${user_id}","role":"authenticated"}', true);
select public.update_transaction(
  '${ledger_id}', '${record_id}', 'expense', '2099-05-01 00:00:00+00',
  jsonb_build_array(jsonb_build_object(
    'id', (select id from public.transaction_item where transaction_record_id = '${record_id}'),
    'amount', ${amount},
    'categoryId', '${expense_category_id}'
  )),
  jsonb_build_array(jsonb_build_object('accountId', '${target_account}')),
  '${merchant_id}', '${note}'
);
commit;
SQL
}

update_payment_account issue_911_a "${record_1}" 100 "${account_b}" "${note_prefix} 1" > /tmp/issue-911-a.log 2>&1 &
a_pid=$!
update_payment_account issue_911_b "${record_2}" 40 "${account_a}" "${note_prefix} 2" > /tmp/issue-911-b.log 2>&1 &
b_pid=$!

both_waiting=false
for _ in $(seq 1 50); do
  waiting="$(psql_in_db -A -t -c "select count(*) from pg_stat_activity where application_name in ('issue_911_a', 'issue_911_b') and wait_event_type = 'Lock';" | tr -d '\r')"
  if [[ "${waiting}" == "2" ]]; then
    both_waiting=true
    break
  fi
  sleep 0.1
done
if [[ "${both_waiting}" != "true" ]]; then
  cat /tmp/issue-911-a.log /tmp/issue-911-b.log >&2 || true
  echo "两个编辑事务没有同时在账户锁上排队。" >&2
  exit 1
fi
echo "ok - 闸门持有账户 A 时，两个反向切换付款账户的事务都在账户锁上等待"

docker exec "${db_container}" touch "${gate_release_marker}"
wait "${gate_pid}"
gate_pid=""

failed=false
wait "${a_pid}" || failed=true
a_pid=""
wait "${b_pid}" || failed=true
b_pid=""
if [[ "${failed}" == "true" ]] || grep -qi 'deadlock' /tmp/issue-911-a.log /tmp/issue-911-b.log; then
  cat /tmp/issue-911-a.log /tmp/issue-911-b.log >&2 || true
  echo "反向切换付款账户的两个事务应依次成功，不应出现 deadlock。" >&2
  exit 1
fi
echo "ok - 释放闸门后两个事务依次成功，没有死锁"

payments="$(psql_in_db -A -t -c "select string_agg(tr.note || '=' || p.account_id || ':' || p.balance_delta, ',' order by tr.note) from public.transaction_payment p join public.transaction_record tr on tr.id = p.transaction_record_id where tr.note like '${note_prefix}%';" | tr -d '\r')"
expected_payments="${note_prefix} 1=${account_b}:-100.00,${note_prefix} 2=${account_a}:-40.00"
if [[ "${payments}" != "${expected_payments}" ]]; then
  echo "付款明细期望 ${expected_payments}，实际 ${payments}" >&2
  exit 1
fi

# A：+100（记录 1 移出）−40（记录 2 移入）；B：−100 +40。
balances_final="$(psql_in_db -A -t -c "select string_agg(current_balance::text, '/' order by id) from public.account where id in ('${account_a}', '${account_b}');" | tr -d '\r')"
expected_final="$(psql_in_db -A -t -c "select (split_part('${balances_after_setup}', '/', 1)::numeric + 60)::text || '/' || (split_part('${balances_after_setup}', '/', 2)::numeric - 60)::text;" | tr -d '\r')"
if [[ "${balances_final}" != "${expected_final}" ]]; then
  echo "账户余额期望 ${expected_final}，实际 ${balances_final}" >&2
  exit 1
fi
echo "ok - 付款明细与两个账户余额最终一致"
