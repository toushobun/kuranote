begin;

set local search_path = public, extensions;

select plan(18);

create temporary table test_business_net_context on commit drop as
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
join public.app_user u
  on u.id = lm.user_id
 and u.status = 'active'
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
limit 1;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_business_net_context);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    values_to_insert.id,
    context.ledger_id,
    'normal',
    'active',
    values_to_insert.transaction_at,
    context.merchant_id,
    values_to_insert.title,
    null,
    context.user_id,
    context.user_id
from test_business_net_context context
cross join (values
    ('57300000-0000-4000-8000-000000000001'::uuid, '2026-08-01 01:00:00+00'::timestamptz, '退款支出 A'),
    ('57300000-0000-4000-8000-000000000002'::uuid, '2026-08-01 02:00:00+00'::timestamptz, '退款支出 B'),
    ('57300000-0000-4000-8000-000000000003'::uuid, '2026-08-01 03:00:00+00'::timestamptz, '退款支出 C'),
    ('57300000-0000-4000-8000-000000000004'::uuid, '2026-08-02 01:00:00+00'::timestamptz, '多明细退款收入'),
    ('57300000-0000-4000-8000-000000000005'::uuid, '2026-08-03 01:00:00+00'::timestamptz, '第二笔退款收入'),
    ('57300000-0000-4000-8000-000000000006'::uuid, '2026-08-04 01:00:00+00'::timestamptz, '报销支出 A'),
    ('57300000-0000-4000-8000-000000000007'::uuid, '2026-08-04 02:00:00+00'::timestamptz, '报销支出 B'),
    ('57300000-0000-4000-8000-000000000008'::uuid, '2026-08-05 01:00:00+00'::timestamptz, '多明细报销收入'),
    ('57300000-0000-4000-8000-000000000009'::uuid, '2026-08-06 01:00:00+00'::timestamptz, '普通收入'),
    ('57300000-0000-4000-8000-000000000010'::uuid, '2026-08-07 01:00:00+00'::timestamptz, '仍待报销支出'),
    ('57300000-0000-4000-8000-000000000011'::uuid, '2026-08-08 01:00:00+00'::timestamptz, '部分报销支出'),
    ('57300000-0000-4000-8000-000000000012'::uuid, '2026-08-08 02:00:00+00'::timestamptz, '部分报销收入')
) values_to_insert(id, transaction_at, title);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    values_to_insert.id,
    context.ledger_id,
    values_to_insert.record_id,
    context.account_id,
    case values_to_insert.category_type
        when 'expense' then context.expense_category_id
        else context.income_category_id
    end,
    values_to_insert.amount,
    0,
    case values_to_insert.category_type
        when 'expense' then -values_to_insert.amount
        else values_to_insert.amount
    end,
    null,
    0,
    values_to_insert.special_status::public.transaction_item_special_status,
    context.user_id,
    context.user_id
from test_business_net_context context
cross join (values
    ('57310000-0000-4000-8000-000000000001'::uuid, '57300000-0000-4000-8000-000000000001'::uuid, 'expense', 100::numeric, null),
    ('57310000-0000-4000-8000-000000000002'::uuid, '57300000-0000-4000-8000-000000000002'::uuid, 'expense', 200::numeric, null),
    ('57310000-0000-4000-8000-000000000003'::uuid, '57300000-0000-4000-8000-000000000003'::uuid, 'expense', 200::numeric, null),
    ('57310000-0000-4000-8000-000000000004'::uuid, '57300000-0000-4000-8000-000000000004'::uuid, 'income', 100::numeric, null),
    ('57310000-0000-4000-8000-000000000014'::uuid, '57300000-0000-4000-8000-000000000004'::uuid, 'income', 200::numeric, null),
    ('57310000-0000-4000-8000-000000000015'::uuid, '57300000-0000-4000-8000-000000000004'::uuid, 'income', 200::numeric, null),
    ('57310000-0000-4000-8000-000000000005'::uuid, '57300000-0000-4000-8000-000000000005'::uuid, 'income', 50::numeric, null),
    ('57310000-0000-4000-8000-000000000006'::uuid, '57300000-0000-4000-8000-000000000006'::uuid, 'expense', 200::numeric, 'pending_reimbursement'),
    ('57310000-0000-4000-8000-000000000007'::uuid, '57300000-0000-4000-8000-000000000007'::uuid, 'expense', 300::numeric, 'pending_reimbursement'),
    ('57310000-0000-4000-8000-000000000008'::uuid, '57300000-0000-4000-8000-000000000008'::uuid, 'income', 200::numeric, null),
    ('57310000-0000-4000-8000-000000000011'::uuid, '57300000-0000-4000-8000-000000000008'::uuid, 'income', 300::numeric, null),
    ('57310000-0000-4000-8000-000000000009'::uuid, '57300000-0000-4000-8000-000000000009'::uuid, 'income', 80::numeric, null),
    ('57310000-0000-4000-8000-000000000010'::uuid, '57300000-0000-4000-8000-000000000010'::uuid, 'expense', 120::numeric, 'pending_reimbursement'),
    ('57310000-0000-4000-8000-000000000012'::uuid, '57300000-0000-4000-8000-000000000011'::uuid, 'expense', 100::numeric, 'pending_reimbursement'),
    ('57310000-0000-4000-8000-000000000013'::uuid, '57300000-0000-4000-8000-000000000012'::uuid, 'income', 100::numeric, null)
) values_to_insert(id, record_id, category_type, amount, special_status);

insert into public.transaction_item_refund_link (
    ledger_id, refunded_item_id, refund_income_item_id, refund_amount, created_by
)
select
    context.ledger_id,
    allocation.refunded_item_id,
    allocation.refund_income_item_id,
    allocation.refund_amount,
    context.user_id
from test_business_net_context context
cross join (values
    ('57310000-0000-4000-8000-000000000001'::uuid, '57310000-0000-4000-8000-000000000004'::uuid, 100::numeric),
    ('57310000-0000-4000-8000-000000000002'::uuid, '57310000-0000-4000-8000-000000000014'::uuid, 200::numeric),
    ('57310000-0000-4000-8000-000000000002'::uuid, '57310000-0000-4000-8000-000000000005'::uuid, 50::numeric)
) allocation(refunded_item_id, refund_income_item_id, refund_amount);

insert into public.transaction_item_reimbursement_link (
    ledger_id, target_expense_item_id,
    reimbursement_income_item_id, reimbursement_amount, created_by
)
select
    context.ledger_id,
    reimbursement.target_expense_item_id,
    reimbursement.reimbursement_income_item_id,
    reimbursement.reimbursement_amount,
    context.user_id
from test_business_net_context context
cross join (values
    ('57310000-0000-4000-8000-000000000006'::uuid, '57310000-0000-4000-8000-000000000008'::uuid, 200::numeric),
    ('57310000-0000-4000-8000-000000000007'::uuid, '57310000-0000-4000-8000-000000000011'::uuid, 300::numeric),
    ('57310000-0000-4000-8000-000000000012'::uuid, '57310000-0000-4000-8000-000000000013'::uuid, 40::numeric)
) reimbursement(
    target_expense_item_id,
    reimbursement_income_item_id,
    reimbursement_amount
);

select set_config('kuranote.reimbursement_link_flow', 'on', true);
update public.transaction_item
set special_status = 'reimbursed'
where id in (
    '57310000-0000-4000-8000-000000000006',
    '57310000-0000-4000-8000-000000000007'
);
select set_config('kuranote.reimbursement_link_flow', 'off', true);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000001'),
    0::numeric,
    '完全退款支出的业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000002'),
    -50::numeric,
    '同一支出多次退款超过原金额后保留负数业务净额'
);

select is(
    (
        select sum(business_net_amount)
        from public.transaction_item_with_refund
        where id in (
            '57310000-0000-4000-8000-000000000004',
            '57310000-0000-4000-8000-000000000014',
            '57310000-0000-4000-8000-000000000015'
        )
    ),
    200::numeric,
    '同一退款交易拆成多条单目标收入明细后保留尚未关联的业务净额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000005'),
    0::numeric,
    '完全分配的第二笔退款收入业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000006'),
    0::numeric,
    '多明细报销中的第一条支出业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000007'),
    0::numeric,
    '多明细报销中的第二条支出业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000008'),
    0::numeric,
    '结清多条支出的报销收入业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000009'),
    80::numeric,
    '普通收入保持原始业务金额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000010'),
    120::numeric,
    '仍待报销的支出在实际结清前保留原始业务金额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000012'),
    60::numeric,
    '部分报销支出按实际关联金额保留剩余业务净额'
);

select is(
    (select reimbursement_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000012'),
    40::numeric,
    '部分报销支出直接暴露实际报销核销金额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000013'),
    60::numeric,
    '部分报销收入按实际关联金额保留未核销净收益'
);

select is(
    (select amount from public.transaction_item where id = '57310000-0000-4000-8000-000000000002'),
    200::numeric,
    '退款不会覆盖原始金额'
);

select is(
    (select balance_delta from public.transaction_item where id = '57310000-0000-4000-8000-000000000002'),
    -200::numeric,
    '业务净额不会改写账户现金流'
);

insert into public.transaction_item_refund_link (
    ledger_id, refunded_item_id, refund_income_item_id, refund_amount, created_by
)
select
    context.ledger_id,
    '57310000-0000-4000-8000-000000000003',
    '57310000-0000-4000-8000-000000000015',
    200,
    context.user_id
from test_business_net_context context;

select is(
    (
        select sum(business_net_amount)
        from public.transaction_item_with_refund
        where id in (
            '57310000-0000-4000-8000-000000000004',
            '57310000-0000-4000-8000-000000000014',
            '57310000-0000-4000-8000-000000000015'
        )
    ),
    0::numeric,
    '跨账单退款拆成多条单目标收入明细后全部关联时业务净额为零'
);

-- 当前产品禁止作废已关联交易；测试中只绕过该入口保护以构造历史失效数据，
-- 验证派生视图不会让失效关联继续影响业务净额。
alter table public.transaction_record
disable trigger transaction_record_prevent_linked_void;

update public.transaction_record
set status = 'deleted', deleted_at = now()
where id = '57300000-0000-4000-8000-000000000004';

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000001'),
    100::numeric,
    '退款收入失效后原支出恢复业务净额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '57310000-0000-4000-8000-000000000002'),
    150::numeric,
    '失效退款只移除对应分摊并保留其它有效退款'
);

update public.transaction_record
set status = 'deleted', deleted_at = now()
where id = '57300000-0000-4000-8000-000000000008';

alter table public.transaction_record
enable trigger transaction_record_prevent_linked_void;

select is(
    (select sum(business_net_amount) from public.transaction_item_with_refund where id in (
        '57310000-0000-4000-8000-000000000006',
        '57310000-0000-4000-8000-000000000007'
    )),
    500::numeric,
    '报销收入失效后已结清支出恢复业务净额'
);

select * from finish();
rollback;