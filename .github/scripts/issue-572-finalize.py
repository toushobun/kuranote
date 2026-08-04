from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    if text.count(old) != 1:
        raise RuntimeError(f"{path}: expected one match, found {text.count(old)}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


repo_test = "src/internal/transaction/repository/transactionRepository.test.ts"
repo_anchor = '''  it("转账创建映射原子 RPC 参数", async () => {
'''
repo_tests = '''  it("退款收入将多目标分摊数组原样传给原子 RPC", async () => {
    const { repository, rpc } = createRepository();
    const refundAllocations = [
      {
        refundAmount: 300,
        refundedItemId: "00000000-0000-4000-8000-000000005073",
      },
      {
        refundAmount: 900,
        refundedItemId: "00000000-0000-4000-8000-000000005074",
      },
    ];

    await repository.createNormal({
      ...normalInput,
      items: [{ ...normalInput.items[0], refundAllocations }],
      type: "income",
    });

    expect(rpc).toHaveBeenCalledWith(
      "create_transaction",
      expect.objectContaining({
        p_items: [
          expect.objectContaining({
            refundAllocations,
          }),
        ],
      }),
    );
  });

  it("转账创建映射原子 RPC 参数", async () => {
'''
replace_once(repo_test, repo_anchor, repo_tests)

service_test = "src/internal/transaction/service/transactionService.test.ts"
service_anchor = '''  it("支出分类允许保存待报销状态", async () => {
'''
service_tests = '''  it("收入分类允许保存多目标退款分摊", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          refundAllocations: [
            {
              refundAmount: 300,
              refundedItemId: "00000000-0000-4000-8000-000000005073",
            },
            {
              refundAmount: 900,
              refundedItemId: "00000000-0000-4000-8000-000000005074",
            },
          ],
        },
      ],
      type: "income" as const,
    };

    await service.createNormal(input);

    expect(repository.createNormal).toHaveBeenCalledWith(input);
  });

  it("退款分摊目标重复时拒绝写入", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            refundAllocations: [
              {
                refundAmount: 600,
                refundedItemId: "00000000-0000-4000-8000-000000005073",
              },
              {
                refundAmount: 600,
                refundedItemId: "00000000-0000-4000-8000-000000005073",
              },
            ],
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.refundLinkInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("退款分摊合计与收入金额不一致时拒绝写入", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            refundAllocations: [
              {
                refundAmount: 300,
                refundedItemId: "00000000-0000-4000-8000-000000005073",
              },
              {
                refundAmount: 899.99,
                refundedItemId: "00000000-0000-4000-8000-000000005074",
              },
            ],
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.refundLinkInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("支出分类允许保存待报销状态", async () => {
'''
replace_once(service_test, service_anchor, service_tests)

migration_workflow = ".github/workflows/migration-check.yml"
replace_once(
    migration_workflow,
    "          bash supabase/tests/database/category_reorder_write_concurrency.sh\n",
    "          bash supabase/tests/database/category_reorder_write_concurrency.sh\n"
    "          bash supabase/tests/database/refund_allocation_concurrency.sh\n",
)

Path("supabase/tests/database/refund_multi_item_allocation.test.sql").write_text(
    r'''begin;

set local search_path = public, extensions;

select plan(10);

create temporary table test_refund_multi_context as
select
    expense_item.ledger_id,
    expense_item.account_id,
    expense_item.transaction_record_id as expense_record_id,
    expense_category.id as expense_category_id,
    income_item.transaction_record_id as income_record_id,
    income_category.id as income_category_id,
    expense_item.created_by as user_id
from public.transaction_item expense_item
join public.category expense_category
  on expense_category.id = expense_item.category_id
 and expense_category.ledger_id = expense_item.ledger_id
 and expense_category.type = 'expense'
join public.transaction_record expense_record
  on expense_record.id = expense_item.transaction_record_id
 and expense_record.ledger_id = expense_item.ledger_id
 and expense_record.status = 'active'
join lateral (
    select candidate.*
    from public.transaction_item candidate
    join public.category category
      on category.id = candidate.category_id
     and category.ledger_id = candidate.ledger_id
     and category.type = 'income'
    join public.transaction_record record
      on record.id = candidate.transaction_record_id
     and record.ledger_id = candidate.ledger_id
     and record.status = 'active'
    where candidate.ledger_id = expense_item.ledger_id
    limit 1
) income_item on true
join public.category income_category
  on income_category.id = income_item.category_id
 and income_category.ledger_id = income_item.ledger_id
limit 1;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_refund_multi_context);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    values_to_insert.id,
    context.ledger_id,
    context.expense_record_id,
    context.account_id,
    context.expense_category_id,
    values_to_insert.amount,
    0,
    -values_to_insert.amount,
    null,
    5720 + values_to_insert.sort_order,
    context.user_id,
    context.user_id
from test_refund_multi_context context
cross join (values
    ('57210000-0000-4000-8000-000000000001'::uuid, 100::numeric, 1),
    ('57210000-0000-4000-8000-000000000002'::uuid, 300::numeric, 2)
) values_to_insert(id, amount, sort_order);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    values_to_insert.id,
    context.ledger_id,
    context.income_record_id,
    context.account_id,
    context.income_category_id,
    values_to_insert.amount,
    0,
    values_to_insert.amount,
    null,
    5730 + values_to_insert.sort_order,
    context.user_id,
    context.user_id
from test_refund_multi_context context
cross join (values
    ('57220000-0000-4000-8000-000000000001'::uuid, 100::numeric, 1),
    ('57220000-0000-4000-8000-000000000002'::uuid, 30::numeric, 2),
    ('57220000-0000-4000-8000-000000000003'::uuid, 100::numeric, 3),
    ('57220000-0000-4000-8000-000000000004'::uuid, 100::numeric, 4)
) values_to_insert(id, amount, sort_order);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_multi_context),
            '57220000-0000-4000-8000-000000000001',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000001',
                        'refundAmount', 25
                    ),
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000002',
                        'refundAmount', 75
                    )
                )
            ),
            (select user_id from test_refund_multi_context)
        )
    $$,
    '一条退款收入可以关联两条支出明细'
);

select is(
    (select count(*)::integer from public.transaction_item_refund_link where refund_income_item_id = '57220000-0000-4000-8000-000000000001'),
    2,
    '多目标退款写入两条关联'
);

select is(
    (select sum(refund_amount) from public.transaction_item_refund_link where refund_income_item_id = '57220000-0000-4000-8000-000000000001'),
    100::numeric,
    '分摊合计严格等于退款收入金额'
);

select is(
    (select string_agg(refund_amount::text, ',' order by refunded_item_id) from public.transaction_item_refund_link where refund_income_item_id = '57220000-0000-4000-8000-000000000001'),
    '25.00,75.00',
    '按剩余可退金额比例分摊'
);

select is(
    (select string_agg(amount::text || '/' || balance_delta::text, ',' order by id) from public.transaction_item where id in ('57210000-0000-4000-8000-000000000001', '57210000-0000-4000-8000-000000000002')),
    '100.00/-100.00,300.00/-300.00',
    '退款关联不会覆盖原金额或 balance_delta'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_multi_context),
            '57220000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000001',
                        'refundAmount', 30
                    )
                )
            ),
            (select user_id from test_refund_multi_context)
        )
    $$,
    '同一支出明细支持多次分批退款'
);

select is(
    (select sum(refund_amount) from public.transaction_item_refund_link where refunded_item_id = '57210000-0000-4000-8000-000000000001'),
    55::numeric,
    '分批退款金额实时聚合'
);

select is(
    (select refunded_amount from public.transaction_item_with_refund where id = '57210000-0000-4000-8000-000000000001'),
    55::numeric,
    '退款聚合视图兼容多笔关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_multi_context),
            '57220000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000001',
                        'refundAmount', 50
                    ),
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000002',
                        'refundAmount', 50
                    )
                )
            ),
            (select user_id from test_refund_multi_context)
        )
    $$,
    '22023',
    'refund_allocation_invalid',
    '数据库拒绝客户端手动篡改比例分摊'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_multi_context),
            '57220000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000002',
                        'refundAmount', 50
                    ),
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000002',
                        'refundAmount', 50
                    )
                )
            ),
            (select user_id from test_refund_multi_context)
        )
    $$,
    '22023',
    'refund_allocation_invalid',
    '数据库拒绝重复退款目标'
);

select * from finish();
rollback;
''',
    encoding="utf-8",
)

Path("supabase/tests/database/refund_allocation_concurrency.sh").write_text(
    r'''#!/usr/bin/env bash
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
''',
    encoding="utf-8",
)

print("Issue #572 final tests prepared")
