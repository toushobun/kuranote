-- #1139 汇率取值、东京日期、客户端权限。
begin;
set local search_path = public, extensions;
select no_plan();

truncate public.exchange_rate;
insert into public.exchange_rate(rate_date,currency,rate_per_eur) values
('2026-11-19','USD',1.2), ('2026-11-19','JPY',180),
('2026-11-19','CNY',8), ('2026-11-20','USD',1.1),
('2026-11-20','JPY',182), ('2026-11-20','CNY',8.2);

select is(public.exchange_rate_on('USD','JPY','2026-11-20'), (182::numeric / 1.1), '两币种交叉换算');
select is(public.exchange_rate_on('EUR','JPY','2026-11-19'), 180::numeric, 'EUR 基准视为 1');
select is(public.exchange_rate_on('USD','EUR','2026-11-19'), (1::numeric / 1.2), '汇回 EUR');
select is(public.exchange_rate_on('USD','USD','2026-11-20'), 1::numeric, '同币种恒为 1');
select is(public.exchange_rate_on('EUR','EUR','2026-11-20'), 1::numeric, 'EUR 同币种恒为 1');
select is(public.exchange_rate_on('USD','JPY','2026-11-21'), (182::numeric / 1.1), '周末取上一个工作日');
select is(public.exchange_rate_on('USD','JPY','2026-12-21'), (182::numeric / 1.1), '未来取最新日');
select is(public.exchange_rate_on('USD','JPY','2020-01-01'), (180::numeric / 1.2), '早于首日取最早日');
select is(public.exchange_rate_on('THB','JPY','2026-11-20'), null::numeric, '没有汇率时返回 null');
select is(public.transaction_record_local_date('2026-11-19 15:10:00+00'::timestamptz), '2026-11-20'::date, '东京跨日');
select ok((select relrowsecurity from pg_class where oid='public.exchange_rate'::regclass), '汇率表启用 RLS');
select ok(has_table_privilege('authenticated','public.exchange_rate','select')
  and not has_table_privilege('authenticated','public.exchange_rate','insert')
  and not has_table_privilege('authenticated','public.exchange_rate','update')
  and not has_table_privilege('authenticated','public.exchange_rate','delete'), '登录用户只能读取汇率');
select ok(not has_table_privilege('anon','public.exchange_rate','select'), '未登录角色不能读');
set local role authenticated;
select is((select count(*) from public.exchange_rate), 6::bigint, '任一登录用户可以读取公共参考价');
reset role;
select * from finish();
rollback;
