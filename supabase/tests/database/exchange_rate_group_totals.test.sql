-- #1139 汇率换算与分组 RPC：两天不同汇率、账户分组、汇率缺失。
begin;
set local search_path = public, extensions;
select no_plan();

truncate public.exchange_rate;
insert into public.exchange_rate(rate_date,currency,rate_per_eur) values
('2099-01-15','JPY',100),
('2099-01-15','USD',1),
('2099-01-16','JPY',100),
('2099-01-16','USD',2);
update public.ledger set base_currency = 'USD'
where id = '00000000-0000-4000-8000-000000000032';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}', true);

select ok(has_function_privilege('authenticated','public.transaction_record_currency(uuid,uuid)','execute'),
  '受 RLS 保护的 SQL 视图可以按请求者权限读取交易币种');
select is((select ledger_rate from public.account_ledger_rate
  where account_id='00000000-0000-4000-8000-000000000043'::uuid),
  public.exchange_rate_on('JPY','USD',(now() at time zone 'UTC')::date),
  '账户余额使用今天能获取的最新日参考汇率');

select public.create_transaction(
 '00000000-0000-4000-8000-000000000032', 'expense', '2099-01-15 12:00:00+00',
 '[{"amount":10000,"categoryId":"00000000-0000-4000-8000-000000005021"}]'::jsonb,
 '[{"accountId":"00000000-0000-4000-8000-000000000043"}]'::jsonb,
 '00000000-0000-4000-8000-000000001001', '#1139 1/15'
);
select public.create_transaction(
 '00000000-0000-4000-8000-000000000032', 'expense', '2099-01-16 12:00:00+00',
 '[{"amount":10000,"categoryId":"00000000-0000-4000-8000-000000005021"}]'::jsonb,
 '[{"accountId":"00000000-0000-4000-8000-000000000043"}]'::jsonb,
 '00000000-0000-4000-8000-000000001001', '#1139 1/16'
);
select is(
 (select count(*) from public.transaction_record_ledger_rate
    where ledger_id='00000000-0000-4000-8000-000000000032'::uuid
      and ledger_rate in (0.01,0.02)
      and record_id in (
        select id from public.transaction_record
        where note like '#1139 %')),
 2::bigint, '不同日期记录使用各自汇率');

select is(
 (select coalesce(sum(expense),0) from public.load_transaction_group_summaries_with_special_status(
    p_ledger_id=>'00000000-0000-4000-8000-000000000032'::uuid,
    p_group_by=>'merchant',
    p_date_start=>'2099-01-15 00:00:00+00'::timestamptz,
    p_date_end=>'2099-01-17 00:00:00+00'::timestamptz
 ) s),
 300::numeric, '商家分组先按每笔交易换算再合计');

select is(
 (select coalesce(sum(expense),0) from public.load_transaction_group_summaries_with_special_status(
    p_ledger_id=>'00000000-0000-4000-8000-000000000032'::uuid,
    p_group_by=>'category',
    p_date_start=>'2099-01-15 00:00:00+00'::timestamptz,
    p_date_end=>'2099-01-17 00:00:00+00'::timestamptz
 ) s),
 300::numeric, '分类分组合计使用同一组日汇率');

select results_eq(
 $$select expense, group_currency
    from public.load_transaction_group_summaries_with_special_status(
      p_ledger_id=>'00000000-0000-4000-8000-000000000032'::uuid,
      p_group_by=>'account',
      p_date_start=>'2099-01-15 00:00:00+00'::timestamptz,
      p_date_end=>'2099-01-17 00:00:00+00'::timestamptz
    ) where group_key='00000000-0000-4000-8000-000000000043'$$,
 $$ values (20000::numeric, 'JPY'::text) $$,
 '账户分组不换算，仍显示日元余额及币种');

reset role;
delete from public.exchange_rate where currency='USD';
set local role authenticated;
select results_eq(
 $$select expense, missing_rate_count
    from public.load_transaction_group_summaries_with_special_status(
      p_ledger_id=>'00000000-0000-4000-8000-000000000032'::uuid,
      p_group_by=>'merchant',
      p_date_start=>'2099-01-15 00:00:00+00'::timestamptz,
      p_date_end=>'2099-01-17 00:00:00+00'::timestamptz
    ) where group_key='00000000-0000-4000-8000-000000001001'$$,
 $$ values (0::numeric, 2::integer) $$,
 '目标币种无汇率时两笔均不计入合计，提示缺失 2 笔');

-- 同币种混合收支：原有正负金额分别入收入/支出桶，不允许先抵消。
reset role;
update public.ledger set base_currency = 'JPY'
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, note, created_by, updated_by
) values
 ('11390000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000032','normal','active',
  '2099-01-18 12:00:00+00','00000000-0000-4000-8000-000000001001',
  null,'#1139 账户筛选下的混合收支',
  '00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031'),
 ('11390000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000032','normal','active',
  '2099-01-19 12:00:00+00','00000000-0000-4000-8000-000000001001',
  null,'#1139 同持有人多账户正负收支',
  '00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');

select tests.insert_normal_transaction_items(jsonb_agg(to_jsonb(i)))
from (values
  ('11390000-0000-4000-8000-000000000011'::uuid,
   '11390000-0000-4000-8000-000000000001'::uuid,
   '00000000-0000-4000-8000-000000000043'::uuid,
   '00000000-0000-4000-8000-000000005021'::uuid,100::numeric,-100::numeric,0),
  ('11390000-0000-4000-8000-000000000012'::uuid,
   '11390000-0000-4000-8000-000000000001'::uuid,
   '00000000-0000-4000-8000-000000000043'::uuid,
   '00000000-0000-4000-8000-000000005002'::uuid,40::numeric,40::numeric,1),
  ('11390000-0000-4000-8000-000000000013'::uuid,
   '11390000-0000-4000-8000-000000000002'::uuid,
   '00000000-0000-4000-8000-000000000043'::uuid,
   '00000000-0000-4000-8000-000000005021'::uuid,100::numeric,-100::numeric,0),
  ('11390000-0000-4000-8000-000000000014'::uuid,
   '11390000-0000-4000-8000-000000000002'::uuid,
   '00000000-0000-4000-8000-000000000044'::uuid,
   '00000000-0000-4000-8000-000000005002'::uuid,40::numeric,40::numeric,1)
) v(id, transaction_record_id, account_id, category_id, amount, balance_delta, sort_order)
cross join lateral (
  select v.id,v.transaction_record_id,v.account_id,v.category_id,
    v.amount,v.balance_delta,v.sort_order,
    '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
    0::numeric as discount_amount,
    null::text as note,
    '00000000-0000-4000-8000-000000000031'::uuid as created_by,
    '00000000-0000-4000-8000-000000000031'::uuid as updated_by
) i;

-- tests.insert_normal_transaction_items 已自动创建交易付款行，不要重复插入。

-- 该测试明确将两个账户指定给同一持有人，避免依赖 seed 中账户的持有人配置。
reset role;
delete from public.account_holder
where ledger_id = '00000000-0000-4000-8000-000000000032'::uuid
  and account_id in (
    '00000000-0000-4000-8000-000000000043'::uuid,
    '00000000-0000-4000-8000-000000000044'::uuid
  );
insert into public.account_holder(ledger_id, account_id, user_id) values
('00000000-0000-4000-8000-000000000032',
 '00000000-0000-4000-8000-000000000043',
 '00000000-0000-4000-8000-000000000031'),
('00000000-0000-4000-8000-000000000032',
 '00000000-0000-4000-8000-000000000044',
 '00000000-0000-4000-8000-000000000031');

set local role authenticated;

select results_eq(
 $$select income,expense,balance
   from public.load_transaction_group_summaries_with_special_status(
     p_ledger_id=>'00000000-0000-4000-8000-000000000032'::uuid,
     p_group_by=>'merchant',
     p_account_id=>'00000000-0000-4000-8000-000000000043'::uuid,
     p_date_start=>'2099-01-18 00:00:00+00'::timestamptz,
     p_date_end=>'2099-01-19 00:00:00+00'::timestamptz
   ) where group_key='00000000-0000-4000-8000-000000001001'$$,
 $$values (40::numeric,100::numeric,-60::numeric)$$,
 '商家分组有账户筛选时同笔混合收支仍分别统计');

select results_eq(
 $$select income,expense,balance
   from public.load_transaction_group_summaries_with_special_status(
     p_ledger_id=>'00000000-0000-4000-8000-000000000032'::uuid,
     p_group_by=>'holder',
     p_date_start=>'2099-01-19 00:00:00+00'::timestamptz,
     p_date_end=>'2099-01-20 00:00:00+00'::timestamptz
   ) where group_key='00000000-0000-4000-8000-000000000031'$$,
 $$values (40::numeric,100::numeric,-60::numeric)$$,
 '同持有人两账户一正一负时收入支出不先抵消');

reset role;
select * from finish();
rollback;
