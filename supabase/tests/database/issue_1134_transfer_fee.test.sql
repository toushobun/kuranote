-- #1134：手续费余额与分类、跨币种换算回归。
begin;
set local search_path = public, extensions;
select no_plan();

-- 2099 年测试汇率独立于在线汇率定时任务，事务结束回滚。
insert into public.exchange_rate(rate_date,currency,rate_per_eur,source)
values ('2099-11-01','JPY',180,'test'),('2099-11-01','CNY',9,'test')
on conflict (rate_date,currency) do update set rate_per_eur=excluded.rate_per_eur;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
set local role authenticated;

create temp table transfer_fee_accounts(name text primary key,id uuid not null);
grant select,insert on transfer_fee_accounts to authenticated;
insert into transfer_fee_accounts(name,id) values
 ('from',public.create_account_with_holders(
   '00000000-0000-4000-8000-000000000032','#1134 JPY 转出','bank','JPY',0,'{}')),
 ('other',public.create_account_with_holders(
   '00000000-0000-4000-8000-000000000032','#1134 第二个 JPY 转出','bank','JPY',0,'{}')),
 ('to',public.create_account_with_holders(
   '00000000-0000-4000-8000-000000000032','#1134 JPY 转入','cash','JPY',0,'{}')),
 ('cny',public.create_account_with_holders(
   '00000000-0000-4000-8000-000000000032','#1134 CNY 转出','bank','CNY',0,'{}'));

create function pg_temp.fee_account(p_name text) returns uuid language sql stable
as $$ select id from transfer_fee_accounts where name=p_name $$;
create function pg_temp.fee_balance(p_name text) returns numeric language sql stable
as $$ select current_balance from public.account where id=pg_temp.fee_account(p_name) $$;

create temp table transfer_fee_created(kind text primary key,id uuid not null);
grant select,insert on transfer_fee_created to authenticated;

insert into transfer_fee_created(kind,id)
select 'same',public.create_transfer_transaction(
 p_ledger_id=>'00000000-0000-4000-8000-000000000032',
 p_transaction_at=>'2099-11-01 10:00:00+09',
 p_amount=>10000,
 p_from_account_id=>pg_temp.fee_account('from'),
 p_to_account_id=>pg_temp.fee_account('to'),
 p_fee_amount=>220
);

select is(pg_temp.fee_balance('from'), -10220::numeric, '转出扣本金加手续费');
select is(pg_temp.fee_balance('to'), 10000::numeric, '转入只加本金');
select is((select count(*)::integer from public.transaction_item
 where transaction_record_id=(select id from transfer_fee_created where kind='same')),
 3, '一条转账至多一条手续费，新增共三条明细');
set local role postgres;
select ok(public.transfer_items_consistent(
 '00000000-0000-4000-8000-000000000032',
 (select id from transfer_fee_created where kind='same')), '新转账三明细完整性成立');
set local role authenticated;
select is((select system_key from public.category
 where id=(select category_id from public.transaction_item
  where transaction_record_id=(select id from transfer_fee_created where kind='same')
  and sort_order=2)), 'transfer_fee', '首次保存手续费自动建立系统支出分类');
select is((select type from public.category
 where ledger_id='00000000-0000-4000-8000-000000000032'
 and system_key='transfer_fee'), 'expense', '手续费是一级系统支出分类');

select lives_ok(format(
 'select public.update_transfer_transaction(%L::uuid,%L::uuid,%L::timestamptz,10000,%L::uuid,%L::uuid,null,null,150)',
 '00000000-0000-4000-8000-000000000032',
 (select id from transfer_fee_created where kind='same'),
 '2099-11-01 10:00:00+09',pg_temp.fee_account('from'),pg_temp.fee_account('to')),
 '编辑手续费 220 改 150 成功');
select is(pg_temp.fee_balance('from'),-10150::numeric,'编辑手续费后原账户正确回滚再扣款');

select lives_ok(format(
 'select public.update_transfer_transaction(%L::uuid,%L::uuid,%L::timestamptz,10000,%L::uuid,%L::uuid,null,null,null)',
 '00000000-0000-4000-8000-000000000032',
 (select id from transfer_fee_created where kind='same'),
 '2099-11-01 10:00:00+09',pg_temp.fee_account('from'),pg_temp.fee_account('to')),
 '编辑传 null 删除手续费成功');
select is(pg_temp.fee_balance('from'),-10000::numeric,'删除手续费后只扣本金');
select is((select count(*)::integer from public.transaction_item
 where transaction_record_id=(select id from transfer_fee_created where kind='same')),
 2,'无手续费恢复原有两明细模型');

select lives_ok(format(
 'select public.update_transfer_transaction(%L::uuid,%L::uuid,%L::timestamptz,10000,%L::uuid,%L::uuid,null,null,125)',
 '00000000-0000-4000-8000-000000000032',
 (select id from transfer_fee_created where kind='same'),
 '2099-11-01 10:00:00+09',pg_temp.fee_account('other'),pg_temp.fee_account('to')),
 '更换转出账户时手续费保留在新转出账户');
select is(pg_temp.fee_balance('from'),0::numeric,'旧转出账户余额恢复');
select is(pg_temp.fee_balance('other'),-10125::numeric,'新转出账户扣本金加手续费');

select throws_ok(format(
 'select public.create_transfer_transaction(%L::uuid,%L::timestamptz,1,%L::uuid,%L::uuid,null,null,0)',
 '00000000-0000-4000-8000-000000000032','2099-11-01 10:00:00+09',
 pg_temp.fee_account('from'),pg_temp.fee_account('to')),
 '22023','transfer_fee_amount_invalid','手续费 0 拒绝');
select throws_ok(format(
 'select public.create_transfer_transaction(%L::uuid,%L::timestamptz,1,%L::uuid,%L::uuid,null,null,-1)',
 '00000000-0000-4000-8000-000000000032','2099-11-01 10:00:00+09',
 pg_temp.fee_account('from'),pg_temp.fee_account('to')),
 '22023','transfer_fee_amount_invalid','负手续费拒绝');
select throws_ok(format(
 'select public.create_transfer_transaction(%L::uuid,%L::timestamptz,1,%L::uuid,%L::uuid,null,null,0.25)',
 '00000000-0000-4000-8000-000000000032','2099-11-01 10:00:00+09',
 pg_temp.fee_account('from'),pg_temp.fee_account('to')),
 '22023','transfer_fee_amount_invalid','JPY 手续费超出币种精度拒绝');

select lives_ok(format(
 'select public.void_transaction(%L::uuid,%L::uuid)',
 '00000000-0000-4000-8000-000000000032',
 (select id from transfer_fee_created where kind='same')),
 '作废带手续费转账成功');
select is(pg_temp.fee_balance('other'),0::numeric,'作废恢复新转出账户余额');
select is(pg_temp.fee_balance('to'),0::numeric,'作废恢复转入余额');

insert into transfer_fee_created(kind,id)
select 'cross',public.create_transfer_transaction(
 p_ledger_id=>'00000000-0000-4000-8000-000000000032',
 p_transaction_at=>'2099-11-01 10:00:00+09',
 p_amount=>100,p_to_amount=>2000,
 p_from_account_id=>pg_temp.fee_account('cny'),
 p_to_account_id=>pg_temp.fee_account('to'),
 p_fee_amount=>3
);
select is(pg_temp.fee_balance('cny'),-103::numeric,'CNY 跨币种手续费从转出扣');
select is(pg_temp.fee_balance('to'),2000::numeric,'跨币种到账不减手续费');
select is((select currency from public.transaction_record_ledger_rate
 where record_id=(select id from transfer_fee_created where kind='cross')),
 'CNY', '跨币种记录汇率按转出账户币种');
select is((select ledger_rate from public.transaction_record_ledger_rate
 where record_id=(select id from transfer_fee_created where kind='cross')),
 20::numeric, '跨币种转出币种当天汇率 1 CNY=20 JPY');
select is((select expense from public.load_transaction_group_summaries_with_special_status(
 '00000000-0000-4000-8000-000000000032','category',
 '2099-11-01 00:00:00+09','2099-12-01 00:00:00+09')
 where group_key=(select id::text from public.category where ledger_id='00000000-0000-4000-8000-000000000032' and system_key='transfer_fee')),
 60::numeric, '分类分组合计包含 3 CNY 手续费折合 60 JPY');

select is((select count(*)::integer from public.load_transaction_group_summaries_with_special_status(
 p_ledger_id=>'00000000-0000-4000-8000-000000000032',
 p_group_by=>'account', p_record_type=>'expense', p_account_id=>pg_temp.fee_account('to'))),
 0, '仅筛选到账账户时，手续费转账不应作为该账户的支出出现');
select is((select expense from public.load_transaction_group_summaries_with_special_status(
 p_ledger_id=>'00000000-0000-4000-8000-000000000032',
 p_group_by=>'account', p_record_type=>'expense', p_account_id=>pg_temp.fee_account('cny'))
 where group_key=pg_temp.fee_account('cny')::text),
 3::numeric, '筛选转出账户时，手续费按转出币种计入该账户支出');

select throws_ok(
 'update public.category set name=''被改名'' where ledger_id=''00000000-0000-4000-8000-000000000032'' and system_key=''transfer_fee''',
 '22023','category_system_locked','手续费系统分类不可改名');
set local role postgres;
select throws_ok(
 'delete from public.category where ledger_id=''00000000-0000-4000-8000-000000000032'' and system_key=''transfer_fee''',
 '22023','category_system_locked','手续费系统分类不可删除');
set local role authenticated;

-- 损坏明细只在事务内测试，恢复后才能作废。
set local role postgres;
select lives_ok(format(
 'update public.transaction_item set account_id=%L::uuid where transaction_record_id=%L::uuid and sort_order=2',
 pg_temp.fee_account('to'),(select id from transfer_fee_created where kind='cross')),
 '测试准备：将手续费账户改成到账账户');
select ok(not public.transfer_items_consistent(
 '00000000-0000-4000-8000-000000000032',(select id from transfer_fee_created where kind='cross')),
 '手续费账户不是转出账户时完整性校验失败');
update public.transaction_item set account_id=pg_temp.fee_account('cny')
where transaction_record_id=(select id from transfer_fee_created where kind='cross') and sort_order=2;
insert into public.transaction_item(
 ledger_id,transaction_record_id,account_id,category_id,amount,discount_amount,balance_delta,
 sort_order,created_by,updated_by)
select ledger_id,transaction_record_id,account_id,category_id,1,0,-1,3,created_by,updated_by
from public.transaction_item
where transaction_record_id=(select id from transfer_fee_created where kind='cross') and sort_order=2;
select ok(not public.transfer_items_consistent(
 '00000000-0000-4000-8000-000000000032',(select id from transfer_fee_created where kind='cross')),
 '两条手续费明细被完整性校验拒绝');
delete from public.transaction_item
where transaction_record_id=(select id from transfer_fee_created where kind='cross') and sort_order=3;

select * from finish();
rollback;
