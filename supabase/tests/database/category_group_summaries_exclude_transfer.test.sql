-- #909 追加 2：非时间维度分组 RPC 按大分类 / 小分类分组时只纳入普通记录。
-- 转账、余额调整没有分类，不再归入「未知大分类 / 未知小分类」组；普通记录的明细缺分类时「未知」组照常保留。
-- 同时确认返回列不再包含 shared_payment_account_share_amount。
begin;

set local search_path = public, extensions;

select plan(11);

create function pg_temp.id(n integer) returns uuid language sql immutable as $$
    select ('90920000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;

-- 1 记账人；10 账本；30〜31 账户；40〜41 分类；50 商家。
insert into auth.users (id, aud, role, email, raw_user_meta_data)
values (pg_temp.id(1), 'authenticated', 'authenticated', 'issue909-category-1@example.test', '{"display_name":"我"}');

insert into public.ledger (id, name, base_currency, owner_user_id, created_by, updated_by)
values (pg_temp.id(10), '分类分组排除转账测试', 'JPY', pg_temp.id(1), pg_temp.id(1), pg_temp.id(1));

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values (pg_temp.id(10), pg_temp.id(1), 'owner', 'active', now(), pg_temp.id(1), pg_temp.id(1));

insert into public.account (id, ledger_id, name, type, currency, initial_balance, created_by, updated_by)
values
    (pg_temp.id(30), pg_temp.id(10), '现金', 'cash', 'JPY', 100000, pg_temp.id(1), pg_temp.id(1)),
    (pg_temp.id(31), pg_temp.id(10), '银行', 'bank', 'JPY', 100000, pg_temp.id(1), pg_temp.id(1));

insert into public.category (id, ledger_id, parent_id, type, name)
values (pg_temp.id(40), pg_temp.id(10), null, 'expense', '餐饮');
insert into public.category (id, ledger_id, parent_id, type, name)
values (pg_temp.id(41), pg_temp.id(10), pg_temp.id(40), 'expense', '午餐');

insert into public.merchant (id, ledger_id, name, created_by, updated_by)
values (pg_temp.id(50), pg_temp.id(10), '食堂', pg_temp.id(1), pg_temp.id(1));

set local role authenticated;
select set_config(
    'request.jwt.claims',
    json_build_object('sub', pg_temp.id(1), 'role', 'authenticated')::text,
    true
);

-- 普通支出 1200（午餐）、普通支出 300（之后去掉分类）、现金转银行 5000、现金余额调整 +500。
select public.create_transaction(
    pg_temp.id(10), 'expense', '2099-05-10 10:00:00+00',
    jsonb_build_array(jsonb_build_object('amount', 1200, 'categoryId', pg_temp.id(41))),
    jsonb_build_array(jsonb_build_object('accountId', pg_temp.id(30), 'amount', 1200)),
    pg_temp.id(50), '午餐'
);
select public.create_transaction(
    pg_temp.id(10), 'expense', '2099-05-11 10:00:00+00',
    jsonb_build_array(jsonb_build_object('amount', 300, 'categoryId', pg_temp.id(41))),
    jsonb_build_array(jsonb_build_object('accountId', pg_temp.id(30), 'amount', 300)),
    pg_temp.id(50), '缺分类'
);
select public.create_transfer_transaction(
    pg_temp.id(10), '2099-05-12 10:00:00+00', 5000, pg_temp.id(30), pg_temp.id(31), '现金转银行'
);
select public.create_balance_adjustment_transaction(
    pg_temp.id(10), pg_temp.id(30), 500, '2099-05-13 10:00:00+00', '余额调整'
);

reset role;

-- 正常写入路径要求普通明细有分类；为覆盖「普通明细缺分类」的分支，测试内临时绕过形态校验。
-- 缺分类的明细没有收支类型，业务金额计 0（既有口径）；按账户分组仍取付款明细的实际收付。
set local session_replication_role = replica;
update public.transaction_item
set category_id = null
where ledger_id = pg_temp.id(10)
  and category_id = pg_temp.id(41)
  and amount = 300;
set local session_replication_role = origin;

create function pg_temp.group_summaries(
    p_group_by text,
    p_account_id uuid default null,
    p_record_type text default 'all'
)
returns table (
    label text,
    income numeric,
    expense numeric,
    transaction_count integer
)
language sql
as $$
    select s.group_label, s.income, s.expense, s.transaction_count
    from public.load_transaction_group_summaries_with_special_status(
        p_ledger_id => pg_temp.id(10),
        p_group_by => p_group_by,
        p_date_start => '2099-05-01',
        p_date_end => '2099-06-01',
        p_record_type => p_record_type,
        p_account_id => p_account_id
    ) s
    order by s.group_label;
$$;

select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;

-- 无筛选
select results_eq(
    $$select label, income, expense, transaction_count from pg_temp.group_summaries('category')$$,
    $$values ('午餐', 0::numeric, 1200::numeric, 1),
             ('未知小分类', 0::numeric, 0::numeric, 1)$$,
    '无筛选按小分类：转账、余额调整不进入「未知小分类」，普通明细缺分类时该组仍在'
);
select results_eq(
    $$select label, income, expense, transaction_count from pg_temp.group_summaries('parentCategory')$$,
    $$values ('未知大分类', 0::numeric, 0::numeric, 1),
             ('餐饮', 0::numeric, 1200::numeric, 1)$$,
    '无筛选按大分类：转账、余额调整不进入「未知大分类」，普通明细缺分类时该组仍在'
);

-- 有筛选
select results_eq(
    $$select label, expense, transaction_count from pg_temp.group_summaries('category', pg_temp.id(30))$$,
    $$values ('午餐', 1200::numeric, 1), ('未知小分类', 0::numeric, 1)$$,
    '筛选现金按小分类：同一账户的转账与余额调整也不进入分类组'
);
select is(
    (select count(*)::integer from pg_temp.group_summaries('category', pg_temp.id(31))),
    0,
    '筛选只有转账的银行账户按小分类：没有分组'
);
select is(
    (select count(*)::integer from pg_temp.group_summaries('parentCategory', null, 'transfer')),
    0,
    '记录类型为转账时按大分类：没有分组'
);

-- 其他分组维度不受影响：转账、余额调整照常计入笔数，不计入收支。
select results_eq(
    $$select label, income, expense, transaction_count from pg_temp.group_summaries('account')$$,
    $$values ('现金', 0::numeric, 1500::numeric, 4),
             ('银行', 0::numeric, 0::numeric, 1)$$,
    '按账户分组：转账与余额调整照常计入笔数'
);
select results_eq(
    $$select label, income, expense, transaction_count from pg_temp.group_summaries('member')$$,
    $$values ('我', 0::numeric, 1200::numeric, 4)$$,
    '按成员分组：转账与余额调整照常计入笔数'
);
select results_eq(
    $$select label, expense, transaction_count from pg_temp.group_summaries('merchant')$$,
    $$values ('未知商家', 0::numeric, 2), ('食堂', 1200::numeric, 2)$$,
    '按商家分组：转账与余额调整照常归入「未知商家」'
);
select is(
    (select count(*)::integer from pg_temp.group_summaries('specialStatus')),
    0,
    '按特殊状态分组：没有特殊状态时没有分组'
);

reset role;

-- 返回列：不再返回份额列，整笔与笔数照常返回。
select is(
    (
        select 'shared_payment_account_share_amount' = any(p.proargnames)
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'load_transaction_group_summaries_with_special_status'
    ),
    false,
    '分组函数不再返回 shared_payment_account_share_amount'
);
select is(
    (
        select array['shared_payment_record_count', 'shared_payment_record_total_amount'] <@ p.proargnames
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'load_transaction_group_summaries_with_special_status'
    ),
    true,
    '分组函数仍返回共同支付笔数与整笔金额'
);

select * from finish();
rollback;
