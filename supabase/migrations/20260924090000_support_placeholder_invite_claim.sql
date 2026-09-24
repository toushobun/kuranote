begin;

-- Issue #802：绑定占位的邀请与原子认领。
-- 统一锁顺序：账本 → 占位 → 邀请 → 成员 → 账户（按 ID）。

-- 生成邀请：匿名分支保持原校验与错误码；绑定分支锁定账本与占位后再校验。
drop function public.create_ledger_invite_v2(uuid, text);

create function public.create_ledger_invite_v2(
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

    if p_placeholder_id is null then
        if not exists (
            select 1
            from public.ledger l
            where l.id = p_ledger_id
              and l.is_archived = false
        ) then
            raise exception 'ledger_not_found'
                using errcode = 'P0002', detail = 'ledger_not_found';
        end if;
    else
        -- 不复用 lock_ledger_placeholder_management：它对归档账本返回 permission_denied，
        -- 这里与匿名分支保持一致，归档账本返回 ledger_not_found。
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

-- 撤销邀请：参数与错误码不变，补齐账本 → 占位 → 邀请的锁顺序。
-- 归档账本上的撤销保持允许，因此只锁账本行，不附加归档判断。
create or replace function public.revoke_ledger_invite(p_ledger_id uuid, p_invite_id uuid)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_invite public.ledger_invite;
    v_placeholder_id uuid;
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

    perform 1 from public.ledger l where l.id = p_ledger_id for update;

    -- 邀请的绑定关系创建后不可修改，锁前读取仅用于确定需要锁定的占位。
    select li.placeholder_id
      into v_placeholder_id
      from public.ledger_invite li
     where li.id = p_invite_id
       and li.ledger_id = p_ledger_id;

    if v_placeholder_id is not null then
        perform 1
        from public.ledger_placeholder_member p
        where p.id = v_placeholder_id
        for update;
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

    -- 保留历史 placeholder_id；revoked_at 使部分唯一索引立即释放该占位。
    update public.ledger_invite
       set revoked_at = now(),
           revoked_by = v_user_id,
           invite_token = null
     where id = v_invite.id;
end;
$$;

-- 接受邀请：匿名分支保持原语义；绑定分支在同一事务内完成成员创建、
-- 持有关系迁移与占位认领，任何失败都整体回滚。
drop function public.accept_ledger_invite(text);

create function public.accept_ledger_invite(p_token text)
returns table (
    ledger_id uuid,
    ledger_name text,
    result text,
    placeholder_id uuid
)
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
#variable_conflict use_column
declare
    v_user_id uuid := auth.uid();
    v_token_hash text;
    v_ledger_id uuid;
    v_placeholder_id uuid;
    v_invite public.ledger_invite;
    v_ledger public.ledger;
    v_placeholder public.ledger_placeholder_member;
    v_existing_status text;
    v_result text;
    v_constraint text;
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

    -- 第 1 步：无锁定位，只取账本与占位 ID，不作为状态判断依据。
    select li.ledger_id, li.placeholder_id
      into v_ledger_id, v_placeholder_id
      from public.ledger_invite li
     where li.token_hash = v_token_hash;

    if v_ledger_id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    -- 第 2 步：按账本 → 占位 → 邀请 → 成员 → 账户顺序加锁后复核。
    -- 匿名邀请同样取得账本锁，与同一用户的并发认领串行化。
    select *
      into v_ledger
      from public.ledger l
     where l.id = v_ledger_id
     for update;

    if v_placeholder_id is not null then
        select *
          into v_placeholder
          from public.ledger_placeholder_member p
         where p.id = v_placeholder_id
           and p.ledger_id = v_ledger_id
         for update;
    end if;

    select *
      into v_invite
      from public.ledger_invite li
     where li.token_hash = v_token_hash
     for update;

    if v_invite.id is null
       or v_invite.revoked_at is not null
       or v_invite.ledger_id is distinct from v_ledger_id
       or v_invite.placeholder_id is distinct from v_placeholder_id then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    if v_ledger.id is null or v_ledger.is_archived then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select lm.status
      into v_existing_status
      from public.ledger_member lm
     where lm.ledger_id = v_ledger_id
       and lm.user_id = v_user_id
       and lm.status <> 'removed'
     for update;

    if v_placeholder_id is null then
        -- 匿名邀请：与原实现一致。
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
                v_ledger_id,
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
    else
        -- 占位持有的账户及持有行在成员锁之后按账户 ID 顺序锁定。
        perform 1
        from public.account a
        where a.id in (
            select h.account_id
            from public.account_holder h
            where h.placeholder_id = v_placeholder_id
        )
        order by a.id
        for update;

        perform 1
        from public.account_holder h
        where h.placeholder_id = v_placeholder_id
        order by h.account_id
        for update;

        -- 第 3 步：同一接受者的幂等重试。被移除后不能借重放重新入会。
        if v_invite.accepted_at is not null then
            if v_invite.accepted_by = v_user_id
               and v_placeholder.claimed_by = v_user_id
               and v_existing_status = 'active'
               and not exists (
                   select 1
                   from public.account_holder h
                   where h.placeholder_id = v_placeholder_id
               ) then
                v_result := 'claimed';
            else
                raise exception 'invite_already_used'
                    using errcode = '23505', detail = 'invite_already_used';
            end if;
        else
            -- 第 4 步：已有非 removed 成员行一律拒绝，不激活、覆盖或合并。
            if v_existing_status is not null then
                raise exception 'placeholder_claim_existing_member'
                    using errcode = '23505', detail = 'placeholder_claim_existing_member';
            end if;

            if v_placeholder.id is null then
                raise exception 'invite_invalid'
                    using errcode = 'P0002', detail = 'invite_invalid';
            end if;

            if v_placeholder.claimed_by is not null then
                raise exception 'placeholder_already_claimed'
                    using errcode = '23514', detail = 'placeholder_already_claimed';
            end if;

            -- 持有行迁移要求接受者为 active 用户，提前给出稳定错误码。
            if not exists (
                select 1
                from public.app_user au
                where au.id = v_user_id
                  and au.status = 'active'
            ) then
                raise exception 'user_inactive'
                    using errcode = '42501', detail = 'user_inactive';
            end if;

            -- 第 5 步：经既有邀请接受通道插入成员；不使用 UPSERT 掩盖并发。
            perform set_config('app.allow_ledger_invite_accept', 'true', true);

            begin
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
                    v_ledger_id,
                    v_user_id,
                    v_invite.role,
                    'active',
                    now(),
                    v_invite.inviter_user_id,
                    v_invite.inviter_user_id,
                    v_user_id
                );
            exception when unique_violation then
                get stacked diagnostics v_constraint = constraint_name;
                if v_constraint = 'ledger_member_not_removed_user_unique' then
                    raise exception 'placeholder_claim_existing_member'
                        using errcode = '23505', detail = 'placeholder_claim_existing_member';
                end if;
                raise;
            end;

            perform set_config('app.allow_ledger_invite_accept', 'false', true);

            -- 先写入已接受事实，供管理权限触发器的认领窄分支核验。
            update public.ledger_invite
               set accepted_at = now(),
                   accepted_by = v_user_id,
                   invite_token = null
             where id = v_invite.id;

            -- 第 6 步：迁移该占位的全部持有行（含归档账户），只改身份与更新审计列。
            update public.account_holder h
               set user_id = v_user_id,
                   placeholder_id = null,
                   updated_by = v_user_id
             where h.placeholder_id = v_placeholder_id
               and h.ledger_id = v_ledger_id;

            -- 名称投影为延迟唯一约束，这里立即检查并精确转换，避免提交时的裸 23505。
            begin
                set constraints public.account_active_name_unique immediate;
            exception when unique_violation then
                get stacked diagnostics v_constraint = constraint_name;
                if v_constraint = 'account_active_name_unique' then
                    raise exception 'placeholder_claim_account_name_conflict'
                        using errcode = '23505', detail = 'placeholder_claim_account_name_conflict';
                end if;
                raise;
            end;
            set constraints public.account_active_name_unique deferred;

            -- 第 7 步：确认没有剩余持有引用后再标记认领。
            if exists (
                select 1
                from public.account_holder h
                where h.placeholder_id = v_placeholder_id
            ) then
                raise exception 'account_holder_changed'
                    using errcode = '40001', detail = 'account_holder_changed';
            end if;

            update public.ledger_placeholder_member
               set claimed_by = v_user_id,
                   claimed_at = now()
             where id = v_placeholder_id;

            v_result := 'claimed';
        end if;
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

    return query select v_ledger.id, v_ledger.name, v_result, v_placeholder_id;
end;
$$;

revoke all on function public.accept_ledger_invite(text) from public, anon, authenticated, service_role;
grant execute on function public.accept_ledger_invite(text) to authenticated;

-- 管理权限触发器：仅为接受绑定邀请的持有行迁移增加窄分支，其余判断不变。
create or replace function public.enforce_ledger_management_permission()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_row jsonb;
    v_ledger_id uuid;
    v_ledger_field text := coalesce(nullif(tg_argv[0], ''), 'ledger_id');
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_table_name = 'account'
       and tg_op = 'UPDATE'
       and current_setting('app.allow_account_balance_update', true) = 'true' then
        return new;
    end if;

    -- 认领迁移：旧占位引用改为当前用户，且除身份列与更新审计列外不变；
    -- 必须已有该用户接受的同账本绑定邀请、占位尚未标记认领、用户为 active 成员。
    -- 外层单独判断表名，避免其他表的 NEW/OLD 解析 account_holder 专有列。
    if tg_table_name = 'account_holder' and tg_op = 'UPDATE' then
        if old.placeholder_id is not null
           and new.placeholder_id is null
           and new.user_id = auth.uid()
           and new.updated_by = auth.uid()
           and (to_jsonb(new) - array['user_id', 'placeholder_id', 'updated_by', 'updated_at'])
               = (to_jsonb(old) - array['user_id', 'placeholder_id', 'updated_by', 'updated_at'])
           and exists (
               select 1
               from public.ledger_invite li
               where li.ledger_id = old.ledger_id
                 and li.placeholder_id = old.placeholder_id
                 and li.accepted_by = auth.uid()
                 and li.accepted_at is not null
           )
           and exists (
               select 1
               from public.ledger_placeholder_member p
               where p.id = old.placeholder_id
                 and p.ledger_id = old.ledger_id
                 and p.claimed_by is null
           )
           and exists (
               select 1
               from public.ledger_member lm
               join public.app_user au on au.id = lm.user_id
               where lm.ledger_id = old.ledger_id
                 and lm.user_id = auth.uid()
                 and lm.status = 'active'
                 and au.status = 'active'
           ) then
            return new;
        end if;
    end if;

    v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
    v_ledger_id := nullif(v_row ->> v_ledger_field, '')::uuid;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_ledger_management_permission() from public, anon, authenticated, service_role;

-- 待接受邀请列表：增加 placeholder_id，过滤、权限与 token 可见性不变。
drop function public.list_pending_ledger_invites(uuid);

create function public.list_pending_ledger_invites(p_ledger_id uuid)
returns table (
    invite_id uuid,
    invite_role text,
    created_at timestamptz,
    invite_token text,
    placeholder_id uuid
)
language plpgsql stable security definer
set search_path = pg_catalog, pg_temp
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
        case when v_can_manage then li.invite_token else null::text end,
        li.placeholder_id
    from public.ledger_invite li
    where li.ledger_id = p_ledger_id
      and li.accepted_at is null
      and li.revoked_at is null
    order by li.created_at desc, li.id;
end;
$$;

revoke all on function public.list_pending_ledger_invites(uuid) from public, anon, authenticated, service_role;
grant execute on function public.list_pending_ledger_invites(uuid) to authenticated;

-- 邀请预览：仅有效绑定邀请实时返回占位名字，不返回认领人、账户或金额。
drop function public.get_ledger_invite_preview(text);

create function public.get_ledger_invite_preview(p_token text)
returns table (
    invite_status text,
    ledger_name text,
    inviter_name text,
    invite_role text,
    is_placeholder_bound boolean,
    placeholder_display_name text
)
language plpgsql stable security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_token_hash text;
begin
    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        return query select 'invalid'::text, null::text, null::text, null::text, false, null::text;
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
        li.role,
        bound.is_bound,
        case when bound.is_bound then p.display_name else null::text end
    from public.ledger_invite li
    join public.ledger l on l.id = li.ledger_id
    join public.app_user au on au.id = li.inviter_user_id
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = li.ledger_id
     and lds.user_id = li.inviter_user_id
    left join public.ledger_placeholder_member p
      on p.id = li.placeholder_id
     and p.ledger_id = li.ledger_id
    cross join lateral (
        select (
            p.id is not null
            and p.claimed_by is null
            and li.revoked_at is null
            and li.accepted_at is null
            and not l.is_archived
        ) as is_bound
    ) bound
    where li.token_hash = v_token_hash;

    if not found then
        return query select 'invalid'::text, null::text, null::text, null::text, false, null::text;
    end if;
end;
$$;

revoke all on function public.get_ledger_invite_preview(text) from public, anon, authenticated, service_role;
grant execute on function public.get_ledger_invite_preview(text) to anon, authenticated;

commit;
