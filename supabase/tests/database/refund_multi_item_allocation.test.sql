begin;

set local search_path = public, extensions;

select plan(11);

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
    ('57210000-0000-4000-8000-000000000002'::uuid, 300::numeric, 2),
    ('57210000-0000-4000-8000-000000000003'::uuid, 100000000::numeric, 3),
    ('57210000-0000-4000-8000-000000000004'::uuid, 300000000::numeric, 4)
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
    ('57220000-0000-4000-8000-000000000004'::uuid, 100::numeric, 4),
    ('57220000-0000-4000-8000-000000000005'::uuid, 100000000::numeric, 5)
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

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_multi_context),
            '57220000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000003',
                        'refundAmount', 25000000
                    ),
                    jsonb_build_object(
                        'refundedItemId', '57210000-0000-4000-8000-000000000004',
                        'refundAmount', 75000000
                    )
                )
            ),
            (select user_id from test_refund_multi_context)
        )
    $$,
    '大金额分摊不会因 bigint 中间乘法溢出'
);

select * from finish();
rollback;
