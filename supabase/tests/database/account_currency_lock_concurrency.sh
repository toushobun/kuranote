#!/usr/bin/env bash
# #910：币种判定与更新在同一事务内持有账户行锁，不会出现「检查时没有交易、更新前刚好有人记账」。
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
readonly name_prefix="#910 币种并发"
readonly hold_marker="/tmp/issue-910-hold-locked"
readonly release_marker="/tmp/issue-910-hold-release"
readonly authenticated_sql="set local role authenticated;
select set_config('request.jwt.claims', '{\"sub\":\"${user_id}\",\"role\":\"authenticated\"}', true);"

hold_pid=""
waiter_pid=""

cleanup() {
  docker exec "${db_container}" touch "${release_marker}" >/dev/null 2>&1 || true
  for pid in "${hold_pid}" "${waiter_pid}"; do
    [[ -n "${pid}" ]] && kill "${pid}" 2>/dev/null || true
  done
  docker exec "${db_container}" rm -f "${hold_marker}" "${release_marker}" >/dev/null 2>&1 || true
  # 测试账户只属于本脚本；跳过权限触发器后按外键顺序删除。
  psql_in_db >/dev/null 2>&1 <<SQL || true
begin;
set local session_replication_role = replica;
delete from public.transaction_payment p using public.account a
where a.id = p.account_id and a.name like '${name_prefix}%';
delete from public.transaction_item ti using public.transaction_record tr
where tr.id = ti.transaction_record_id and tr.note like '${name_prefix}%';
delete from public.transaction_record where note like '${name_prefix}%';
delete from public.account_holder h using public.account a
where a.id = h.account_id and a.name like '${name_prefix}%';
delete from public.account where name like '${name_prefix}%';
commit;
SQL
}
trap cleanup EXIT

create_account() {
  psql_in_db -A -t <<SQL | tr -d '\r' | grep -E '^[0-9a-f-]{36}$'
begin;
${authenticated_sql}
select public.create_account_with_holders('${ledger_id}', '${name_prefix} $1', 'cash', 'JPY', 0, '{}');
commit;
SQL
}

expense_sql() {
  cat <<SQL
select public.create_transaction(
  '${ledger_id}', 'expense', '2099-07-01 00:00:00+00',
  jsonb_build_array(jsonb_build_object('amount', 100, 'categoryId', '${expense_category_id}')),
  jsonb_build_array(jsonb_build_object('accountId', '$1')),
  '${merchant_id}', '${name_prefix}'
);
SQL
}

update_currency_sql() {
  echo "select public.update_account_with_holders('${ledger_id}', '$1', '${name_prefix} $2', 'cash', 'USD', '{}');"
}

# 先执行的会话在提交前暂停，后执行的会话必须在锁上等待；释放后检查结果。
run_race() {
  local first_sql="$1" second_sql="$2" label="$3"
  docker exec "${db_container}" rm -f "${hold_marker}" "${release_marker}"

  psql_in_db > /tmp/issue-910-hold.log 2>&1 <<SQL &
begin;
${authenticated_sql}
${first_sql}
\! touch ${hold_marker}
\! while [ ! -f ${release_marker} ]; do sleep 0.1; done
commit;
SQL
  hold_pid=$!

  for _ in $(seq 1 50); do
    docker exec "${db_container}" test -f "${hold_marker}" && break
    sleep 0.1
  done
  if ! docker exec "${db_container}" test -f "${hold_marker}"; then
    cat /tmp/issue-910-hold.log >&2 || true
    echo "${label}：先执行的会话没有完成写入。" >&2
    exit 1
  fi

  psql_in_db > /tmp/issue-910-waiter.log 2>&1 <<SQL &
begin;
set application_name = 'issue_910_waiter';
${authenticated_sql}
${second_sql}
commit;
SQL
  waiter_pid=$!

  local waiting=false
  for _ in $(seq 1 50); do
    if [[ "$(psql_in_db -A -t -c "select count(*) from pg_stat_activity where application_name = 'issue_910_waiter' and wait_event_type = 'Lock';" | tr -d '\r')" == "1" ]]; then
      waiting=true
      break
    fi
    sleep 0.1
  done
  if [[ "${waiting}" != "true" ]]; then
    cat /tmp/issue-910-hold.log /tmp/issue-910-waiter.log >&2 || true
    echo "${label}：后执行的会话没有在账户锁上等待。" >&2
    exit 1
  fi
  echo "ok - ${label}：后执行的会话在账户锁上等待"

  docker exec "${db_container}" touch "${release_marker}"
  if ! wait "${hold_pid}"; then
    cat /tmp/issue-910-hold.log >&2 || true
    echo "${label}：先执行的会话应提交成功。" >&2
    exit 1
  fi
  hold_pid=""
  waiter_status=0
  wait "${waiter_pid}" || waiter_status=$?
  waiter_pid=""
}

currency_of() {
  psql_in_db -A -t -c "select currency from public.account where id = '$1';" | tr -d '\r'
}

# 1. 记账先写入未提交，再修改币种：等记账提交后判定为已有交易并拒绝。
account_1="$(create_account 1)"
run_race "$(expense_sql "${account_1}")" "$(update_currency_sql "${account_1}" 1)" "记账在先"
if [[ "${waiter_status}" == "0" ]] || ! grep -q 'account_currency_locked' /tmp/issue-910-waiter.log; then
  cat /tmp/issue-910-waiter.log >&2 || true
  echo "记账提交后，修改币种应以 account_currency_locked 失败。" >&2
  exit 1
fi
if [[ "$(currency_of "${account_1}")" != "JPY" ]]; then
  echo "记账在先时账户币种应保持 JPY。" >&2
  exit 1
fi
echo "ok - 记账在先：提交后修改币种被拒绝，币种保持 JPY"

# 2. 修改币种先执行未提交，再记账：记账等币种提交后写入新币种账户，不死锁。
account_2="$(create_account 2)"
run_race "$(update_currency_sql "${account_2}" 2)" "$(expense_sql "${account_2}")" "改币种在先"
if [[ "${waiter_status}" != "0" ]] || grep -qi 'deadlock' /tmp/issue-910-waiter.log; then
  cat /tmp/issue-910-waiter.log >&2 || true
  echo "改币种提交后，记账应成功且不出现 deadlock。" >&2
  exit 1
fi
if [[ "$(currency_of "${account_2}")" != "USD" ]]; then
  echo "改币种在先时账户币种应为 USD。" >&2
  exit 1
fi
echo "ok - 改币种在先：币种改为 USD 后记账成功，没有死锁"
