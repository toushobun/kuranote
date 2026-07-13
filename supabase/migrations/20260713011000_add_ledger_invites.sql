-- Issue #388：通过不可猜测邀请 token 加入账本。
-- 数据库只保存 token 摘要；原始 token 仅在生成 RPC 返回时暴露一次。
-- 邀请撤回将在后续 issue 中与“邀请中”成员项一并实现，本期仅保留撤回状态字段。

create table public.ledger_invite (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null references public.ledger(id) on delete cascade,
    inviter_user_id uuid not null references public.app_user(id),
    token_hash text not null unique,
    role text not null default 'member',
    accepted_at timestamptz,
    accepted_by uuid references public.app_user(id),
    revoked_at timestamptz,
    revoked_by uuid references public.app_user(id),
    created_at timestamptz not null default now(),
    created_by uuid not null references public.app_user(id),
    constraint ledger_invite_role_check check (role in ('member', 'viewer')),
    constraint ledger_invite_acceptance_check check (
        (accepted_at is null and accepted_by is null)
        or (accepted_at is not null and accepted_by is not null)
    ),
    constraint ledger_invite_revocation_check check (
        (revoked_at is null and revoked_by is null)
        or (revoked_at is not null and revoked_by is not null)
    )
);

create index ledger_invite_ledger_id_created_at_idx
    on public.ledger_invite (ledger_id, created_at desc);

alter table public.ledger_invite enable row level security;

-- 邀请表不允许客户端直接读写，统一经过下列 SECURITY DEFINER RPC。
revoke all on table public.ledger_invite from public;
revoke all on table public.ledger_invite from anon;
revoke all on table public.ledger_invite from authenticated;

create or replace function public.create_ledger_invite(
    p_ledger_id uuid,
    p_role text default 'member'
)
returns table (
    token text,
    ledger_name text,
    invite_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
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

    if v_role not in ('member', 'viewer') then
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
          and l.status = 'active'
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    v_token := encode(gen_random_bytes(32), 'hex');

    insert into public.ledger_invite (
        ledger_id,
        inviter_user_id,
        token_hash,
        role,
        created_by
    ) values (
        p_ledger_id,
        v_user_id,
        encode(digest(v_token, 'sha256'), 'hex'),
        v_role,
        v_user_id
    );

    return query
    select v_token, l.name, v_role
    from public.ledger l
    where l.id = p_ledger_id;
end;
$$;

-- 邀请接受由 SECURITY DEFINER RPC 临时标记，避免成员管理 trigger 将合法加入误判为越权。
-- 重新激活既存成员记录时保留原 created_by / created_at / invited_by。
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
       and new.role in ('member', 'viewer')
       and new.invited_by is not null then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and new.status = 'active'
       and new.role in ('member', 'viewer')
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

create or replace function public.get_ledger_invite_preview(p_token text)
returns table (
    invite_status text,
    ledger_name text,
    inviter_name text,
    invite_role text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    v_token_hash text;
begin
    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        return query select 'invalid'::text, null::text, null::text, null::text;
        return;
    end if;

    v_token_hash := encode(digest(btrim(p_token), 'sha256'), 'hex');

    return query
    select
        case
            when auth.uid() is not null and exists (
                select 1
                from public.ledger_member lm
                where lm.ledger_id = li.ledger_id
                  and lm.user_id = auth.uid()
                  and lm.status = 'active'
            ) then 'already_member'
            when li.revoked_at is not null then 'revoked'
            when li.accepted_at is not null then 'accepted'
            when l.status <> 'active' then 'invalid'
            else 'valid'
        end,
        l.name,
        coalesce(
            nullif(btrim(lds.display_name), ''),
            nullif(btrim(au.display_name), ''),
            '账本管理员'
        ),
        li.role
    from public.ledger_invite li
    join public.ledger l on l.id = li.ledger_id
    join public.app_user au on au.id = li.inviter_user_id
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = li.ledger_id
     and lds.user_id = li.inviter_user_id
    where li.token_hash = v_token_hash;

    if not found then
        return query select 'invalid'::text, null::text, null::text, null::text;
    end if;
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
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_token_hash text;
    v_invite public.ledger_invite;
    v_ledger public.ledger;
    v_existing_status text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    v_token_hash := encode(digest(btrim(p_token), 'sha256'), 'hex');

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
       and l.status = 'active';

    if v_ledger.id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select lm.status
      into v_existing_status
      from public.ledger_member lm
     where lm.ledger_id = v_invite.ledger_id
       and lm.user_id = v_user_id;

    if v_existing_status = 'active' then
        insert into public.user_setting (user_id, current_ledger_id, created_by, updated_by)
        values (v_user_id, v_invite.ledger_id, v_user_id, v_user_id)
        on conflict (user_id) do update set
            current_ledger_id = excluded.current_ledger_id,
            updated_by = v_user_id;

        return query select v_ledger.id, v_ledger.name, 'already_member'::text;
        return;
    end if;

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
    on conflict (ledger_id, user_id) do update set
        role = excluded.role,
        status = 'active',
        joined_at = now(),
        removed_at = null,
        removed_by = null,
        updated_by = v_user_id;

    perform set_config('app.allow_ledger_invite_accept', 'false', true);

    update public.ledger_invite
       set accepted_at = now(),
           accepted_by = v_user_id
     where id = v_invite.id;

    insert into public.user_setting (user_id, current_ledger_id, created_by, updated_by)
    values (v_user_id, v_invite.ledger_id, v_user_id, v_user_id)
    on conflict (user_id) do update set
        current_ledger_id = excluded.current_ledger_id,
        updated_by = v_user_id;

    return query select v_ledger.id, v_ledger.name, 'joined'::text;
end;
$$;

revoke all on function public.create_ledger_invite(uuid, text) from public;
revoke all on function public.create_ledger_invite(uuid, text) from anon;
grant execute on function public.create_ledger_invite(uuid, text) to authenticated;

revoke all on function public.get_ledger_invite_preview(text) from public;
grant execute on function public.get_ledger_invite_preview(text) to anon;
grant execute on function public.get_ledger_invite_preview(text) to authenticated;

revoke all on function public.accept_ledger_invite(text) from public;
revoke all on function public.accept_ledger_invite(text) from anon;
grant execute on function public.accept_ledger_invite(text) to authenticated;
