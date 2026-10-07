-- Issue #395：验证「创建中」账本的向导 RPC 与边界（当前账本、业务写入、邀请、列表、状态列保护）。
-- 本文件不能依赖 seed；schema snapshot check 只回放 migrations。
-- 测试数据仅存在于当前事务，最终统一回滚。

begin;

-- 按真实认证链路准备用户，让既存 on_auth_user_created trigger 创建 app_user。
create function pg_temp.create_test_user(p_user_id uuid, p_email text)
returns void
language plpgsql
as $$
begin
    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        reauthentication_token,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        is_sso_user,
        is_anonymous,
        created_at,
        updated_at
    )
    values (
        '00000000-0000-0000-0000-000000000000',
        p_user_id,
        'authenticated',
        'authenticated',
        p_email,
        extensions.crypt('not-used', extensions.gen_salt('bf')),
        pg_catalog.now(),
        '',
        '',
        '',
        '',
        null,
        '',
        '',
        '',
        0,
        '',
        pg_catalog.now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"display_name": "Ledger Setup User"}'::jsonb,
        false,
        false,
        false,
        pg_catalog.now(),
        pg_catalog.now()
    );
end;
$$;

create function pg_temp.sign_in(p_user_id uuid)
returns void
language sql
as $$
    select pg_catalog.set_config('request.jwt.claim.sub', p_user_id::text, true);
$$;

-- 执行 SQL 并断言失败的 SQLSTATE；指定 p_detail 时同时断言业务错误码。
create function pg_temp.expect_error(
    p_label text,
    p_sql text,
    p_sqlstate text,
    p_detail text default null
)
returns void
language plpgsql
as $$
declare
    v_sqlstate text;
    v_detail text;
begin
    begin
        execute p_sql;
    exception when others then
        get stacked diagnostics
            v_sqlstate = returned_sqlstate,
            v_detail = pg_exception_detail;

        if v_sqlstate <> p_sqlstate
           or (p_detail is not null and v_detail is distinct from p_detail) then
            raise exception '% failed: expected % / %, got % / %',
                p_label, p_sqlstate, p_detail, v_sqlstate, v_detail;
        end if;
        return;
    end;

    raise exception '% failed: no error raised', p_label;
end;
$$;

do $$
declare
    v_owner_id uuid := '39500000-0000-4000-8000-000000000001';
    v_other_id uuid := '39500000-0000-4000-8000-000000000002';
    v_completed_ledger_id uuid;
    v_setup_ledger_id uuid;
    v_count integer;
    v_updated_count integer;
begin
    perform pg_temp.create_test_user(v_owner_id, 'ledger-setup-owner@example.invalid');
    perform pg_temp.create_test_user(v_other_id, 'ledger-setup-other@example.invalid');
    perform pg_temp.sign_in(v_owner_id);

    -- 既有创建流程不受影响：账本为 completed 并切换为当前账本。
    select (public.create_ledger_with_owner_settings('Completed Ledger', 'JPY', 'Owner', 'jade')).id
      into v_completed_ledger_id;

    if not exists (
        select 1
        from public.ledger l
        join public.app_user au on au.current_ledger_id = l.id
        where l.id = v_completed_ledger_id
          and au.id = v_owner_id
          and l.setup_status = 'completed'
          and l.setup_step is null
          and l.setup_draft is null
    ) then
        raise exception 'create_ledger_with_owner_settings completed status smoke test failed';
    end if;

    -- 创建中账本：只创建账本、owner 成员与成员设置，不初始化业务数据，不切换当前账本。
    select public.create_ledger_setup(' Setup Ledger ', ' jpy ', ' Setup Owner ', 'sky')
      into v_setup_ledger_id;

    if not exists (
        select 1
        from public.ledger l
        where l.id = v_setup_ledger_id
          and l.name = 'Setup Ledger'
          and l.base_currency = 'JPY'
          and l.owner_user_id = v_owner_id
          and l.setup_status = 'in_progress'
          and l.setup_step = 2
          and l.setup_draft = '{}'::jsonb
    ) then
        raise exception 'create_ledger_setup ledger smoke test failed';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.ledger_member_display_setting lds
          on lds.ledger_id = lm.ledger_id
         and lds.user_id = lm.user_id
        where lm.ledger_id = v_setup_ledger_id
          and lm.user_id = v_owner_id
          and lm.role = 'owner'
          and lm.status = 'active'
          and lds.display_name = 'Setup Owner'
          and lds.display_color = 'sky'
    ) then
        raise exception 'create_ledger_setup owner member smoke test failed';
    end if;

    if exists (select 1 from public.category where ledger_id = v_setup_ledger_id)
       or exists (select 1 from public.account where ledger_id = v_setup_ledger_id)
       or exists (select 1 from public.merchant where ledger_id = v_setup_ledger_id)
       or exists (select 1 from public.merchant_tags where ledger_id = v_setup_ledger_id) then
        raise exception 'create_ledger_setup must not initialize default data';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_owner_id
          and au.current_ledger_id = v_completed_ledger_id
    ) then
        raise exception 'create_ledger_setup must not change current ledger';
    end if;

    perform pg_temp.expect_error(
        'create_ledger_setup duplicate',
        $sql$select public.create_ledger_setup('Second Setup', 'JPY', 'Owner', 'jade')$sql$,
        '23505',
        'ledger_setup_in_progress_exists'
    );
    perform pg_temp.expect_error(
        'create_ledger_setup invalid currency',
        $sql$select public.create_ledger_setup('Invalid Setup', 'XXX', 'Owner', 'jade')$sql$,
        '22023',
        'currency_invalid'
    );

    -- 读取当前用户的创建中账本。
    if not exists (
        select 1
        from public.get_current_user_setup_ledger() s
        where s.ledger_id = v_setup_ledger_id
          and s.ledger_name = 'Setup Ledger'
          and s.base_currency = 'JPY'
          and s.setup_step = 2
          and s.setup_draft = '{}'::jsonb
    ) then
        raise exception 'get_current_user_setup_ledger owner smoke test failed';
    end if;

    -- 保存草稿。
    perform public.save_ledger_setup_draft(
        v_setup_ledger_id,
        3,
        '{"accounts": [{"type": "cash"}]}'::jsonb
    );

    if not exists (
        select 1
        from public.ledger l
        where l.id = v_setup_ledger_id
          and l.setup_step = 3
          and l.setup_draft = '{"accounts": [{"type": "cash"}]}'::jsonb
    ) then
        raise exception 'save_ledger_setup_draft smoke test failed';
    end if;

    perform pg_temp.expect_error(
        'save_ledger_setup_draft step too large',
        format('select public.save_ledger_setup_draft(%L, 6, %L::jsonb)', v_setup_ledger_id, '{}'),
        '22023',
        'ledger_setup_step_invalid'
    );
    perform pg_temp.expect_error(
        'save_ledger_setup_draft step too small',
        format('select public.save_ledger_setup_draft(%L, 0, %L::jsonb)', v_setup_ledger_id, '{}'),
        '22023',
        'ledger_setup_step_invalid'
    );
    perform pg_temp.expect_error(
        'save_ledger_setup_draft array draft',
        format('select public.save_ledger_setup_draft(%L, 3, %L::jsonb)', v_setup_ledger_id, '[]'),
        '22023',
        'ledger_setup_draft_invalid'
    );
    perform pg_temp.expect_error(
        'save_ledger_setup_draft null draft',
        format('select public.save_ledger_setup_draft(%L, 3, null)', v_setup_ledger_id),
        '22023',
        'ledger_setup_draft_invalid'
    );
    perform pg_temp.expect_error(
        'save_ledger_setup_draft too large',
        format(
            'select public.save_ledger_setup_draft(%L, 3, jsonb_build_object(%L, repeat(%L, 70000)))',
            v_setup_ledger_id,
            'note',
            'x'
        ),
        '22023',
        'ledger_setup_draft_too_large'
    );
    perform pg_temp.expect_error(
        'save_ledger_setup_draft completed ledger',
        format('select public.save_ledger_setup_draft(%L, 3, %L::jsonb)', v_completed_ledger_id, '{}'),
        '55000',
        'ledger_setup_not_in_progress'
    );

    -- 修改创建中账本的基本信息。
    perform public.update_ledger_setup_basic_info(
        v_setup_ledger_id,
        'Renamed Setup',
        'usd',
        'Renamed Owner',
        'rose'
    );

    if not exists (
        select 1
        from public.ledger l
        join public.ledger_member_display_setting lds
          on lds.ledger_id = l.id
         and lds.user_id = v_owner_id
        where l.id = v_setup_ledger_id
          and l.name = 'Renamed Setup'
          and l.base_currency = 'USD'
          and l.setup_status = 'in_progress'
          and lds.display_name = 'Renamed Owner'
          and lds.display_color = 'rose'
    ) then
        raise exception 'update_ledger_setup_basic_info smoke test failed';
    end if;

    perform pg_temp.expect_error(
        'update_ledger_setup_basic_info completed ledger',
        format(
            'select public.update_ledger_setup_basic_info(%L, %L, %L, %L, %L)',
            v_completed_ledger_id,
            'Name',
            'JPY',
            'Owner',
            'jade'
        ),
        '55000',
        'ledger_setup_not_in_progress'
    );
    perform pg_temp.expect_error(
        'update_ledger_setup_basic_info invalid color',
        format(
            'select public.update_ledger_setup_basic_info(%L, %L, %L, %L, %L)',
            v_setup_ledger_id,
            'Name',
            'JPY',
            'Owner',
            'unknown'
        ),
        '22023',
        'display_color_invalid'
    );

    -- 创建中账本不可设为当前账本。
    perform pg_temp.expect_error(
        'validate_app_user_current_ledger',
        format(
            'update public.app_user set current_ledger_id = %L where id = %L',
            v_setup_ledger_id,
            v_owner_id
        ),
        '42501'
    );

    -- 权限函数只对 completed 账本放行。
    if public.current_user_can_manage_ledger(v_setup_ledger_id)
       or public.current_user_can_write_ledger(v_setup_ledger_id)
       or not public.current_user_can_manage_ledger(v_completed_ledger_id)
       or not public.current_user_can_write_ledger(v_completed_ledger_id) then
        raise exception 'ledger permission helper smoke test failed';
    end if;

    -- 创建中账本拒绝业务写入。
    perform pg_temp.expect_error(
        'create_account_with_holders',
        format(
            'select public.create_account_with_holders(%L, %L, %L, %L, 0, array[%L]::uuid[])',
            v_setup_ledger_id,
            'Setup Account',
            'cash',
            'JPY',
            v_owner_id
        ),
        '42501'
    );
    perform pg_temp.expect_error(
        'merchant insert',
        format(
            'insert into public.merchant (ledger_id, name, created_by, updated_by) values (%L, %L, %L, %L)',
            v_setup_ledger_id,
            'Setup Merchant',
            v_owner_id,
            v_owner_id
        ),
        '42501'
    );
    perform pg_temp.expect_error(
        'category insert',
        format(
            'insert into public.category (ledger_id, name, type, created_by, updated_by) values (%L, %L, %L, %L, %L)',
            v_setup_ledger_id,
            'Setup Category',
            'expense',
            v_owner_id,
            v_owner_id
        ),
        '42501'
    );
    perform pg_temp.expect_error(
        'create_merchant_tag',
        format('select public.create_merchant_tag(%L, %L, null)', v_setup_ledger_id, 'Setup Tag'),
        '42501',
        'permission_denied'
    );
    perform pg_temp.expect_error(
        'create_transaction',
        format(
            'select public.create_transaction(%L, %L, now(), %L::jsonb, gen_random_uuid(), gen_random_uuid(), null)',
            v_setup_ledger_id,
            'expense',
            '[]'
        ),
        '42501',
        'ledger_forbidden'
    );

    -- 创建中账本拒绝生成邀请与待邀请成员。
    perform pg_temp.expect_error(
        'create_ledger_invite_v2',
        format('select * from public.create_ledger_invite_v2(%L, %L, null)', v_setup_ledger_id, 'member'),
        '42501',
        'permission_denied'
    );
    perform pg_temp.expect_error(
        'create_ledger_placeholder_member',
        format('select public.create_ledger_placeholder_member(%L, %L)', v_setup_ledger_id, 'Setup Placeholder'),
        '42501',
        'permission_denied'
    );

    -- 账本列表排除创建中账本。
    select count(*)
      into v_count
      from public.list_current_user_ledger_display_names() l
     where l.ledger_id = v_setup_ledger_id;

    if v_count <> 0
       or not exists (
           select 1
           from public.list_current_user_ledger_display_names() l
           where l.ledger_id = v_completed_ledger_id
       ) then
        raise exception 'list_current_user_ledger_display_names smoke test failed';
    end if;

    -- 以 authenticated 身份直接更新 ledger：RLS 与状态列保护生效，completed 账本的普通更新不受影响。
    execute 'set local role authenticated';

    update public.ledger
       set setup_status = 'completed',
           setup_step = null,
           setup_draft = null
     where id = v_setup_ledger_id;
    get diagnostics v_updated_count = row_count;

    if v_updated_count <> 0 then
        raise exception 'in_progress ledger direct completion must be rejected by RLS';
    end if;

    update public.ledger
       set name = 'Completed Ledger Renamed'
     where id = v_completed_ledger_id;
    get diagnostics v_updated_count = row_count;

    if v_updated_count <> 1 then
        raise exception 'completed ledger direct update smoke test failed';
    end if;

    perform pg_temp.expect_error(
        'completed ledger back to in_progress',
        format(
            'update public.ledger set setup_status = %L, setup_step = 2, setup_draft = %L::jsonb where id = %L',
            'in_progress',
            '{}',
            v_completed_ledger_id
        ),
        '55000',
        'ledger_setup_not_in_progress'
    );

    execute 'reset role';

    if not exists (
        select 1
        from public.ledger l
        where l.id = v_setup_ledger_id
          and l.setup_status = 'in_progress'
    ) then
        raise exception 'in_progress ledger status changed unexpectedly';
    end if;

    -- 状态列只允许向导 RPC 修改（即使由能绕过 RLS 的调用方直接更新也会被拒绝）。
    perform pg_temp.expect_error(
        'direct setup draft update',
        format(
            'update public.ledger set setup_draft = %L::jsonb where id = %L',
            '{"bypass": true}',
            v_setup_ledger_id
        ),
        '42501',
        'permission_denied'
    );

    -- 其他用户无法读取或修改该创建中账本。
    perform pg_temp.sign_in(v_other_id);

    if exists (select 1 from public.get_current_user_setup_ledger()) then
        raise exception 'get_current_user_setup_ledger other user smoke test failed';
    end if;

    perform pg_temp.expect_error(
        'save_ledger_setup_draft other user',
        format('select public.save_ledger_setup_draft(%L, 3, %L::jsonb)', v_setup_ledger_id, '{}'),
        'P0002',
        'ledger_setup_not_found'
    );
    perform pg_temp.expect_error(
        'update_ledger_setup_basic_info other user',
        format(
            'select public.update_ledger_setup_basic_info(%L, %L, %L, %L, %L)',
            v_setup_ledger_id,
            'Name',
            'JPY',
            'Other',
            'jade'
        ),
        'P0002',
        'ledger_setup_not_found'
    );

    -- 其他用户可以拥有自己的创建中账本（唯一约束按 owner 区分）。
    perform public.create_ledger_setup('Other Setup', 'CNY', 'Other', 'lime');

    perform pg_catalog.set_config('request.jwt.claim.sub', '', true);

    perform pg_temp.expect_error(
        'create_ledger_setup unauthenticated',
        $sql$select public.create_ledger_setup('Anonymous Setup', 'JPY', 'Owner', 'jade')$sql$,
        '42501',
        'auth_required'
    );
end;
$$;

rollback;
