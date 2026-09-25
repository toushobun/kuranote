begin;
set local search_path = public, extensions;
select no_plan();

-- Issue #808：编辑账户提交「无持有人」时保留非活跃成员持有行，提交新持有人时照常替换。
-- Issue #816：绑定邀请预览中，未移除成员行（active / invited）显示 already_member。
-- 用户：01 owner、02 active 成员、03 稍后移除的成员、04 稍后停用的用户、05 invited 成员、
-- 06 active 成员（替换用）、07 非成员。
create function pg_temp.uid(p_n integer) returns uuid language sql immutable as $$
    select ('81600000-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid;
$$;
create function pg_temp.lid() returns uuid language sql immutable as $$
    select '81600000-0000-4000-8000-000000000101'::uuid;
$$;
create function pg_temp.act(p_n integer) returns void language sql as $$
    select set_config('request.jwt.claim.sub', case when p_n is null then '' else pg_temp.uid(p_n)::text end, true);
$$;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select pg_temp.uid(n), 'authenticated', 'authenticated', format('issue816-%s@example.test', n),
       jsonb_build_object('display_name', format('Issue816 用户%s', n))
from generate_series(1, 7) n;

insert into public.ledger (id, name, base_currency, owner_user_id)
values (pg_temp.lid(), 'Issue816 账本', 'JPY', pg_temp.uid(1));
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at)
values (pg_temp.lid(), pg_temp.uid(1), 'owner', 'active', now()),
       (pg_temp.lid(), pg_temp.uid(2), 'member', 'active', now()),
       (pg_temp.lid(), pg_temp.uid(3), 'member', 'active', now()),
       (pg_temp.lid(), pg_temp.uid(4), 'member', 'active', now()),
       (pg_temp.lid(), pg_temp.uid(6), 'member', 'active', now());
insert into public.ledger_member (ledger_id, user_id, role, status)
values (pg_temp.lid(), pg_temp.uid(5), 'member', 'invited');

insert into public.ledger_placeholder_member (ledger_id, display_name, created_by)
select pg_temp.lid(), n, pg_temp.uid(1)
from unnest(array['Issue816 占位A', 'Issue816 占位B', 'Issue816 预览占位']) n;
create function pg_temp.placeholder(p_name text) returns uuid language sql stable as $$
    select id from public.ledger_placeholder_member where ledger_id = pg_temp.lid() and display_name = p_name;
$$;

-- 账户按名字定位；持有行与名称投影都以「u:用户序号 / p:占位名 / none」表示，便于比较。
-- 以 security definer 读取，authenticated 会话中也能观察名称投影。
create function pg_temp.account(p_name text) returns uuid language sql stable security definer as $$
    select id from public.account where ledger_id = pg_temp.lid() and name = p_name;
$$;
create function pg_temp.label(p_user uuid, p_placeholder uuid) returns text language sql stable security definer as $$
    select case
        when p_user is not null then 'u:' || (right(p_user::text, 12)::integer)::text
        when p_placeholder is not null then 'p:' || (select display_name from public.ledger_placeholder_member where id = p_placeholder)
        else 'none'
    end;
$$;
create function pg_temp.holders(p_name text) returns text language sql stable security definer as $$
    select coalesce(string_agg(pg_temp.label(h.user_id, h.placeholder_id), ',' order by h.id), 'none')
    from public.account_holder h where h.account_id = pg_temp.account(p_name);
$$;
create function pg_temp.scope(p_name text) returns text language sql stable security definer as $$
    select pg_temp.label(s.holder_user_id, s.holder_placeholder_id)
    from public.account_name_scope s where s.account_id = pg_temp.account(p_name);
$$;

-- 准备：持有人均为 active 时建立持有行，之后再把 03 移出账本、04 停用。
create function pg_temp.seed(p_name text, p_user integer, p_placeholder text default null) returns void language plpgsql as $$
declare v_account uuid;
begin
    insert into public.account (ledger_id, name, type, currency)
    values (pg_temp.lid(), p_name, 'bank', 'JPY') returning id into v_account;
    if p_user is not null or p_placeholder is not null then
        insert into public.account_holder (ledger_id, account_id, user_id, placeholder_id, role)
        values (pg_temp.lid(), v_account,
                case when p_user is null then null else pg_temp.uid(p_user) end,
                case when p_placeholder is null then null else pg_temp.placeholder(p_placeholder) end,
                'owner');
    end if;
end;
$$;
select pg_temp.act(null);
select pg_temp.seed('移除成员持有', 3);
select pg_temp.seed('停用用户持有', 4);
select pg_temp.seed('移除成员改选成员', 3);
select pg_temp.seed('停用用户改选占位', 4);
select pg_temp.seed('active成员持有', 2);
select pg_temp.seed('占位持有', null, 'Issue816 占位A');
select pg_temp.seed('余额调整保留', 3);
select pg_temp.seed('余额调整替换', 4);
select pg_temp.seed('余额调整占位', 3);
update public.ledger_member set status = 'removed', removed_at = now()
where ledger_id = pg_temp.lid() and user_id = pg_temp.uid(3);
update public.app_user set status = 'disabled' where id = pg_temp.uid(4);

create function pg_temp.edit(p_name text, p_users uuid[], p_placeholder uuid default null) returns uuid language sql as $$
    select public.update_account_with_holders(pg_temp.lid(), pg_temp.account(p_name), p_name, 'bank', 'JPY', p_users, p_placeholder);
$$;

select diag('签名与授权不变');
select is(pg_get_function_identity_arguments('public.update_account_with_holders'::regproc),
          'p_ledger_id uuid, p_account_id uuid, p_name text, p_type text, p_currency text, p_holder_user_ids uuid[], p_placeholder_id uuid',
          '持有人 RPC 签名不变');
select ok(has_function_privilege('authenticated', 'public.update_account_with_holders(uuid,uuid,text,text,text,uuid[],uuid)', 'execute'), 'authenticated 保留执行权限');
select ok(not has_function_privilege('anon', 'public.update_account_with_holders(uuid,uuid,text,text,text,uuid[],uuid)', 'execute'), 'anon 仍不能执行');
select is(pg_get_function_identity_arguments('public.get_ledger_invite_preview'::regproc), 'p_token text', '预览 RPC 签名不变');
select is(pg_get_function_result('public.get_ledger_invite_preview'::regproc),
          'TABLE(invite_status text, ledger_name text, inviter_name text, invite_role text, is_placeholder_bound boolean, placeholder_display_name text)',
          '预览 RPC 返回列不变');
select ok(has_function_privilege('anon', 'public.get_ledger_invite_preview(text)', 'execute'), 'anon 保留预览执行权限');
select ok(has_function_privilege('authenticated', 'public.get_ledger_invite_preview(text)', 'execute'), 'authenticated 保留预览执行权限');

select diag('#808：提交无持有人时保留非活跃成员持有行');
select pg_temp.act(1);
set local role authenticated;
select lives_ok($$select pg_temp.edit('移除成员持有', '{}')$$, 'removed 成员持有的账户可以保存');
select is(pg_temp.holders('移除成员持有'), 'u:3', 'removed 成员持有 + 提交无持有人 → 保留');
select is(pg_temp.scope('移除成员持有'), 'u:3', 'removed 成员持有行保留时名称投影一致');
select lives_ok($$select pg_temp.edit('停用用户持有', '{}')$$, '停用用户持有的账户可以保存');
select is(pg_temp.holders('停用用户持有'), 'u:4', '停用用户持有 + 提交无持有人 → 保留');
select is(pg_temp.scope('停用用户持有'), 'u:4', '停用用户持有行保留时名称投影一致');

select diag('#808：提交新持有人时替换非活跃成员持有行');
select lives_ok($$select pg_temp.edit('移除成员改选成员', array[pg_temp.uid(6)])$$, '非活跃持有 + 提交 active 成员不报唯一约束错误');
select is(pg_temp.holders('移除成员改选成员'), 'u:6', '非活跃持有 + 提交 active 成员 → 替换为单一持有人');
select is(pg_temp.scope('移除成员改选成员'), 'u:6', '替换为成员后名称投影一致');
select lives_ok($$select pg_temp.edit('停用用户改选占位', '{}', pg_temp.placeholder('Issue816 占位B'))$$, '非活跃持有 + 提交占位可以保存');
select is(pg_temp.holders('停用用户改选占位'), 'p:Issue816 占位B', '非活跃持有 + 提交占位 → 替换为占位');
select is(pg_temp.scope('停用用户改选占位'), 'p:Issue816 占位B', '替换为占位后名称投影一致');

select diag('#808：active 成员与占位持有行照常删除');
select lives_ok($$select pg_temp.edit('active成员持有', '{}')$$, 'active 成员持有 + 提交无持有人可以保存');
select is(pg_temp.holders('active成员持有'), 'none', 'active 成员持有 + 提交无持有人 → 删除');
select is(pg_temp.scope('active成员持有'), 'none', 'active 成员持有行删除后名称投影一致');
select lives_ok($$select pg_temp.edit('占位持有', '{}')$$, '占位持有 + 提交无持有人可以保存');
select is(pg_temp.holders('占位持有'), 'none', '占位持有 + 提交无持有人 → 删除');
select is(pg_temp.scope('占位持有'), 'none', '占位持有行删除后名称投影一致');

select diag('#808：经 update_account_with_balance_adjustment 调用时行为一致');
select lives_ok($$select public.update_account_with_balance_adjustment(pg_temp.lid(), pg_temp.account('余额调整保留'), '余额调整保留', 'bank', 'JPY', '{}', 300, '盘点')$$,
                '余额调整 RPC 提交无持有人可以保存');
select is(pg_temp.holders('余额调整保留'), 'u:3', '余额调整 RPC：非活跃持有 + 提交无持有人 → 保留');
select is(pg_temp.scope('余额调整保留'), 'u:3', '余额调整 RPC：保留后名称投影一致');
select is((select current_balance from public.account where id = pg_temp.account('余额调整保留')), 300::numeric, '余额调整与持有人保存在同一事务内完成');
select lives_ok($$select public.update_account_with_balance_adjustment(pg_temp.lid(), pg_temp.account('余额调整替换'), '余额调整替换', 'bank', 'JPY', array[pg_temp.uid(2)])$$,
                '余额调整 RPC 提交 active 成员可以保存');
select is(pg_temp.holders('余额调整替换'), 'u:2', '余额调整 RPC：非活跃持有 + 提交 active 成员 → 替换');
select is(pg_temp.scope('余额调整替换'), 'u:2', '余额调整 RPC：替换后名称投影一致');
select lives_ok($$select public.update_account_with_balance_adjustment(pg_temp.lid(), pg_temp.account('余额调整占位'), '余额调整占位', 'bank', 'JPY', '{}', null, null, pg_temp.placeholder('Issue816 占位A'))$$,
                '余额调整 RPC 提交占位可以保存');
select is(pg_temp.holders('余额调整占位'), 'p:Issue816 占位A', '余额调整 RPC：非活跃持有 + 提交占位 → 替换');
select is(pg_temp.scope('余额调整占位'), 'p:Issue816 占位A', '余额调整 RPC：替换为占位后名称投影一致');
reset role;

select diag('#816：绑定邀请预览按未移除成员行判断 already_member');
select pg_temp.act(1);
set local role authenticated;
create temporary table issue816_token (label text primary key, token text);
insert into issue816_token (label, token)
select 'bound', i.token
from public.create_ledger_invite_v2(p_ledger_id => pg_temp.lid(), p_role => 'member', p_placeholder_id => pg_temp.placeholder('Issue816 预览占位')) i;
reset role;
-- 历史匿名邀请只能由数据库维护角色构造（新数据必须绑定占位）。
insert into public.ledger_invite (ledger_id, inviter_user_id, created_by, role, token_hash, placeholder_id, accepted_at, accepted_by)
values (pg_temp.lid(), pg_temp.uid(1), pg_temp.uid(1), 'member', encode(extensions.digest('issue816-legacy-anon', 'sha256'), 'hex'), null, now(), pg_temp.uid(7));
insert into issue816_token (label, token) values ('legacy-anon', 'issue816-legacy-anon');
grant select on issue816_token to authenticated;

create function pg_temp.preview(p_label text, p_user integer) returns text language plpgsql as $$
declare v_result text;
begin
    perform pg_temp.act(p_user);
    set local role authenticated;
    select invite_status || ':' || is_placeholder_bound || ':' || coalesce(placeholder_display_name, 'null')
      into v_result
      from public.get_ledger_invite_preview((select token from issue816_token where label = p_label));
    reset role;
    return v_result;
end;
$$;

select is(pg_temp.preview('bound', 5), 'already_member:true:Issue816 预览占位', '绑定邀请 + invited 成员 → already_member');
select is(pg_temp.preview('bound', 2), 'already_member:true:Issue816 预览占位', '绑定邀请 + active 成员 → already_member');
select is(pg_temp.preview('bound', 3), 'valid:true:Issue816 预览占位', '绑定邀请 + removed 成员 → valid');
select is(pg_temp.preview('bound', 7), 'valid:true:Issue816 预览占位', '绑定邀请 + 非成员 → valid');
select is(pg_temp.preview('legacy-anon', 5), 'accepted:false:null', '匿名历史邀请 + invited 成员保持原结果（不视为已是成员）');
select is(pg_temp.preview('legacy-anon', 2), 'already_member:false:null', '匿名历史邀请 + active 成员保持 already_member');

-- 预览与接受一致：invited 成员接受绑定邀请被拒。
select pg_temp.act(5);
set local role authenticated;
select throws_ok($$select * from public.accept_ledger_invite((select token from issue816_token where label = 'bound'))$$,
                 '23505', 'placeholder_claim_existing_member', '预览为 already_member 的 invited 成员接受时同样被拒');
reset role;

select * from finish();
rollback;
