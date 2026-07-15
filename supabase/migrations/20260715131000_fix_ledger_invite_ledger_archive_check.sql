-- Issue #433：ledger 使用 is_archived 表示归档状态，不存在 status 列。
-- 重新定义邀请 RPC，避免生产环境因引用不存在的账本状态列而失败。

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
set search_path = pg_catalog, pg_temp
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
    );

    return query
    select v_token, l.name, v_role
    from public.ledger l
    where l.id = p_ledger_id;
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
set search_path = pg_catalog, pg_temp
stable
as $$
declare
    v_token_hash text;
begin
    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        return query select 'invalid'::text, null::text, null::text, null::text;
        return;
    end if;

    v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

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
            when l.is_archived then 'invalid'
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
set search_path = pg_catalog, pg_temp
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
