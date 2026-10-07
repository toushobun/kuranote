begin;

-- Issue #395：创建账本向导（实施拆分第 1 项）。
-- 第 1 步完成时即创建「创建中」（in_progress）账本，后续步骤只保存草稿；
-- 完成写入与默认数据初始化时机调整由后续 PR 处理。
--
-- 「创建中」账本边界（DB 层防线）：
-- 1. 不可设为当前账本：validate_app_user_current_ledger 只接受 completed 账本。
-- 2. 不可写入业务数据、不可生成邀请或待邀请成员：current_user_can_manage_ledger /
--    current_user_can_write_ledger 只对 completed 账本返回 true。账户、商家、分类、
--    交易、预算、邀请、待邀请成员等 RLS、trigger 与 RPC 都经过这两个函数。
-- 3. 不出现在账本列表：list_current_user_ledger_display_names 只返回 completed 账本。
-- 4. 创建状态列只能由 SECURITY DEFINER 的向导 RPC 在事务内打开
--    app.allow_ledger_setup_update 后修改，客户端不能直接把账本标记为完成。
--
-- 后续完成写入 RPC 的约定：在同一事务内先写入业务数据，再打开
-- app.allow_ledger_setup_update 将 setup_status 改为 completed。业务数据写入时账本仍为
-- in_progress，上述权限函数会拒绝，因此完成写入 RPC 需要以 SECURITY DEFINER 身份
-- 自行校验 owner 与创建中状态，并通过事务内标记放行对应 trigger（与
-- app.allow_ledger_owner_bootstrap 相同的模式），不得放宽权限函数本身。

alter table public.ledger
    add column setup_status text not null default 'completed',
    add column setup_step smallint,
    add column setup_draft jsonb;

-- 草稿大小上限（字节，按 jsonb 文本表示计算）。check 约束与 RPC 共用此函数，避免两处数值不一致。
create or replace function public.ledger_setup_draft_max_bytes()
returns integer
language sql immutable parallel safe
set search_path = pg_catalog, pg_temp
as $$
    select 65536;
$$;

alter table public.ledger
    add constraint ledger_setup_status_check
        check (setup_status in ('in_progress', 'completed')),
    add constraint ledger_setup_state_check
        check (
            (
                setup_status = 'completed'
                and setup_step is null
                and setup_draft is null
            )
            or (
                setup_status = 'in_progress'
                and setup_step between 1 and 5
                and setup_draft is not null
                and jsonb_typeof(setup_draft) = 'object'
                and octet_length(setup_draft::text) <= public.ledger_setup_draft_max_bytes()
            )
        );

-- 每个用户同时最多一个创建中账本。
create unique index ledger_owner_in_progress_setup_key
    on public.ledger (owner_user_id)
    where setup_status = 'in_progress' and not is_archived;

-- 创建状态列的直接修改保护：completed 账本不可回到创建中；
-- 其余修改只允许向导 RPC 在事务内打开 app.allow_ledger_setup_update 后进行。
create or replace function public.guard_ledger_setup_state()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
    if new.setup_status is not distinct from old.setup_status
       and new.setup_step is not distinct from old.setup_step
       and new.setup_draft is not distinct from old.setup_draft then
        return new;
    end if;

    if old.setup_status = 'completed' then
        raise exception 'ledger_setup_not_in_progress'
            using errcode = '55000', detail = 'ledger_setup_not_in_progress';
    end if;

    if current_setting('app.allow_ledger_setup_update', true) is distinct from 'true' then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    return new;
end;
$$;

create trigger ledger_guard_setup_state
before update of setup_status, setup_step, setup_draft on public.ledger
for each row execute function public.guard_ledger_setup_state();

-- ledger_setup_draft_max_bytes 出现在 check 约束中，直接更新 ledger 的 authenticated 用户也需要
-- EXECUTE 权限（函数权限在表达式初始化时检查），因此只收回 anon 的权限。
revoke all on function public.ledger_setup_draft_max_bytes() from public, anon;
grant execute on function public.ledger_setup_draft_max_bytes() to authenticated, service_role;
revoke all on function public.guard_ledger_setup_state() from public, anon, authenticated, service_role;

-- 账本是否已完成创建。只在 SECURITY DEFINER 权限函数内部使用。
create or replace function public.ledger_setup_is_completed(p_ledger_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
    select exists (
        select 1
        from public.ledger l
        where l.id = p_ledger_id
          and l.setup_status = 'completed'
    );
$$;

revoke all on function public.ledger_setup_is_completed(uuid) from public, anon, authenticated, service_role;

-- 业务管理权限：仅 completed 账本。签名、owner 与 EXECUTE 权限保持不变。
create or replace function public.current_user_can_manage_ledger(p_ledger_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
    select public.current_user_has_ledger_role(
        p_ledger_id,
        array['owner', 'admin']::text[]
    )
    and public.ledger_setup_is_completed(p_ledger_id);
$$;

-- 业务写入权限：仅 completed 账本。签名、owner 与 EXECUTE 权限保持不变。
create or replace function public.current_user_can_write_ledger(p_ledger_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
    select public.current_user_has_ledger_role(
        p_ledger_id,
        array['owner', 'admin', 'member']::text[]
    )
    and public.ledger_setup_is_completed(p_ledger_id);
$$;

-- 当前账本只能指向 active 加入、未归档且已完成创建的账本。
create or replace function public.validate_app_user_current_ledger()
returns trigger
language plpgsql
as $$
begin
    if new.current_ledger_id is null then
        return new;
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.ledger l
          on l.id = lm.ledger_id
        where lm.user_id = new.id
          and lm.ledger_id = new.current_ledger_id
          and lm.status = 'active'
          and l.is_archived = false
          and l.setup_status = 'completed'
    ) then
        raise exception 'current_ledger_id_invalid' using errcode = '42501';
    end if;

    return new;
end;
$$;

-- 个人主页同步昵称时列出的账本只包含已完成创建的账本。
create or replace function public.list_current_user_ledger_display_names()
returns table(ledger_id uuid, ledger_name text, display_name text)
language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select
        l.id,
        l.name,
        coalesce(nullif(btrim(lds.display_name), ''), btrim(au.display_name))
    from public.ledger_member lm
    join public.ledger l
      on l.id = lm.ledger_id
    join public.app_user au
      on au.id = lm.user_id
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = lm.ledger_id
     and lds.user_id = lm.user_id
    where lm.user_id = auth.uid()
      and lm.status = 'active'
      and au.status = 'active'
      and l.is_archived = false
      and l.setup_status = 'completed'
    order by lm.joined_at asc nulls last, lm.created_at asc, lm.ledger_id asc;
$$;

-- 在原有逻辑基础上，允许向导 RPC 打开 app.allow_ledger_setup_update 后更新
-- 创建中账本的 ledger 行本身（基本信息与草稿）。业务数据表不适用此放行。
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

    if tg_table_name = 'ledger'
       and tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_setup_update', true) = 'true' then
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

-- 向导基本信息校验。规则与 create_ledger_with_owner_settings 一致，
-- 供 create_ledger_setup 与 update_ledger_setup_basic_info 共用。
create or replace function public.validate_ledger_setup_basic_info(
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns void
language plpgsql immutable
set search_path = pg_catalog, pg_temp
as $$
begin
    if p_name is null or btrim(p_name) = '' then
        raise exception 'ledger_name_required'
            using errcode = '22023', detail = 'ledger_name_required';
    end if;

    if length(btrim(p_name)) > 100 then
        raise exception 'ledger_name_too_long'
            using errcode = '22023', detail = 'ledger_name_too_long';
    end if;

    if p_base_currency is null
       or upper(btrim(p_base_currency)) not in (
           'CNY', 'JPY', 'USD', 'EUR', 'GBP', 'KRW', 'THB'
       ) then
        raise exception 'currency_invalid'
            using errcode = '22023', detail = 'currency_invalid';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required'
            using errcode = '22023', detail = 'display_name_required';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long'
            using errcode = '22023', detail = 'display_name_too_long';
    end if;

    if p_display_color is null
       or btrim(p_display_color) not in (
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
end;
$$;

revoke all on function public.validate_ledger_setup_basic_info(text, text, text, text) from public, anon, authenticated, service_role;

-- 锁定并返回当前用户自己的创建中账本。供向导 RPC 共用：
-- 非 owner、已归档或不存在统一视为不存在，completed 账本返回 ledger_setup_not_in_progress。
create or replace function public.lock_current_user_setup_ledger(p_ledger_id uuid)
returns public.ledger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    select l.*
      into v_ledger
      from public.ledger l
     where l.id = p_ledger_id
       and l.is_archived = false
     for update;

    if not found
       or v_ledger.owner_user_id <> v_user_id
       or not public.current_user_has_ledger_role(p_ledger_id, array['owner']::text[]) then
        raise exception 'ledger_setup_not_found'
            using errcode = 'P0002', detail = 'ledger_setup_not_found';
    end if;

    if v_ledger.setup_status <> 'in_progress' then
        raise exception 'ledger_setup_not_in_progress'
            using errcode = '55000', detail = 'ledger_setup_not_in_progress';
    end if;

    return v_ledger;
end;
$$;

revoke all on function public.lock_current_user_setup_ledger(uuid) from public, anon, authenticated, service_role;

-- 向导第 1 步：创建「创建中」账本、owner 成员与成员显示设置。
-- 不初始化默认业务数据，不修改当前账本指针。
create or replace function public.create_ledger_setup(
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger_id uuid;
    v_constraint text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    perform public.validate_ledger_setup_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    if not public.current_app_user_is_active() then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    begin
        insert into public.ledger (
            name,
            base_currency,
            owner_user_id,
            setup_status,
            setup_step,
            setup_draft,
            created_by,
            updated_by
        )
        values (
            btrim(p_name),
            upper(btrim(p_base_currency)),
            v_user_id,
            'in_progress',
            2,
            '{}'::jsonb,
            v_user_id,
            v_user_id
        )
        returning id into v_ledger_id;
    exception when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'ledger_owner_in_progress_setup_key' then
            raise exception 'ledger_setup_in_progress_exists'
                using errcode = '23505', detail = 'ledger_setup_in_progress_exists';
        end if;
        raise;
    end;

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
        v_ledger_id,
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
        btrim(p_display_name),
        btrim(p_display_color),
        v_user_id,
        v_user_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_user_id;

    return v_ledger_id;
end;
$$;

-- 修改创建中账本的基本信息（账本名、默认货币、我的显示名、个性色）。
-- 现有账本设置更新路径对创建中账本不可用（权限函数只接受 completed），因此单独提供。
create or replace function public.update_ledger_setup_basic_info(
    p_ledger_id uuid,
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
begin
    perform public.lock_current_user_setup_ledger(p_ledger_id);

    perform public.validate_ledger_setup_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set name = btrim(p_name),
           base_currency = upper(btrim(p_base_currency)),
           updated_by = v_user_id
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        v_user_id,
        btrim(p_display_name),
        btrim(p_display_color),
        v_user_id,
        v_user_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_user_id;
end;
$$;

-- 保存向导草稿。本 PR 只校验步骤范围、JSON object 结构与大小；
-- 草稿内容的业务校验由后续 PR 处理。
create or replace function public.save_ledger_setup_draft(
    p_ledger_id uuid,
    p_step integer,
    p_draft jsonb
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    perform public.lock_current_user_setup_ledger(p_ledger_id);

    if p_step is null or p_step < 1 or p_step > 5 then
        raise exception 'ledger_setup_step_invalid'
            using errcode = '22023', detail = 'ledger_setup_step_invalid';
    end if;

    if p_draft is null or jsonb_typeof(p_draft) <> 'object' then
        raise exception 'ledger_setup_draft_invalid'
            using errcode = '22023', detail = 'ledger_setup_draft_invalid';
    end if;

    if octet_length(p_draft::text) > public.ledger_setup_draft_max_bytes() then
        raise exception 'ledger_setup_draft_too_large'
            using errcode = '22023', detail = 'ledger_setup_draft_too_large';
    end if;

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set setup_step = p_step,
           setup_draft = p_draft,
           updated_by = auth.uid()
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);
end;
$$;

-- 当前用户的创建中账本，没有时返回空。供首页 / 账本管理页的「继续创建」入口使用。
create or replace function public.get_current_user_setup_ledger()
returns table(
    ledger_id uuid,
    ledger_name text,
    base_currency text,
    setup_step smallint,
    setup_draft jsonb
)
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
    select
        l.id,
        l.name,
        l.base_currency,
        l.setup_step,
        l.setup_draft
    from public.ledger l
    where l.owner_user_id = auth.uid()
      and l.setup_status = 'in_progress'
      and l.is_archived = false
      and public.current_user_has_ledger_role(l.id, array['owner']::text[])
    limit 1;
$$;

revoke all on function public.create_ledger_setup(text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.create_ledger_setup(text, text, text, text) to authenticated;

revoke all on function public.update_ledger_setup_basic_info(uuid, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.update_ledger_setup_basic_info(uuid, text, text, text, text) to authenticated;

revoke all on function public.save_ledger_setup_draft(uuid, integer, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.save_ledger_setup_draft(uuid, integer, jsonb) to authenticated;

revoke all on function public.get_current_user_setup_ledger() from public, anon, authenticated, service_role;
grant execute on function public.get_current_user_setup_ledger() to authenticated;

commit;
