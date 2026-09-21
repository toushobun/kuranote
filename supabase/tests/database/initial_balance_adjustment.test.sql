begin;
set local search_path = public, extensions;
select no_plan();

-- reset 后所有非零初始余额 seed 账户都有且仅有一笔对应记录。
select is((select count(*) from public.account a where a.ledger_id = '00000000-0000-4000-8000-000000000032' and a.initial_balance <> 0 and (
    select count(*) from public.transaction_item ti
    join public.transaction_record tr on tr.id = ti.transaction_record_id
    where ti.account_id = a.id and tr.type = 'balance_adjustment'
      and tr.note = '初始余额' and ti.balance_delta = a.initial_balance
      and tr.transaction_at = a.created_at
) <> 1), 0::bigint, '种子账户初始余额均有对应记录');
select is((select count(*) from public.account a where a.ledger_id = '00000000-0000-4000-8000-000000000032' and a.current_balance <> (
    select coalesce(sum(ti.balance_delta), 0) from public.transaction_item ti
    join public.transaction_record tr on tr.id = ti.transaction_record_id
    where ti.account_id = a.id and tr.status = 'active'
)), 0::bigint, '种子账户余额等于有效流水总和且没有翻倍');

insert into public.ledger(id,name,base_currency,owner_user_id,created_by,updated_by)
values('79200000-0000-4000-8000-000000000001','初始余额测试','JPY','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
insert into public.ledger_member(ledger_id,user_id,role,status,joined_at,created_by,updated_by)
values('79200000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000031','owner','active',now(),'00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
set local role authenticated;
select public.create_account_with_holders('79200000-0000-4000-8000-000000000001', name, 'cash', 'JPY', balance, array[auth.uid()])
from (values ('正余额', 123.45), ('负余额', -67.89), ('零余额', 0)) balances(name, balance);
select results_eq(
    $$select name,current_balance from public.account where ledger_id='79200000-0000-4000-8000-000000000001' order by name$$,
    $$select name,balance from (values ('正余额',123.45::numeric),('负余额',-67.89::numeric),('零余额',0::numeric)) balances(name,balance) order by name$$,
    '正负零初始余额保持原值而不翻倍'
);
select is((select count(*) from public.transaction_record where ledger_id='79200000-0000-4000-8000-000000000001'),2::bigint,'只有非零初始余额生成记录');
select is((select count(*) from public.transaction_item ti
    join public.transaction_record tr on tr.id=ti.transaction_record_id
    join public.account a on a.id=ti.account_id
    where a.ledger_id='79200000-0000-4000-8000-000000000001'
      and tr.type='balance_adjustment' and tr.note='初始余额'
      and tr.transaction_at=a.created_at and tr.created_by=auth.uid()
      and tr.merchant_id is null and ti.category_id is null
      and ti.balance_delta=a.initial_balance and ti.amount=abs(a.initial_balance)),2::bigint,
    '记录保存创建时间、当前记账人、固定备注和带符号差值');
select is((select sum(income+expense) from public.load_transaction_group_summaries_with_special_status('79200000-0000-4000-8000-000000000001','account')),0::numeric,'初始余额不计入收支统计');
select is((select sum(transaction_count) from public.load_transaction_group_summaries_with_special_status('79200000-0000-4000-8000-000000000001','account')),2::bigint,'初始余额出现在账户流水中');
select throws_ok($$select public.record_account_initial_balance((select id from public.account where ledger_id='79200000-0000-4000-8000-000000000001' limit 1))$$,'42501',null,'客户端不能调用内部函数重复写入');
select lives_ok($$select public.void_transaction('79200000-0000-4000-8000-000000000001',(select tr.id from public.transaction_record tr join public.transaction_item ti on ti.transaction_record_id=tr.id where tr.ledger_id='79200000-0000-4000-8000-000000000001' and ti.balance_delta<0))$$,'初始余额可按普通余额调整撤销');
select is((select current_balance from public.account where ledger_id='79200000-0000-4000-8000-000000000001' and name='负余额'),0::numeric,'撤销负初始余额恢复为零');

-- 在最后的明细写入阶段制造故障，检查账户、持有人与交易整体回滚。
reset role;
create function pg_temp.fail_initial_balance_item() returns trigger language plpgsql as $$
begin
    if new.ledger_id='79200000-0000-4000-8000-000000000001' then
        raise exception 'test_initial_balance_failure';
    end if;
    return new;
end;
$$;
create trigger test_initial_balance_failure before insert on public.transaction_item
for each row execute function pg_temp.fail_initial_balance_item();
set local role authenticated;
select throws_ok($$select public.create_account_with_holders('79200000-0000-4000-8000-000000000001','失败账户','cash','JPY',99,array[auth.uid()])$$,'P0001','test_initial_balance_failure','明细失败时整个创建事务失败');
-- 使用数据库角色同时检查已撤销记录，避免 RLS 隐藏历史记录影响回滚断言。
reset role;
select is((select count(*) from public.account where ledger_id='79200000-0000-4000-8000-000000000001'),3::bigint,'失败不残留账户');
select is((select count(*) from public.account_holder where ledger_id='79200000-0000-4000-8000-000000000001'),3::bigint,'失败不残留持有人');
select is((select count(*) from public.transaction_record where ledger_id='79200000-0000-4000-8000-000000000001'),2::bigint,'失败不残留交易记录');
set local role authenticated;
select lives_ok($$select public.create_ledger_with_owner_settings('零余额默认账户测试','JPY','测试成员','sky')$$,'创建账本仍可创建零余额默认账户');
select is((select count(*) from public.transaction_record where ledger_id=(select id from public.ledger where name='零余额默认账户测试')),0::bigint,'默认零余额账户不生成记录');
reset role;
select * from finish();
rollback;
