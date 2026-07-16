-- Issue #453：刷新账本设置页后仍可读取有效邀请链接，并在邀请失效后清除明文 token。
-- ledger_invite 表已禁止客户端直接访问；仅受控 SECURITY DEFINER RPC 可以返回仍有效的 token。
-- 这是可恢复性与数据库泄漏风险之间的权衡：保留 token_hash 用于公开预览和接受，
-- 明文 token 仅在邀请待接受期间保存，并在接受或撤销时立即清除。

alter table public.ledger_invite
    add column invite_token text;

-- 测试环境中已经存在的待接受邀请只有摘要，无法恢复明文 token。
-- 这些旧邀请直接撤销，避免保留“有效但无法读取”的异常状态。
update public.ledger_invite
   set revoked_at = now(),
       revoked_by = created_by
 where accepted_at is null
   and revoked_at is null
   and invite_token is null;

alter table public.ledger_invite
    add constraint ledger_invite_token_length_check
    check (invite_token is null or length(invite_token) = 64);

alter table public.ledger_invite
    add constraint ledger_invite_token_lifecycle_check
    check (
        (accepted_at is null and revoked_at is null and invite_token is not null)
        or ((accepted_at is not null or revoked_at is not null) and invite_token is null)
    );

create or replace function public.create_ledger_invite_v2(
    p_ledger_id uuid,
    p_role text default 'member'
)
returns table (
    invite_id uuid,
    token text,
    ledger_name text,
    invite_role text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_invite_id uuid;
    v_token text;
    v_role text := lower(btrim(coalesce(p_role, 'member')));
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null then
        raise exception 'ledger_required'
            using errcode = '22023', detail = 'ledger_required';
    end if;

    if v_role not in ('admin', 'member', 'viewer') then
        raise exception 'invite_role_invalid'
            using errcode = '22023', detail = 'invite_role_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if not exists (
        select 1
        from public.ledger l
        where l.id = p_ledger_id
          and l.is_archived = false
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    v_token := encode(extensions.gen_random_bytes(32), 'hex');

    insert into public.ledger_invite (
        ledger_id,
        inviter_user_id,
        token_hash,
        invite_token,
        role,
        created_by
    ) values (
        p_ledger_id,
        v_user_id,
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
        v_token,
        v_role,
        v_user_id
    )
    returning id into v_invite_id;

    return query
    select v_invite_id, v_token, l.name, v_role
    from public.ledger l
    where l.id = p_ledger_id;
end;
$$;

-- 未上线的重新生成流程已废弃；创建新邀请和撤销旧邀请足以覆盖产品需求。
drop function if exists public.replace_ledger_invite(uuid, uuid);

-- 返回待接受邀请元数据；只有 Owner / Admin 可以得到明文 token。
drop function public.list_pending_ledger_invites(uuid);

create function public.list_pending_ledger_invites(p_ledger_id uuid)
returns table (
    invite_id uuid,
    invite_role text,
    created_at timestamptz,
    invite_token text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
stable
as $$
declare
    v_user_id uuid := auth.uid();
    v_can_manage boolean;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null then
        raise exception 'ledger_required'
            using errcode = '22023', detail = 'ledger_required';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    v_can_manage := public.current_user_can_manage_ledger(p_ledger_id);

    return query
    select
        li.id,
        li.role,
        li.created_at,
        case when v_can_manage then li.invite_token else null::text end
    from public.ledger_invite li
    where li.ledger_id = p_ledger_id
      and li.accepted_at is null
      and li.revoked_at is null
    order by li.created_at desc, li.id;
end;
$$;

create or replace function public.revoke_ledger_invite(
    p_ledger_id uuid,
    p_invite_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_invite public.ledger_invite;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null or p_invite_id is null then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    select *
      into v_invite
      from public.ledger_invite li
     where li.id = p_invite_id
       and li.ledger_id = p_ledger_id
     for update;

    if v_invite.id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    if v_invite.accepted_at is not null then
        raise exception 'invite_already_used'
            using errcode = '23505', detail = 'invite_already_used';
    end if;

    if v_invite.revoked_at is not null then
        raise exception 'invite_already_revoked'
            using errcode = '23505', detail = 'invite_already_revoked';
    end if;

    update public.ledger_invite
       set revoked_at = now(),
           revoked_by = v_user_id,
           invite_token = null
     where id = v_invite.id;
end;
$$;

create or replace function public.accept_ledger_invite(p_token text)
returns table (
    ledger_id uuid,
    ledger_name text,
    result text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_token_hash text;
    v_invite public.ledger_invite;
    v_ledger public.ledger;
    v_existing_status text;
    v_result text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

    select *
      into v_invite
      from public.ledger_invite li
     where li.token_hash = v_token_hash
     for update;

    if v_invite.id is null or v_invite.revoked_at is not null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select *
      into v_ledger
      from public.ledger l
     where l.id = v_invite.ledger_id
       and l.is_archived = false;

    if v_ledger.id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select lm.status
      into v_existing_status
      from public.ledger_member lm
     where lm.ledger_id = v_invite.ledger_id
       and lm.user_id = v_user_id
       and lm.status <> 'removed';

    if v_existing_status = 'active' then
        v_result := 'already_member';
    else
        if v_invite.accepted_at is not null then
            raise exception 'invite_already_used'
                using errcode = '23505', detail = 'invite_already_used';
        end if;

        perform set_config('app.allow_ledger_invite_accept', 'true', true);

        insert into public.ledger_member (
            ledger_id,
            user_id,
            role,
            status,
            joined_at,
            invited_by,
            created_by,
            updated_by
        ) values (
            v_invite.ledger_id,
            v_user_id,
            v_invite.role,
            'active',
            now(),
            v_invite.inviter_user_id,
            v_invite.inviter_user_id,
            v_user_id
        )
        on conflict (ledger_id, user_id) where status <> 'removed' do update set
            role = excluded.role,
            status = 'active',
            joined_at = now(),
            removed_at = null,
            removed_by = null,
            updated_by = v_user_id;

        perform set_config('app.allow_ledger_invite_accept', 'false', true);

        update public.ledger_invite
           set accepted_at = now(),
               accepted_by = v_user_id,
               invite_token = null
         where id = v_invite.id;

        v_result := 'joined';
    end if;

    update public.app_user
       set current_ledger_id = v_invite.ledger_id,
           updated_by = v_user_id
     where id = v_user_id
       and status = 'active';

    if not found then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    return query select v_ledger.id, v_ledger.name, v_result;
end;
$$;

revoke all on function public.create_ledger_invite_v2(uuid, text) from public;
revoke all on function public.create_ledger_invite_v2(uuid, text) from anon;
grant execute on function public.create_ledger_invite_v2(uuid, text) to authenticated;

revoke all on function public.list_pending_ledger_invites(uuid) from public;
revoke all on function public.list_pending_ledger_invites(uuid) from anon;
grant execute on function public.list_pending_ledger_invites(uuid) to authenticated;

revoke all on function public.revoke_ledger_invite(uuid, uuid) from public;
revoke all on function public.revoke_ledger_invite(uuid, uuid) from anon;
grant execute on function public.revoke_ledger_invite(uuid, uuid) to authenticated;

revoke all on function public.accept_ledger_invite(text) from public;
revoke all on function public.accept_ledger_invite(text) from anon;
grant execute on function public.accept_ledger_invite(text) to authenticated;
