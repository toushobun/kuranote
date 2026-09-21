begin;
set local search_path = public, extensions;
select no_plan();
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
set local role authenticated;
create temporary table import_account as select public.create_account_with_holders(
 '00000000-0000-4000-8000-000000000032','余额导入测试','cash','JPY',0,'{}'::uuid[]
) as id;
select lives_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),123.45,'2020-01-02 03:04:05+09','初始余额')$$,'导入正差值与历史时间');
select lives_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),-23.45,'2020-01-03 03:04:05+09','减少')$$,'导入负差值');
select is((select current_balance from public.account where id=(select id from import_account)),100::numeric,'正负差值恰好各应用一次');
select is((select count(*) from public.transaction_item ti join public.transaction_record tr on tr.id=ti.transaction_record_id where ti.account_id=(select id from import_account) and tr.type='balance_adjustment' and tr.created_by=auth.uid() and ti.amount=abs(ti.balance_delta) and ti.category_id is null and tr.merchant_id is null),2::bigint,'每条记录包含唯一账户明细与当前记账人');
select is((select tr.transaction_at from public.transaction_record tr join public.transaction_item ti on ti.transaction_record_id=tr.id where ti.account_id=(select id from import_account) and tr.note='初始余额'),'2020-01-02 03:04:05+09'::timestamptz,'交易时间不是导入执行时间');
select throws_ok(format($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),%L::numeric,now(),null)$$, amount),'22023','amount_invalid','拒绝非法差值 ' || coalesce(amount,'空值'))
from unnest(array['0','NaN','Infinity','-Infinity','1000000000000','-1000000000000','1.001',null]) amounts(amount);
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),1,'infinity',null)$$,'22023','transaction_at_invalid','拒绝非法交易时间');
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),1,now(),repeat('字',2001))$$,'22023','note_too_long','拒绝超长备注');
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032','79100000-0000-4000-8000-000000000099',1,now(),null)$$,'22023','account_invalid','拒绝不属于账本的账户');
reset role;
create function pg_temp.fail_import_balance() returns trigger language plpgsql as $$
begin
 if new.name='余额导入测试' and new.current_balance is distinct from old.current_balance then raise exception 'test_import_failure'; end if;
 return new;
end;
$$;
create trigger test_import_failure before update on public.account for each row execute function pg_temp.fail_import_balance();
set local role authenticated;
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),10,now(),'失败')$$,'P0001','test_import_failure','余额应用失败时交易与明细原子回滚');
select is((select count(*) from public.transaction_item where account_id=(select id from import_account)),2::bigint,'单行失败不影响已成功的两行且不残留明细');
select is((select current_balance from public.account where id=(select id from import_account)),100::numeric,'失败不改变余额');
reset role;
drop trigger test_import_failure on public.account;
set local role authenticated;
select lives_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),1,now(),null)$$,'失败后后续行可以继续成功');
-- 往返：源账本账户（非零初始余额 + 正负差值）导出的记录，逐条导入到另一个空账本的 0 余额账户，最终余额一致。
reset role;
select set_config('request.jwt.claim.sub','',true);
insert into public.ledger(id,name,base_currency,owner_user_id,created_by,updated_by)
values('79100000-0000-4000-8000-0000000000a1','往返空账本','JPY','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
insert into public.ledger_member(ledger_id,user_id,role,status,joined_at,created_by,updated_by)
values('79100000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-000000000031','owner','active',now(),'00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
set local role authenticated;
create temporary table roundtrip_account as
select public.create_account_with_holders('00000000-0000-4000-8000-000000000032','往返源','cash','JPY',1000,'{}'::uuid[]) as source_id,
       public.create_account_with_holders('79100000-0000-4000-8000-0000000000a1','往返源','cash','JPY',0,'{}'::uuid[]) as target_id;
select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select source_id from roundtrip_account),7,'2020-02-01 00:00:00+09','盘点');
select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select source_id from roundtrip_account),-20.5,'2020-02-02 00:00:00+09',null);
select is((select current_balance from public.account where id=(select source_id from roundtrip_account)),986.5::numeric,'源账户含初始余额的最终余额');
select is((select current_balance from public.account where id=(select target_id from roundtrip_account)),0::numeric,'空账本导入前余额为 0，且不生成初始余额记录');
select public.create_balance_adjustment_transaction('79100000-0000-4000-8000-0000000000a1',(select target_id from roundtrip_account),ti.balance_delta,tr.transaction_at,tr.note)
from public.transaction_item ti join public.transaction_record tr on tr.id=ti.transaction_record_id
where ti.account_id=(select source_id from roundtrip_account) and tr.type='balance_adjustment'
order by tr.transaction_at, tr.created_at;
select is((select current_balance from public.account where id=(select target_id from roundtrip_account)),986.5::numeric,'导入后空账本账户余额与导出前一致');
select is((select count(*) from public.transaction_item where account_id=(select target_id from roundtrip_account)),3::bigint,'初始余额记录与其余差值都被导入');
select ok(exists(select 1 from public.transaction_item ti join public.transaction_record tr on tr.id=ti.transaction_record_id where ti.account_id=(select target_id from roundtrip_account) and tr.note='初始余额' and ti.balance_delta=1000),'非零初始余额作为普通余额变更被导入');

update public.account set is_archived=true,archived_at=now(),archived_by=auth.uid() where id=(select id from import_account);
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),1,now(),null)$$,'22023','balance_adjustment_account_archived','归档账户拒绝写入');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),1,now(),null)$$,'42501','ledger_forbidden','无账本管理权限时拒绝写入');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.create_balance_adjustment_transaction('00000000-0000-4000-8000-000000000032',(select id from import_account),1,now(),null)$$,'28000','not_authenticated','会话失效时拒绝写入');
reset role;
select * from finish();
rollback;
