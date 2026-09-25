begin;
set local search_path = public, extensions;
select no_plan();

-- Issue #811：认领后成员显示名沿用待邀请成员名字；待邀请成员名字不能与 active 成员有效显示名重名。
-- 用户：01 owner、02 member（无账本内显示名，回退账号昵称）、03 member（账本内显示名覆盖）、
-- 04 member（账本内显示名带首尾空白）、05 removed 成员、06 已停用用户、07 认领者、
-- 08 认领失败者（先持有同名账户后被移除）、09 历史重名数据成员。
create function pg_temp.uid(p_n integer) returns uuid language sql immutable as $$
    select ('81100000-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid;
$$;
create function pg_temp.lid(p_n integer) returns uuid language sql immutable as $$
    select ('81100000-0000-4000-8000-' || lpad((100 + p_n)::text, 12, '0'))::uuid;
$$;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select pg_temp.uid(n), 'authenticated', 'authenticated', format('issue811-%s@example.test', n),
       jsonb_build_object('display_name', format('Issue811 用户%s', n))
from generate_series(1, 9) n;

insert into public.ledger (id, name, base_currency, owner_user_id)
values (pg_temp.lid(1), 'Issue811 主账本', 'JPY', pg_temp.uid(1)),
       (pg_temp.lid(2), 'Issue811 其他账本', 'JPY', pg_temp.uid(1));
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
select pg_temp.lid(1), pg_temp.uid(n), case when n = 1 then 'owner' else 'member' end, 'active', now()
from unnest(array[1, 2, 3, 4, 5, 6, 8, 9]) n;
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(2), pg_temp.uid(1), 'owner', 'active', now()),
       (pg_temp.lid(2), pg_temp.uid(2), 'member', 'active', now());

-- 成员加入触发器已建立只有颜色的显示设置行，这里直接写入账本内显示名。
update public.ledger_member_display_setting set display_name = '三号覆盖'
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(3);
update public.ledger_member_display_setting set display_name = '  Grandma  '
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(4);
update public.ledger_member_display_setting set display_name = '历史重名'
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(9);

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
create function pg_temp.act(p_n integer) returns void language sql as $$
    select set_config('request.jwt.claim.sub', case when p_n is null then '' else pg_temp.uid(p_n)::text end, true);
$$;
create function pg_temp.placeholder(p_name text) returns uuid language sql stable as $$
    select id from public.ledger_placeholder_member
    where ledger_id = pg_temp.lid(1) and display_name = p_name and claimed_by is null;
$$;
create function pg_temp.create_sql(p_name text, p_ledger integer default 1) returns text language sql immutable as $$
    select format('select public.create_ledger_placeholder_member(%L, %L)', pg_temp.lid(p_ledger), p_name);
$$;
-- 成员在主账本的有效显示名，与读取侧口径一致。
create function pg_temp.effective_name(p_n integer) returns text language sql stable as $$
    select coalesce(nullif(btrim(lds.display_name), ''), btrim(au.display_name))
    from public.app_user au
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = pg_temp.lid(1) and lds.user_id = au.id
    where au.id = pg_temp.uid(p_n);
$$;
create function pg_temp.member_color(p_n integer) returns text language sql stable as $$
    select display_color from public.ledger_member_display_setting
    where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(p_n);
$$;
create function pg_temp.update_member_sql(p_n integer, p_name text, p_color text default 'sky') returns text language sql immutable as $$
    select format('select public.update_ledger_member_settings(%L, %L, %L, %L, %L)',
                  pg_temp.lid(1), pg_temp.uid(p_n), p_name, p_color, 'member');
$$;

create temporary table issue811_token (label text primary key, token text);
grant all on table issue811_token to authenticated;
create function pg_temp.invite(p_label text, p_placeholder uuid) returns void language sql as $$
    insert into issue811_token (label, token)
    select p_label, i.token
    from public.create_ledger_invite_v2(pg_temp.lid(1), 'member', p_placeholder) i;
$$;
create function pg_temp.accept(p_label text) returns text language sql as $$
    select a.result from public.accept_ledger_invite((select token from issue811_token where label = p_label)) a;
$$;

select diag('签名与授权不变，辅助函数仅供内部使用');
select is(pg_get_function_identity_arguments('public.create_ledger_placeholder_member'::regproc), 'p_ledger_id uuid, p_display_name text', '新建 RPC 签名不变');
select is(pg_get_function_identity_arguments('public.rename_ledger_placeholder_member'::regproc), 'p_ledger_id uuid, p_placeholder_id uuid, p_display_name text', '改名 RPC 签名不变');
select is(pg_get_function_identity_arguments('public.ensure_ledger_placeholder_members'::regproc), 'p_ledger_id uuid, p_display_names text[]', 'ensure RPC 签名不变');
select is(pg_get_function_identity_arguments('public.update_ledger_member_settings'::regproc), 'p_ledger_id uuid, p_member_user_id uuid, p_display_name text, p_display_color text, p_role text', '成员设置 RPC 签名不变');
select is(pg_get_function_result('public.accept_ledger_invite'::regproc), 'TABLE(ledger_id uuid, ledger_name text, result text, placeholder_id uuid)', '接受 RPC 返回列不变');
select ok(has_function_privilege('authenticated', 'public.create_ledger_placeholder_member(uuid,text)', 'execute'), 'authenticated 仍可新建待邀请成员');
select ok(has_function_privilege('authenticated', 'public.rename_ledger_placeholder_member(uuid,uuid,text)', 'execute'), 'authenticated 仍可改名');
select ok(has_function_privilege('authenticated', 'public.ensure_ledger_placeholder_members(uuid,text[])', 'execute'), 'authenticated 仍可 ensure');
select ok(has_function_privilege('authenticated', 'public.update_ledger_member_settings(uuid,uuid,text,text,text)', 'execute'), 'authenticated 仍可修改成员设置');
select ok(has_function_privilege('authenticated', 'public.accept_ledger_invite(text)', 'execute'), 'authenticated 仍可接受邀请');
select ok(not has_function_privilege('anon', 'public.update_ledger_member_settings(uuid,uuid,text,text,text)', 'execute'), 'anon 不能修改成员设置');
select ok(not has_function_privilege('public', 'public.ledger_active_member_display_name_exists(uuid,text)', 'execute'), 'PUBLIC 不能执行成员重名辅助函数');
select ok(not has_function_privilege('anon', 'public.ledger_active_member_display_name_exists(uuid,text)', 'execute'), 'anon 不能执行成员重名辅助函数');
select ok(not has_function_privilege('authenticated', 'public.ledger_active_member_display_name_exists(uuid,text)', 'execute'), 'authenticated 不能执行成员重名辅助函数');
select ok(not has_function_privilege('service_role', 'public.ledger_active_member_display_name_exists(uuid,text)', 'execute'), 'service_role 不能执行成员重名辅助函数');
select is((select proconfig from pg_proc where oid = 'public.ledger_active_member_display_name_exists(uuid,text)'::regprocedure),
          array['search_path=pg_catalog, pg_temp'], '辅助函数固定 search_path');

-- 以下成员状态在准备数据之后再变化：05 移除、06 停用。
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(5);
update public.app_user set status = 'disabled' where id = pg_temp.uid(6);

select diag('新建待邀请成员与成员重名');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.create_sql('Issue811 用户2')), '23505:placeholder_name_member_conflict', '与无账本内显示名成员的账号昵称重名被拒');
select is(pg_temp.err(pg_temp.create_sql('三号覆盖')), '23505:placeholder_name_member_conflict', '与账本内显示名覆盖重名被拒');
select is(pg_temp.err(pg_temp.create_sql('Issue811 用户3')), 'ok', '被账本内显示名覆盖的账号昵称不算重名');
select is(pg_temp.err(pg_temp.create_sql('  三号覆盖  ')), '23505:placeholder_name_member_conflict', '输入名字首尾空白去除后比较');
select is(pg_temp.err(pg_temp.create_sql('Grandma')), '23505:placeholder_name_member_conflict', '成员显示名首尾空白去除后比较');
select is(pg_temp.err(pg_temp.create_sql('grandma')), 'ok', '大小写不同时允许');
select is(pg_temp.err(pg_temp.create_sql('Issue811 用户1')), '23505:placeholder_name_member_conflict', '与 owner 自己的名字重名同样被拒');
select is(pg_temp.err(pg_temp.create_sql('Issue811 用户5')), 'ok', 'removed 成员不算重名');
select is(pg_temp.err(pg_temp.create_sql('Issue811 用户6')), 'ok', '停用用户不算重名');
select is(pg_temp.err(pg_temp.create_sql('Issue811 用户2', 2)), '23505:placeholder_name_member_conflict', '其他账本按该账本自己的成员判断');
select is(pg_temp.err(pg_temp.create_sql('三号覆盖', 2)), 'ok', '其他账本的成员显示名不影响本账本');
select is(pg_temp.err(pg_temp.create_sql('grandma')), '23505:placeholder_name_conflict', '与其他待邀请成员重名仍返回原错误码');
reset role;
select is((select count(*) from public.ledger_placeholder_member where ledger_id = pg_temp.lid(1)
           and display_name in ('Issue811 用户2', '三号覆盖', 'Grandma', 'Issue811 用户1')), 0::bigint, '被拒的名字没有写入');

select diag('改名与成员重名');
set local role authenticated;
select public.create_ledger_placeholder_member(pg_temp.lid(1), '改名对象');
select is(pg_temp.err(format('select public.rename_ledger_placeholder_member(%L, %L, %L)', pg_temp.lid(1), pg_temp.placeholder('改名对象'), 'Issue811 用户2')),
          '23505:placeholder_name_member_conflict', '改名为无账本内显示名成员的昵称被拒');
select is(pg_temp.err(format('select public.rename_ledger_placeholder_member(%L, %L, %L)', pg_temp.lid(1), pg_temp.placeholder('改名对象'), ' Grandma ')),
          '23505:placeholder_name_member_conflict', '改名为带首尾空白的成员显示名被拒');
select is(pg_temp.err(format('select public.rename_ledger_placeholder_member(%L, %L, %L)', pg_temp.lid(1), pg_temp.placeholder('改名对象'), 'grandma')),
          '23505:placeholder_name_conflict', '改名为其他待邀请成员名字仍返回原错误码');
select is(pg_temp.err(format('select public.rename_ledger_placeholder_member(%L, %L, %L)', pg_temp.lid(1), pg_temp.placeholder('改名对象'), ' 改名对象 ')),
          'ok', '改为自己当前的名字幂等成功');
reset role;
-- 维护角色构造历史重名数据：待邀请成员与 09 号成员同名。
insert into public.ledger_placeholder_member (ledger_id, display_name, created_by)
values (pg_temp.lid(1), '历史重名', pg_temp.uid(1));
set local role authenticated;
select is(pg_temp.err(format('select public.rename_ledger_placeholder_member(%L, %L, %L)', pg_temp.lid(1), pg_temp.placeholder('历史重名'), '历史重名')),
          'ok', '已存在的历史重名数据改为自身名字仍幂等成功');
select is((select display_name from public.ledger_placeholder_member where id = pg_temp.placeholder('改名对象')), '改名对象', '被拒的改名没有写入');

select diag('ensure 与成员重名时整批回滚');
select is(pg_temp.err(format('select public.ensure_ledger_placeholder_members(%L, %L::text[])', pg_temp.lid(1), array['导入新人', 'Issue811 用户2'])),
          '23505:placeholder_name_member_conflict', '任一名字与成员昵称重名时整批失败');
select is(pg_temp.err(format('select public.ensure_ledger_placeholder_members(%L, %L::text[])', pg_temp.lid(1), array['导入新人', '  三号覆盖 '])),
          '23505:placeholder_name_member_conflict', '与成员账本内显示名（含首尾空白输入）重名时整批失败');
select is(pg_temp.err(format('select public.ensure_ledger_placeholder_members(%L, %L::text[])', pg_temp.lid(1), array['导入新人', '改名对象', 'GRANDMA'])),
          'ok', '不与成员重名时照常创建或复用');
reset role;
select is((select count(*) from public.ledger_placeholder_member where ledger_id = pg_temp.lid(1) and display_name = '导入新人'), 1::bigint,
          '失败批次没有留下部分写入，成功批次只创建一次');

select diag('成员改显示名不能改成待邀请成员的名字');
select pg_temp.act(2);
set local role authenticated;
select is(pg_temp.err(pg_temp.update_member_sql(2, '改名对象')), '23505:display_name_placeholder_conflict', '成员自己改成待邀请成员名字被拒');
select is(pg_temp.err(pg_temp.update_member_sql(2, '  改名对象  ')), '23505:display_name_placeholder_conflict', '首尾空白去除后比较');
select is(pg_temp.err(pg_temp.update_member_sql(2, '改名对象X')), 'ok', '不同名字可以保存');
select is(pg_temp.effective_name(2), '改名对象X', '保存后的有效显示名');
select pg_temp.act(1);
select is(pg_temp.err(pg_temp.update_member_sql(3, 'grandma')), '23505:display_name_placeholder_conflict', '管理员替成员改成待邀请成员名字同样被拒');
select is(pg_temp.err(pg_temp.update_member_sql(3, 'Grandma2')), 'ok', '管理员改成其他名字可以保存');
reset role;
select is(pg_temp.effective_name(3), 'Grandma2', '管理员保存后的有效显示名');
select pg_temp.act(9);
set local role authenticated;
select is(pg_temp.err(pg_temp.update_member_sql(9, '历史重名', 'lime')), 'ok', '名字不变只改颜色时，即使存在同名待邀请成员也能保存');
select is(pg_temp.err(pg_temp.update_member_sql(9, '  历史重名 ', 'jade')), 'ok', '名字只有首尾空白差异时视为不变');
reset role;
select is(pg_temp.member_color(9), 'jade', '颜色已保存');

select diag('认领后显示名沿用待邀请成员名字');
select pg_temp.act(1);
set local role authenticated;
select public.create_ledger_placeholder_member(pg_temp.lid(1), '奶奶');
select pg_temp.invite('grandma', pg_temp.placeholder('奶奶'));
reset role;
create temporary table issue811_placeholder as
select id from public.ledger_placeholder_member where ledger_id = pg_temp.lid(1) and display_name = '奶奶' and claimed_by is null;
grant all on table issue811_placeholder to authenticated;
select pg_temp.act(7);
set local role authenticated;
select is(pg_temp.accept('grandma'), 'claimed', '以「奶奶」认领成功');
reset role;
select is((select display_name from public.ledger_member_display_setting where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(7)), '奶奶', '账本内显示名写入待邀请成员名字');
select is(pg_temp.effective_name(7), '奶奶', '成员的有效显示名为「奶奶」');
select is((select display_name from public.app_user where id = pg_temp.uid(7)), 'Issue811 用户7', '账号全局昵称不变');
select ok(pg_temp.member_color(7) is not null, '成员加入时分配的颜色保留');
select is((select count(*) from public.ledger_member_display_setting where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(7)), 1::bigint, '显示设置只有一行');
select is((select claimed_by from public.ledger_placeholder_member where id = (select id from issue811_placeholder)), pg_temp.uid(7), '占位写入 claimed_by');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.create_sql('奶奶')), '23505:placeholder_name_member_conflict', '认领后名字转为成员显示名，新建同名占位按成员重名拒绝');

select diag('幂等重放不覆盖成员之后自己改过的显示名');
select pg_temp.act(7);
select is(pg_temp.err(pg_temp.update_member_sql(7, '奶奶改名')), 'ok', '认领后成员可以修改自己的显示名');
select is(pg_temp.accept('grandma'), 'claimed', '同一用户重放返回成功');
reset role;
select is(pg_temp.effective_name(7), '奶奶改名', '重放没有覆盖成员自己改过的显示名');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.create_sql('奶奶')), 'ok', '成员改名后旧名字释放，可以新建同名待邀请成员');
select is(pg_temp.err(pg_temp.create_sql('奶奶改名')), '23505:placeholder_name_member_conflict', '成员的新名字被占用');

select diag('认领失败时显示名不写入');
reset role;
select pg_temp.act(1);
set local role authenticated;
select public.create_ledger_placeholder_member(pg_temp.lid(1), '冲突占位');
select public.create_account_with_holders(pg_temp.lid(1), 'Issue811 冲突', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('冲突占位'));
select public.create_account_with_holders(pg_temp.lid(1), 'issue811 冲突', 'bank', 'JPY', 0, array[pg_temp.uid(8)]);
select pg_temp.invite('conflict', pg_temp.placeholder('冲突占位'));
reset role;
set constraints public.account_active_name_unique immediate;
set constraints public.account_active_name_unique deferred;
-- 08 号成员保留同名账户后被移除，构造认领时的名称冲突。
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8);
select pg_temp.act(8);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('conflict')$$), '23505:placeholder_claim_account_name_conflict', '账户名称冲突时认领失败');
reset role;
select is((select count(*) from public.ledger_member_display_setting where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8)), 0::bigint, '认领失败后没有写入显示设置');
select is((select count(*) from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8) and status <> 'removed'), 0::bigint, '认领失败后没有成员行');
select ok((select claimed_by is null from public.ledger_placeholder_member where display_name = '冲突占位' and ledger_id = pg_temp.lid(1)), '认领失败后占位仍未认领');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(pg_temp.create_sql('冲突占位')), '23505:placeholder_name_conflict', '未认领的名字仍只与待邀请成员冲突');

select diag('真实双会话并发：新建待邀请成员与成员改名取得同一账本锁');
reset role;
select pg_temp.act(null);
create extension if not exists dblink with schema extensions;
create function pg_temp.wait_lock(p_pid integer, p_blocker integer)
returns boolean language plpgsql as $$
begin
    for attempt in 1..200 loop
        if p_blocker = any(pg_blocking_pids(p_pid)) then return true; end if;
        perform pg_sleep(0.025);
    end loop;
    return false;
end;
$$;
-- 并发数据必须真实提交，因此使用种子用户 31（owner）与 34（member），结束后清理。
create function pg_temp.name_concurrency()
returns setof text language plpgsql as $fn$
declare
    v_connection text := format('host=%s port=%s dbname=%s user=postgres password=postgres', host(inet_server_addr()), inet_server_port(), current_database());
    v_owner uuid := '00000000-0000-4000-8000-000000000031';
    v_member uuid := '00000000-0000-4000-8000-000000000034';
    v_ledger uuid := gen_random_uuid();
    v_a_pid integer;
    v_b_pid integer;
    v_result text;
    v_cleanup text;
    v_setup text;
begin
    perform dblink_connect('name_a', v_connection);
    perform dblink_connect('name_b', v_connection);
    select pid into v_a_pid from dblink('name_a', 'select pg_backend_pid()') as t(pid integer);
    select pid into v_b_pid from dblink('name_b', 'select pg_backend_pid()') as t(pid integer);
    v_cleanup := format($q$
        delete from public.ledger_placeholder_member where ledger_id = %1$L;
        delete from public.ledger_member_display_setting where ledger_id = %1$L;
        delete from public.ledger_member where ledger_id = %1$L;
        delete from public.ledger where id = %1$L;
    $q$, v_ledger);
    perform dblink_exec('name_a', format($q$
        insert into public.ledger(id, name, base_currency, owner_user_id) values (%1$L, 'Issue811 并发测试', 'JPY', %2$L);
        insert into public.ledger_member(ledger_id, user_id, role, status, joined_at)
        values (%1$L, %2$L, 'owner', 'active', now()), (%1$L, %3$L, 'member', 'active', now());
    $q$, v_ledger, v_owner, v_member));
    -- 在远端子事务收集 SQLSTATE/detail，失败写入自动回滚，避免解析英文错误。
    v_setup := $q$
        create function pg_temp.run_sql(p_sql text) returns text language plpgsql as $remote$
        declare v_detail text;
        begin
            execute p_sql;
            return 'ok';
        exception when others then
            get stacked diagnostics v_detail = pg_exception_detail;
            return sqlstate || ':' || coalesce(v_detail, '');
        end;
        $remote$;
        set role authenticated;
        set statement_timeout = '10s';
    $q$;
    perform dblink_exec('name_a', v_setup);
    perform dblink_exec('name_b', v_setup);
    perform dblink_exec('name_a', format('set request.jwt.claim.sub = %L', v_owner));
    perform dblink_exec('name_b', format('set request.jwt.claim.sub = %L', v_member));
    select r into v_result from dblink('name_a', 'select current_user || '':'' || auth.uid()') as t(r text);
    return next is(v_result, 'authenticated:' || v_owner, '第一会话以 authenticated 角色和 owner 身份调用 RPC');
    select r into v_result from dblink('name_b', 'select current_user || '':'' || auth.uid()') as t(r text);
    return next is(v_result, 'authenticated:' || v_member, '第二会话以 authenticated 角色和 member 身份调用 RPC');

    -- 1. owner 持有账本锁新建待邀请成员，member 同时改成同名：后到的改名得到稳定错误码。
    perform dblink_exec('name_a', 'begin');
    perform * from dblink('name_a', format('select public.create_ledger_placeholder_member(%L, ''并发同名一'')', v_ledger)) as t(id uuid);
    perform dblink_send_query('name_b', format('select pg_temp.run_sql(%L)',
        format('select public.update_ledger_member_settings(%L, %L, ''并发同名一'', ''sky'', ''member'')', v_ledger, v_member)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), '成员改名等待新建待邀请成员持有的账本锁');
    perform dblink_exec('name_a', 'commit');
    select result into v_result from dblink_get_result('name_b') as t(result text);
    perform * from dblink_get_result('name_b') as t(result text);
    return next is(v_result, '23505:display_name_placeholder_conflict', '新建先提交后成员改名返回 display_name_placeholder_conflict');

    -- 2. member 持有账本锁改名，owner 同时新建同名待邀请成员：后到的新建得到稳定错误码。
    perform dblink_exec('name_b', 'begin');
    perform * from dblink('name_b', format('select public.update_ledger_member_settings(%L, %L, ''并发同名二'', ''sky'', ''member'')', v_ledger, v_member)) as t(r text);
    perform dblink_send_query('name_a', format('select pg_temp.run_sql(%L)',
        format('select public.create_ledger_placeholder_member(%L, ''并发同名二'')', v_ledger)));
    return next ok(pg_temp.wait_lock(v_a_pid, v_b_pid), '新建待邀请成员等待成员改名持有的账本锁');
    perform dblink_exec('name_b', 'commit');
    select result into v_result from dblink_get_result('name_a') as t(result text);
    perform * from dblink_get_result('name_a') as t(result text);
    return next is(v_result, '23505:placeholder_name_member_conflict', '改名先提交后新建返回 placeholder_name_member_conflict');

    select r into v_result from dblink('name_a', format($q$
        select (select count(*) from public.ledger_placeholder_member where ledger_id = %1$L)::text || ':' ||
               (select display_name from public.ledger_member_display_setting where ledger_id = %1$L and user_id = %2$L)
    $q$, v_ledger, v_member)) as t(r text);
    return next is(v_result, '1:并发同名二', '只有先提交的一方写入');

    perform dblink_exec('name_a', $q$reset role; set request.jwt.claim.sub = ''$q$);
    perform dblink_exec('name_a', v_cleanup);
    perform dblink_disconnect('name_a');
    perform dblink_disconnect('name_b');
exception when others then
    perform dblink_cancel_query('name_a');
    perform dblink_cancel_query('name_b');
    perform dblink_exec('name_a', 'rollback');
    perform dblink_exec('name_b', 'rollback');
    perform dblink_exec('name_a', $q$reset role; set request.jwt.claim.sub = ''$q$);
    perform dblink_exec('name_a', v_cleanup);
    perform dblink_disconnect('name_a');
    perform dblink_disconnect('name_b');
    raise;
end;
$fn$;
select * from pg_temp.name_concurrency();

select * from finish();
rollback;
