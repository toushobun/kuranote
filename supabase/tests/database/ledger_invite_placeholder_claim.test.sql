begin;
set local search_path = public, extensions;
select no_plan();

-- Issue #802：绑定占位邀请、原子认领。
-- Issue #809：不再支持新建匿名邀请，匿名接受分支只剩历史数据能走到。
-- 用户：01 owner、02 admin、03 member 认领者、04 viewer 认领者、05 active 成员、06 invited 成员、
-- 07 removed 成员、08 已停用用户、09 旁观用户、10 普通邀请加入者、11 名称冲突的 removed 成员、
-- 12 认领后被移除者、13 触发器窄分支测试用户、14 全量迁移认领者。
create function pg_temp.uid(p_n integer) returns uuid language sql immutable as $$
    select ('80200000-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid;
$$;
create function pg_temp.lid(p_n integer) returns uuid language sql immutable as $$
    select ('80200000-0000-4000-8000-' || lpad((100 + p_n)::text, 12, '0'))::uuid;
$$;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select pg_temp.uid(n), 'authenticated', 'authenticated', format('issue802-%s@example.test', n),
       jsonb_build_object('display_name', format('Issue802 用户%s', n))
from generate_series(1, 14) n;
update public.app_user set status = 'disabled' where id = pg_temp.uid(8);

-- 1：主账本；2：另一账本；3：稍后归档的账本。
insert into public.ledger (id, name, base_currency, owner_user_id)
values (pg_temp.lid(1), 'Issue802 主账本', 'JPY', pg_temp.uid(1)),
       (pg_temp.lid(2), 'Issue802 其他账本', 'JPY', pg_temp.uid(1)),
       (pg_temp.lid(3), 'Issue802 归档账本', 'JPY', pg_temp.uid(1));
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, removed_at)
values (pg_temp.lid(1), pg_temp.uid(1), 'owner', 'active', now(), null),
       (pg_temp.lid(2), pg_temp.uid(1), 'owner', 'active', now(), null),
       (pg_temp.lid(3), pg_temp.uid(1), 'owner', 'active', now(), null),
       (pg_temp.lid(1), pg_temp.uid(2), 'admin', 'active', now(), null),
       (pg_temp.lid(1), pg_temp.uid(5), 'member', 'active', now(), null),
       (pg_temp.lid(1), pg_temp.uid(6), 'member', 'invited', null, null),
       (pg_temp.lid(1), pg_temp.uid(7), 'member', 'removed', null, now()),
       (pg_temp.lid(1), pg_temp.uid(11), 'member', 'active', now(), null),
       (pg_temp.lid(1), pg_temp.uid(13), 'member', 'active', now(), null);

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
-- 执行后必定回滚，用于只观察触发器判断而不留下副作用。
create function pg_temp.probe(p_sql text) returns text language plpgsql as $$
declare v_detail text;
begin
    execute p_sql;
    raise exception 'probe_rollback' using errcode = 'P9999';
exception when others then
    if sqlstate = 'P9999' then
        return 'ok';
    end if;
    get stacked diagnostics v_detail = pg_exception_detail;
    return sqlstate || ':' || coalesce(v_detail, '');
end;
$$;
create function pg_temp.act(p_n integer) returns void language sql as $$
    select set_config('request.jwt.claim.sub', case when p_n is null then '' else pg_temp.uid(p_n)::text end, true);
$$;

create temporary table issue802_token (label text primary key, invite_id uuid, token text, placeholder_id uuid);
grant all on table issue802_token to authenticated, anon;
create function pg_temp.invite(p_label text, p_ledger uuid, p_role text, p_placeholder uuid default null)
returns uuid language sql as $$
    insert into issue802_token (label, invite_id, token, placeholder_id)
    select p_label, i.invite_id, i.token, i.placeholder_id
    from public.create_ledger_invite_v2(p_ledger_id => p_ledger, p_role => p_role, p_placeholder_id => p_placeholder) i
    returning invite_id;
$$;
create function pg_temp.token(p_label text) returns text language sql stable as $$
    select token from issue802_token where label = p_label;
$$;
create function pg_temp.placeholder(p_name text) returns uuid language sql stable as $$
    select id from public.ledger_placeholder_member
    where ledger_id = pg_temp.lid(1) and display_name = p_name and claimed_by is null;
$$;
create function pg_temp.accept(p_label text) returns text language sql as $$
    select a.result || ':' || coalesce(a.placeholder_id::text, 'null')
    from public.accept_ledger_invite(pg_temp.token(p_label)) a;
$$;
-- 认领相关的完整状态快照，用于证明失败后没有任何部分写入。
create function pg_temp.claim_state(p_placeholder uuid, p_user uuid) returns jsonb language sql stable as $$
    select jsonb_build_object(
        'member', (select coalesce(jsonb_agg(to_jsonb(lm) order by lm.id), '[]') from public.ledger_member lm
                   where lm.ledger_id = pg_temp.lid(1) and lm.user_id = p_user),
        'invite', (select coalesce(jsonb_agg(to_jsonb(li) order by li.id), '[]') from public.ledger_invite li
                   where li.placeholder_id = p_placeholder),
        'holder', (select coalesce(jsonb_agg(to_jsonb(h) order by h.id), '[]') from public.account_holder h
                   where h.ledger_id = pg_temp.lid(1) and (h.placeholder_id = p_placeholder or h.user_id = p_user)),
        'scope', (select coalesce(jsonb_agg(to_jsonb(s) order by s.account_id), '[]') from public.account_name_scope s
                  where s.ledger_id = pg_temp.lid(1)),
        'placeholder', (select to_jsonb(p) from public.ledger_placeholder_member p where p.id = p_placeholder),
        'current_ledger', (select current_ledger_id from public.app_user where id = p_user)
    );
$$;

select diag('签名与授权');
select is((select count(*) from pg_proc where proname = 'create_ledger_invite_v2' and pronamespace = 'public'::regnamespace), 1::bigint, '生成 RPC 只保留一个签名，没有两参数重载');
select is(pg_get_function_identity_arguments('public.create_ledger_invite_v2'::regproc), 'p_ledger_id uuid, p_role text, p_placeholder_id uuid', '生成 RPC 末尾增加可选占位参数');
select is(pg_get_function_result('public.create_ledger_invite_v2'::regproc), 'TABLE(invite_id uuid, token text, ledger_name text, invite_role text, placeholder_id uuid)', '生成 RPC 返回占位绑定标识');
select is(pg_get_function_result('public.accept_ledger_invite'::regproc), 'TABLE(ledger_id uuid, ledger_name text, result text, placeholder_id uuid)', '接受 RPC 返回占位绑定标识');
select is(pg_get_function_result('public.list_pending_ledger_invites'::regproc), 'TABLE(invite_id uuid, invite_role text, created_at timestamp with time zone, invite_token text, placeholder_id uuid)', '待接受列表返回占位绑定标识');
select is(pg_get_function_result('public.get_ledger_invite_preview'::regproc), 'TABLE(invite_status text, ledger_name text, inviter_name text, invite_role text, is_placeholder_bound boolean, placeholder_display_name text)', '预览只增加两个受控字段');
select ok(has_function_privilege('authenticated', 'public.create_ledger_invite_v2(uuid,text,uuid)', 'execute'), 'authenticated 可以生成邀请');
select ok(has_function_privilege('authenticated', 'public.accept_ledger_invite(text)', 'execute'), 'authenticated 可以接受邀请');
select ok(has_function_privilege('authenticated', 'public.list_pending_ledger_invites(uuid)', 'execute'), 'authenticated 可以读取待接受邀请');
select ok(has_function_privilege('anon', 'public.get_ledger_invite_preview(text)', 'execute'), 'anon 保留预览执行权限');
select ok(has_function_privilege('authenticated', 'public.get_ledger_invite_preview(text)', 'execute'), 'authenticated 保留预览执行权限');
select ok(not has_function_privilege('anon', 'public.create_ledger_invite_v2(uuid,text,uuid)', 'execute'), 'anon 不能生成邀请');
select ok(not has_function_privilege('anon', 'public.accept_ledger_invite(text)', 'execute'), 'anon 不能接受邀请');
select ok(not has_function_privilege('anon', 'public.list_pending_ledger_invites(uuid)', 'execute'), 'anon 不能读取待接受邀请');
select ok(not has_function_privilege('anon', 'public.revoke_ledger_invite(uuid,uuid)', 'execute'), 'anon 不能撤销邀请');
select ok(not has_function_privilege('service_role', 'public.accept_ledger_invite(text)', 'execute'), 'service_role 不能直接接受邀请');
select ok(not has_function_privilege('authenticated', 'public.enforce_ledger_management_permission()', 'execute'), '客户端不能执行管理权限触发器函数');
select ok(not has_function_privilege('service_role', 'public.enforce_ledger_management_permission()', 'execute'), 'service_role 不能执行管理权限触发器函数');

select diag('占位与账户准备');
select pg_temp.act(1);
set local role authenticated;
select public.create_ledger_placeholder_member(pg_temp.lid(1), n)
from unnest(array['绑定占位', '已有成员占位', 'member 认领', 'viewer 认领', '全量迁移', '移除后重放',
                  '名称冲突', '停用用户', '窄分支', '预览占位', '他账本', '普通加入', '普通加入二', '普通撤销']) n;
select public.create_ledger_placeholder_member(pg_temp.lid(2), '其他账本占位');
select public.create_ledger_placeholder_member(pg_temp.lid(3), '归档账本占位');
select public.create_account_with_holders(pg_temp.lid(1), '已有成员账户', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('已有成员占位'));
select public.create_account_with_holders(pg_temp.lid(1), 'member 认领账户', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('member 认领'));
select public.create_account_with_holders(pg_temp.lid(1), 'viewer 认领账户', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('viewer 认领'));
select public.create_account_with_holders(pg_temp.lid(1), '迁移银行', 'bank', 'JPY', 1000, '{}', pg_temp.placeholder('全量迁移'));
select public.create_account_with_holders(pg_temp.lid(1), '迁移现金', 'cash', 'JPY', 200, '{}', pg_temp.placeholder('全量迁移'));
select public.create_account_with_holders(pg_temp.lid(1), '迁移归档', 'bank', 'USD', 0, '{}', pg_temp.placeholder('全量迁移'));
update public.account set is_archived = true, archived_at = now(), archived_by = auth.uid() where name = '迁移归档';
select public.create_account_with_holders(pg_temp.lid(1), '重放账户', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('移除后重放'));
select public.create_account_with_holders(pg_temp.lid(1), 'Issue802 冲突', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('名称冲突'));
select public.create_account_with_holders(pg_temp.lid(1), 'issue802 冲突', 'bank', 'JPY', 0, array[pg_temp.uid(11)]);
select public.create_account_with_holders(pg_temp.lid(1), '停用账户', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('停用用户'));
select public.create_account_with_holders(pg_temp.lid(1), '窄分支账户', 'bank', 'JPY', 0, '{}', pg_temp.placeholder('窄分支'));
select pg_temp.invite('archived-before', pg_temp.lid(3), 'member',
    (select id from public.ledger_placeholder_member where display_name = '归档账本占位'));
reset role;
set constraints public.account_active_name_unique immediate;
set constraints public.account_active_name_unique deferred;
-- 11 号成员保留同名账户后被移除，构造认领时的名称冲突。
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(11);
update public.ledger set is_archived = true, archived_at = now() where id = pg_temp.lid(3);

select diag('邀请必须绑定待邀请成员（#809）');
set local role authenticated;
select is(pg_temp.err($$select public.create_ledger_invite_v2(p_ledger_id => pg_temp.lid(1), p_role => 'viewer')$$), '22023:placeholder_required', '两参数命名调用不再生成匿名邀请');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1))$$), '22023:placeholder_required', '省略角色和占位同样返回 placeholder_required');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', null)$$), '22023:placeholder_required', '显式传入 null 占位返回 placeholder_required');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'owner')$$), '22023:invite_role_invalid', '角色校验先于占位必填校验');
select is(pg_temp.err($$select public.create_ledger_invite_v2(null, 'member')$$), '22023:ledger_required', '缺少账本的错误码不变');
select is(pg_temp.err(format($$select public.create_ledger_invite_v2(pg_temp.lid(3), 'member', %L)$$,
    (select id from public.ledger_placeholder_member where display_name = '归档账本占位'))), 'P0002:ledger_not_found', '归档账本生成绑定邀请返回 ledger_not_found');
select pg_temp.invite('anon', pg_temp.lid(1), 'member', pg_temp.placeholder('普通加入'));
select pg_temp.invite('anon-used', pg_temp.lid(1), 'member', pg_temp.placeholder('普通加入二'));
select is((select count(*) from public.list_pending_ledger_invites(pg_temp.lid(1)) where placeholder_id is null), 0::bigint, '待接受列表中没有未绑定的邀请');
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(3), (select invite_id from issue802_token where label = 'archived-before'))$$), 'ok', '归档账本上仍可撤销邀请');
select pg_temp.act(5);
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member')$$), '42501:permission_denied', '普通成员不传占位时先返回 permission_denied');
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(1), (select invite_id from issue802_token where label = 'anon'))$$), '42501:permission_denied', '普通成员撤销邀请被拒');
select pg_temp.act(10);
select is(pg_temp.accept('anon'), 'claimed:' || (select placeholder_id from issue802_token where label = 'anon'), '无账户的待邀请成员被首次接受时返回 claimed');
select is((select role || ':' || status from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(10)), 'member:active', '按邀请角色创建 active 成员');
select is((select current_ledger_id from public.app_user where id = pg_temp.uid(10)), pg_temp.lid(1), '接受后切换当前账本');
select is(pg_temp.err($$select pg_temp.accept('anon-used')$$), '23505:placeholder_claim_existing_member', 'active 成员接受其他绑定邀请被拒');
select is(pg_temp.accept('anon'), 'claimed:' || (select placeholder_id from issue802_token where label = 'anon'), '同一接受者重放已接受的邀请幂等成功');
select pg_temp.act(9);
select is(pg_temp.err($$select pg_temp.accept('anon')$$), '23505:invite_already_used', '其他用户使用已接受的邀请被拒');
select is(pg_temp.err($$select public.accept_ledger_invite('not-a-real-token')$$), 'P0002:invite_invalid', '不存在的 token 返回 invite_invalid');
select is(pg_temp.err($$select public.accept_ledger_invite('  ')$$), '22023:invite_invalid', '空白 token 返回 invite_invalid');
select pg_temp.act(1);
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(1), (select invite_id from issue802_token where label = 'anon'))$$), '23505:invite_already_used', '撤销已接受邀请的错误码不变');
select pg_temp.invite('anon-revoked', pg_temp.lid(1), 'member', pg_temp.placeholder('普通撤销'));
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(1), (select invite_id from issue802_token where label = 'anon-revoked'))$$), 'ok', '撤销绑定邀请成功');
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(1), (select invite_id from issue802_token where label = 'anon-revoked'))$$), '23505:invite_already_revoked', '重复撤销的错误码不变');
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(1), gen_random_uuid())$$), 'P0002:invite_invalid', '撤销不存在邀请的错误码不变');
select pg_temp.act(9);
select is(pg_temp.err($$select pg_temp.accept('anon-revoked')$$), 'P0002:invite_invalid', '已撤销的邀请不能接受');
reset role;

select diag('表级 CHECK：待接受邀请必须绑定待邀请成员');
select pg_temp.act(null);
select ok((select convalidated from pg_constraint where conname = 'ledger_invite_pending_requires_placeholder' and conrelid = 'public.ledger_invite'::regclass), 'CHECK 已存在且对全部既有行生效');
select is((select count(*) from public.ledger_invite where placeholder_id is null and accepted_at is null and revoked_at is null), 0::bigint, '库中不存在未绑定的待接受邀请（migration 已撤销残留匿名邀请）');
create function pg_temp.insert_invite(p_placeholder uuid, p_state text) returns void language sql as $$
    insert into public.ledger_invite(ledger_id, inviter_user_id, created_by, role, token_hash, invite_token, placeholder_id,
                                     accepted_at, accepted_by, revoked_at, revoked_by)
    values (pg_temp.lid(1), pg_temp.uid(1), pg_temp.uid(1), 'member', md5(random()::text),
            case when p_state = 'pending' then md5(random()::text) || md5(random()::text) end, p_placeholder,
            case when p_state = 'accepted' then now() end, case when p_state = 'accepted' then pg_temp.uid(10) end,
            case when p_state = 'revoked' then now() end, case when p_state = 'revoked' then pg_temp.uid(1) end);
$$;
-- CHECK 违反的 detail 含整行数据，这里按约束名精确判断。
create function pg_temp.check_err(p_sql text) returns text language plpgsql as $$
declare v_constraint text;
begin
    execute p_sql;
    return 'ok';
exception when check_violation then
    get stacked diagnostics v_constraint = constraint_name;
    return sqlstate || ':' || coalesce(v_constraint, '');
end;
$$;
select is(pg_temp.check_err($$select pg_temp.insert_invite(null, 'pending')$$), '23514:ledger_invite_pending_requires_placeholder', '直接插入未绑定的待接受邀请被 CHECK 拒绝');
select is(pg_temp.err($$select pg_temp.insert_invite(null, 'revoked')$$), 'ok', '已撤销邀请允许 placeholder_id 为空');
select is(pg_temp.err($$select pg_temp.insert_invite(null, 'accepted')$$), 'ok', '已接受的历史匿名邀请允许 placeholder_id 为空');
select is(pg_temp.check_err(format('update public.ledger_invite set placeholder_id = null where id = %L', (select invite_id from issue802_token where label = 'anon-used'))),
          '23514:ledger_invite_pending_requires_placeholder', '不能把待接受邀请的占位关联置空');
select is(pg_temp.err(format('update public.ledger_invite set placeholder_id = null where id = %L', (select invite_id from issue802_token where label = 'anon-revoked'))),
          'ok', '已撤销邀请的占位关联可以置空');
select is(pg_temp.err(format('update public.ledger_invite set placeholder_id = %L where id = %L', pg_temp.placeholder('普通撤销'), (select invite_id from issue802_token where label = 'anon-revoked'))),
          'ok', '恢复已撤销邀请的占位关联，供后续删除流程验证');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err($$select public.delete_ledger_placeholder_member(pg_temp.lid(1), pg_temp.placeholder('普通撤销'))$$), 'ok', '删除占位时把已撤销邀请的 placeholder_id 置空，流程照常可用');
reset role;
select is((select coalesce(placeholder_id::text, 'null') || ':' || (revoked_at is not null) from public.ledger_invite where id = (select invite_id from issue802_token where label = 'anon-revoked')),
          'null:true', '已撤销邀请记录保留且关联已解除');

select diag('历史匿名邀请的接受分支保持不变');
-- 只能由数据库维护角色构造：历史上已接受的匿名邀请，token 已清空但 hash 仍可定位。
select pg_temp.act(null);
insert into public.ledger_invite(ledger_id, inviter_user_id, created_by, role, token_hash, invite_token, placeholder_id, accepted_at, accepted_by)
values (pg_temp.lid(1), pg_temp.uid(1), pg_temp.uid(1), 'member', encode(extensions.digest('issue809-legacy-anon', 'sha256'), 'hex'), null, null, now(), pg_temp.uid(10));
insert into issue802_token (label, token) values ('legacy-anon', 'issue809-legacy-anon');
select pg_temp.act(10);
set local role authenticated;
select is(pg_temp.accept('legacy-anon'), 'already_member:null', 'active 成员重放历史匿名邀请仍返回 already_member');
select pg_temp.act(9);
select is(pg_temp.err($$select pg_temp.accept('legacy-anon')$$), '23505:invite_already_used', '其他用户使用历史匿名邀请被拒');
reset role;

select diag('绑定邀请生成与唯一有效绑定');
select pg_temp.act(1);
set local role authenticated;
select isnt(pg_temp.invite('bound', pg_temp.lid(1), 'member', pg_temp.placeholder('绑定占位')), null, '管理员可以生成绑定邀请');
select is((select placeholder_id from issue802_token where label = 'bound'), pg_temp.placeholder('绑定占位'), '生成结果返回占位绑定标识');
select is((select placeholder_id from public.list_pending_ledger_invites(pg_temp.lid(1)) where invite_id = (select invite_id from issue802_token where label = 'bound')), pg_temp.placeholder('绑定占位'), '待接受列表返回占位绑定标识');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', pg_temp.placeholder('绑定占位'))$$), '23505:placeholder_invite_pending', '串行的第二条绑定邀请被拒');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', (select id from public.ledger_placeholder_member where display_name = '其他账本占位'))$$), '22023:placeholder_not_found', '其他账本的占位不能绑定');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', gen_random_uuid())$$), '22023:placeholder_not_found', '不存在的占位不能绑定');
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'owner', pg_temp.placeholder('他账本'))$$), '22023:invite_role_invalid', '绑定邀请沿用角色校验');
select pg_temp.act(2);
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', pg_temp.placeholder('他账本'))$$), 'ok', 'active admin 可以生成绑定邀请');
select pg_temp.act(5);
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', pg_temp.placeholder('窄分支'))$$), '42501:permission_denied', '普通成员不能生成绑定邀请');
reset role;
select pg_temp.act(null);
update public.ledger_placeholder_member set claimed_by = pg_temp.uid(9), claimed_at = now() where id = pg_temp.placeholder('他账本');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err(format($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member', %L)$$,
    (select id from public.ledger_placeholder_member where display_name = '他账本'))), '23514:placeholder_already_claimed', '已认领占位不能生成绑定邀请');

select diag('撤销后重新创建必须重传占位 ID');
select is(pg_temp.err($$select public.revoke_ledger_invite(pg_temp.lid(1), (select invite_id from issue802_token where label = 'bound'))$$), 'ok', '撤销绑定邀请');
reset role;
select is((select invite_token from public.ledger_invite where id = (select invite_id from issue802_token where label = 'bound')), null, '撤销后清空明文 token');
select is((select placeholder_id from public.ledger_invite where id = (select invite_id from issue802_token where label = 'bound')), pg_temp.placeholder('绑定占位'), '撤销后保留历史 placeholder_id');
select pg_temp.act(9);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('bound')$$), 'P0002:invite_invalid', '撤销后旧 token 立即无效');
select pg_temp.act(1);
select is(pg_temp.err($$select public.create_ledger_invite_v2(pg_temp.lid(1), 'member')$$), '22023:placeholder_required', '不传占位 ID 重新创建返回 placeholder_required');
select is((select count(*) from public.list_pending_ledger_invites(pg_temp.lid(1)) where placeholder_id = pg_temp.placeholder('绑定占位')), 0::bigint, '撤销后占位仍没有有效绑定');
select pg_temp.invite('bound-again', pg_temp.lid(1), 'member', pg_temp.placeholder('绑定占位'));
select is((select placeholder_id from issue802_token where label = 'bound-again'), pg_temp.placeholder('绑定占位'), '重新传占位 ID 才会再次绑定，唯一索引已释放');

select diag('已是成员时拒绝且不覆盖或合并');
select pg_temp.invite('existing', pg_temp.lid(1), 'admin', pg_temp.placeholder('已有成员占位'));
reset role;
create temporary table issue802_state as
select 5 as n, pg_temp.claim_state(pg_temp.placeholder('已有成员占位'), pg_temp.uid(5)) as state
union all
select 6, pg_temp.claim_state(pg_temp.placeholder('已有成员占位'), pg_temp.uid(6));
grant all on table issue802_state to authenticated;
select pg_temp.act(5);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('existing')$$), '23505:placeholder_claim_existing_member', 'active 成员接受绑定邀请被拒');
reset role;
select is(pg_temp.claim_state(pg_temp.placeholder('已有成员占位'), pg_temp.uid(5)), (select state from issue802_state where n = 5), 'active 成员的成员行、邀请、占位与持有行均未变化');
select pg_temp.act(6);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('existing')$$), '23505:placeholder_claim_existing_member', 'invited 成员接受绑定邀请被拒');
reset role;
select is(pg_temp.claim_state(pg_temp.placeholder('已有成员占位'), pg_temp.uid(6)), (select state from issue802_state where n = 6), 'invited 成员未被激活，邀请与持有行均未变化');
select is((select status from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(6)), 'invited', 'invited 行保持原状态');
select pg_temp.act(7);
set local role authenticated;
select is(pg_temp.accept('existing'), 'claimed:' || (select placeholder_id from issue802_token where label = 'existing'), 'removed 成员视为非成员，可以正常认领');
reset role;
select is((select array_agg(status || ':' || role order by status) from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(7)), array['active:admin', 'removed:member'], 'removed 历史行保留，新增按邀请角色的 active 成员');

select diag('member / viewer 可以认领但不获得管理权限');
select pg_temp.act(1);
set local role authenticated;
select pg_temp.invite('member-claim', pg_temp.lid(1), 'member', pg_temp.placeholder('member 认领'));
select pg_temp.invite('viewer-claim', pg_temp.lid(1), 'viewer', pg_temp.placeholder('viewer 认领'));
select pg_temp.act(3);
select is(pg_temp.accept('member-claim'), 'claimed:' || (select placeholder_id from issue802_token where label = 'member-claim'), 'member 角色邀请认领成功');
select pg_temp.act(4);
select is(pg_temp.accept('viewer-claim'), 'claimed:' || (select placeholder_id from issue802_token where label = 'viewer-claim'), 'viewer 角色邀请认领成功');
reset role;
select is((select array_agg(user_id::text || ':' || role order by role) from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id in (pg_temp.uid(3), pg_temp.uid(4))),
          array[pg_temp.uid(3)::text || ':member', pg_temp.uid(4)::text || ':viewer'], '成员角色取自邀请');
create function pg_temp.assert_no_management(p_label text, p_account uuid) returns setof text language plpgsql as $$
declare
    v_name text := (select name from public.account where id = p_account);
begin
    return next is(pg_temp.err(format('update public.account_holder set role = ''co_owner'' where account_id = %L', p_account)), '42501:', p_label || '不能直接更新持有行');
    return next is(pg_temp.err(format('delete from public.account_holder where account_id = %L', p_account)), '42501:', p_label || '不能直接删除持有行');
    return next is(pg_temp.err(format('insert into public.account_holder(ledger_id, account_id, user_id) values (%L, %L, auth.uid())', pg_temp.lid(1), p_account)), '42501:', p_label || '不能直接新增持有行');
    perform pg_temp.err(format('update public.account set name = ''越权改名'' where id = %L', p_account));
    perform pg_temp.err(format('delete from public.account where id = %L', p_account));
    return next is((select name from public.account where id = p_account), v_name, p_label || '直接更新或删除账户均不生效');
    return next is(pg_temp.err(format('insert into public.account(ledger_id, name, type, currency) values (%L, ''越权账户'', ''bank'', ''JPY'')', pg_temp.lid(1))), '42501:', p_label || '不能直接新增账户');
    return next is(pg_temp.err(format('select public.create_account_with_holders(%L, ''越权新增'', ''bank'', ''JPY'', 0, ''{}'')', pg_temp.lid(1))), '42501:permission_denied', p_label || '不能调用账户创建 RPC');
    return next is(pg_temp.err(format('select public.update_account_with_holders(%L, %L, ''越权编辑'', ''bank'', ''JPY'', ''{}'')', pg_temp.lid(1), p_account)), '42501:permission_denied', p_label || '不能调用账户编辑 RPC');
    return next is(pg_temp.err(format('select public.update_account_with_balance_adjustment(%L, %L, ''越权编辑'', ''bank'', ''JPY'', ''{}'', 1)', pg_temp.lid(1), p_account)), '42501:ledger_forbidden', p_label || '不能调用余额调整 RPC');
    return next is(pg_temp.err(format('select public.create_ledger_placeholder_member(%L, ''越权占位'')', pg_temp.lid(1))), '42501:permission_denied', p_label || '不能调用占位管理 RPC');
    return next is(pg_temp.err(format('select public.create_ledger_invite_v2(%L, ''member'')', pg_temp.lid(1))), '42501:permission_denied', p_label || '不能生成邀请');
end;
$$;
select pg_temp.act(3);
set local role authenticated;
select * from pg_temp.assert_no_management('member 认领者', (select id from public.account where name = 'member 认领账户'));
select pg_temp.act(4);
select * from pg_temp.assert_no_management('viewer 认领者', (select id from public.account where name = 'viewer 认领账户'));
reset role;

select diag('全量迁移含归档账户');
create temporary table issue802_before as
select
    (select jsonb_agg(to_jsonb(a) order by a.id) from public.account a where a.name like '迁移%') as accounts,
    (select jsonb_agg(jsonb_build_object('id', h.id, 'account_id', h.account_id, 'role', h.role, 'share_ratio', h.share_ratio,
                                         'created_by', h.created_by, 'created_at', h.created_at) order by h.id)
     from public.account_holder h where h.placeholder_id = pg_temp.placeholder('全量迁移')) as holders,
    (select jsonb_agg(to_jsonb(ti) order by ti.id) from public.transaction_item ti
     where ti.account_id in (select id from public.account where name like '迁移%')) as items,
    (select jsonb_agg(to_jsonb(tr) order by tr.id) from public.transaction_record tr where tr.id in (
        select ti.transaction_record_id from public.transaction_item ti
        where ti.account_id in (select id from public.account where name like '迁移%'))) as records,
    pg_temp.placeholder('全量迁移') as placeholder_id;
grant all on table issue802_before to authenticated;
select is((select jsonb_array_length(holders) from issue802_before), 3, '占位持有三个账户（含归档账户）');
select is((select jsonb_array_length(items) from issue802_before), 2, '初始余额产生了需要保持不变的交易');
select pg_temp.act(1);
set local role authenticated;
select pg_temp.invite('full', pg_temp.lid(1), 'member', pg_temp.placeholder('全量迁移'));
select pg_temp.act(14);
select is(pg_temp.accept('full'), 'claimed:' || (select placeholder_id from issue802_before), '接受绑定邀请返回 claimed 及占位 ID');
reset role;
select is((select count(*) from public.account_holder where placeholder_id = (select placeholder_id from issue802_before)), 0::bigint, '占位已没有剩余持有引用');
select is((select jsonb_agg(jsonb_build_object('id', h.id, 'account_id', h.account_id, 'role', h.role, 'share_ratio', h.share_ratio,
                                               'created_by', h.created_by, 'created_at', h.created_at) order by h.id)
           from public.account_holder h where h.account_id in (select id from public.account where name like '迁移%')),
          (select holders from issue802_before), '持有行 ID、账户、角色、比例及创建审计均不变');
select is((select count(*) from public.account_holder h where h.account_id in (select id from public.account where name like '迁移%')
           and h.user_id = pg_temp.uid(14) and h.placeholder_id is null and h.updated_by = pg_temp.uid(14)), 3::bigint, '全部持有行（含归档账户）迁移到接受者');
select is((select jsonb_agg(to_jsonb(a) order by a.id) from public.account a where a.name like '迁移%'), (select accounts from issue802_before), '账户余额、名称等全部字段不变');
select is((select jsonb_agg(to_jsonb(ti) order by ti.id) from public.transaction_item ti where ti.account_id in (select id from public.account where name like '迁移%')), (select items from issue802_before), '交易明细不变');
select is((select jsonb_agg(to_jsonb(tr) order by tr.id) from public.transaction_record tr where tr.id in (
               select ti.transaction_record_id from public.transaction_item ti where ti.account_id in (select id from public.account where name like '迁移%'))),
          (select records from issue802_before), '交易记录及其记账人不变');
select is((select array_agg(s.holder_user_id::text || ':' || coalesce(s.holder_placeholder_id::text, 'null') order by s.name)
           from public.account_name_scope s join public.account a on a.id = s.account_id where a.name like '迁移%'),
          array[pg_temp.uid(14)::text || ':null', pg_temp.uid(14)::text || ':null'], '未归档账户的名称投影切换到接受者');
select is((select count(*) from public.account_name_scope s join public.account a on a.id = s.account_id where a.name = '迁移归档'), 0::bigint, '归档账户仍不进入名称投影');
select is((select claimed_by from public.ledger_placeholder_member where id = (select placeholder_id from issue802_before)), pg_temp.uid(14), '占位写入 claimed_by');
select ok((select claimed_at is not null from public.ledger_placeholder_member where id = (select placeholder_id from issue802_before)), '占位写入 claimed_at');
select is((select accepted_by::text || ':' || coalesce(invite_token, 'null') from public.ledger_invite where id = (select invite_id from issue802_token where label = 'full')), pg_temp.uid(14)::text || ':null', '邀请写入接受人并清空 token');
select is((select current_ledger_id from public.app_user where id = pg_temp.uid(14)), pg_temp.lid(1), '认领后切换当前账本');
select pg_temp.act(1);
set local role authenticated;
select is(pg_temp.err($$select public.create_ledger_placeholder_member(pg_temp.lid(1), '全量迁移')$$), 'ok', '认领后占位名字释放，可被新占位复用');

select diag('重放已接受 token 幂等且不重复迁移');
reset role;
create temporary table issue802_replay as
select
    (select claimed_at from public.ledger_placeholder_member where id = (select placeholder_id from issue802_before)) as claimed_at,
    (select jsonb_agg(to_jsonb(h) order by h.id) from public.account_holder h where h.account_id in (select id from public.account where name like '迁移%')) as holders,
    (select jsonb_agg(to_jsonb(lm) order by lm.id) from public.ledger_member lm where lm.ledger_id = pg_temp.lid(1) and lm.user_id = pg_temp.uid(14)) as members,
    (select to_jsonb(li) from public.ledger_invite li where li.id = (select invite_id from issue802_token where label = 'full')) as invite;
grant all on table issue802_replay to authenticated;
select pg_temp.act(14);
set local role authenticated;
select is(pg_temp.accept('full'), 'claimed:' || (select placeholder_id from issue802_before), '同一用户重放返回成功');
reset role;
select is((select claimed_at from public.ledger_placeholder_member where id = (select placeholder_id from issue802_before)), (select claimed_at from issue802_replay), '重放不改 claimed_at');
select is((select jsonb_agg(to_jsonb(h) order by h.id) from public.account_holder h where h.account_id in (select id from public.account where name like '迁移%')), (select holders from issue802_replay), '重放不重复迁移，持有行 updated_at 不变');
select is((select jsonb_agg(to_jsonb(lm) order by lm.id) from public.ledger_member lm where lm.ledger_id = pg_temp.lid(1) and lm.user_id = pg_temp.uid(14)), (select members from issue802_replay), '重放不改成员行');
select is((select to_jsonb(li) from public.ledger_invite li where li.id = (select invite_id from issue802_token where label = 'full')), (select invite from issue802_replay), '重放不改邀请');
select pg_temp.act(9);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('full')$$), '23505:invite_already_used', '其他用户重放已接受的绑定邀请被拒');
select pg_temp.act(1);
select pg_temp.invite('removed-replay', pg_temp.lid(1), 'member', pg_temp.placeholder('移除后重放'));
select pg_temp.act(12);
select is(pg_temp.accept('removed-replay'), 'claimed:' || (select placeholder_id from issue802_token where label = 'removed-replay'), '12 号用户先完成认领');
reset role;
select pg_temp.act(null);
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null
where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(12);
update public.app_user set current_ledger_id = null where id = pg_temp.uid(12);
select pg_temp.act(12);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('removed-replay')$$), '23505:invite_already_used', '认领后被移除的用户重放被拒');
reset role;
select is((select count(*) from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(12) and status <> 'removed'), 0::bigint, '重放没有重新授予成员资格');

select diag('任一步失败全部回滚');
select pg_temp.act(1);
set local role authenticated;
select pg_temp.invite('conflict', pg_temp.lid(1), 'member', pg_temp.placeholder('名称冲突'));
select pg_temp.invite('inactive', pg_temp.lid(1), 'member', pg_temp.placeholder('停用用户'));
reset role;
create temporary table issue802_rollback as
select 11 as n, pg_temp.claim_state(pg_temp.placeholder('名称冲突'), pg_temp.uid(11)) as state
union all
select 8, pg_temp.claim_state(pg_temp.placeholder('停用用户'), pg_temp.uid(8));
select pg_temp.act(11);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('conflict')$$), '23505:placeholder_claim_account_name_conflict', '迁移造成账户名称冲突时返回稳定错误码');
reset role;
select is(pg_temp.claim_state(pg_temp.placeholder('名称冲突'), pg_temp.uid(11)), (select state from issue802_rollback where n = 11), '名称冲突后成员、邀请、持有行、名称投影、占位与当前账本全部回滚');
select ok((select invite_token is not null and accepted_at is null from public.ledger_invite where id = (select invite_id from issue802_token where label = 'conflict')), '名称冲突后邀请仍可使用');
select pg_temp.act(8);
set local role authenticated;
select is(pg_temp.err($$select pg_temp.accept('inactive')$$), '42501:user_inactive', '停用用户认领返回 user_inactive');
reset role;
select is(pg_temp.claim_state(pg_temp.placeholder('停用用户'), pg_temp.uid(8)), (select state from issue802_rollback where n = 8), '停用用户认领失败后全部状态保持原样');
select is((select count(*) from public.ledger_member where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(8)), 0::bigint, '停用用户没有留下成员行');

select diag('认领窄分支不可被绕过');
-- 以维护角色直接执行 DML，只观察管理权限触发器本身；客户端角色另外受表权限与 RLS 限制。
create function pg_temp.migrate_sql(p_user integer, p_extra text default '') returns text language sql as $$
    select format('update public.account_holder set user_id = %L, placeholder_id = null, updated_by = %L%s where placeholder_id = %L',
                  pg_temp.uid(p_user), pg_temp.uid(p_user), p_extra, pg_temp.placeholder('窄分支'));
$$;
select pg_temp.act(13);
select is(pg_temp.probe(pg_temp.migrate_sql(13)), '42501:', '没有已接受邀请时不能把占位引用改成自己');
select pg_temp.act(1);
set local role authenticated;
select pg_temp.invite('narrow', pg_temp.lid(1), 'member', pg_temp.placeholder('窄分支'));
reset role;
select pg_temp.act(13);
select is(pg_temp.probe(pg_temp.migrate_sql(13)), '42501:', '邀请尚未接受时同样被拒');
select pg_temp.act(null);
update public.ledger_invite set accepted_at = now(), accepted_by = pg_temp.uid(13), invite_token = null
where id = (select invite_id from issue802_token where label = 'narrow');
select pg_temp.act(13);
select is(pg_temp.probe(pg_temp.migrate_sql(13)), 'ok', '满足全部条件时窄分支放行（对照组）');
select is(pg_temp.probe(pg_temp.migrate_sql(5)), '42501:', '不能改成他人 userId');
select is(pg_temp.probe(pg_temp.migrate_sql(13, ', role = ''co_owner''')), '42501:', '迁移时不能顺带修改 role');
select is(pg_temp.probe(pg_temp.migrate_sql(13, ', share_ratio = 50')), '42501:', '迁移时不能顺带修改 share_ratio');
select is(pg_temp.probe(pg_temp.migrate_sql(13, format(', account_id = %L', (select id from public.account where name = '停用账户')))), '42501:', '迁移时不能顺带修改 account_id');
select is(pg_temp.probe(pg_temp.migrate_sql(13, ', created_by = ' || quote_literal(pg_temp.uid(13)))), '42501:', '迁移时不能修改创建审计');
select is(pg_temp.probe(format('update public.account_holder set user_id = %L, placeholder_id = null where placeholder_id = %L', pg_temp.uid(13), pg_temp.placeholder('窄分支'))), '42501:', '更新审计列必须记录为接受者');
select is(pg_temp.probe(format('delete from public.account_holder where placeholder_id = %L', pg_temp.placeholder('窄分支'))), '42501:', '窄分支不放行 DELETE');
select is(pg_temp.probe(format('insert into public.account_holder(ledger_id, account_id, user_id, updated_by) select ledger_id, id, auth.uid(), auth.uid() from public.account where name = %L', '停用账户')), '42501:', '窄分支不放行 INSERT');
select is(pg_temp.probe(format('update public.account set name = ''窄分支改名'' where name = %L', '窄分支账户')), '42501:', '窄分支不影响其他表的判断');
select pg_temp.act(null);
update public.ledger_member set status = 'removed', removed_at = now(), joined_at = null where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(13);
select pg_temp.act(13);
select is(pg_temp.probe(pg_temp.migrate_sql(13)), '42501:', '接受者不是 active 成员时被拒');
select pg_temp.act(null);
update public.ledger_member set status = 'active', removed_at = null, joined_at = now() where ledger_id = pg_temp.lid(1) and user_id = pg_temp.uid(13);
update public.ledger_placeholder_member set claimed_by = pg_temp.uid(13), claimed_at = now() where id = pg_temp.placeholder('窄分支');
create temporary table issue802_narrow as select id from public.ledger_placeholder_member where display_name = '窄分支';
select pg_temp.act(13);
select is(pg_temp.probe(format('update public.account_holder set user_id = %L, placeholder_id = null, updated_by = %L where placeholder_id = %L',
                               pg_temp.uid(13), pg_temp.uid(13), (select id from issue802_narrow))), '42501:', '占位已认领后不能再触发窄分支');
select pg_temp.act(null);
update public.ledger_placeholder_member set claimed_by = null, claimed_at = null where id = (select id from issue802_narrow);
select pg_temp.act(5);
select set_config('app.allow_account_balance_update', 'true', true);
select is(pg_temp.probe(format('update public.account_holder set role = ''co_owner'' where placeholder_id = %L', pg_temp.placeholder('窄分支'))), '42501:', '账户余额 GUC 对 account_holder 无效');
select set_config('app.allow_account_balance_update', '', true);
select pg_temp.act(13);
set local role authenticated;
select is(pg_temp.err(pg_temp.migrate_sql(13)), '42501:', '客户端直接 DML 路径（非 RPC）被拒');
select is(pg_temp.err(format('update public.ledger_invite set accepted_by = auth.uid() where id = %L', (select invite_id from issue802_token where label = 'narrow'))), '42501:', '客户端不能直接改写邀请');
select is(pg_temp.err(format('update public.ledger_placeholder_member set claimed_by = null where id = %L', pg_temp.placeholder('窄分支'))), '42501:', '客户端不能直接改写占位');
reset role;
select is((select count(*) from public.account_holder where placeholder_id = pg_temp.placeholder('窄分支')), 1::bigint, '所有被拒尝试均未改变持有行');

select diag('预览只返回受控字段');
select pg_temp.act(1);
set local role authenticated;
select pg_temp.invite('preview', pg_temp.lid(1), 'viewer', pg_temp.placeholder('预览占位'));
select public.rename_ledger_placeholder_member(pg_temp.lid(1), pg_temp.placeholder('预览占位'), '预览改名');
reset role;
select pg_temp.act(null);
set local role anon;
select is((select invite_status || ':' || is_placeholder_bound || ':' || placeholder_display_name from public.get_ledger_invite_preview(pg_temp.token('preview'))),
          'valid:true:预览改名', 'anon 可以预览有效绑定邀请，并读取改名后的实时名字');
select is((select invite_status || ':' || is_placeholder_bound || ':' || coalesce(placeholder_display_name, 'null') from public.get_ledger_invite_preview(pg_temp.token('legacy-anon'))),
          'accepted:false:null', '历史匿名邀请返回 false / null');
select is((select invite_status || ':' || is_placeholder_bound || ':' || coalesce(placeholder_display_name, 'null') from public.get_ledger_invite_preview(pg_temp.token('full'))),
          'accepted:false:null', '已接受的绑定邀请不返回占位名字');
select is((select invite_status || ':' || is_placeholder_bound || ':' || coalesce(placeholder_display_name, 'null') from public.get_ledger_invite_preview('invalid-token')),
          'invalid:false:null', '无效 token 返回 false / null');
reset role;
select pg_temp.act(1);
set local role authenticated;
select public.revoke_ledger_invite(pg_temp.lid(1), (select invite_id from issue802_token where label = 'bound-again'));
reset role;
select pg_temp.act(null);
set local role anon;
select is((select invite_status || ':' || is_placeholder_bound || ':' || coalesce(placeholder_display_name, 'null') from public.get_ledger_invite_preview(pg_temp.token('bound-again'))),
          'revoked:false:null', '已撤销的绑定邀请不返回占位名字');
reset role;
select pg_temp.act(null);
update public.ledger_placeholder_member set claimed_by = pg_temp.uid(9), claimed_at = now() where display_name = '预览改名';
set local role anon;
select is((select is_placeholder_bound::text || ':' || coalesce(placeholder_display_name, 'null') from public.get_ledger_invite_preview(pg_temp.token('preview'))),
          'false:null', '占位已认领时邀请不再返回占位名字');
reset role;

select diag('真实双会话并发：绑定邀请唯一、接受与撤销竞争、接受取得账本锁');
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
-- 多个会话排队等待同一行锁时，后到者可能被前一个等待者阻塞，因此只确认其处于锁等待。
create function pg_temp.wait_blocked(p_pid integer)
returns boolean language plpgsql as $$
begin
    for attempt in 1..200 loop
        if cardinality(pg_blocking_pids(p_pid)) > 0 then return true; end if;
        perform pg_sleep(0.025);
    end loop;
    return false;
end;
$$;
-- 并发数据必须真实提交，因此使用种子用户 31（owner）、34 与 37（接受者），结束后清理并恢复接受者的当前账本。
create function pg_temp.invite_concurrency()
returns setof text language plpgsql as $fn$
declare
    v_connection text := format('host=%s port=%s dbname=%s user=postgres password=postgres', host(inet_server_addr()), inet_server_port(), current_database());
    v_owner uuid := '00000000-0000-4000-8000-000000000031';
    v_acceptor uuid := '00000000-0000-4000-8000-000000000034';
    v_claimer uuid := '00000000-0000-4000-8000-000000000037';
    v_ledger uuid := gen_random_uuid();
    v_p1 uuid := gen_random_uuid();
    v_p2 uuid := gen_random_uuid();
    v_p3 uuid := gen_random_uuid();
    v_p4 uuid := gen_random_uuid();
    v_p5 uuid := gen_random_uuid();
    v_p6 uuid := gen_random_uuid();
    v_account uuid;
    v_invite uuid;
    v_token text;
    v_a_pid integer;
    v_b_pid integer;
    v_c_pid integer;
    v_result text;
    v_count bigint;
    v_cleanup text;
    v_setup text;
begin
    perform dblink_connect('invite_a', v_connection);
    perform dblink_connect('invite_b', v_connection);
    perform dblink_connect('invite_c', v_connection);
    select pid into v_a_pid from dblink('invite_a', 'select pg_backend_pid()') as t(pid integer);
    select pid into v_b_pid from dblink('invite_b', 'select pg_backend_pid()') as t(pid integer);
    select pid into v_c_pid from dblink('invite_c', 'select pg_backend_pid()') as t(pid integer);
    v_cleanup := format($q$
        update public.app_user set current_ledger_id = %2$L where id = %3$L;
        update public.app_user set current_ledger_id = %4$L where id = %5$L;
        delete from public.account_holder where ledger_id = %1$L;
        delete from public.transaction_item where ledger_id = %1$L;
        delete from public.transaction_record where ledger_id = %1$L;
        delete from public.account where ledger_id = %1$L;
        delete from public.ledger_invite where ledger_id = %1$L;
        delete from public.ledger_placeholder_member where ledger_id = %1$L;
        delete from public.ledger_member_display_setting where ledger_id = %1$L;
        delete from public.ledger_member where ledger_id = %1$L;
        delete from public.ledger where id = %1$L;
    $q$, v_ledger, (select current_ledger_id from public.app_user where id = v_acceptor), v_acceptor,
        (select current_ledger_id from public.app_user where id = v_claimer), v_claimer);
    perform dblink_exec('invite_a', format($q$
        insert into public.ledger(id, name, base_currency, owner_user_id) values (%1$L, 'Issue802 并发测试', 'JPY', %2$L);
        insert into public.ledger_member(ledger_id, user_id, role, status, joined_at) values (%1$L, %2$L, 'owner', 'active', now());
        insert into public.ledger_placeholder_member(id, ledger_id, display_name, created_by)
        values (%3$L, %1$L, '并发一', %2$L), (%4$L, %1$L, '并发二', %2$L), (%5$L, %1$L, '并发三', %2$L), (%6$L, %1$L, '并发四', %2$L),
               (%7$L, %1$L, '并发五', %2$L), (%8$L, %1$L, '并发六', %2$L);
    $q$, v_ledger, v_owner, v_p1, v_p2, v_p3, v_p4, v_p5, v_p6));
    -- 在远端子事务收集 SQLSTATE/detail，失败写入自动回滚，避免解析英文错误。
    v_setup := format($q$
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
        set request.jwt.claim.sub = %L;
        set statement_timeout = '10s';
    $q$, v_owner);
    perform dblink_exec('invite_b', v_setup);
    perform dblink_exec('invite_c', v_setup);
    perform dblink_exec('invite_a', format('set request.jwt.claim.sub = %L', v_owner));
    -- 确认第二、第三会话确实以客户端角色和 owner 身份执行，而不是沿用维护连接的超级用户权限。
    select r into v_result from dblink('invite_b', 'select current_user || '':'' || auth.uid()') as t(r text);
    return next is(v_result, 'authenticated:' || v_owner, '第二会话以 authenticated 角色和 owner 身份调用 RPC');
    select r into v_result from dblink('invite_c', 'select current_user || '':'' || auth.uid()') as t(r text);
    return next is(v_result, 'authenticated:' || v_owner, '第三会话以 authenticated 角色和 owner 身份调用 RPC');

    -- 1. 两个会话同时为同一占位生成绑定邀请。
    perform dblink_exec('invite_a', 'begin; set local role authenticated');
    perform * from dblink('invite_a', format('select invite_id from public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p1)) as t(id uuid);
    perform dblink_send_query('invite_b', format('select pg_temp.run_sql(%L)', format('select public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p1)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), '并发生成绑定邀请等待同一账本锁');
    perform dblink_exec('invite_a', 'commit');
    select result into v_result from dblink_get_result('invite_b') as t(result text);
    perform * from dblink_get_result('invite_b') as t(result text);
    return next is(v_result, '23505:placeholder_invite_pending', '后完成的并发生成返回 placeholder_invite_pending');
    select count into v_count from dblink('invite_a', format('select count(*) from public.ledger_invite where placeholder_id = %L and accepted_at is null and revoked_at is null', v_p1)) as t(count bigint);
    return next is(v_count, 1::bigint, '并发后同一占位只有一条有效绑定邀请');

    -- 2. 不取账本锁的直接写入与 RPC 竞争时，由部分唯一索引兜底并精确转换。
    perform dblink_exec('invite_a', 'begin');
    perform dblink_exec('invite_a', format($q$
        insert into public.ledger_invite(ledger_id, inviter_user_id, created_by, role, token_hash, invite_token, placeholder_id)
        values (%L, %L, %L, 'member', md5(random()::text), md5(random()::text) || md5(random()::text), %L)
    $q$, v_ledger, v_owner, v_owner, v_p2));
    perform dblink_send_query('invite_b', format('select pg_temp.run_sql(%L)', format('select public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p2)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), 'RPC 插入等待未提交的同占位邀请');
    perform dblink_exec('invite_a', 'commit');
    select result into v_result from dblink_get_result('invite_b') as t(result text);
    perform * from dblink_get_result('invite_b') as t(result text);
    return next is(v_result, '23505:placeholder_invite_pending', '部分唯一索引冲突被转换为 placeholder_invite_pending');

    -- 3. 接受先持锁，撤销后到。
    select id, tok into v_invite, v_token from dblink('invite_a', format('select invite_id, token from public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p3)) as t(id uuid, tok text);
    perform dblink_exec('invite_a', format('begin; set local role authenticated; set local request.jwt.claim.sub = %L', v_acceptor));
    select r into v_result from dblink('invite_a', format('select result from public.accept_ledger_invite(%L)', v_token)) as t(r text);
    return next is(v_result, 'claimed', '接受方先取得锁并完成认领');
    perform dblink_send_query('invite_b', format('select pg_temp.run_sql(%L)', format('select public.revoke_ledger_invite(%L, %L)', v_ledger, v_invite)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), '撤销等待接受事务持有的锁');
    perform dblink_exec('invite_a', 'commit');
    select result into v_result from dblink_get_result('invite_b') as t(result text);
    perform * from dblink_get_result('invite_b') as t(result text);
    return next is(v_result, '23505:invite_already_used', '接受先完成时撤销返回 invite_already_used');
    select r into v_result from dblink('invite_a', format('select (claimed_by = %L)::text from public.ledger_placeholder_member where id = %L', v_acceptor, v_p3)) as t(r text);
    return next is(v_result, 'true', '先完成的接受生效');

    -- 4. 撤销先持锁，接受后到。
    select id, tok into v_invite, v_token from dblink('invite_a', format('select invite_id, token from public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p4)) as t(id uuid, tok text);
    perform dblink_exec('invite_a', 'begin; set local role authenticated');
    perform * from dblink('invite_a', format('select public.revoke_ledger_invite(%L, %L)::text', v_ledger, v_invite)) as t(r text);
    perform dblink_exec('invite_b', format('set request.jwt.claim.sub = %L', v_acceptor));
    perform dblink_send_query('invite_b', format('select pg_temp.run_sql(%L)', format('select public.accept_ledger_invite(%L)', v_token)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), '接受等待撤销事务持有的账本锁');
    perform dblink_exec('invite_a', 'commit');
    select result into v_result from dblink_get_result('invite_b') as t(result text);
    perform * from dblink_get_result('invite_b') as t(result text);
    return next is(v_result, 'P0002:invite_invalid', '撤销先完成时接受返回 invite_invalid');
    select r into v_result from dblink('invite_a', format('select coalesce(claimed_by::text, ''null'') from public.ledger_placeholder_member where id = %L', v_p4)) as t(r text);
    return next is(v_result, 'null', '撤销生效后占位保持未认领');

    -- 5. 绑定邀请的接受在任何状态判断之前先等待账本锁。
    -- 可用的种子用户有限，接受者 34 已在场景 3 成为成员，锁释放后按既有成员规则被拒。
    select tok into v_token from dblink('invite_a', format('select token from public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p6)) as t(tok text);
    perform dblink_exec('invite_a', 'begin');
    perform * from dblink('invite_a', format('select id from public.ledger where id = %L for update', v_ledger)) as t(id uuid);
    perform dblink_send_query('invite_b', format('select pg_temp.run_sql(%L)', format('select public.accept_ledger_invite(%L)', v_token)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), '绑定邀请接受等待账本锁');
    perform dblink_exec('invite_a', 'commit');
    select result into v_result from dblink_get_result('invite_b') as t(result text);
    perform * from dblink_get_result('invite_b') as t(result text);
    return next is(v_result, '23505:placeholder_claim_existing_member', '账本锁释放后接受继续执行并返回稳定结果');
    select r into v_result from dblink('invite_a', format('select coalesce(claimed_by::text, ''null'') from public.ledger_placeholder_member where id = %L', v_p6)) as t(r text);
    return next is(v_result, 'null', '被拒的接受没有认领占位');

    -- 6. 认领事务持锁期间，改名与账户编辑都等待账本锁，锁释放后读取已认领状态。
    select id into v_account from dblink('invite_a', format('select public.create_account_with_holders(%L, ''并发账户'', ''bank'', ''JPY'', 0, ''{}'', %L)', v_ledger, v_p5)) as t(id uuid);
    select tok into v_token from dblink('invite_a', format('select token from public.create_ledger_invite_v2(%L, ''member'', %L)', v_ledger, v_p5)) as t(tok text);
    perform dblink_exec('invite_a', format('begin; set local role authenticated; set local request.jwt.claim.sub = %L', v_claimer));
    select r into v_result from dblink('invite_a', format('select result from public.accept_ledger_invite(%L)', v_token)) as t(r text);
    return next is(v_result, 'claimed', '认领事务先取得账本与占位锁');
    perform dblink_exec('invite_b', format('set request.jwt.claim.sub = %L', v_owner));
    perform dblink_send_query('invite_b', format('select pg_temp.run_sql(%L)', format('select public.rename_ledger_placeholder_member(%L, %L, ''并发改名'')', v_ledger, v_p5)));
    return next ok(pg_temp.wait_lock(v_b_pid, v_a_pid), '改名等待认领事务持有的账本锁');
    -- 管理员按旧表单继续把持有人指定为该占位，同时修改账户名称。
    perform dblink_send_query('invite_c', format('select pg_temp.run_sql(%L)', format('select public.update_account_with_holders(%L, %L, ''并发改名账户'', ''bank'', ''JPY'', ''{}'', %L)', v_ledger, v_account, v_p5)));
    return next ok(pg_temp.wait_blocked(v_c_pid), '账户编辑同样等待账本锁');
    perform dblink_exec('invite_a', 'commit');
    select result into v_result from dblink_get_result('invite_b') as t(result text);
    perform * from dblink_get_result('invite_b') as t(result text);
    return next is(v_result, '23514:placeholder_already_claimed', '认领先提交后改名返回 placeholder_already_claimed');
    select result into v_result from dblink_get_result('invite_c') as t(result text);
    perform * from dblink_get_result('invite_c') as t(result text);
    return next is(v_result, '23514:placeholder_already_claimed', '认领先提交后账户编辑按 A 阶段契约返回 placeholder_already_claimed');
    select r into v_result from dblink('invite_a', format($q$
        select p.display_name || ':' || (p.claimed_by = %1$L) || ':' || a.name || ':' || (h.user_id = %1$L) || ':' || (h.placeholder_id is null)
            || ':' || (s.holder_user_id = %1$L) || ':' || (s.holder_placeholder_id is null)
        from public.ledger_placeholder_member p
        join public.account a on a.id = %3$L
        join public.account_holder h on h.account_id = a.id
        join public.account_name_scope s on s.account_id = a.id
        where p.id = %2$L
    $q$, v_claimer, v_p5, v_account)) as t(r text);
    return next is(v_result, '并发五:true:并发账户:true:true:true:true', '改名与账户编辑均未写入，持有行与名称投影保持认领结果');

    perform dblink_exec('invite_a', $q$reset role; set request.jwt.claim.sub = ''$q$);
    perform dblink_exec('invite_a', v_cleanup);
    perform dblink_disconnect('invite_a');
    perform dblink_disconnect('invite_b');
    perform dblink_disconnect('invite_c');
exception when others then
    perform dblink_cancel_query('invite_b');
    perform dblink_disconnect('invite_b');
    perform dblink_cancel_query('invite_c');
    perform dblink_disconnect('invite_c');
    perform dblink_exec('invite_a', 'rollback');
    perform dblink_exec('invite_a', $q$reset role; set request.jwt.claim.sub = ''$q$);
    perform dblink_exec('invite_a', v_cleanup);
    perform dblink_disconnect('invite_a');
    raise;
end;
$fn$;
select * from pg_temp.invite_concurrency();

select * from finish();
rollback;
