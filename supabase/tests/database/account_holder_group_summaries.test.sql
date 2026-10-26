-- #909：非时间维度分组 RPC 按账户持有人筛选和分组。
-- 医院 12 万：治疗费 4 万 + 检查费 8 万；我的现金 5 万、妻子现金 7 万；之后退款 1 万进入我的礼品卡并关联检查费。
-- 记录经正式 RPC 写入；最后立即执行延迟校验，确认数据满足不变量。
-- 时间段：A 医院 + 退款（4/10〜4/12）、B 我名下两个账户共同支付（4/15）、
-- C 转账与余额调整（4/16〜4/18）、D 无持有人账户与占位成员账户（4/19〜4/20）。
begin;

set local search_path = public, extensions;

select plan(22);

create function pg_temp.id(n integer) returns uuid language sql immutable as $$
    select ('90900000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;

-- 1 我、2 妻子；10 账本；20 占位「奶奶」；30〜35 账户；40〜46 分类；50〜51 商家。
insert into auth.users (id, aud, role, email, raw_user_meta_data)
values
    (pg_temp.id(1), 'authenticated', 'authenticated', 'issue909-1@example.test', '{"display_name":"我"}'),
    (pg_temp.id(2), 'authenticated', 'authenticated', 'issue909-2@example.test', '{"display_name":"妻子"}');

insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by,
    transaction_item_special_status_enabled, multi_account_payment_enabled
)
values (pg_temp.id(10), '持有人统计测试', 'JPY', pg_temp.id(1), pg_temp.id(1), pg_temp.id(1), true, true);

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values
    (pg_temp.id(10), pg_temp.id(1), 'owner', 'active', now(), pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(10), pg_temp.id(2), 'member', 'active', now(), pg_temp.id(1), pg_temp.id(1));

insert into public.ledger_placeholder_member (id, ledger_id, display_name, created_by)
values (pg_temp.id(20), pg_temp.id(10), '奶奶', pg_temp.id(1));

insert into public.account (id, ledger_id, name, type, currency, initial_balance, created_by, updated_by)
values
    (pg_temp.id(30), pg_temp.id(10), '我的现金', 'cash', 'JPY', 1000000, pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(31), pg_temp.id(10), '妻子现金', 'cash', 'JPY', 1000000, pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(32), pg_temp.id(10), '我的礼品卡', 'cash', 'JPY', 0, pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(33), pg_temp.id(10), '我的银行', 'bank', 'JPY', 1000000, pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(34), pg_temp.id(10), '公共钱包', 'cash', 'JPY', 1000000, pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(35), pg_temp.id(10), '奶奶的钱包', 'cash', 'JPY', 1000000, pg_temp.id(1), pg_temp.id(1));

insert into public.account_holder (ledger_id, account_id, user_id)
values
    (pg_temp.id(10), pg_temp.id(30), pg_temp.id(1)),
    (pg_temp.id(10), pg_temp.id(31), pg_temp.id(2)),
    (pg_temp.id(10), pg_temp.id(32), pg_temp.id(1)),
    (pg_temp.id(10), pg_temp.id(33), pg_temp.id(1));
insert into public.account_holder (ledger_id, account_id, placeholder_id)
values (pg_temp.id(10), pg_temp.id(35), pg_temp.id(20));

insert into public.category (id, ledger_id, parent_id, type, name)
values
    (pg_temp.id(40), pg_temp.id(10), null, 'expense', '医疗'),
    (pg_temp.id(45), pg_temp.id(10), null, 'income', '其他收入'),
    (pg_temp.id(46), pg_temp.id(10), null, 'expense', '生活');
insert into public.category (id, ledger_id, parent_id, type, name)
values
    (pg_temp.id(41), pg_temp.id(10), pg_temp.id(40), 'expense', '治疗费'),
    (pg_temp.id(42), pg_temp.id(10), pg_temp.id(40), 'expense', '检查费'),
    (pg_temp.id(43), pg_temp.id(10), pg_temp.id(45), 'income', '退款'),
    (pg_temp.id(44), pg_temp.id(10), pg_temp.id(46), 'expense', '餐饮');

insert into public.merchant (id, ledger_id, name, created_by, updated_by)
values
    (pg_temp.id(50), pg_temp.id(10), '妇产科医院', pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(51), pg_temp.id(10), '商店', pg_temp.id(1), pg_temp.id(1));

set local role authenticated;
select set_config(
    'request.jwt.claims',
    json_build_object('sub', pg_temp.id(1), 'role', 'authenticated')::text,
    true
);

-- A：医院（多账户）与退款（单账户进入礼品卡）
select public.create_transaction(
    pg_temp.id(10), 'expense', '2099-04-10 10:00:00+00',
    jsonb_build_array(
        jsonb_build_object('amount', 40000, 'categoryId', pg_temp.id(41)),
        jsonb_build_object('amount', 80000, 'categoryId', pg_temp.id(42))
    ),
    jsonb_build_array(
        jsonb_build_object('accountId', pg_temp.id(30), 'amount', 50000),
        jsonb_build_object('accountId', pg_temp.id(31), 'amount', 70000)
    ),
    pg_temp.id(50), '医院'
);
select public.create_transaction(
    pg_temp.id(10), 'income', '2099-04-12 10:00:00+00',
    jsonb_build_array(jsonb_build_object('amount', 10000, 'categoryId', pg_temp.id(43))),
    jsonb_build_array(jsonb_build_object('accountId', pg_temp.id(32), 'amount', 10000)),
    pg_temp.id(50), '医院退款'
);
-- B：我名下两个账户共同支付
select public.create_transaction(
    pg_temp.id(10), 'expense', '2099-04-15 10:00:00+00',
    jsonb_build_array(jsonb_build_object('amount', 3000, 'categoryId', pg_temp.id(44))),
    jsonb_build_array(
        jsonb_build_object('accountId', pg_temp.id(30), 'amount', 1000),
        jsonb_build_object('accountId', pg_temp.id(33), 'amount', 2000)
    ),
    pg_temp.id(51), '我两个账户共同支付'
);
-- C：我名下两个账户之间转账、我转给妻子、余额调整
select public.create_transfer_transaction(
    pg_temp.id(10), '2099-04-16 10:00:00+00', 5000, pg_temp.id(30), pg_temp.id(33), '我的账户之间'
);
select public.create_transfer_transaction(
    pg_temp.id(10), '2099-04-17 10:00:00+00', 2000, pg_temp.id(30), pg_temp.id(31), '我转给妻子'
);
select public.create_balance_adjustment_transaction(
    pg_temp.id(10), pg_temp.id(30), 500, '2099-04-18 10:00:00+00', '余额调整'
);
-- D：无持有人账户、占位成员持有的账户
select public.create_transaction(
    pg_temp.id(10), 'expense', '2099-04-19 10:00:00+00',
    jsonb_build_array(jsonb_build_object('amount', 800, 'categoryId', pg_temp.id(44))),
    jsonb_build_array(jsonb_build_object('accountId', pg_temp.id(34), 'amount', 800)),
    pg_temp.id(51), '公共钱包'
);
select public.create_transaction(
    pg_temp.id(10), 'expense', '2099-04-20 10:00:00+00',
    jsonb_build_array(jsonb_build_object('amount', 600, 'categoryId', pg_temp.id(44))),
    jsonb_build_array(jsonb_build_object('accountId', pg_temp.id(35), 'amount', 600)),
    pg_temp.id(51), '奶奶的钱包'
);

reset role;

select public.apply_transaction_item_links(
    pg_temp.id(10),
    (select ti.id from public.transaction_item ti where ti.ledger_id = pg_temp.id(10) and ti.category_id = pg_temp.id(43)),
    jsonb_build_object(
        'refundedItemId',
        (select ti.id from public.transaction_item ti where ti.ledger_id = pg_temp.id(10) and ti.category_id = pg_temp.id(42))
    ),
    pg_temp.id(1)
);

create function pg_temp.group_summaries(
    p_group_by text,
    p_date_start timestamptz,
    p_date_end timestamptz,
    p_holder_id text default null,
    p_account_id uuid default null
)
returns table (
    label text,
    income numeric,
    expense numeric,
    balance numeric,
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
        s.balance,
        s.transaction_count,
        s.shared_payment_record_count,
        s.shared_payment_account_share_amount,
        s.shared_payment_record_total_amount
    from public.load_transaction_group_summaries_with_special_status(
        p_ledger_id => pg_temp.id(10),
        p_group_by => p_group_by,
        p_date_start => p_date_start,
        p_date_end => p_date_end,
        p_account_id => p_account_id,
        p_holder_id => p_holder_id
    ) s
    order by s.group_label;
$$;

select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;

-- A：医院 + 退款
select results_eq(
    $$select label, income, expense, balance, transaction_count
      from pg_temp.group_summaries('holder', '2099-04-10', '2099-04-13')$$,
    $$values ('妻子', 0::numeric, 70000::numeric, -70000::numeric, 1),
             ('我', 10000::numeric, 50000::numeric, -40000::numeric, 2)$$,
    '按持有人分组：我 -5 万 + 1 万 = -4 万，妻子 -7 万（实际收付，退款按实际进入的账户计入）'
);
select results_eq(
    $$select label, income, expense, shared_count
      from pg_temp.group_summaries('member', '2099-04-10', '2099-04-13', pg_temp.id(1)::text)$$,
    $$values ('我', 10000::numeric, 50000::numeric, 1)$$,
    '筛选「我」按成员（记录级维度）：-5 万 + 1 万，不用业务净额'
);
select results_eq(
    $$select label, income, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('merchant', '2099-04-10', '2099-04-13', pg_temp.id(1)::text)$$,
    $$values ('妇产科医院', 10000::numeric, 50000::numeric, 1, 50000::numeric, 120000::numeric)$$,
    '筛选「我」按商家：医院取我的份额 5 万，退款记录取实际进入礼品卡的 1 万'
);
select results_eq(
    $$select label, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('category', '2099-04-10', '2099-04-13', pg_temp.id(1)::text)$$,
    $$values ('检查费', 70000::numeric, 1, 50000::numeric, 120000::numeric),
             ('治疗费', 40000::numeric, 1, 50000::numeric, 120000::numeric),
             ('退款', 0::numeric, 0, 0::numeric, 0::numeric)$$,
    '筛选「我」按分类：命中明细全额（业务净额），医院带共同支付（我 5 万 / 整笔 12 万）'
);
select results_eq(
    $$select label, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('member', '2099-04-10', '2099-04-13', pg_temp.id(2)::text)$$,
    $$values ('我', 70000::numeric, 1, 70000::numeric, 120000::numeric)$$,
    '筛选「妻子」按成员：只计妻子的份额 7 万（记账人是我）'
);
select results_eq(
    $$select label, income, expense
      from pg_temp.group_summaries('holder', '2099-04-10', '2099-04-13', pg_temp.id(1)::text)$$,
    $$values ('我', 10000::numeric, 50000::numeric)$$,
    '筛选「我」按持有人分组：只有「我」一组'
);
select results_eq(
    $$select label, expense, shared_count, shared_share, shared_total
      from pg_temp.group_summaries('member', '2099-04-10', '2099-04-13', null, pg_temp.id(30))$$,
    $$values ('我', 50000::numeric, 1, 50000::numeric, 120000::numeric)$$,
    '按单个账户筛选保持 #914 方案 D：只计该账户份额，并带共同支付统计'
);
select results_eq(
    $$select label, income, expense
      from pg_temp.group_summaries('member', '2099-04-10', '2099-04-13', null, pg_temp.id(32))$$,
    $$values ('我', 0::numeric, 0::numeric)$$,
    '按单个账户筛选：单账户退款记录仍为业务净额 0（与持有人筛选的口径不同）'
);
select results_eq(
    $$select label, income, expense
      from pg_temp.group_summaries('holder', '2099-04-10', '2099-04-13', pg_temp.id(1)::text, pg_temp.id(30))$$,
    $$values ('我', 0::numeric, 50000::numeric)$$,
    '账户筛选与持有人筛选取交集：只计我的现金'
);

-- B：我名下两个账户共同支付
select results_eq(
    $$select label, expense, transaction_count
      from pg_temp.group_summaries('holder', '2099-04-15', '2099-04-16')$$,
    $$values ('我', 3000::numeric, 1)$$,
    '按持有人分组：我名下两个账户合计 3000，记一笔'
);
select results_eq(
    $$select label, expense, shared_count
      from pg_temp.group_summaries('member', '2099-04-15', '2099-04-16', pg_temp.id(1)::text)$$,
    $$values ('我', 3000::numeric, 0)$$,
    '筛选「我」按成员：份额 = 整笔，不算共同支付'
);
select results_eq(
    $$select label, expense, shared_count
      from pg_temp.group_summaries('category', '2099-04-15', '2099-04-16', pg_temp.id(1)::text)$$,
    $$values ('餐饮', 3000::numeric, 0)$$,
    '筛选「我」按分类：不带共同支付统计'
);
select results_eq(
    $$select label, expense, shared_count
      from pg_temp.group_summaries('category', '2099-04-15', '2099-04-16', null, pg_temp.id(30))$$,
    $$values ('餐饮', 3000::numeric, 1)$$,
    '同一笔按单个账户筛选仍是共同支付'
);

-- C：转账与余额调整
select results_eq(
    $$select label, income, expense, balance
      from pg_temp.group_summaries('holder', '2099-04-16', '2099-04-19')$$,
    $$values ('妻子', 0::numeric, 0::numeric, 0::numeric),
             ('我', 0::numeric, 0::numeric, 0::numeric)$$,
    '按持有人分组：我名下账户之间转账、我转给妻子、余额调整都不计入收支'
);
select results_eq(
    $$select label, income, expense
      from pg_temp.group_summaries('member', '2099-04-16', '2099-04-19', pg_temp.id(1)::text)$$,
    $$values ('我', 0::numeric, 0::numeric)$$,
    '筛选「我」按成员：转账与余额调整不计入收支'
);
select results_eq(
    $$select label, income, expense
      from pg_temp.group_summaries('category', '2099-04-16', '2099-04-19', pg_temp.id(2)::text)$$,
    $$values ('未知小分类', 0::numeric, 0::numeric)$$,
    '筛选「妻子」按分类：收到的转账不计入收支'
);

-- D：无持有人账户、占位成员持有的账户
select results_eq(
    $$select label, expense
      from pg_temp.group_summaries('holder', '2099-04-19', '2099-04-21')$$,
    $$values ('奶奶', 600::numeric), ('未指定持有人', 800::numeric)$$,
    '无持有人账户进入「未指定持有人」组；占位成员持有的账户正常分组并显示名称'
);
select results_eq(
    $$select label, expense
      from pg_temp.group_summaries('member', '2099-04-19', '2099-04-21', 'none')$$,
    $$values ('我', 800::numeric)$$,
    '筛选「未指定持有人」：只有无持有人账户的记录'
);
select results_eq(
    $$select label, expense
      from pg_temp.group_summaries('member', '2099-04-19', '2099-04-21', pg_temp.id(20)::text)$$,
    $$values ('我', 600::numeric)$$,
    '筛选占位成员：只有其持有账户的记录'
);
select is(
    (select count(*)::integer from pg_temp.group_summaries('member', '2099-04-10', '2099-04-21', 'not-a-holder')),
    0,
    '筛选不存在的持有人时没有记录'
);

-- 全月：持有人分组合计
select results_eq(
    $$select label, income, expense, balance
      from pg_temp.group_summaries('holder', '2099-04-01', '2099-05-01')$$,
    $$values ('奶奶', 0::numeric, 600::numeric, -600::numeric),
             ('妻子', 0::numeric, 70000::numeric, -70000::numeric),
             ('我', 10000::numeric, 53000::numeric, -43000::numeric),
             ('未指定持有人', 0::numeric, 800::numeric, -800::numeric)$$,
    '全月按持有人分组：每个持有人为名下账户的实际收付合计'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select lives_ok(
    'set constraints public.validate_transaction_record_payments immediate',
    '经 RPC 写入的多账户记录满足付款明细不变量'
);

select * from finish();
rollback;
