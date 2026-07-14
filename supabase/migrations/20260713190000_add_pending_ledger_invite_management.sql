-- Issue #431：在成员列表展示待接受邀请并支持撤销。
-- 邀请表仍禁止客户端直接访问，查询与撤销统一经过 SECURITY DEFINER RPC。

create or replace function public.list_pending_ledger_invites(p_ledger_id uuid)
returns table (
    invite_id uuid,
    invite_role text,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    v_user_id uuid := auth.uid();
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

    return query
    select li.id, li.role, li.created_at
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
set search_path = public
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
           revoked_by = v_user_id
     where id = v_invite.id;
end;
$$;

revoke all on function public.list_pending_ledger_invites(uuid) from public;
revoke all on function public.list_pending_ledger_invites(uuid) from anon;
grant execute on function public.list_pending_ledger_invites(uuid) to authenticated;

revoke all on function public.revoke_ledger_invite(uuid, uuid) from public;
revoke all on function public.revoke_ledger_invite(uuid, uuid) from anon;
grant execute on function public.revoke_ledger_invite(uuid, uuid) to authenticated;
