-- #914：非时间维度分组 RPC 的统计口径方案 D（docs/design/issue-834-split-payment.md 2.1 / 2.3 / 2.4）。
-- 医院 12 万：治疗费 4 万 + 住院费 8 万；我的账户 5 万、妻子账户 7 万。
-- 医院记录经正式 RPC create_transaction 写入多账户付款明细；最后立即执行延迟校验，确认数据满足不变量。
begin;

set local search_path = public, extensions;

select plan(19);

insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by,
    transaction_item_special_status_enabled, multi_account_payment_enabled
)
values (
    '91400000-0000-4000-8000-000000000001', '共同支付统计测试', 'JPY',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    true,
    true
);

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values (
    '91400000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031',
    'owner', 'active', now(),
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.account (id, ledger_id, name, type, currency, initial_balance, created_by, updated_by)
values
    ('91410000-0000-4000-8000-000000000001', '91400000-0000-4000-8000-000000000001', '我的账户', 'bank', 'JPY', 0,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('91410000-0000-4000-8000-000000000002', '91400000-0000-4000-8000-000000000001', '妻子账户', 'bank', 'JPY', 0,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

insert into public.category (id, ledger_id, parent_id, type, name)
values
    ('91420000-0000-4000-8000-000000000001', '91400000-0000-4000-8000-000000000001', null, 'expense', '医疗'),
    ('91420000-0000-4000-8000-000000000004', '91400000-0000-4000-8000-000000000001', null, 'expense', '购物'),
    ('91420000-0000-4000-8000-000000000005', '91400000-0000-4000-8000-000000000001', null, 'income', '退款');
insert into public.category (id, ledger_id, parent_id, type, name)
values
    ('91420000-0000-4000-8000-000000000002', '91400000-0000-4000-8000-000000000001',
     '91420000-0000-4000-8000-000000000001', 'expense', '治疗费'),
    ('91420000-0000-4000-8000-000000000003', '91400000-0000-4000-8000-000000000001',
     '91420000-0000-4000-8000-000000000001', 'expense', '住院费');

insert into public.merchant (id, ledger_id, name, created_by, updated_by)
values
    ('91430000-0000-4000-8000-000000000001', '91400000-0000-4000-8000-000000000001', '妇产科医院',
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('91430000-0000-4000-8000-000000000002', '91400000-0000-4000-8000-000000000001', '商店',
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id, title, note, created_by, updated_by
)
values
    -- 单账户支出 1000，之后退款 300 到妻子账户
    ('91440000-0000-4000-8000-000000000002', '91400000-0000-4000-8000-000000000001', 'normal', 'active',
     '2099-03-11 10:00:00+00', '91430000-0000-4000-8000-000000000002', '购物', null,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('91440000-0000-4000-8000-000000000003', '91400000-0000-4000-8000-000000000001', 'normal', 'active',
     '2099-03-12 10:00:00+00', '91430000-0000-4000-8000-000000000002', '退款', null,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

select tests.insert_normal_transaction_items(jsonb_build_array(
    jsonb_build_object(
        'id', '91450000-0000-4000-8000-000000000003',
        'ledger_id', '91400000-0000-4000-8000-000000000001',
        'transaction_record_id', '91440000-0000-4000-8000-000000000002',
        'account_id', '91410000-0000-4000-8000-000000000001',
        'category_id', '91420000-0000-4000-8000-000000000004',
        'amount', 1000,
        'created_by', '00000000-0000-4000-8000-000000000031'
    ),
    jsonb_build_object(
        'id', '91450000-0000-4000-8000-000000000004',
        'ledger_id', '91400000-0000-4000-8000-000000000001',
        'transaction_record_id', '91440000-0000-4000-8000-000000000003',
        'account_id', '91410000-0000-4000-8000-000000000002',
        'category_id', '91420000-0000-4000-8000-000000000005',
        'amount', 300,
        'created_by', '00000000-0000-4000-8000-000000000031'
    )
));

-- 医院 12 万（多账户），以记账人身份经正式 RPC 写入。
set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select public.create_transaction(
    '91400000-0000-4000-8000-000000000001',
    'expense',
    '2099-03-10 10:00:00+00',
    jsonb_build_array(
        jsonb_build_object('amount', 40000, 'categoryId', '91420000-0000-4000-8000-000000000002'),
        jsonb_build_object('amount', 80000, 'categoryId', '91420000-0000-4000-8000-000000000003')
    ),
    jsonb_build_array(
        jsonb_build_object('accountId', '91410000-0000-4000-8000-000000000001', 'amount', 50000),
        jsonb_build_object('accountId', '91410000-0000-4000-8000-000000000002', 'amount', 70000)
    ),
    '91430000-0000-4000-8000-000000000001',
    '医院'
);

reset role;

select public.apply_transaction_item_links(
    '91400000-0000-4000-8000-000000000001',
    '91450000-0000-4000-8000-000000000004',
    jsonb_build_object('refundedItemId', '91450000-0000-4000-8000-000000000003'),
    '00000000-0000-4000-8000-000000000031'
);

-- 只取医院记录所在日期，或单账户记录所在日期，避免互相影响。
create function pg_temp.group_summaries(
    p_group_by text,
    p_hospital boolean,
    p_account_id uuid default null,
    p_category_id uuid default null,
    p_parent_category_id uuid default null
)
returns table (
    label text,
    income numeric,
    expense numeric,
    transaction_count integer,
    shared_count integer,
    shared_share numeric,
    shared_total numeric
)
language sql
as $$
    select
        s.group_label,
        s.income,
        s.expense,
        s.transaction_count,
        s.shared_payment_record_count,
        s.shared_payment_account_share_amount,
        s.shared_payment_record_total_amount
    from public.load_transaction_group_summaries_with_special_status(
        p_ledger_id => '91400000-0000-4000-8000-000000000001',
        p_group_by => p_group_by,
        p_date_start => case when p_hospital then '2099-03-10 00:00:00+00'::timestamptz else '2099-03-11 00:00:00+00'::timestamptz end,
        p_date_end => case when p_hospital then '2099-03-11 00:00:00+00'::timestamptz else '2099-03-13 00:00:00+00'::timestamptz end,
        p_account_id => p_account_id,
        p_category_id => p_category_id,
        p_parent_category_id => p_parent_category_id
    ) s
    order by s.group_label;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
set local role authenticated;

-- 无筛选
select results_eq(
    $$select label, expense, shared_count from pg_temp.group_summaries('merchant', true)$$,
    $$values ('妇产科医院', 120000::numeric, 0)$$,
    '无筛选按商家（记录级维度）计整笔 12 万'
);
select results_eq(
    $$select label, expense, shared_count from pg_temp.group_summaries('member', true)$$,
    $$select display_name, 120000::numeric, 0 from public.app_user where id = '00000000-0000-4000-8000-000000000031'$$,
    '无筛选按成员计整笔 12 万'
);
select results_eq(
    $$select label, expense, shared_count from pg_temp.group_summaries('category', true)$$,
    $$values ('住院费', 80000::numeric, 0), ('治疗费', 40000::numeric, 0)$$,
    '无筛选按分类：住院费 8 万、治疗费 4 万，不带共同支付统计'
);
select results_eq(
    $$select label, income, expense, transaction_count from pg_temp.group_summaries('account', true)$$,
    $$values ('妻子账户', 0::numeric, 70000::numeric, 1), ('我的账户', 0::numeric, 50000::numeric, 1)$$,
    '无筛选按账户分组：我 5 万、妻子 7 万（付款明细的实际金额）'
);

-- 筛选我的账户
select results_eq(
    $$select label, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('merchant', true, '91410000-0000-4000-8000-000000000001')$$,
    $$values ('妇产科医院', 50000::numeric, 1, 50000::numeric, 120000::numeric)$$,
    '筛选我的账户按商家：只计我的份额 5 万'
);
select results_eq(
    $$select expense, shared_count from pg_temp.group_summaries('member', true, '91410000-0000-4000-8000-000000000001')$$,
    $$values (50000::numeric, 1)$$,
    '筛选我的账户按成员：只计我的份额 5 万'
);
select results_eq(
    $$select label, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('category', true, '91410000-0000-4000-8000-000000000001')$$,
    $$values
        ('住院费', 80000::numeric, 1, 50000::numeric, 120000::numeric),
        ('治疗费', 40000::numeric, 1, 50000::numeric, 120000::numeric)$$,
    '筛选我的账户按分类：明细全额，并返回共同支付统计'
);
select results_eq(
    $$select label, expense, shared_count from pg_temp.group_summaries('parentCategory', true, '91410000-0000-4000-8000-000000000001')$$,
    $$values ('医疗', 120000::numeric, 1)$$,
    '筛选我的账户按大分类：一笔记录在组内只计一次共同支付'
);
select results_eq(
    $$select label, expense, transaction_count from pg_temp.group_summaries('account', true, '91410000-0000-4000-8000-000000000001')$$,
    $$values ('我的账户', 50000::numeric, 1)$$,
    '筛选我的账户按账户分组：只有「我的账户」组 5 万'
);

-- 筛选我的账户 + 分类住院费：明细级筛选优先，记录级维度也计命中明细全额
select results_eq(
    $$select label, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('merchant', true, '91410000-0000-4000-8000-000000000001', '91420000-0000-4000-8000-000000000003')$$,
    $$values ('妇产科医院', 80000::numeric, 1, 50000::numeric, 120000::numeric)$$,
    '筛选我的账户 + 住院费按商家：8 万，并带共同支付（本账户 5 万 / 整笔 12 万）'
);
select results_eq(
    $$select label, expense from pg_temp.group_summaries('account', true, '91410000-0000-4000-8000-000000000001', '91420000-0000-4000-8000-000000000003')$$,
    $$values ('我的账户', 50000::numeric)$$,
    '筛选我的账户 + 住院费按账户分组：仍为实际付款 5 万'
);
select is(
    (select count(*)::integer from pg_temp.group_summaries('merchant', true, '91410000-0000-4000-8000-000000000001', '91420000-0000-4000-8000-000000000004')),
    0,
    '筛选账户 + 没有命中明细的分类时记录不出现'
);
select results_eq(
    $$select label, expense, shared_count from pg_temp.group_summaries('merchant', true, '91410000-0000-4000-8000-000000000002', null, '91420000-0000-4000-8000-000000000001')$$,
    $$values ('妇产科医院', 120000::numeric, 1)$$,
    '筛选妻子账户 + 大分类医疗按商家：命中明细全额 12 万'
);

-- 单账户记录：与现状一致，按账户分组改为实际收付
select results_eq(
    $$select label, income, expense, shared_count from pg_temp.group_summaries('merchant', false)$$,
    $$values ('商店', 0::numeric, 700::numeric, 0)$$,
    '单账户已退款记录按商家仍为业务净额（支出 700、退款收入 0）'
);
select results_eq(
    $$select label, income, expense from pg_temp.group_summaries('category', false)$$,
    $$values ('购物', 0::numeric, 700::numeric), ('退款', 0::numeric, 0::numeric)$$,
    '单账户已退款记录按分类仍为业务净额'
);
select results_eq(
    $$select label, income, expense from pg_temp.group_summaries('merchant', false, '91410000-0000-4000-8000-000000000001')$$,
    $$values ('商店', 0::numeric, 700::numeric)$$,
    '单账户记录筛选账户时仍为业务净额'
);
select results_eq(
    $$select label, income, expense, transaction_count from pg_temp.group_summaries('account', false)$$,
    $$values ('妻子账户', 300::numeric, 0::numeric, 1), ('我的账户', 0::numeric, 1000::numeric, 1)$$,
    '单账户按账户分组取实际收付：支出侧 1000、退款收入侧 +300'
);
select results_eq(
    $$select label, income, expense from pg_temp.group_summaries('account', false, '91410000-0000-4000-8000-000000000002')$$,
    $$values ('妻子账户', 300::numeric, 0::numeric)$$,
    '筛选退款收款账户只出现该账户一组'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select lives_ok(
    'set constraints public.validate_transaction_record_payments immediate',
    '经 RPC 写入的多账户记录满足付款明细不变量'
);

select * from finish();
rollback;
