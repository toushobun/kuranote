begin;

set local search_path = public, extensions;

select plan(4);

create temporary table test_issue_605_pr2_context on commit drop as
select
    l.id as ledger_id,
    lm.user_id,
    a.id as account_id,
    m.id as merchant_id,
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
) m on true
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

grant select on test_issue_605_pr2_context to authenticated;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_issue_605_pr2_context);

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
from test_issue_605_pr2_context context
cross join (values
    ('60521000-0000-4000-8000-000000000001'::uuid, '2099-01-15 12:00:00+00'::timestamptz, '核销结余原支出'),
    ('60521000-0000-4000-8000-000000000002'::uuid, '2099-01-15 13:00:00+00'::timestamptz, '超额报销收入')
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
from test_issue_605_pr2_context context
cross join (values
    (
        '60522000-0000-4000-8000-000000000001'::uuid,
        '60521000-0000-4000-8000-000000000001'::uuid,
        'expense',
        100::numeric,
        'pending_reimbursement'
    ),
    (
        '60522000-0000-4000-8000-000000000002'::uuid,
        '60521000-0000-4000-8000-000000000002'::uuid,
        'income',
        150::numeric,
        null
    )
) values_to_insert(id, record_id, category_type, amount, special_status);

select public.apply_transaction_item_links(
    context.ledger_id,
    '60522000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'reimbursementItemId',
        '60522000-0000-4000-8000-000000000001'
    ),
    context.user_id
)
from test_issue_605_pr2_context context;

select is(
    (
        select business_net_amount
        from public.transaction_item_with_refund
        where id = '60522000-0000-4000-8000-000000000001'
    ),
    -50::numeric,
    '超额核销后的支出保留负数业务净额'
);

select is(
    (
        select business_net_amount
        from public.transaction_item_with_refund
        where id = '60522000-0000-4000-8000-000000000002'
    ),
    0::numeric,
    '超额报销收入本身仍完整核销为零'
);

select set_config(
    'request.jwt.claim.sub',
    (select user_id::text from test_issue_605_pr2_context),
    true
);
set local role authenticated;

select is(
    (
        select coalesce(sum(summary.income), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => (select ledger_id from test_issue_605_pr2_context),
            p_group_by => 'category',
            p_date_start => '2099-01-15 00:00:00+00',
            p_date_end => '2099-01-16 00:00:00+00'
        ) summary
        where summary.group_key = (
            select expense_category_id::text from test_issue_605_pr2_context
        )
    ),
    50::numeric,
    '分类汇总把核销结余支出的正向有符号金额计入收入'
);

select is(
    (
        select coalesce(sum(summary.expense), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => (select ledger_id from test_issue_605_pr2_context),
            p_group_by => 'category',
            p_date_start => '2099-01-15 00:00:00+00',
            p_date_end => '2099-01-16 00:00:00+00'
        ) summary
        where summary.group_key = (
            select expense_category_id::text from test_issue_605_pr2_context
        )
    ),
    0::numeric,
    '分类汇总不再把核销结余计入支出'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();
rollback;
