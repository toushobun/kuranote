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
    ('59830000-0000-4000-8000-000000000002'::uuid, 100::numeric, 2, null)
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
    ('59840000-0000-4000-8000-000000000003'::uuid, 150::numeric, 3)
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
    '先建立报销关联以减少退款目标的剩余可核销金额'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id = '59840000-0000-4000-8000-000000000001'
    ),
    40::numeric,
    '报销关联先核销 40'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundedItemId',
                '59830000-0000-4000-8000-000000000001'
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '退款收入按单目标剩余额度建立关联'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link
        where refund_income_item_id = '59840000-0000-4000-8000-000000000002'
    ),
    1,
    '一条退款收入只写入一条退款关联'
);

select is(
    (
        select refunded_item_id
        from public.transaction_item_refund_link
        where refund_income_item_id = '59840000-0000-4000-8000-000000000002'
    ),
    '59830000-0000-4000-8000-000000000001'::uuid,
    '退款关联指向提交的单一支出目标'
);

select is(
    (
        select refund_amount
        from public.transaction_item_refund_link
        where refund_income_item_id = '59840000-0000-4000-8000-000000000002'
    ),
    60::numeric,
    '退款核销金额按收入金额与组合剩余额度的较小值封顶'
);

select is(
    (
        select business_net_amount
        from public.transaction_item_with_refund
        where id = '59840000-0000-4000-8000-000000000002'
    ),
    90::numeric,
    '收入超过单目标剩余额度的差额体现为业务净收益'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        (select ledger_id from test_refund_min_context),
        '59830000-0000-4000-8000-000000000001'
    ),
    0::numeric,
    '退款与报销组合核销后目标剩余额度为零'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from test_refund_min_context),
            '59840000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'refundedItemId',
                '59830000-0000-4000-8000-000000000002'
            ),
            (select user_id from test_refund_min_context)
        )
    $$,
    '退款收入超过全新目标剩余额度时仍按封顶金额成功建立关联'
);

select is(
    (
        select link.refund_amount::text || '/' || income_item.business_net_amount::text
        from public.transaction_item_refund_link link
        join public.transaction_item_with_refund income_item
          on income_item.id = link.refund_income_item_id
        where link.refund_income_item_id = '59840000-0000-4000-8000-000000000003'
    ),
    '100.00/50.00',
    '单目标退款保留 LEAST 封顶并将未核销部分计入净收益'
);

select * from finish();
rollback;
