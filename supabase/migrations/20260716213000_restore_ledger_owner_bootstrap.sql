-- Issue #459：恢复首次创建账本时写入唯一 owner 成员的受控豁免。
-- 同时收回旧创建 RPC 与 ledger 表直写权限，确保账本统一经过完整初始化 RPC。
drop policy if exists ledger_insert_self_owner on public.ledger;
revoke insert on table public.ledger from authenticated;

create or replace function public.create_ledger_with_owner(
    p_name text,
    p_base_currency text default 'JPY'
)
returns public.ledger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_user_id
          and au.status = 'active'
    ) then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    insert into public.ledger (
        name,
        base_currency,
        owner_user_id,
        created_by,
        updated_by
    )
    values (
        p_name,
        p_base_currency,
        v_user_id,
        v_user_id,
        v_user_id
    )
    returning * into v_ledger;

    perform set_config('app.allow_ledger_owner_bootstrap', 'true', true);

    insert into public.ledger_member (
        ledger_id,
        user_id,
        role,
        status,
        invited_by,
        invited_at,
        joined_at,
        created_by,
        updated_by
    )
    values (
        v_ledger.id,
        v_user_id,
        'owner',
        'active',
        v_user_id,
        now(),
        now(),
        v_user_id,
        v_user_id
    );

    perform set_config('app.allow_ledger_owner_bootstrap', 'false', true);

    perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);

    update public.app_user
    set
        current_ledger_id = v_ledger.id,
        updated_by = v_user_id
    where id = v_user_id;

    return v_ledger;
end;
$$;

revoke all on function public.create_ledger_with_owner(text, text) from public;
revoke all on function public.create_ledger_with_owner(text, text) from anon;
revoke all on function public.create_ledger_with_owner(text, text) from authenticated;

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
       and current_setting('app.allow_ledger_owner_bootstrap', true) = 'true'
       and new.user_id = auth.uid()
       and new.role = 'owner'
       and new.status = 'active'
       and new.invited_by = auth.uid()
       and new.invited_at is not null
       and new.joined_at is not null
       and new.removed_by is null
       and new.removed_at is null
       and new.created_by = auth.uid()
       and new.updated_by = auth.uid()
       and exists (
           select 1
           from public.ledger l
           where l.id = new.ledger_id
             and l.owner_user_id = auth.uid()
             and not exists (
                 select 1
                 from public.ledger_member existing_member
                 where existing_member.ledger_id = l.id
             )
       ) then
        return new;
    end if;

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
