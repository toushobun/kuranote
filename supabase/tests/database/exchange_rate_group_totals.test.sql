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
  0.02::numeric, '账户余额使用最新日的参考汇率');

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

reset role;
select * from finish();
rollback;
