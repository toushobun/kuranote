begin;
set local search_path = public, extensions;
select no_plan();

create function pg_temp.uid(n integer) returns uuid language sql immutable as $$
    select ('87500000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;
create function pg_temp.lid(n integer) returns uuid language sql immutable as $$
    select ('87500000-0000-4000-8000-' || lpad((100 + n)::text, 12, '0'))::uuid;
$$;
create function pg_temp.act(n integer) returns void language sql as $$
    select set_config('request.jwt.claim.sub', case when n is null then '' else pg_temp.uid(n)::text end, true);
$$;
create function pg_temp.err(p_sql text) returns text language plpgsql as $$
declare v_detail text;
begin
    execute p_sql;
    return 'ok';
exception when others then
    get stacked diagnostics v_detail = pg_exception_detail;
    return sqlstate || ':' || coalesce(v_detail, '');
end;
$$;
create function pg_temp.abandon_sql(n integer default 1) returns text language sql as $$
    select format('select public.abandon_ledger_setup(%L)', pg_temp.lid(n));
$$;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select pg_temp.uid(n), 'authenticated', 'authenticated', format('issue875-%s@example.test', n),
       jsonb_build_object('display_name', format('用户%s', n)) from generate_series(1,2) n;
insert into public.ledger(id, name, base_currency, owner_user_id, setup_status, setup_step, setup_draft)
values (pg_temp.lid(1), '创建中', 'JPY', pg_temp.uid(1), 'in_progress', 4, '{"features":{"specialStatusEnabled":true}}'),
       (pg_temp.lid(2), '已完成', 'JPY', pg_temp.uid(1), 'completed', null, null);
insert into public.ledger_member(ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(1), pg_temp.uid(1), 'owner', 'active', now()),
       (pg_temp.lid(2), pg_temp.uid(1), 'owner', 'active', now());
update public.app_user set current_ledger_id = pg_temp.lid(2) where id = pg_temp.uid(1);

select ok(not has_function_privilege('anon', 'public.abandon_ledger_setup(uuid)', 'execute'), 'anon 无执行权限');
select ok(not has_function_privilege('service_role', 'public.abandon_ledger_setup(uuid)', 'execute'), 'service_role 无执行权限');
select ok(has_function_privilege('authenticated', 'public.abandon_ledger_setup(uuid)', 'execute'), '仅 authenticated 可执行');
select ok(not has_function_privilege('authenticated', 'public.ledger_setup_abandonment_allows_delete(uuid)', 'execute'), '内部放行函数不可直接调用');
select is(pg_temp.err(pg_temp.abandon_sql()), '42501:auth_required', '未登录拒绝且 detail 稳定');
select pg_temp.act(2);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), '42501:ledger_setup_owner_required', '非 owner 拒绝');
select pg_temp.act(1);
select is(pg_temp.err(pg_temp.abandon_sql(2)), '55000:ledger_setup_not_in_progress', 'completed 拒绝');
select is(pg_temp.err(pg_temp.abandon_sql(99)), 'P0002:ledger_setup_not_found', '不存在拒绝');
select is(pg_temp.err(format('delete from public.ledger where id = %L', pg_temp.lid(1))), '42501:', '客户端没有 ledger DELETE 授权');
select is((select count(*) from public.ledger where id = pg_temp.lid(1)), 1::bigint, '直接 DELETE 无法删除账本');
-- 即使伪造事务标记，客户端仍由 RLS 拒绝删除。
select set_config('app.ledger_setup_abandonment_ledger_id', pg_temp.lid(1)::text, true);
select is(pg_temp.err(format('delete from public.ledger where id = %L', pg_temp.lid(1))), '42501:', '伪造标记仍没有 DELETE 授权');
select is((select count(*) from public.ledger where id = pg_temp.lid(1)), 1::bigint, '伪造标记不绕过 ledger RLS');
select set_config('app.ledger_setup_abandonment_ledger_id', '', true);

reset role;
select pg_temp.act(null);
insert into public.ledger_member(ledger_id, user_id, role, status) values(pg_temp.lid(1), pg_temp.uid(2), 'member', 'invited');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), '55000:ledger_setup_has_members', '待邀请成员拒绝');
reset role;
select pg_temp.act(null);
delete from public.ledger_member_display_setting where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(2);
delete from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(2);
insert into public.ledger_placeholder_member(ledger_id, display_name, created_by) values(pg_temp.lid(1), '占位', pg_temp.uid(1));
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), '55000:ledger_setup_has_members', 'placeholder 拒绝');
reset role;
select pg_temp.act(null);
delete from public.ledger_placeholder_member where ledger_id = pg_temp.lid(1);
insert into public.ledger_invite(ledger_id, inviter_user_id, token_hash, created_by, revoked_at, revoked_by)
values(pg_temp.lid(1), pg_temp.uid(1), 'history', pg_temp.uid(1), now(), pg_temp.uid(1));
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), '55000:ledger_setup_has_members', '历史邀请也拒绝');
reset role;
select pg_temp.act(null);
delete from public.ledger_invite where ledger_id = pg_temp.lid(1);
insert into public.transaction_record(ledger_id, type, transaction_at) values(pg_temp.lid(1), 'transfer', now());
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), '55000:ledger_setup_has_transactions', '有交易时拒绝');
reset role;
select pg_temp.act(null);
delete from public.transaction_record where ledger_id = pg_temp.lid(1);
update public.ledger set is_archived = true, archived_at = now() where id = pg_temp.lid(1);
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), '55000:ledger_setup_not_in_progress', '归档账本拒绝');
reset role;
select pg_temp.act(null);
update public.ledger set is_archived = false, archived_at = null where id = pg_temp.lid(1);
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.abandon_sql()), 'ok', 'owner 放弃成功');
reset role;
select is((select count(*) from public.ledger where id = pg_temp.lid(1)), 0::bigint, '账本及草稿已删除');
select is((select count(*) from public.ledger_member where ledger_id = pg_temp.lid(1)), 0::bigint, '成员已清理');
select is((select count(*) from public.ledger_member_display_setting where ledger_id = pg_temp.lid(1)), 0::bigint, '显示设置已清理');
select is((select current_ledger_id from public.app_user where id = pg_temp.uid(1)), pg_temp.lid(2), 'current_ledger_id 不受影响');
select is(current_setting('app.ledger_setup_abandonment_ledger_id', true), '', '清理事务标记');
set local role authenticated;
select lives_ok($$select public.create_ledger_setup('重新创建', 'JPY', '我的名字', 'sky')$$, '唯一索引释放后可再次创建');
select * from finish();
rollback;
