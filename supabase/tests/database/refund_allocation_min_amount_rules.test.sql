begin;

set local search_path = public, extensions;

select plan(10);

create temporary table test_refund_min_context as
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
      and candidate.account_id = expense_item.account_id
    limit 1
) income_item on true
join public.category income_category
  on income_category.id = income_item.category_id
 and income_category.ledger_id = income_item.ledger_id
limit 1;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_refund_min_context);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, special_status,
    created_by, updated_by
)
select
    item.id,
    context.ledger_id,
    context.expense_record_id,
    context.account_id,
    context.expense_category_id,
    item.amount,
    0,
    -item.amount,
    null,
    5980 + item.sort_order,
    item.special_status::public.transaction_item_special_status,
    context.user_id,
    context.user_id
from test_refund_min_context context
cross join (values
    ('59830000-0000-4000-8000-000000000001'::uuid, 100::numeric, 1, 'pending_reimbursement'),
    ('59830000-0000-4000-8000-000000000002'::uuid, 40::numeric, 2, null),
    ('59830000-0000-4000-8000-000000000003'::uuid, 100::numeric, 3, null),
    ('59830000-0000-4000-8000-000000000004'::uuid, 100::numeric, 4, null),
    ('59830000-0000-4000-8000-000000000005'::uuid, 100::numeric, 5, null)
) item(id, amount, sort_order, special_status);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    item.id,
    context.ledger_id,
    context.income_record_id,
    context.account_id,
    context.income_category_id,
    item.amount,
    0,
    item.amount,
    null,
    5990 + item.sort_order,
    context.user_id,
    context.user_id
from test_refund_min_context context
cross join (values
    ('59840000-0000-4000-8000-000000000001'::uuid, 40::numeric, 1),
    ('59840000-0000-4000-8000-000000000002'::uuid, 150::numeric, 2),
    ('59840000-0000-4000-8000-000000000003'::uuid, 150::numeric, 3),
    ('59840000-0000-4000-8000-000000000004'::uuid, 150::numeric, 4),
    ('59840000-0000-4000-8000-000000000005'::uuid, 100::numeric, 5)
) item(id, amount, sort_order);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000001',
            jsonb_build_object(
                'reimbursementItemId',
                '59830000-0000-4000-8000-000000000001'
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '先建立报销分摊以减少退款目标的剩余可核销金额'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000001',
                        'refundAmount', 60
                    ),
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000002',
                        'refundAmount', 40
                    )
                )
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '退款收入超过组合剩余额度时按 allocatable_amount 建立关联'
);

select is(
    (
        select sum(refund_amount)
        from public.transaction_item_refund_link
        where refund_income_item_id = '59840000-0000-4000-8000-000000000002'
    ),
    100::numeric,
    '退款分摊合计等于收入金额与组合剩余额度合计的较小值'
);

select is(
    (
        select string_agg(
            refund_amount::text,
            ','
            order by refunded_item_id
        )
        from public.transaction_item_refund_link
        where refund_income_item_id = '59840000-0000-4000-8000-000000000002'
    ),
    '60.00,40.00',
    '已有报销分摊会减少退款侧对应目标的分摊金额'
);

select is(
    (
        select business_net_amount
        from public.transaction_item_with_refund
        where id = '59840000-0000-4000-8000-000000000002'
    ),
    50::numeric,
    '收入金额超过 allocatable_amount 的差额体现为业务净额'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        (select ledger_id from test_refund_min_context),
        '59830000-0000-4000-8000-000000000001'
    ),
    0::numeric,
    '退款与报销组合核销后目标剩余额度为零'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000003',
                        'refundAmount', 99.99
                    )
                )
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '22023',
    'refund_allocation_invalid',
    '分摊合计小于 allocatable_amount 时拒绝写入'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000003',
                        'refundAmount', 100.01
                    )
                )
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '22023',
    'refund_amount_exceeded',
    '分摊合计大于 allocatable_amount 时拒绝写入'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000003',
                        'refundAmount', 33.34
                    ),
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000004',
                        'refundAmount', 33.33
                    ),
                    jsonb_build_object(
                        'refundedItemId', '59830000-0000-4000-8000-000000000005',
                        'refundAmount', 33.33
                    )
                )
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '最大余数法按 allocatable_amount 分摊多个目标'
);

select is(
    (
        select string_agg(
            refund_amount::text,
            ','
            order by refunded_item_id
        )
        from public.transaction_item_refund_link
        where refund_income_item_id = '59840000-0000-4000-8000-000000000005'
    ),
    '33.34,33.33,33.33',
    '最大余数法按目标 id 稳定补齐尾差'
);

select * from finish();
rollback;
