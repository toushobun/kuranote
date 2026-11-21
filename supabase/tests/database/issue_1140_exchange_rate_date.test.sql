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

-- 回归索引探查的两种情况：日期前无记录取最早日，已有记录取最近日。
select is((select rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-18')),
  '2026-11-19'::date, '早于首条记录时回退最早日');
select is((select rate from public.exchange_rate_with_date('CNY','JPY','2026-11-18')),
  180::numeric / 8::numeric, '最早日的汇率正确');
insert into public.exchange_rate(rate_date,currency,rate_per_eur) values
('2026-11-17','JPY',176), ('2026-11-17','CNY',7.8),
('2026-11-18','JPY',178), ('2026-11-18','CNY',7.9);
select is((select rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-18')),
  '2026-11-18'::date, '多日数据优先匹配不晚于请求日的最近日');
select is((select rate from public.exchange_rate_with_date('CNY','JPY','2026-11-18')),
  178::numeric / 7.9::numeric, '多日数据返回对应的汇率');
select is((select rate_date from public.exchange_rate_with_date('CNY','JPY','2026-11-21')),
  '2026-11-20'::date, '追加历史数据不改变最新可用日');

select * from finish();
rollback;
