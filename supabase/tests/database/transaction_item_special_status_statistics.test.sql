begin;

set local search_path = public, extensions;

select plan(4);

create temporary table test_special_status_context on commit drop as
select
    l.id as ledger_id,
    lm.user_id,
    a.id as account_id,
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

grant select on test_special_status_context to authenticated;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_special_status_context);

insert into public.merchant (
    id, ledger_id, name, created_by, updated_by
)
select
    '55194900-0000-4000-8000-000000000001',
    context.ledger_id,
    '统计回归测试商家',
    context.user_id,
    context.user_id
from test_special_status_context context;

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
    '55194900-0000-4000-8000-000000000001',
    values_to_insert.title,
    null,
    context.user_id,
    context.user_id
from test_special_status_context context
cross join (values
    ('55194000-0000-4000-8000-000000000001'::uuid, '2026-07-15 12:00:00+00'::timestamptz, '跨月报销支出'),
    ('55194000-0000-4000-8000-000000000002'::uuid, '2026-08-15 12:00:00+00'::timestamptz, '跨月报销收入'),
    ('55194000-0000-4000-8000-000000000003'::uuid, '2026-09-15 12:00:00+00'::timestamptz, '退款原支出'),
    ('55194000-0000-4000-8000-000000000004'::uuid, '2026-10-15 12:00:00+00'::timestamptz, '退款收入')
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
from test_special_status_context context
cross join (values
    (
        '55194100-0000-4000-8000-000000000001'::uuid,
        '55194000-0000-4000-8000-000000000001'::uuid,
        'expense',
        10000::numeric,
        'pending_reimbursement'
    ),
    (
        '55194100-0000-4000-8000-000000000002'::uuid,
        '55194000-0000-4000-8000-000000000002'::uuid,
        'income',
        10000::numeric,
        null
    ),
    (
        '55194100-0000-4000-8000-000000000003'::uuid,
        '55194000-0000-4000-8000-000000000003'::uuid,
        'expense',
        10000::numeric,
        null
    ),
    (
        '55194100-0000-4000-8000-000000000004'::uuid,
        '55194000-0000-4000-8000-000000000004'::uuid,
        'income',
        3000::numeric,
        null
    )
) values_to_insert(id, record_id, category_type, amount, special_status);

select public.apply_transaction_item_links(
    context.ledger_id,
    '55194100-0000-4000-8000-000000000002',
    jsonb_build_object(
        'reimbursementItemIds',
        jsonb_build_array('55194100-0000-4000-8000-000000000001')
    ),
    context.user_id
)
from test_special_status_context context;

select public.apply_transaction_item_links(
    context.ledger_id,
    '55194100-0000-4000-8000-000000000004',
    jsonb_build_object(
        'refundedItemId',
        '55194100-0000-4000-8000-000000000003'
    ),
    context.user_id
)
from test_special_status_context context;

select set_config(
    'request.jwt.claim.sub',
    (select user_id::text from test_special_status_context),
    true
);
set local role authenticated;

-- 汇总函数会返回账本内所有账户的分组；这里只断言测试数据使用的账户，
-- 避免同账本其它账户的种子交易改变预期金额。
select is(
    (
        select coalesce(sum(summary.expense), 0)
        from public.load_transaction_group_summaries_with_special_status(
            (select ledger_id from test_special_status_context),
            'account',
            '2026-07-01 00:00:00+00',
            '2026-08-01 00:00:00+00'
        ) summary
        where summary.group_key = (
            select account_id::text from test_special_status_context
        )
    ),
    0::numeric,
    '报销完成后七月原支出不再计入统计'
);

select is(
    (
        select coalesce(sum(summary.income), 0)
        from public.load_transaction_group_summaries_with_special_status(
            (select ledger_id from test_special_status_context),
            'account',
            '2026-08-01 00:00:00+00',
            '2026-09-01 00:00:00+00'
        ) summary
        where summary.group_key = (
            select account_id::text from test_special_status_context
        )
    ),
    0::numeric,
    '报销完成后八月结算收入不再计入统计'
);

select is(
    (
        select coalesce(sum(summary.expense), 0)
        from public.load_transaction_group_summaries_with_special_status(
            (select ledger_id from test_special_status_context),
            'account',
            '2026-09-01 00:00:00+00',
            '2026-10-01 00:00:00+00'
        ) summary
        where summary.group_key = (
            select account_id::text from test_special_status_context
        )
    ),
    7000::numeric,
    '退款仍按原支出减去已退款金额统计'
);

select is(
    (
        select coalesce(sum(summary.income), 0)
        from public.load_transaction_group_summaries_with_special_status(
            (select ledger_id from test_special_status_context),
            'account',
            '2026-10-01 00:00:00+00',
            '2026-11-01 00:00:00+00'
        ) summary
        where summary.group_key = (
            select account_id::text from test_special_status_context
        )
    ),
    0::numeric,
    '退款收入仍不重复计入收入统计'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();
rollback;
