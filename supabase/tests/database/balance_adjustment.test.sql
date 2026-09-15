begin;
set local search_path = public, extensions;
select no_plan();
insert into public.ledger(id,name,base_currency,owner_user_id,created_by,updated_by)
values('75500000-0000-4000-8000-000000000001','余额调整测试','JPY','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
insert into public.ledger_member(ledger_id,user_id,role,status,joined_at,created_by,updated_by)
values('75500000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000031','owner','active',now(),'00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
insert into public.account(id,ledger_id,name,type,currency,initial_balance,created_by,updated_by)
values('75510000-0000-4000-8000-000000000001','75500000-0000-4000-8000-000000000001','现金','cash','JPY',10000,'00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
set local role authenticated;
select lives_ok($$select public.update_account_with_balance_adjustment('75500000-0000-4000-8000-000000000001','75510000-0000-4000-8000-000000000001','现金新名称','cash','JPY',array['00000000-0000-4000-8000-000000000031']::uuid[],12500,'盘点')$$,'资料、余额和记录原子保存');
select is((select current_balance from public.account where id='75510000-0000-4000-8000-000000000001'),12500::numeric,'目标余额生效');
select is((select name from public.account where id='75510000-0000-4000-8000-000000000001'),'现金新名称','账户资料同步保存');
select is((select balance_delta from public.transaction_item where ledger_id='75500000-0000-4000-8000-000000000001'),2500::numeric,'保存正差值');
select is((select count(*) from public.transaction_item where ledger_id='75500000-0000-4000-8000-000000000001' and category_id is null),1::bigint,'仅一条无分类账户明细');
select is((select count(*) from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001' and merchant_id is null and created_by=auth.uid() and note='盘点'),1::bigint,'保存记账人和独立备注而无商家');
select lives_ok($$select public.update_account_with_balance_adjustment('75500000-0000-4000-8000-000000000001','75510000-0000-4000-8000-000000000001','现金新名称','cash','JPY',array['00000000-0000-4000-8000-000000000031']::uuid[],12500,null)$$,'余额不变仍可保存资料');
select is((select count(*) from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001'),1::bigint,'零差值不生成记录');
select is((select income+expense from public.load_transaction_group_summaries_with_special_status('75500000-0000-4000-8000-000000000001','account')),0::numeric,'账户流水汇总不包含调整');
select is((select transaction_count from public.load_transaction_group_summaries_with_special_status('75500000-0000-4000-8000-000000000001','account')),1,'账户流水包含调整记录');
select is((select count(*) from public.load_transaction_group_summaries_with_special_status('75500000-0000-4000-8000-000000000001','account',p_record_type=>'transfer')),0::bigint,'余额调整不混入转账筛选');
-- 两个已授权 RPC 均应保留全部流水，但不得将余额调整纳入收支或转账筛选。
select results_eq(
  format($query$
    select filter, coalesce(sum(summary.transaction_count), 0)::bigint,
      coalesce(sum(summary.income), 0), coalesce(sum(summary.expense), 0)
    from unnest(array['all','expense','income','transfer']) as filters(filter)
    left join lateral public.%I('75500000-0000-4000-8000-000000000001', 'account', p_record_type => filter) summary on true
    group by filter order by filter
  $query$, rpc),
  $$values ('all', 1::bigint, 0::numeric, 0::numeric), ('expense', 0::bigint, 0::numeric, 0::numeric), ('income', 0::bigint, 0::numeric, 0::numeric), ('transfer', 0::bigint, 0::numeric, 0::numeric)$$,
  rpc || '正确排除余额调整的收支筛选及金额'
) from unnest(array['load_transaction_group_summaries','load_transaction_group_summaries_with_special_status']) as functions(rpc);
select throws_ok($$update public.transaction_item set balance_delta=999 where ledger_id='75500000-0000-4000-8000-000000000001'$$,'22023','transaction_type_invalid','禁止篡改原始调整金额');
select lives_ok($$select public.void_transaction('75500000-0000-4000-8000-000000000001',(select id from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001'))$$,'删除正调整成功');
select is((select current_balance from public.account where id='75510000-0000-4000-8000-000000000001'),10000::numeric,'删除按原差值反向冲销');
select throws_ok($$select public.void_transaction('75500000-0000-4000-8000-000000000001',(select id from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001'))$$,'22023','transaction_not_found','重复撤销不会二次冲销');
select lives_ok($$select public.update_account_with_balance_adjustment('75500000-0000-4000-8000-000000000001','75510000-0000-4000-8000-000000000001','现金新名称','cash','JPY',array['00000000-0000-4000-8000-000000000031']::uuid[],8000,null)$$,'负向调整成功');
select is((select balance_delta from public.transaction_item ti join public.transaction_record tr on tr.id=ti.transaction_record_id where tr.ledger_id='75500000-0000-4000-8000-000000000001' and tr.status='active'),-2000::numeric,'负向调整保存负差值');
select lives_ok($$select public.void_transaction('75500000-0000-4000-8000-000000000001',(select id from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001' and status='active'))$$,'负向调整撤销成功');
select is((select current_balance from public.account where id='75510000-0000-4000-8000-000000000001'),10000::numeric,'负向调整删除恢复余额');
reset role;
-- 在余额真正应用阶段注入故障，验证前面的资料、持有人和交易插入一起回滚。
create function pg_temp.fail_adjustment_balance() returns trigger language plpgsql as $$
begin
 if new.current_balance is distinct from old.current_balance then raise exception 'test_balance_failure'; end if;
 return new;
end;
$$;
create trigger test_adjustment_balance_failure before update on public.account for each row execute function pg_temp.fail_adjustment_balance();
set local role authenticated;
select throws_ok($$select public.update_account_with_balance_adjustment('75500000-0000-4000-8000-000000000001','75510000-0000-4000-8000-000000000001','不应保留的新名称','cash','JPY',array['00000000-0000-4000-8000-000000000031']::uuid[],15000,'失败备注')$$,'P0001','test_balance_failure','余额应用失败整体回滚');
select is((select name from public.account where id='75510000-0000-4000-8000-000000000001'),'现金新名称','失败后账户资料回滚');
select is((select current_balance from public.account where id='75510000-0000-4000-8000-000000000001'),10000::numeric,'失败后余额回滚');
select is((select count(*) from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001' and status='active'),0::bigint,'失败后不残留交易');
reset role;
drop trigger test_adjustment_balance_failure on public.account;
set local role authenticated;
select public.update_account_with_balance_adjustment('75500000-0000-4000-8000-000000000001','75510000-0000-4000-8000-000000000001','现金新名称','cash','JPY',array['00000000-0000-4000-8000-000000000031']::uuid[],11000,null);
update public.account set is_archived=true,archived_at=now(),archived_by=auth.uid() where id='75510000-0000-4000-8000-000000000001';
select lives_ok($$select public.update_balance_adjustment_transaction('75500000-0000-4000-8000-000000000001',(select id from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001' and status='active'),'2026-09-14T00:00:00Z','归档后编辑')$$,'归档后允许修改时间备注');
select throws_ok($$select public.void_transaction('75500000-0000-4000-8000-000000000001',(select id from public.transaction_record where ledger_id='75500000-0000-4000-8000-000000000001' and status='active'))$$,'22023','balance_adjustment_account_archived','归档账户禁止撤销');
select is((select current_balance from public.account where id='75510000-0000-4000-8000-000000000001'),11000::numeric,'归档编辑和撤销失败不改变余额');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000034',true);
select throws_ok($$select public.update_account_with_balance_adjustment('75500000-0000-4000-8000-000000000001','75510000-0000-4000-8000-000000000001','越权','cash','JPY','{}'::uuid[],0,null)$$,'42501','ledger_forbidden','非管理员不可调整余额');
reset role;
select * from finish();
rollback;
