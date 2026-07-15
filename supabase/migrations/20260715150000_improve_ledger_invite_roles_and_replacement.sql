-- Issue #442：允许邀请管理员，并为无法恢复明文 token 的待接受邀请提供安全替换。
-- 数据库仍只保存 token 摘要；替换在同一事务中使旧邀请失效并生成新邀请。

-- v2 已完全替代旧创建入口，移除不再使用且仅支持旧角色集合的 RPC。
drop function if exists public.create_ledger_invite(uuid, text);

alter table public.ledger_invite
    drop constraint ledger_invite_role_check;

alter table public.ledger_invite
    add constraint ledger_invite_role_check
    check (role in ('admin', 'member', 'viewer'));

create or replace function public.enforce_ledger_member_management_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    v_ledger_id := case when tg_op = 'INSERT' then new.ledger_id else old.ledger_id end;

    if tg_op = 'INSERT'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and new.user_id = auth.uid()
       and new.status = 'active'
       and new.role in ('admin', 'member', 'viewer')
       and new.invited_by is not null then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and new.status = 'active'
       and new.role in ('admin', 'member', 'viewer')
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null
       and new.created_by = old.created_by
       and new.created_at = old.created_at
       and new.invited_by is not distinct from old.invited_by
       and new.updated_by = auth.uid() then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and old.status = 'invited'
       and new.status = 'active'
       and new.role = old.role
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null then
        return new;
    end if;

    if not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create function public.create_ledger_invite_v2(
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
        role,
        created_by
    ) values (
        p_ledger_id,
        v_user_id,
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
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

create function public.replace_ledger_invite(
    p_ledger_id uuid,
    p_invite_id uuid
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
    v_invite public.ledger_invite;
    v_new_invite_id uuid;
    v_token text;
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

    if v_invite.id is null or v_invite.revoked_at is not null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    if v_invite.accepted_at is not null then
        raise exception 'invite_already_used'
            using errcode = '23505', detail = 'invite_already_used';
    end if;

    if v_invite.role not in ('admin', 'member', 'viewer') then
        raise exception 'invite_role_invalid'
            using errcode = '22023', detail = 'invite_role_invalid';
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

    update public.ledger_invite
       set revoked_at = now(),
           revoked_by = v_user_id
     where id = v_invite.id;

    insert into public.ledger_invite (
        ledger_id,
        inviter_user_id,
        token_hash,
        role,
        created_by
    ) values (
        p_ledger_id,
        v_user_id,
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
        v_invite.role,
        v_user_id
    )
    returning id into v_new_invite_id;

    return query
    select v_new_invite_id, v_token, l.name, v_invite.role
    from public.ledger l
    where l.id = p_ledger_id;
end;
$$;

revoke all on function public.create_ledger_invite_v2(uuid, text) from public;
revoke all on function public.create_ledger_invite_v2(uuid, text) from anon;
grant execute on function public.create_ledger_invite_v2(uuid, text) to authenticated;

revoke all on function public.replace_ledger_invite(uuid, uuid) from public;
revoke all on function public.replace_ledger_invite(uuid, uuid) from anon;
grant execute on function public.replace_ledger_invite(uuid, uuid) to authenticated;
