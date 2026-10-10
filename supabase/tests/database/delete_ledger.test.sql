begin;
set local search_path = public, extensions;
select no_plan();
create function pg_temp.id(n integer) returns uuid language sql immutable as $$
 select ('89000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid;
$$;
create function pg_temp.act(n integer) returns void language sql as $$
 select set_config('request.jwt.claim.sub',case when n is null then '' else pg_temp.id(n)::text end,true);
$$;
create function pg_temp.err(q text) returns text language plpgsql as $$
declare d text;
begin execute q; return 'ok'; exception when others then get stacked diagnostics d = pg_exception_detail; return sqlstate || ':' || coalesce(d,''); end;
$$;
create function pg_temp.remove(n integer default 10) returns text language sql as $$ select pg_temp.err(format('select public.delete_ledger(%L)',pg_temp.id(n))); $$;
insert into auth.users(id,aud,role,email,raw_user_meta_data)
select pg_temp.id(n),'authenticated','authenticated',format('issue890-%s@example.test',n),jsonb_build_object('display_name',format('用户%s',n)) from generate_series(1,4) n;
insert into public.ledger(id,name,base_currency,owner_user_id,transaction_item_special_status_enabled)
select pg_temp.id(n),format('账本%s',n),'JPY',pg_temp.id(1),true from generate_series(10,15) n;
insert into public.ledger(id,name,base_currency,owner_user_id,setup_status,setup_step,setup_draft)
values(pg_temp.id(16),'创建中','JPY',pg_temp.id(1),'in_progress',2,'{}');
insert into public.ledger_member(ledger_id,user_id,role,status,joined_at)
select pg_temp.id(n),pg_temp.id(1),'owner','active',now() - (20-n)*interval '1 day' from generate_series(10,16) n;
insert into public.ledger_member(ledger_id,user_id,role,status,joined_at) values
(pg_temp.id(10),pg_temp.id(2),'member','active',now()),
(pg_temp.id(10),pg_temp.id(3),'admin','active',now()),
(pg_temp.id(10),pg_temp.id(4),'viewer','active',now()),
(pg_temp.id(11),pg_temp.id(2),'member','active',now()),
(pg_temp.id(12),pg_temp.id(2),'member','active',now()+interval '1 day'),
(pg_temp.id(13),pg_temp.id(3),'member','active',now()),
(pg_temp.id(14),pg_temp.id(3),'member','active',now()),
(pg_temp.id(15),pg_temp.id(3),'member','invited',null);
update public.ledger_member set status='removed',removed_at=now() where ledger_id=pg_temp.id(14) and user_id=pg_temp.id(3);
update public.ledger set is_archived=true,archived_at=now() where id=pg_temp.id(13);
update public.ledger_member set status='removed',removed_at=now() where user_id=pg_temp.id(1) and ledger_id in(pg_temp.id(14),pg_temp.id(15));
update public.app_user set current_ledger_id=pg_temp.id(10) where id in(select pg_temp.id(n) from generate_series(1,4) n);
insert into public.ledger_placeholder_member(id,ledger_id,display_name,created_by) values(pg_temp.id(20),pg_temp.id(10),'宝宝',pg_temp.id(1));
insert into public.ledger_invite(ledger_id,inviter_user_id,token_hash,created_by,placeholder_id,invite_token)
values(pg_temp.id(10),pg_temp.id(1),'hash890',pg_temp.id(1),pg_temp.id(20),repeat('a',64));
insert into public.account(id,ledger_id,name,type,currency) values(pg_temp.id(30),pg_temp.id(10),'现金','cash','JPY'),(pg_temp.id(31),pg_temp.id(11),'其他账本现金','cash','JPY'),(pg_temp.id(32),pg_temp.id(10),'宝宝现金','cash','JPY');
insert into public.account_holder(ledger_id,account_id,user_id) values(pg_temp.id(10),pg_temp.id(30),pg_temp.id(1));
insert into public.account_holder(ledger_id,account_id,placeholder_id,role) values(pg_temp.id(10),pg_temp.id(32),pg_temp.id(20),'owner');
insert into public.merchant(id,ledger_id,name) values(pg_temp.id(40),pg_temp.id(10),'商店');
insert into public.merchant_alias(merchant_id,alias) values(pg_temp.id(40),'商店别名');
insert into public.merchant_tags(id,ledger_id,name,icon) values(pg_temp.id(41),pg_temp.id(10),'标签','store');
insert into public.merchant_tag_links values(pg_temp.id(40),pg_temp.id(41));
insert into public.category(id,ledger_id,type,name) values(pg_temp.id(50),pg_temp.id(10),'expense','支出'),(pg_temp.id(52),pg_temp.id(10),'income','收入');
insert into public.category(id,ledger_id,parent_id,type,name) values(pg_temp.id(51),pg_temp.id(10),pg_temp.id(50),'expense','餐饮'),(pg_temp.id(53),pg_temp.id(10),pg_temp.id(52),'income','收入子类');
insert into public.budget(ledger_id,category_id,budget_month,amount) values(pg_temp.id(10),pg_temp.id(51),'2026-10-01',1000);
insert into public.transaction_record(id,ledger_id,type,transaction_at,merchant_id,created_by)
select pg_temp.id(n),pg_temp.id(10),'normal',now(),pg_temp.id(40),pg_temp.id(2) from generate_series(60,62) n;
insert into public.transaction_item(id,ledger_id,transaction_record_id,account_id,category_id,amount,balance_delta,special_status)
values(pg_temp.id(70),pg_temp.id(10),pg_temp.id(60),pg_temp.id(30),pg_temp.id(51),100,-100,'pending_reimbursement'),
(pg_temp.id(71),pg_temp.id(10),pg_temp.id(61),pg_temp.id(30),pg_temp.id(53),40,40,null),
(pg_temp.id(72),pg_temp.id(10),pg_temp.id(62),pg_temp.id(30),pg_temp.id(53),20,20,null);
insert into public.transaction_item_reimbursement_link(ledger_id,target_expense_item_id,reimbursement_income_item_id,reimbursement_amount)
values(pg_temp.id(10),pg_temp.id(70),pg_temp.id(71),40);
insert into public.transaction_item_refund_link(ledger_id,refunded_item_id,refund_income_item_id,refund_amount)
values(pg_temp.id(10),pg_temp.id(70),pg_temp.id(72),20);
insert into public.transaction_record(id,ledger_id,type,transaction_at) values(pg_temp.id(63),pg_temp.id(10),'balance_adjustment',now());
insert into public.transaction_item(id,ledger_id,transaction_record_id,account_id,amount,balance_delta)
values(pg_temp.id(73),pg_temp.id(10),pg_temp.id(63),pg_temp.id(30),10,10);
-- 同账本含归档账户与商家，硬删除不能依赖正常业务写入的活跃筛选。
update public.account set is_archived=true,archived_at=now() where id=pg_temp.id(30);
update public.merchant set is_archived=true,archived_at=now() where id=pg_temp.id(40);

select ok(not has_function_privilege('anon','public.delete_ledger(uuid)','execute'),'anon 不可执行');
select ok(not has_function_privilege('service_role','public.delete_ledger(uuid)','execute'),'service_role 不可执行');
select ok(has_function_privilege('authenticated','public.delete_ledger(uuid)','execute'),'authenticated 可执行');
select ok(not has_function_privilege('authenticated','public.ledger_deletion_allows_delete(uuid)','execute'),'内部放行函数不暴露');
select is(pg_temp.remove(),'42501:auth_required','未登录拒绝');
select pg_temp.act(2);
set local role authenticated;
select is(pg_temp.remove(),'42501:ledger_delete_forbidden','普通成员拒绝');
select pg_temp.act(3);
select is(pg_temp.remove(),'42501:ledger_delete_forbidden','admin 拒绝');
select pg_temp.act(1);
select is(pg_temp.remove(99),'P0002:ledger_invalid','不存在拒绝');
select is(pg_temp.remove(16),'55000:ledger_delete_not_completed','创建中拒绝');
-- 无 DELETE 授权或 RLS 过滤都视为拒绝，以账本仍存在为准。
do $$ begin perform pg_temp.err(format('delete from public.ledger where id=%L',pg_temp.id(10))); end $$;
select is((select count(*) from public.ledger where id=pg_temp.id(10)),1::bigint,'客户端直接 DELETE 无法删除账本');
select set_config('app.deleting_ledger_id',pg_temp.id(10)::text,true);
do $$ begin perform pg_temp.err(format('delete from public.ledger where id=%L',pg_temp.id(10))); end $$;
select is((select count(*) from public.ledger where id=pg_temp.id(10)),1::bigint,'伪造标记无法直接删账本');
select is(pg_temp.err(format('insert into public.ledger_deletion_context values(pg_current_xact_id(),%L,%L)',pg_temp.id(10),pg_temp.id(1))),'42501:','客户端无法伪造授权上下文');
do $$ begin perform pg_temp.err(format('delete from public.transaction_item where id=%L',pg_temp.id(73))); end $$;
select is((select count(*) from public.transaction_item where id=pg_temp.id(73)),1::bigint,'伪造标记无法删除余额调整明细');
reset role;
select ok(not public.ledger_deletion_allows_delete(pg_temp.id(10)),'只有 GUC 没有授权上下文时放行失败');
select set_config('app.deleting_ledger_id','',true);
-- 整个事务回滚验证：在最后一步制造拒绝，先前清理和指针修改必须全部恢复。
create function pg_temp.reject_delete() returns trigger language plpgsql as $$ begin raise exception 'test_rollback'; end; $$;
create trigger test_delete_rollback before delete on public.ledger for each row execute function pg_temp.reject_delete();
set local role authenticated;
select matches(pg_temp.remove(),'^P0001:','末尾失败时 RPC 拒绝');
reset role;
select is((select count(*) from public.transaction_item where ledger_id=pg_temp.id(10)),4::bigint,'失败回滚全部明细');
select is((select current_ledger_id from public.app_user where id=pg_temp.id(2)),pg_temp.id(10),'失败回滚成员当前账本');
select is((select count(*) from public.ledger_deletion_context),0::bigint,'失败不残留上下文');
drop trigger test_delete_rollback on public.ledger;
set local role authenticated;
select is(pg_temp.remove(),'ok','owner 删除包含关联、余额调整、成员和归档数据的账本成功');
reset role;
select is((select current_ledger_id from public.app_user where id=pg_temp.id(1)),pg_temp.id(12),'owner 选择最近加入的未归档已完成账本');
select is((select current_ledger_id from public.app_user where id=pg_temp.id(2)),pg_temp.id(12),'其他成员按自己的加入顺序切换');
select is((select current_ledger_id from public.app_user where id=pg_temp.id(3)),null::uuid,'没有有效候选的成员置空');
select is((select current_ledger_id from public.app_user where id=pg_temp.id(4)),null::uuid,'仅有被删账本的成员置空');
select is((select count(*) from public.account where id=pg_temp.id(31)),1::bigint,'其他账本账户保留');
select is((select count(*) from public.ledger where id=pg_temp.id(10)),0::bigint,'账本物理删除');
select is((select count(*) from public.merchant_alias where merchant_id=pg_temp.id(40)),0::bigint,'商家别名删除');
select is((select count(*) from public.merchant_tag_links where merchant_id=pg_temp.id(40)),0::bigint,'商家标签关联删除');
select is((select count(*) from public.ledger_deletion_context),0::bigint,'成功清除上下文');
select is(current_setting('app.deleting_ledger_id',true),'','成功清除事务标记');
select is((select count(*) from public.account where ledger_id=pg_temp.id(10)),0::bigint,'account 关联数据清零');
select is((select count(*) from public.account_holder where ledger_id=pg_temp.id(10)),0::bigint,'account_holder 关联数据清零');
select is((select count(*) from public.account_name_scope where ledger_id=pg_temp.id(10)),0::bigint,'account_name_scope 关联数据清零');
select is((select count(*) from public.budget where ledger_id=pg_temp.id(10)),0::bigint,'budget 关联数据清零');
select is((select count(*) from public.category where ledger_id=pg_temp.id(10)),0::bigint,'category 关联数据清零');
select is((select count(*) from public.merchant where ledger_id=pg_temp.id(10)),0::bigint,'merchant 关联数据清零');
select is((select count(*) from public.merchant_tags where ledger_id=pg_temp.id(10)),0::bigint,'merchant_tags 关联数据清零');
select is((select count(*) from public.transaction_item where ledger_id=pg_temp.id(10)),0::bigint,'transaction_item 关联数据清零');
select is((select count(*) from public.transaction_record where ledger_id=pg_temp.id(10)),0::bigint,'transaction_record 关联数据清零');
select is((select count(*) from public.transaction_item_refund_link where ledger_id=pg_temp.id(10)),0::bigint,'transaction_item_refund_link 关联数据清零');
select is((select count(*) from public.transaction_item_reimbursement_link where ledger_id=pg_temp.id(10)),0::bigint,'transaction_item_reimbursement_link 关联数据清零');
select is((select count(*) from public.ledger_invite where ledger_id=pg_temp.id(10)),0::bigint,'ledger_invite 关联数据清零');
select is((select count(*) from public.ledger_placeholder_member where ledger_id=pg_temp.id(10)),0::bigint,'ledger_placeholder_member 关联数据清零');
select is((select count(*) from public.ledger_member_display_setting where ledger_id=pg_temp.id(10)),0::bigint,'ledger_member_display_setting 关联数据清零');
select is((select count(*) from public.ledger_member where ledger_id=pg_temp.id(10)),0::bigint,'ledger_member 关联数据清零');
-- 再删除 owner 唯一的有效账本，验证 owner 的空账本落点。
select pg_temp.act(null);
update public.ledger set is_archived=true,archived_at=now() where id=pg_temp.id(11);
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.remove(12),'ok','owner 删除最后一个可选账本成功');
reset role;
select is((select current_ledger_id from public.app_user where id=pg_temp.id(1)),null::uuid,'owner 无候选账本时置空');
select * from finish();
rollback;
