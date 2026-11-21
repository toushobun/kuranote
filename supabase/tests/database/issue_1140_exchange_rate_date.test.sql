-- #1140：新旧接口共享汇率取值，校验实际使用日期。
begin;
set local search_path = public, extensions;
select no_plan();

truncate public.exchange_rate;
insert into public.exchange_rate(rate_date,currency,rate_per_eur) values
('2026-11-19','JPY',180), ('2026-11-19','CNY',8),
('2026-11-20','JPY',182), ('2026-11-20','CNY',8.2);

select is((select rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-20')),
  '2026-11-20'::date, '当天返回当天实际日期');
select is((select rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  '2026-11-20'::date, '周末返回上一工作日');
select is((select rate from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  public.exchange_rate_on('CNY','JPY','2026-11-21'), '新旧函数汇率一致');
select is((select rate_date from public.exchange_rate_with_date('USD','JPY','2026-11-21')),
  null::date, '缺少一侧汇率返回空日期');
select is((select rate from public.exchange_rate_with_date('USD','JPY','2026-11-21')),
  null::numeric, '缺少一侧汇率返回空数值');
select ok(has_function_privilege('authenticated',
  'public.exchange_rate_with_date(text,text,date)','execute'), '登录用户可执行');
select ok(not has_function_privilege('anon',
  'public.exchange_rate_with_date(text,text,date)','execute'), '未登录用户不可执行');

-- 当两币种汇率日期不一致时，保留每边的真实取值日供前端展示。
delete from public.exchange_rate where rate_date = '2026-11-20' and currency = 'JPY';
select is((select from_rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  '2026-11-20'::date, '不同日期时保留转出币种取值日');
select is((select to_rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  '2026-11-19'::date, '不同日期时保留转入币种取值日');
select is((select rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  '2026-11-19'::date, '兼容字段返回较早的汇率日');
select is((select rate from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  public.exchange_rate_on('CNY','JPY','2026-11-21'), '混合日期也保持新旧汇率一致');

select * from finish();
rollback;
