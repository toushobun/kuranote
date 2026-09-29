begin;
set local search_path = public, extensions;
select no_plan();

-- Issue #826：个人主页修改昵称，可选同步到账本内昵称；成员加入时写入账本内昵称。
-- 用户：01 本人、02 其他账本 owner、03 非成员账本 owner、04 未使用、05 已停用用户、
-- 06 昵称带首尾空白的新成员、07 认领待邀请成员的用户、08 退出后重新加入的成员。
-- 账本：01 家庭、02 公司（本人已改过账本内昵称）、03 旅行（有与新昵称同名的待邀请成员）、
-- 04 非成员账本、05 已归档账本、06 已被移除的账本。
create function pg_temp.uid(p_n integer) returns uuid language sql immutable as $$
    select ('82600000-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid;
$$;
create function pg_temp.lid(p_n integer) returns uuid language sql immutable as $$
    select ('82600000-0000-4000-8000-' || lpad((100 + p_n)::text, 12, '0'))::uuid;
$$;
create function pg_temp.act(p_n integer) returns void language sql as $$
    select set_config('request.jwt.claim.sub', case when p_n is null then '' else pg_temp.uid(p_n)::text end, true);
$$;
-- 以 SQLSTATE:detail 返回结果，避免解析英文 message。
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
create function pg_temp.update_sql(p_name text, p_ledgers integer[]) returns text language sql immutable as $$
    select format('select * from public.update_current_user_display_name(%L, %L::uuid[])',
                  p_name,
                  (select coalesce(array_agg(pg_temp.lid(n)), '{}'::uuid[]) from unnest(p_ledgers) n));
$$;
create function pg_temp.effective_names() returns table (ledger_id uuid, user_id uuid, name text)
language sql stable security definer as $$
    -- 与读取处口径一致的有效昵称。
    select lds.ledger_id, lds.user_id,
           coalesce(nullif(btrim(lds.display_name), ''), btrim(au.display_name))
    from public.ledger_member_display_setting lds
    join public.app_user au on au.id = lds.user_id;
$$;
-- 以 security definer 读取，authenticated 会话中也能观察结果。
create function pg_temp.global_name(p_n integer) returns text language sql stable security definer as $$
    select display_name from public.app_user where id = pg_temp.uid(p_n);
$$;
create function pg_temp.ledger_name_setting(p_ledger integer, p_n integer default 1) returns text language sql stable security definer as $$
    select display_name from public.ledger_member_display_setting
    where ledger_id = pg_temp.lid(p_ledger) and user_id = pg_temp.uid(p_n);
$$;
create function pg_temp.ledger_color(p_ledger integer, p_n integer default 1) returns text language sql stable security definer as $$
    select display_color from public.ledger_member_display_setting
    where ledger_id = pg_temp.lid(p_ledger) and user_id = pg_temp.uid(p_n);
$$;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select pg_temp.uid(n), 'authenticated', 'authenticated', format('issue826-%s@example.test', n),
       jsonb_build_object('display_name', format('Issue826 用户%s', n))
from generate_series(1, 8) n;

insert into public.ledger (id, name, base_currency, owner_user_id)
values (pg_temp.lid(1), 'Issue826 家庭', 'JPY', pg_temp.uid(1)),
       (pg_temp.lid(2), 'Issue826 公司', 'JPY', pg_temp.uid(2)),
       (pg_temp.lid(3), 'Issue826 旅行', 'JPY', pg_temp.uid(2)),
       (pg_temp.lid(4), 'Issue826 非成员', 'JPY', pg_temp.uid(3)),
       (pg_temp.lid(5), 'Issue826 已归档', 'JPY', pg_temp.uid(1)),
       (pg_temp.lid(6), 'Issue826 已移除', 'JPY', pg_temp.uid(2));
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(1), pg_temp.uid(1), 'owner', 'active', now() - interval '3 day'),
       (pg_temp.lid(2), pg_temp.uid(2), 'owner', 'active', now() - interval '3 day'),
       (pg_temp.lid(2), pg_temp.uid(1), 'member', 'active', now() - interval '2 day'),
       (pg_temp.lid(3), pg_temp.uid(2), 'owner', 'active', now() - interval '3 day'),
       (pg_temp.lid(3), pg_temp.uid(1), 'member', 'active', now() - interval '1 day'),
       (pg_temp.lid(4), pg_temp.uid(3), 'owner', 'active', now()),
       (pg_temp.lid(5), pg_temp.uid(1), 'owner', 'active', now()),
       (pg_temp.lid(6), pg_temp.uid(2), 'owner', 'active', now()),
       (pg_temp.lid(6), pg_temp.uid(1), 'member', 'active', now()),
       (pg_temp.lid(1), pg_temp.uid(5), 'member', 'active', now()),
       (pg_temp.lid(1), pg_temp.uid(8), 'member', 'active', now());

select diag('成员加入时写入账本内昵称');
select is(pg_temp.ledger_name_setting(1), 'Issue826 用户1', '新成员加入时写入当时的账号昵称');
select is(pg_temp.ledger_name_setting(3), 'Issue826 用户1', '加入其他账本时同样写入账号昵称');
select ok(pg_temp.ledger_color(1) is not null, '同时分配个性色');
update public.app_user set display_name = '  带空白的昵称  ' where id = pg_temp.uid(6);
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(1), pg_temp.uid(6), 'member', 'active', now());
select is(pg_temp.ledger_name_setting(1, 6), '带空白的昵称', '写入去除首尾空白后的账号昵称');

select diag('认领待邀请成员时使用待邀请成员的名字');
create temporary table issue826_token (label text primary key, token text);
grant all on table issue826_token to authenticated;
select pg_temp.act(1);
set local role authenticated;
select public.create_ledger_placeholder_member(pg_temp.lid(1), '奶奶');
insert into issue826_token (label, token)
select 'grandma', i.token
from public.create_ledger_invite_v2(
    pg_temp.lid(1), 'member',
    (select id from public.ledger_placeholder_member where ledger_id = pg_temp.lid(1) and display_name = '奶奶')
) i;
select pg_temp.act(7);
select is((select a.result from public.accept_ledger_invite((select token from issue826_token where label = 'grandma')) a),
          'claimed', '认领成功');
reset role;
select is(pg_temp.ledger_name_setting(1, 7), '奶奶', '账本内昵称为待邀请成员的名字，没有被账号昵称覆盖');
select is(pg_temp.global_name(7), 'Issue826 用户7', '账号昵称不变');
select is((select count(*) from public.ledger_member_display_setting where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(7)),
          1::bigint, '显示设置只有一行');

select diag('重新加入时的账本内昵称');
select pg_temp.act(null);
update public.ledger_member_display_setting set display_name = '八号自定义'
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8);
-- 显示设置已存在时 trigger 不覆盖：暂停退出时的清理 trigger，保留旧设置后重新加入。
alter table public.ledger_member disable trigger ledger_member_display_setting_cleanup_on_member_leave;
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8) and status = 'active';
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(1), pg_temp.uid(8), 'member', 'active', now());
alter table public.ledger_member enable trigger ledger_member_display_setting_cleanup_on_member_leave;
select is(pg_temp.ledger_name_setting(1, 8), '八号自定义', '已有显示设置时重新加入保留原昵称');
-- 实际流程：退出时清理 trigger 删除显示设置，重新加入时按当时的账号昵称重新建立。
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8) and status = 'active';
select is(pg_temp.ledger_name_setting(1, 8), null, '退出时显示设置被清理');
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(1), pg_temp.uid(8), 'member', 'active', now());
select is(pg_temp.ledger_name_setting(1, 8), 'Issue826 用户8', '清理后重新加入写入当时的账号昵称');

select diag('补填历史数据：active 成员账本内昵称为空时写入账号昵称');
select ok(not has_function_privilege('authenticated', 'public.backfill_ledger_member_display_names()', 'execute'), 'authenticated 不能执行补填函数');
select ok(not has_function_privilege('service_role', 'public.backfill_ledger_member_display_names()', 'execute'), 'service_role 不能执行补填函数');
-- 构造 trigger 引入前的历史数据：账本内昵称为空，页面回退显示账号昵称。
update public.ledger_member_display_setting set display_name = null
where user_id in (pg_temp.uid(1), pg_temp.uid(5), pg_temp.uid(6));
update public.app_user set status = 'disabled' where id = pg_temp.uid(5);
create temporary table issue826_before as select * from pg_temp.effective_names();
select ok(public.backfill_ledger_member_display_names() >= 4, '补填本人 3 个账本与 06 号成员');
select is((select count(*) from public.ledger_member_display_setting lds
           join public.ledger_member lm on lm.ledger_id = lds.ledger_id and lm.user_id = lds.user_id and lm.status = 'active'
           join public.app_user au on au.id = lds.user_id and au.status = 'active'
           where lds.display_name is null), 0::bigint, 'active 成员中已没有空的账本内昵称');
select is(pg_temp.ledger_name_setting(1), 'Issue826 用户1', '本人家庭账本已补填');
select is(pg_temp.ledger_name_setting(1, 6), '带空白的昵称', '补填去除首尾空白后的账号昵称');
select ok(pg_temp.ledger_name_setting(1, 5) is null, '已停用用户保持为空，由读取处回退');
select set_eq('select * from pg_temp.effective_names()', 'select * from issue826_before', '补填前后显示的昵称完全一致');
select is(public.backfill_ledger_member_display_names(), 0, '再次执行不再修改');

-- 其余用例：本人在公司账本改过账本内昵称；准备与新昵称同名的待邀请成员。
update public.ledger_member_display_setting set display_name = '公司里的我'
where ledger_id = pg_temp.lid(2) and user_id = pg_temp.uid(1);
update public.ledger set is_archived = true, archived_at = now() where id = pg_temp.lid(5);
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(6) and user_id = pg_temp.uid(1);
insert into public.ledger_placeholder_member (ledger_id, display_name, created_by)
values (pg_temp.lid(3), '新昵称', pg_temp.uid(2)),
       (pg_temp.lid(1), '家里的占位', pg_temp.uid(1));

create temporary table issue826_color (ledger integer primary key, color text);
insert into issue826_color select n, pg_temp.ledger_color(n) from unnest(array[1, 2, 3]) n;

select diag('签名、授权与 search_path');
select is(pg_get_function_identity_arguments('public.update_current_user_display_name'::regproc),
          'p_display_name text, p_sync_ledger_ids uuid[]', '写入 RPC 签名');
select is(pg_get_function_result('public.update_current_user_display_name'::regproc),
          'TABLE(ledger_id uuid, ledger_name text, error_code text)', '写入 RPC 返回列');
select is(pg_get_function_result('public.list_current_user_ledger_display_names'::regproc),
          'TABLE(ledger_id uuid, ledger_name text, display_name text)', '读取 RPC 返回列');
select ok(has_function_privilege('authenticated', 'public.update_current_user_display_name(text,uuid[])', 'execute'), 'authenticated 可修改昵称');
select ok(has_function_privilege('authenticated', 'public.list_current_user_ledger_display_names()', 'execute'), 'authenticated 可读取账本昵称');
select ok(not has_function_privilege('anon', 'public.update_current_user_display_name(text,uuid[])', 'execute'), 'anon 不能修改昵称');
select ok(not has_function_privilege('anon', 'public.list_current_user_ledger_display_names()', 'execute'), 'anon 不能读取账本昵称');
select ok(not has_function_privilege('public', 'public.update_current_user_display_name(text,uuid[])', 'execute'), 'PUBLIC 不能修改昵称');
select ok((select prosecdef from pg_proc where oid = 'public.update_current_user_display_name(text,uuid[])'::regprocedure), '写入 RPC 为 security definer');
select ok(not (select prosecdef from pg_proc where oid = 'public.list_current_user_ledger_display_names()'::regprocedure), '读取 RPC 为 security invoker');
select is((select proconfig from pg_proc where oid = 'public.update_current_user_display_name(text,uuid[])'::regprocedure),
          array['search_path=pg_catalog, pg_temp'], '写入 RPC 固定 search_path');
select is((select proconfig from pg_proc where oid = 'public.list_current_user_ledger_display_names()'::regprocedure),
          array['search_path=pg_catalog, pg_temp'], '读取 RPC 固定 search_path');

select diag('读取所属 active 账本与账本内有效昵称');
select pg_temp.act(1);
set local role authenticated;
select results_eq(
    'select ledger_id, ledger_name, display_name from public.list_current_user_ledger_display_names()',
    format($$values (%L::uuid, 'Issue826 家庭'::text, 'Issue826 用户1'::text),
                    (%L::uuid, 'Issue826 公司'::text, '公司里的我'::text),
                    (%L::uuid, 'Issue826 旅行'::text, 'Issue826 用户1'::text)$$,
           pg_temp.lid(1), pg_temp.lid(2), pg_temp.lid(3)),
    '按加入顺序返回 active 未归档账本，不含非成员、已归档与已移除账本'
);
select pg_temp.act(null);
select is((select count(*) from public.list_current_user_ledger_display_names()), 0::bigint, '未登录时不返回账本');
reset role;

select diag('参数校验');
select pg_temp.act(null);
set local role authenticated;
select is(pg_temp.err(pg_temp.update_sql('新名字', '{}')), '42501:auth_required', '未登录被拒');
select pg_temp.act(1);
select is(pg_temp.err(pg_temp.update_sql('   ', '{}')), '22023:display_name_required', '空白昵称被拒');
select is(pg_temp.err(format('select * from public.update_current_user_display_name(null, %L::uuid[])', '{}')), '22023:display_name_required', 'null 昵称被拒');
select is(pg_temp.err(pg_temp.update_sql(repeat('名', 101), '{}')), '22023:display_name_too_long', '超过 100 字被拒');
select is(pg_temp.err(pg_temp.update_sql(repeat('名', 100), '{}')), 'ok', '100 字以内可以保存');
reset role;

select is(pg_temp.ledger_name_setting(1), 'Issue826 用户1', '不同步时账本内昵称不变');
select is(pg_temp.ledger_name_setting(2), '公司里的我', '不同步时已改过的账本内昵称不变');

-- 恢复初始数据，后续用例从同一状态开始。
update public.app_user set display_name = 'Issue826 用户1' where id = pg_temp.uid(1);

select diag('账本范围由服务端重新校验');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.update_sql('新名字', array[4])), '42501:ledger_permission_denied', '非成员账本被拒');
select is(pg_temp.err(pg_temp.update_sql('新名字', array[5])), '42501:ledger_permission_denied', '已归档账本被拒');
select is(pg_temp.err(pg_temp.update_sql('新名字', array[1, 6])), '42501:ledger_permission_denied', '已被移除的账本被拒，整次不写入');
reset role;
select is(pg_temp.global_name(1), 'Issue826 用户1', '被拒时账号昵称不变');
select is(pg_temp.ledger_name_setting(1), 'Issue826 用户1', '被拒时账本内昵称不变');

select pg_temp.act(5);
set local role authenticated;
select is(pg_temp.err(pg_temp.update_sql('新名字', '{}')), '42501:user_inactive', '已停用用户被拒');
reset role;

select diag('勾选账本与待邀请成员重名时整体不写入并返回冲突账本');
select pg_temp.act(1);
set local role authenticated;
select results_eq(
    pg_temp.update_sql('  新昵称  ', array[1, 3]),
    format($$values (%L::uuid, 'Issue826 旅行'::text, 'display_name_placeholder_conflict'::text)$$, pg_temp.lid(3)),
    '返回冲突账本 ID、名称与原因'
);
reset role;
select is(pg_temp.global_name(1), 'Issue826 用户1', '冲突时账号昵称不变');
select is(pg_temp.ledger_name_setting(1), 'Issue826 用户1', '冲突时其他勾选账本不变');
select is(pg_temp.ledger_name_setting(3), 'Issue826 用户1', '冲突账本不变');

select diag('未勾选的冲突账本不影响保存');
select pg_temp.act(1);
set local role authenticated;
select is((select count(*) from public.update_current_user_display_name('新昵称', array[pg_temp.lid(1)])), 0::bigint, '只勾选家庭账本时保存成功');
reset role;
select is(pg_temp.global_name(1), '新昵称', '账号昵称已更新');
select is(pg_temp.ledger_name_setting(1), '新昵称', '勾选账本的账本内昵称更新为新昵称');
select is(pg_temp.ledger_name_setting(2), '公司里的我', '未勾选且改过账本内昵称的账本保持不变');
select is(pg_temp.ledger_name_setting(3), 'Issue826 用户1', '未勾选的账本内昵称不变');
select is(pg_temp.ledger_color(1), (select color from issue826_color where ledger = 1), '勾选账本的个性色保留');
select is(pg_temp.ledger_color(3), (select color from issue826_color where ledger = 3), '未勾选账本的个性色保留');
select is(pg_temp.ledger_name_setting(4, 3), 'Issue826 用户3', '非成员账本不受影响');

select diag('名字不变时即使存在同名待邀请成员也能保存');
-- 维护角色构造历史重名数据：家庭账本出现与本人账本内昵称同名的待邀请成员。
insert into public.ledger_placeholder_member (ledger_id, display_name, created_by)
values (pg_temp.lid(1), '新昵称', pg_temp.uid(1));
select pg_temp.act(1);
set local role authenticated;
select is((select count(*) from public.update_current_user_display_name('新昵称', array[pg_temp.lid(1)])), 0::bigint, '账本内昵称不变时不检查冲突');
select results_eq(
    pg_temp.update_sql('家里的占位', array[1]),
    format($$values (%L::uuid, 'Issue826 家庭'::text, 'display_name_placeholder_conflict'::text)$$, pg_temp.lid(1)),
    '改成其他待邀请成员的名字时返回冲突'
);
reset role;
select is(pg_temp.global_name(1), '新昵称', '有冲突返回时账号昵称不变');

select diag('全部勾选时全部更新，不勾选时只改账号昵称');
select pg_temp.act(1);
set local role authenticated;
select is((select count(*) from public.update_current_user_display_name('全部同步', array[pg_temp.lid(1), pg_temp.lid(2), pg_temp.lid(3), pg_temp.lid(1)])), 0::bigint, '重复 ID 去重后保存成功');
reset role;
select is(pg_temp.global_name(1), '全部同步', '账号昵称已更新');
select is(pg_temp.ledger_name_setting(1), '全部同步', '家庭账本已同步');
select is(pg_temp.ledger_name_setting(2), '全部同步', '公司账本已同步');
select is(pg_temp.ledger_name_setting(3), '全部同步', '旅行账本已同步');

select pg_temp.act(1);
set local role authenticated;
select is((select count(*) from public.update_current_user_display_name('只改个人', '{}'::uuid[])), 0::bigint, '不勾选任何账本时保存成功');
select is((select count(*) from public.update_current_user_display_name('只改个人2', null)), 0::bigint, 'null 账本列表视为不同步');
reset role;
select is(pg_temp.global_name(1), '只改个人2', '账号昵称已更新');
select is(pg_temp.ledger_name_setting(1), '全部同步', '账本内昵称保持不变');
select is(pg_temp.ledger_name_setting(2), '全部同步', '账本内昵称保持不变');

select diag('不影响其他成员');
select is(pg_temp.global_name(2), 'Issue826 用户2', '其他用户账号昵称不变');

select * from finish();
rollback;
