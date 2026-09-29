begin;
set local search_path = public, extensions;
select no_plan();

-- Issue #826：个人主页修改昵称，可选同步到账本内昵称。
-- 用户：01 本人、02 其他账本 owner、03 非成员账本 owner、04 被移除账本、05 已停用用户。
-- 账本：01 家庭（本人账本内昵称为空）、02 公司（本人已设置账本内昵称）、
-- 03 旅行（有与新昵称同名的待邀请成员）、04 非成员账本、05 已归档账本、06 已被移除的账本。
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
from generate_series(1, 5) n;

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
       (pg_temp.lid(1), pg_temp.uid(5), 'member', 'active', now());

update public.ledger_member_display_setting set display_name = null
where user_id = pg_temp.uid(1);
update public.ledger_member_display_setting set display_name = '公司里的我'
where ledger_id = pg_temp.lid(2) and user_id = pg_temp.uid(1);
update public.ledger set is_archived = true, archived_at = now() where id = pg_temp.lid(5);
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(6) and user_id = pg_temp.uid(1);
update public.app_user set status = 'disabled' where id = pg_temp.uid(5);
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

select is(pg_temp.ledger_name_setting(1), 'Issue826 用户1', '不同步时账本内昵称为空的账本固定为修改前的昵称');
select is(pg_temp.ledger_name_setting(2), '公司里的我', '不同步时已设置的账本内昵称不变');

-- 恢复初始数据，后续用例从同一状态开始。
update public.app_user set display_name = 'Issue826 用户1' where id = pg_temp.uid(1);
update public.ledger_member_display_setting set display_name = null
where user_id = pg_temp.uid(1) and ledger_id in (pg_temp.lid(1), pg_temp.lid(3));

select diag('账本范围由服务端重新校验');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.update_sql('新名字', array[4])), '42501:ledger_permission_denied', '非成员账本被拒');
select is(pg_temp.err(pg_temp.update_sql('新名字', array[5])), '42501:ledger_permission_denied', '已归档账本被拒');
select is(pg_temp.err(pg_temp.update_sql('新名字', array[1, 6])), '42501:ledger_permission_denied', '已被移除的账本被拒，整次不写入');
reset role;
select is(pg_temp.global_name(1), 'Issue826 用户1', '被拒时账号昵称不变');
select ok(pg_temp.ledger_name_setting(1) is null, '被拒时账本内昵称不变');

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
select ok(pg_temp.ledger_name_setting(1) is null, '冲突时其他勾选账本不变');
select ok(pg_temp.ledger_name_setting(3) is null, '冲突账本不变');

select diag('未勾选的冲突账本不影响保存');
select pg_temp.act(1);
set local role authenticated;
select is((select count(*) from public.update_current_user_display_name('新昵称', array[pg_temp.lid(1)])), 0::bigint, '只勾选家庭账本时保存成功');
reset role;
select is(pg_temp.global_name(1), '新昵称', '账号昵称已更新');
select is(pg_temp.ledger_name_setting(1), '新昵称', '勾选账本的账本内昵称更新为新昵称');
select is(pg_temp.ledger_name_setting(2), '公司里的我', '未勾选且已设置账本内昵称的账本保持不变');
select is(pg_temp.ledger_name_setting(3), 'Issue826 用户1', '未勾选且账本内昵称为空的账本固定为修改前的昵称');
select is(pg_temp.ledger_color(1), (select color from issue826_color where ledger = 1), '勾选账本的个性色保留');
select is(pg_temp.ledger_color(3), (select color from issue826_color where ledger = 3), '未勾选账本的个性色保留');
select is(pg_temp.ledger_name_setting(4, 3), null, '非成员账本不受影响');

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
