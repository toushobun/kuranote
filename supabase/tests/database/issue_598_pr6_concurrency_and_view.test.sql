begin;

set local search_path = public, extensions;

select plan(6);

-- transaction_item_with_refund 在同一支出同时存在退款与报销时，
-- 必须只按实际有效核销金额扣减，且收入侧只扣除自己发起的关联金额。
create temporary table issue_598_pr6_context on commit drop as
select
    l.id as ledger_id,
    lm.user_id,
    a.id as account_id,
    merchant.id as merchant_id,
    expense_category.id as expense_category_id,
    income_category.id as income_category_id
from public.ledger l
join public.ledger_member lm
  on lm.ledger_id = l.id
 and lm.status = 'active'
join lateral (
    select account.id
    from public.account account
    where account.ledger_id = l.id
      and account.is_archived = false
    order by account.created_at
    limit 1
) a on true
join lateral (
    select merchant.id
    from public.merchant merchant
    where merchant.ledger_id = l.id
      and merchant.is_archived = false
    order by merchant.created_at
    limit 1
) merchant on true
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = l.id
      and category.type = 'expense'
      and category.is_archived = false
    order by category.created_at
    limit 1
) expense_category on true
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = l.id
      and category.type = 'income'
      and category.is_archived = false
    order by category.created_at
    limit 1
) income_category on true
where l.id = '00000000-0000-4000-8000-000000000032'
limit 1;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from issue_598_pr6_context);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    fixture.id,
    context.ledger_id,
    'normal',
    'active',
    fixture.transaction_at,
    context.merchant_id,
    fixture.title,
    context.user_id,
    context.user_id
from issue_598_pr6_context context
cross join (values
    ('59890000-0000-4000-8000-000000000001'::uuid, '2026-08-18 01:00:00+00'::timestamptz, 'PR6 组合核销支出'),
    ('59890000-0000-4000-8000-000000000002'::uuid, '2026-08-18 02:00:00+00'::timestamptz, 'PR6 退款收入'),
    ('59890000-0000-4000-8000-000000000003'::uuid, '2026-08-18 03:00:00+00'::timestamptz, 'PR6 报销收入')
) fixture(id, transaction_at, title);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order, special_status,
    created_by, updated_by
)
select
    fixture.id,
    context.ledger_id,
    fixture.record_id,
    context.account_id,
    case fixture.category_type
        when 'expense' then context.expense_category_id
        else context.income_category_id
    end,
    fixture.amount,
    0,
    case fixture.category_type when 'expense' then -fixture.amount else fixture.amount end,
    0,
    fixture.special_status::public.transaction_item_special_status,
    context.user_id,
    context.user_id
from issue_598_pr6_context context
cross join (values
    ('59891000-0000-4000-8000-000000000001'::uuid, '59890000-0000-4000-8000-000000000001'::uuid, 'expense', 100::numeric, 'pending_reimbursement'),
    ('59891000-0000-4000-8000-000000000002'::uuid, '59890000-0000-4000-8000-000000000002'::uuid, 'income', 30::numeric, null),
    ('59891000-0000-4000-8000-000000000003'::uuid, '59890000-0000-4000-8000-000000000003'::uuid, 'income', 50::numeric, null)
) fixture(id, record_id, category_type, amount, special_status);

select public.apply_transaction_item_links(
    (select ledger_id from issue_598_pr6_context),
    '59891000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'refundAllocations',
        jsonb_build_array(jsonb_build_object(
            'refundedItemId', '59891000-0000-4000-8000-000000000001',
            'refundAmount', 30
        ))
    ),
    (select user_id from issue_598_pr6_context)
);

select public.apply_transaction_item_links(
    (select ledger_id from issue_598_pr6_context),
    '59891000-0000-4000-8000-000000000003',
    jsonb_build_object(
        'reimbursementItemId', '59891000-0000-4000-8000-000000000001'
    ),
    (select user_id from issue_598_pr6_context)
);

select is(
    (select refunded_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000001'),
    30::numeric,
    '组合场景记录实际退款核销金额'
);

select is(
    (select reimbursement_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000001'),
    50::numeric,
    '组合场景记录实际报销核销金额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000001'),
    20::numeric,
    '退款加报销部分核销后支出业务净额为剩余二十'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000002'),
    0::numeric,
    '完全分配的退款收入业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000003'),
    0::numeric,
    '完全分配的报销收入业务净额为零'
);

select is(
    (select special_status from public.transaction_item where id = '59891000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '组合部分核销未归零时保持待报销'
);

select * from finish();
rollback;
