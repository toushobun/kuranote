begin;

-- Issue #811：
-- 1. 认领绑定邀请后，成员在该账本内的显示名沿用待邀请成员的名字；
-- 2. 同账本「未认领待邀请成员名字」与「active 成员有效显示名」不能相同。
-- 比较口径与占位名字一致：去除首尾空白后按 collate "C" 精确比较，不做大小写折叠。

-- 判断账本内是否有 active 成员（且账号 active）的有效显示名等于给定名字。
-- 有效显示名 = 账本内显示名，为空时回退到账号昵称。仅供内部 RPC 调用。
create function public.ledger_active_member_display_name_exists(p_ledger_id uuid, p_display_name text)
returns boolean language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        left join public.ledger_member_display_setting lds
          on lds.ledger_id = lm.ledger_id
         and lds.user_id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.status = 'active'
          and au.status = 'active'
          and coalesce(nullif(btrim(lds.display_name), ''), btrim(au.display_name)) collate "C"
              = btrim(p_display_name) collate "C"
    );
$$;
revoke all on function public.ledger_active_member_display_name_exists(uuid, text) from public, anon, authenticated, service_role;

-- 新建待邀请成员：取得账本锁后检查与成员重名。签名与授权不变。
create or replace function public.create_ledger_placeholder_member(p_ledger_id uuid, p_display_name text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_id uuid;
    v_name text;
    v_constraint text;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    v_name := public.normalize_ledger_placeholder_name(p_display_name);
    if public.ledger_active_member_display_name_exists(p_ledger_id, v_name) then
        raise exception 'placeholder_name_member_conflict'
            using errcode = '23505', detail = 'placeholder_name_member_conflict';
    end if;
    insert into public.ledger_placeholder_member(ledger_id, display_name, created_by)
    values (p_ledger_id, v_name, auth.uid())
    returning id into v_id;
    return v_id;
exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'ledger_placeholder_member_unclaimed_name_unique' then
        raise exception 'placeholder_name_conflict'
            using errcode = '23505', detail = 'placeholder_name_conflict';
    end if;
    raise;
end;
$$;

-- 改名：名字有变化时检查与成员重名；改为自身现有名字仍幂等成功。签名与授权不变。
create or replace function public.rename_ledger_placeholder_member(p_ledger_id uuid, p_placeholder_id uuid, p_display_name text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_placeholder public.ledger_placeholder_member;
    v_name text;
    v_constraint text;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    select * into v_placeholder from public.ledger_placeholder_member
    where id = p_placeholder_id and ledger_id = p_ledger_id for update;
    if not found then
        raise exception 'placeholder_not_found' using errcode = '22023', detail = 'placeholder_not_found';
    end if;
    if v_placeholder.claimed_by is not null then
        raise exception 'placeholder_already_claimed' using errcode = '23514', detail = 'placeholder_already_claimed';
    end if;
    v_name := public.normalize_ledger_placeholder_name(p_display_name);
    if v_name collate "C" <> v_placeholder.display_name collate "C"
       and public.ledger_active_member_display_name_exists(p_ledger_id, v_name) then
        raise exception 'placeholder_name_member_conflict'
            using errcode = '23505', detail = 'placeholder_name_member_conflict';
    end if;
    update public.ledger_placeholder_member
    set display_name = v_name
    where id = p_placeholder_id;
    return p_placeholder_id;
exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'ledger_placeholder_member_unclaimed_name_unique' then
        raise exception 'placeholder_name_conflict'
            using errcode = '23505', detail = 'placeholder_name_conflict';
    end if;
    raise;
end;
$$;

-- 导入批量创建/复用：任何一个名字与成员重名即整批回滚。签名与授权不变。
create or replace function public.ensure_ledger_placeholder_members(p_ledger_id uuid, p_display_names text[])
returns table(display_name text, placeholder_id uuid)
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
#variable_conflict use_column
declare
    v_names text[];
    v_name text;
    v_id uuid;
    v_constraint text;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    if p_display_names is null then
        raise exception 'placeholder_name_invalid' using errcode = '22023', detail = 'placeholder_name_invalid';
    end if;
    -- 全部输入先规范化校验，之后才统一写入；排序与唯一索引采用相同的精确比较。
    select array_agg(n.name order by n.name collate "C") into v_names
    from (select distinct public.normalize_ledger_placeholder_name(input.name) collate "C" as name
          from unnest(p_display_names) as input(name)) n;
    if exists (
        select 1
        from unnest(coalesce(v_names, '{}'::text[])) as n(name)
        where public.ledger_active_member_display_name_exists(p_ledger_id, n.name)
    ) then
        raise exception 'placeholder_name_member_conflict'
            using errcode = '23505', detail = 'placeholder_name_member_conflict';
    end if;
    foreach v_name in array coalesce(v_names, '{}'::text[]) loop
        insert into public.ledger_placeholder_member(ledger_id, display_name, created_by)
        values (p_ledger_id, v_name, auth.uid())
        on conflict (ledger_id, display_name collate "C") where claimed_by is null do nothing
        returning id into v_id;
        if v_id is null then
            select p.id into v_id from public.ledger_placeholder_member p
            where p.ledger_id = p_ledger_id and p.display_name collate "C" = v_name collate "C"
              and p.claimed_by is null for update;
            if not found then
                raise exception 'placeholder_name_conflict' using errcode = '23505', detail = 'placeholder_name_conflict';
            end if;
        end if;
        display_name := v_name;
        placeholder_id := v_id;
        return next;
    end loop;
exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'ledger_placeholder_member_unclaimed_name_unique' then
        raise exception 'placeholder_name_conflict' using errcode = '23505', detail = 'placeholder_name_conflict';
    end if;
    raise;
end;
$$;

-- 成员设置：先锁账本再锁成员；显示名改成未认领待邀请成员的名字时拒绝。签名与授权不变。
create or replace function public.update_ledger_member_settings(
    p_ledger_id uuid,
    p_member_user_id uuid,
    p_display_name text,
    p_display_color text,
    p_role text
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_actor_id uuid;
    v_actor_role text;
    v_current_role text;
    v_can_manage_member boolean;
    v_display_name text;
    v_current_display_name text;
begin
    v_actor_id = auth.uid();

    if v_actor_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    select lm.role
      into v_actor_role
      from public.ledger_member lm
      join public.app_user au
        on au.id = lm.user_id
     where lm.ledger_id = p_ledger_id
       and lm.user_id = v_actor_id
       and lm.status = 'active'
       and au.status = 'active';

    if not found then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    v_can_manage_member = v_actor_role in ('owner', 'admin');

    if not v_can_manage_member and v_actor_id <> p_member_user_id then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required'
            using errcode = '22023', detail = 'display_name_required';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long'
            using errcode = '22023', detail = 'display_name_too_long';
    end if;

    if p_display_color not in (
        'jade',
        'aqua',
        'sky',
        'indigo',
        'lavender',
        'magenta',
        'sakura',
        'rose',
        'amber',
        'lime'
    ) then
        raise exception 'display_color_invalid'
            using errcode = '22023', detail = 'display_color_invalid';
    end if;

    if p_role not in ('owner', 'admin', 'member', 'viewer') then
        raise exception 'role_invalid'
            using errcode = '22023', detail = 'role_invalid';
    end if;

    v_display_name = btrim(p_display_name);

    -- #811：锁顺序为账本 → 成员，与待邀请成员管理 RPC 一致，
    -- 使「新建待邀请成员」与「成员改名」的同名检查串行化。
    perform 1
      from public.ledger l
     where l.id = p_ledger_id
     for update;

    select lm.role
      into v_current_role
      from public.ledger_member lm
      join public.app_user au
        on au.id = lm.user_id
     where lm.ledger_id = p_ledger_id
       and lm.user_id = p_member_user_id
       and lm.status = 'active'
       and au.status = 'active'
     for update of lm;

    if not found then
        raise exception 'member_not_found'
            using errcode = '22023', detail = 'member_not_found';
    end if;

    if not v_can_manage_member and p_role <> v_current_role then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    -- 所有者权限转移需要单独设计，避免误操作导致无 owner 或多 owner。
    if (v_current_role = 'owner' and p_role <> 'owner')
       or (v_current_role <> 'owner' and p_role = 'owner') then
        raise exception 'role_invalid'
            using errcode = '22023', detail = 'role_invalid';
    end if;

    -- #811：名字有变化时，不能改成同账本未认领待邀请成员的名字。
    -- 名字不变（只改颜色或角色）时不检查，已有的重名数据不影响保存。
    select coalesce(nullif(btrim(lds.display_name), ''), btrim(au.display_name))
      into v_current_display_name
      from public.app_user au
      left join public.ledger_member_display_setting lds
        on lds.ledger_id = p_ledger_id
       and lds.user_id = au.id
     where au.id = p_member_user_id;

    if v_display_name collate "C" is distinct from v_current_display_name collate "C"
       and exists (
           select 1
           from public.ledger_placeholder_member p
           where p.ledger_id = p_ledger_id
             and p.claimed_by is null
             and p.display_name collate "C" = v_display_name collate "C"
       ) then
        raise exception 'display_name_placeholder_conflict'
            using errcode = '23505', detail = 'display_name_placeholder_conflict';
    end if;

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        p_member_user_id,
        v_display_name,
        p_display_color,
        v_actor_id,
        v_actor_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_actor_id;

    if v_can_manage_member and p_role <> v_current_role then
        perform set_config('app.allow_ledger_member_role_change', 'on', true);

        update public.ledger_member
           set role = p_role,
               updated_by = v_actor_id
         where ledger_id = p_ledger_id
           and user_id = p_member_user_id
           and status = 'active';

        perform set_config('app.allow_ledger_member_role_change', 'off', true);
    end if;
end;
$$;

-- 接受邀请：签名、返回列与授权不变；绑定分支认领之后写入账本内显示名。
-- 匿名分支与幂等重放分支不变，重放不会覆盖成员之后自己改过的显示名。
create or replace function public.accept_ledger_invite(p_token text)
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

            -- 第 8 步（#811）：认领之后把账本内显示名设为待邀请成员的名字。
            -- 放在认领之后，占位已退出未认领名字范围，不与成员名唯一规则自相矛盾。
            -- 显示设置行由成员插入触发器建立，只补写名字、保留颜色；
            -- 行不存在时按同一颜色规则补建。只改账本内显示名，不改 app_user.display_name。
            insert into public.ledger_member_display_setting (
                ledger_id,
                user_id,
                display_name,
                display_color,
                created_by,
                updated_by
            ) values (
                v_ledger_id,
                v_user_id,
                v_placeholder.display_name,
                public.get_next_ledger_member_display_color(v_ledger_id),
                v_user_id,
                v_user_id
            )
            on conflict (ledger_id, user_id) do update set
                display_name = excluded.display_name,
                updated_by = v_user_id;

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


commit;
