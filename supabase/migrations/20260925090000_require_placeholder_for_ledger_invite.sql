begin;

-- Issue #809：邀请成员 = 待邀请成员 + 专属链接，不再支持新建匿名邀请。

-- 项目尚未上线：直接撤销残留的匿名待接受邀请，不做兼容。
update public.ledger_invite
   set revoked_at = now(),
       revoked_by = inviter_user_id,
       invite_token = null
 where placeholder_id is null
   and accepted_at is null
   and revoked_at is null;

-- 有效（待接受）邀请必须绑定待邀请成员。
-- 已撤销的邀请可以为空（delete_ledger_placeholder_member 会解除其关联），已接受的历史匿名邀请也允许为空。
alter table public.ledger_invite
    add constraint ledger_invite_pending_requires_placeholder
    check (placeholder_id is not null or accepted_at is not null or revoked_at is not null);

-- 生成邀请：签名、返回列与授权不变；权限校验之后拒绝未绑定占位的请求，绑定分支原样保留。
create or replace function public.create_ledger_invite_v2(
    p_ledger_id uuid,
    p_role text default 'member',
    p_placeholder_id uuid default null
)
returns table (
    invite_id uuid,
    token text,
    ledger_name text,
    invite_role text,
    placeholder_id uuid
)
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
#variable_conflict use_column
declare
    v_user_id uuid := auth.uid();
    v_invite_id uuid;
    v_token text;
    v_role text := lower(btrim(coalesce(p_role, 'member')));
    v_placeholder public.ledger_placeholder_member;
    v_constraint text;
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

    -- 不再生成匿名邀请；放在权限校验之后，避免向无权限者暴露参数要求。
    if p_placeholder_id is null then
        raise exception 'placeholder_required'
            using errcode = '22023', detail = 'placeholder_required';
    end if;

    -- 不复用 lock_ledger_placeholder_management：它对归档账本返回 permission_denied，
    -- 这里保持归档账本返回 ledger_not_found。
    perform 1
    from public.ledger l
    where l.id = p_ledger_id
      and l.is_archived = false
    for update;

    if not found then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    -- 取得账本锁后复核权限，避免使用锁前的角色快照。
    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    select *
      into v_placeholder
      from public.ledger_placeholder_member p
     where p.id = p_placeholder_id
       and p.ledger_id = p_ledger_id
     for update;

    if v_placeholder.id is null then
        raise exception 'placeholder_not_found'
            using errcode = '22023', detail = 'placeholder_not_found';
    end if;

    if v_placeholder.claimed_by is not null then
        raise exception 'placeholder_already_claimed'
            using errcode = '23514', detail = 'placeholder_already_claimed';
    end if;

    if exists (
        select 1
        from public.ledger_invite li
        where li.placeholder_id = p_placeholder_id
          and li.accepted_at is null
          and li.revoked_at is null
    ) then
        raise exception 'placeholder_invite_pending'
            using errcode = '23505', detail = 'placeholder_invite_pending';
    end if;

    v_token := encode(extensions.gen_random_bytes(32), 'hex');

    begin
        insert into public.ledger_invite (
            ledger_id,
            inviter_user_id,
            token_hash,
            invite_token,
            role,
            placeholder_id,
            created_by
        ) values (
            p_ledger_id,
            v_user_id,
            encode(extensions.digest(v_token, 'sha256'), 'hex'),
            v_token,
            v_role,
            p_placeholder_id,
            v_user_id
        )
        returning id into v_invite_id;
    exception when unique_violation then
        -- 部分唯一索引是并发兜底；只转换该索引，其余唯一冲突原样抛出。
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'ledger_invite_one_pending_placeholder' then
            raise exception 'placeholder_invite_pending'
                using errcode = '23505', detail = 'placeholder_invite_pending';
        end if;
        raise;
    end;

    return query
    select v_invite_id, v_token, l.name, v_role, p_placeholder_id
    from public.ledger l
    where l.id = p_ledger_id;
end;
$$;

revoke all on function public.create_ledger_invite_v2(uuid, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_ledger_invite_v2(uuid, text, uuid) to authenticated;

commit;
