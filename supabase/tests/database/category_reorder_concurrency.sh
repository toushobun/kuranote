#!/usr/bin/env bash
set -euo pipefail

readonly ledger_id="46900000-0000-4000-8000-000000000003"
readonly owner_user_id="00000000-0000-4000-8000-000000000031"
readonly category_a="46950000-0000-4000-8000-000000000001"
readonly category_b="46950000-0000-4000-8000-000000000002"
readonly category_c="46950000-0000-4000-8000-000000000003"
readonly lock_marker="/tmp/category-reorder-a-locked"

db_container="$(docker ps --filter 'name=supabase_db_' --format '{{.Names}}' | head -n 1)"
if [[ -z "${db_container}" ]]; then
  echo "找不到本地 Supabase 数据库容器。" >&2
  exit 1
fi

psql_in_db() {
  docker exec -i "${db_container}" psql \
    -X \
    -v ON_ERROR_STOP=1 \
    -U postgres \
    -d postgres \
    "$@"
}

a_pid=""
b_pid=""
cleanup() {
  if [[ -n "${a_pid}" ]] && kill -0 "${a_pid}" 2>/dev/null; then
    kill "${a_pid}" 2>/dev/null || true
  fi
  if [[ -n "${b_pid}" ]] && kill -0 "${b_pid}" 2>/dev/null; then
    kill "${b_pid}" 2>/dev/null || true
  fi

  docker exec "${db_container}" rm -f "${lock_marker}" >/dev/null 2>&1 || true
  psql_in_db >/dev/null 2>&1 <<SQL || true
begin;
delete from public.category where ledger_id = '${ledger_id}';
delete from public.ledger_member where ledger_id = '${ledger_id}';
delete from public.ledger where id = '${ledger_id}';
commit;
SQL
}
trap cleanup EXIT

psql_in_db >/dev/null <<SQL
begin;

delete from public.category where ledger_id = '${ledger_id}';
delete from public.ledger_member where ledger_id = '${ledger_id}';
delete from public.ledger where id = '${ledger_id}';

insert into public.ledger (
  id,
  name,
  base_currency,
  owner_user_id,
  created_by,
  updated_by
)
values (
  '${ledger_id}',
  '分类排序并发测试账本',
  'JPY',
  '${owner_user_id}',
  '${owner_user_id}',
  '${owner_user_id}'
);

insert into public.ledger_member (
  id,
  ledger_id,
  user_id,
  role,
  status,
  invited_by,
  invited_at,
  joined_at,
  created_by,
  updated_by
)
values (
  '46901000-0000-4000-8000-000000000004',
  '${ledger_id}',
  '${owner_user_id}',
  'owner',
  'active',
  '${owner_user_id}',
  now(),
  now(),
  '${owner_user_id}',
  '${owner_user_id}'
);

insert into public.category (
  id,
  ledger_id,
  parent_id,
  type,
  name,
  sort_order,
  created_by,
  updated_by
)
values
  (
    '${category_a}',
    '${ledger_id}',
    null,
    'expense',
    '并发分类一',
    30,
    '${owner_user_id}',
    '${owner_user_id}'
  ),
  (
    '${category_b}',
    '${ledger_id}',
    null,
    'expense',
    '并发分类二',
    10,
    '${owner_user_id}',
    '${owner_user_id}'
  ),
  (
    '${category_c}',
    '${ledger_id}',
    null,
    'expense',
    '并发分类三',
    20,
    '${owner_user_id}',
    '${owner_user_id}'
  );

commit;
SQL

docker exec "${db_container}" rm -f "${lock_marker}"

psql_in_db > /tmp/category-reorder-a.log 2>&1 <<SQL &
begin;
set role authenticated;
set request.jwt.claim.sub = '${owner_user_id}';
set application_name = 'category_reorder_a';

select public.reorder_categories(
  '${ledger_id}',
  'expense',
  null,
  array[
    '${category_a}'::uuid,
    '${category_b}'::uuid,
    '${category_c}'::uuid
  ]
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
  if ! kill -0 "${a_pid}" 2>/dev/null; then
    break
  fi
  sleep 0.1
done

if [[ "${marker_found}" != "true" ]]; then
  cat /tmp/category-reorder-a.log >&2 || true
  echo "第一个排序请求未能取得锁。" >&2
  exit 1
fi

psql_in_db > /tmp/category-reorder-b.log 2>&1 <<SQL &
begin;
set role authenticated;
set request.jwt.claim.sub = '${owner_user_id}';
set application_name = 'category_reorder_b';

select public.reorder_categories(
  '${ledger_id}',
  'expense',
  null,
  array[
    '${category_c}'::uuid,
    '${category_a}'::uuid,
    '${category_b}'::uuid
  ]
);

commit;
SQL
b_pid=$!

blocked=false
for _ in $(seq 1 30); do
  wait_event="$(
    psql_in_db -A -t -c \
      "select coalesce(wait_event_type, '') || ':' || coalesce(wait_event, '') from pg_stat_activity where application_name = 'category_reorder_b';" \
      | tr -d '\r'
  )"

  if [[ "${wait_event}" == Lock:* ]]; then
    blocked=true
    break
  fi
  if ! kill -0 "${b_pid}" 2>/dev/null; then
    break
  fi
  sleep 0.1
done

if [[ "${blocked}" != "true" ]]; then
  cat /tmp/category-reorder-a.log >&2 || true
  cat /tmp/category-reorder-b.log >&2 || true
  echo "第二个排序请求未等待第一个请求的分类写锁。" >&2
  exit 1
fi

echo "ok - 第二个并发排序请求等待分类写锁"

wait "${a_pid}"
a_pid=""
wait "${b_pid}"
b_pid=""

if ! grep -Eq '^[[:space:]]*3[[:space:]]*$' /tmp/category-reorder-a.log; then
  cat /tmp/category-reorder-a.log >&2
  echo "第一个排序请求未完整写入 3 个分类。" >&2
  exit 1
fi
echo "ok - 第一个并发排序请求完整写入"

if ! grep -Eq '^[[:space:]]*3[[:space:]]*$' /tmp/category-reorder-b.log; then
  cat /tmp/category-reorder-b.log >&2
  echo "第二个排序请求未完整写入 3 个分类。" >&2
  exit 1
fi
echo "ok - 第二个并发排序请求完整写入"

final_order="$(
  psql_in_db -A -t -c \
    "select string_agg(id::text, ',' order by sort_order) from public.category where ledger_id = '${ledger_id}' and type = 'expense' and parent_id is null and is_archived = false;" \
    | tr -d '\r'
)"
expected_order="${category_c},${category_a},${category_b}"

if [[ "${final_order}" != "${expected_order}" ]]; then
  echo "期望最终顺序: ${expected_order}" >&2
  echo "实际最终顺序: ${final_order}" >&2
  exit 1
fi

echo "ok - 并发排序最终结果完整来自第二个请求"
