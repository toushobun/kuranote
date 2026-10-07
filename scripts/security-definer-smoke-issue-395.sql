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

-- 完成写入 RPC（实施拆分第 2 项）：成功写入、跳过、非法 payload、权限、GUC、货币变更清空草稿。
create function pg_temp.completion_payload()
returns jsonb
language sql
as $$
    select '{
        "accounts": [
            {"type": "cash", "name": "现金"},
            {"type": "bank", "name": " 楽天銀行 "},
            {"type": "e_money", "name": "楽天銀行"}
        ],
        "merchantTags": [
            {"key": "ecommerce", "name": "电商", "icon": "📦"},
            {"key": "subscription", "name": "订阅服务", "icon": "🎬"}
        ],
        "merchants": [
            {
                "name": "Amazon",
                "websiteUrl": "https://www.amazon.co.jp/",
                "tagKeys": ["ecommerce", "subscription"],
                "aliases": [
                    {"alias": "亚马逊", "locale": "zh"},
                    {"alias": "Prime Video", "locale": "en"}
                ]
            },
            {
                "name": "水道局",
                "websiteUrl": null,
                "tagKeys": [],
                "aliases": [{"alias": "自来水", "locale": "zh"}]
            }
        ],
        "specialStatusEnabled": true
    }'::jsonb;
$$;

create function pg_temp.assert_setup_untouched(p_label text, p_ledger_id uuid)
returns void
language plpgsql
as $$
begin
    if exists (select 1 from public.category where ledger_id = p_ledger_id)
       or exists (select 1 from public.account where ledger_id = p_ledger_id)
       or exists (select 1 from public.merchant where ledger_id = p_ledger_id)
       or exists (select 1 from public.merchant_tags where ledger_id = p_ledger_id)
       or not exists (
           select 1
           from public.ledger l
           where l.id = p_ledger_id
             and l.setup_status = 'in_progress'
             and l.transaction_item_special_status_enabled = false
       ) then
        raise exception '% left data behind', p_label;
    end if;
end;
$$;

do $$
declare
    v_owner_id uuid := '39500000-0000-4000-8000-000000000011';
    v_other_id uuid := '39500000-0000-4000-8000-000000000012';
    v_previous_ledger_id uuid;
    v_setup_ledger_id uuid;
    v_skip_ledger_id uuid;
    v_amazon_id uuid;
    v_count integer;
    v_invalid jsonb;
    v_category_id uuid;
    v_account_id uuid;
    v_placeholder_id uuid;
    v_token text;
    v_draft jsonb := '{
        "templateCurrency": "JPY",
        "templateVersion": 1,
        "accounts": {"skipped": false, "items": [{"type": "cash", "name": "现金"}]},
        "merchants": {"skipped": false, "selectedKeys": ["amazon"]},
        "features": {"specialStatusEnabled": true}
    }'::jsonb;
begin
    perform pg_temp.create_test_user(v_owner_id, 'ledger-complete-owner@example.invalid');
    perform pg_temp.create_test_user(v_other_id, 'ledger-complete-other@example.invalid');
    perform pg_temp.sign_in(v_owner_id);

    -- 既有 /ledgers/new 流程行为不变：completed、默认分类 / 商家 / 别名 / 标签与现金账户。
    select (public.create_ledger_with_owner_settings(' Previous ', ' jpy ', ' Owner ', 'jade')).id
      into v_previous_ledger_id;

    if not exists (
        select 1
        from public.ledger l
        join public.app_user au on au.current_ledger_id = l.id and au.id = v_owner_id
        join public.ledger_member_display_setting lds
          on lds.ledger_id = l.id and lds.user_id = v_owner_id
        where l.id = v_previous_ledger_id
          and l.name = 'Previous'
          and l.base_currency = 'JPY'
          and l.setup_status = 'completed'
          and lds.display_name = 'Owner'
          and lds.display_color = 'jade'
       )
       or (select count(*) from public.category where ledger_id = v_previous_ledger_id) <> 101
       or (select count(*) from public.merchant where ledger_id = v_previous_ledger_id) <> 55
       or (select count(*) from public.merchant_tags where ledger_id = v_previous_ledger_id) <> 8
       or (
           select count(*)
           from public.merchant_alias ma
           join public.merchant m on m.id = ma.merchant_id
           where m.ledger_id = v_previous_ledger_id
       ) <> 110
       or not exists (
           select 1
           from public.account a
           join public.account_holder h on h.account_id = a.id and h.user_id = v_owner_id
           where a.ledger_id = v_previous_ledger_id
             and a.name = '现金'
             and a.type = 'cash'
             and a.currency = 'JPY'
       ) then
        raise exception 'create_ledger_with_owner_settings behavior changed';
    end if;

    perform pg_temp.expect_error(
        'create_ledger_with_owner_settings invalid color',
        $sql$select public.create_ledger_with_owner_settings('Name', 'JPY', 'Owner', 'unknown')$sql$,
        '22023',
        'display_color_invalid'
    );

    select public.create_ledger_setup('Wizard Ledger', 'JPY', 'Wizard Owner', 'sky')
      into v_setup_ledger_id;

    -- 草稿的模板币种必须与账本默认货币一致。
    perform public.save_ledger_setup_draft(v_setup_ledger_id, 4, v_draft);
    perform pg_temp.expect_error(
        'save_ledger_setup_draft currency mismatch',
        format(
            'select public.save_ledger_setup_draft(%L, 4, %L::jsonb)',
            v_setup_ledger_id,
            v_draft || '{"templateCurrency": "USD"}'::jsonb
        ),
        '22023',
        'ledger_setup_draft_currency_mismatch'
    );

    -- 货币不变时草稿不动。
    perform public.update_ledger_setup_basic_info(
        v_setup_ledger_id, 'Wizard Renamed', 'JPY', 'Wizard Owner', 'sky'
    );
    if (select setup_draft from public.ledger where id = v_setup_ledger_id) <> v_draft then
        raise exception 'update_ledger_setup_basic_info must keep draft when currency unchanged';
    end if;

    -- 货币变化时清空与模板相关的部分，保留其他内容。
    perform public.update_ledger_setup_basic_info(
        v_setup_ledger_id, 'Wizard Renamed', 'USD', 'Wizard Owner', 'sky'
    );
    if (select setup_draft from public.ledger where id = v_setup_ledger_id)
       <> '{"features": {"specialStatusEnabled": true}}'::jsonb then
        raise exception 'update_ledger_setup_basic_info must reset template draft when currency changed';
    end if;

    perform public.update_ledger_setup_basic_info(
        v_setup_ledger_id, 'Wizard Ledger', 'JPY', 'Wizard Owner', 'sky'
    );

    -- 非法 payload 被拒且不留任何数据。
    foreach v_invalid in array array[
        null,
        '[]'::jsonb,
        pg_temp.completion_payload() - 'specialStatusEnabled',
        jsonb_set(pg_temp.completion_payload(), '{accounts,0,name}', to_jsonb(repeat('x', 101))),
        jsonb_set(pg_temp.completion_payload(), '{accounts,0,type}', '"other"'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{accounts,1}', '{"type": "cash", "name": "现金 "}'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{accounts,2,type}', '"bank"'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchants,0,tagKeys}', '["ecommerce", "missing"]'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchants,0,tagKeys}', '["ecommerce", "ecommerce"]'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchants,1,name}', '" amazon "'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchants,0,websiteUrl}', '"http://www.amazon.co.jp/"'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchants,0,aliases,1,alias}', '"亚马逊"'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchants,0,aliases,0,locale}', '"z"'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchantTags,1,key}', '"ecommerce"'::jsonb),
        jsonb_set(pg_temp.completion_payload(), '{merchantTags,0,icon}', to_jsonb(repeat('x', 33))),
        jsonb_set(
            pg_temp.completion_payload(),
            '{merchants}',
            (select jsonb_agg(jsonb_build_object(
                'name', 'M' || i, 'websiteUrl', null, 'tagKeys', '[]'::jsonb, 'aliases', '[]'::jsonb
            )) from generate_series(1, 201) i)
        )
    ]
    loop
        perform pg_temp.expect_error(
            'complete_ledger_setup invalid payload ' || coalesce(left(v_invalid::text, 60), 'null'),
            format('select public.complete_ledger_setup(%L, %L::jsonb)', v_setup_ledger_id, v_invalid),
            '22023',
            'ledger_setup_payload_invalid'
        );
        perform pg_temp.assert_setup_untouched('complete_ledger_setup invalid payload', v_setup_ledger_id);
    end loop;

    -- completed 账本、其他用户、未登录调用被拒。
    perform pg_temp.expect_error(
        'complete_ledger_setup completed ledger',
        format('select public.complete_ledger_setup(%L, %L::jsonb)', v_previous_ledger_id, pg_temp.completion_payload()),
        '55000',
        'ledger_setup_not_in_progress'
    );

    perform pg_temp.sign_in(v_other_id);
    perform pg_temp.expect_error(
        'complete_ledger_setup other user',
        format('select public.complete_ledger_setup(%L, %L::jsonb)', v_setup_ledger_id, pg_temp.completion_payload()),
        'P0002',
        'ledger_setup_not_found'
    );

    perform pg_catalog.set_config('request.jwt.claim.sub', '', true);
    perform pg_temp.expect_error(
        'complete_ledger_setup unauthenticated',
        format('select public.complete_ledger_setup(%L, %L::jsonb)', v_setup_ledger_id, pg_temp.completion_payload()),
        '42501',
        'auth_required'
    );
    perform pg_temp.assert_setup_untouched('complete_ledger_setup rejected caller', v_setup_ledger_id);

    -- 未经完成写入 RPC 时，GUC 只设为其他账本也无法放行业务写入。
    perform pg_temp.sign_in(v_owner_id);
    perform pg_catalog.set_config('app.ledger_setup_completion_ledger_id', v_previous_ledger_id::text, true);
    perform pg_temp.expect_error(
        'completion guc for another ledger',
        format(
            'insert into public.category (ledger_id, name, type, created_by, updated_by) values (%L, %L, %L, %L, %L)',
            v_setup_ledger_id,
            'Bypass Category',
            'expense',
            v_owner_id,
            v_owner_id
        ),
        '42501'
    );
    perform pg_catalog.set_config('app.ledger_setup_completion_ledger_id', '', true);

    -- 完成写入成功。
    perform public.complete_ledger_setup(v_setup_ledger_id, pg_temp.completion_payload());

    if not exists (
        select 1
        from public.ledger l
        join public.app_user au on au.current_ledger_id = l.id and au.id = v_owner_id
        where l.id = v_setup_ledger_id
          and l.setup_status = 'completed'
          and l.setup_step is null
          and l.setup_draft is null
          and l.transaction_item_special_status_enabled = true
    ) then
        raise exception 'complete_ledger_setup ledger status smoke test failed';
    end if;

    if (select count(*) from public.category where ledger_id = v_setup_ledger_id) <> 101 then
        raise exception 'complete_ledger_setup default categories smoke test failed';
    end if;

    select count(*)
      into v_count
      from public.account a
      join public.account_holder h
        on h.account_id = a.id
       and h.ledger_id = a.ledger_id
       and h.user_id = v_owner_id
       and h.role = 'owner'
     where a.ledger_id = v_setup_ledger_id
       and a.currency = 'JPY'
       and a.initial_balance = 0
       and a.current_balance = 0
       and (a.name, a.type, a.sort_order) in (
           ('现金', 'cash', 0),
           ('楽天銀行', 'bank', 1),
           ('楽天銀行', 'e_money', 2)
       );
    if v_count <> 3
       or (select count(*) from public.account where ledger_id = v_setup_ledger_id) <> 3 then
        raise exception 'complete_ledger_setup accounts smoke test failed';
    end if;

    if (select count(*) from public.merchant_tags where ledger_id = v_setup_ledger_id) <> 2
       or not exists (
           select 1 from public.merchant_tags
           where ledger_id = v_setup_ledger_id and name = '订阅服务' and icon = '🎬' and sort_order = 1
       ) then
        raise exception 'complete_ledger_setup merchant tags smoke test failed';
    end if;

    select id
      into v_amazon_id
      from public.merchant
     where ledger_id = v_setup_ledger_id
       and name = 'Amazon'
       and website_url = 'https://www.amazon.co.jp/';

    if v_amazon_id is null
       or (select count(*) from public.merchant where ledger_id = v_setup_ledger_id) <> 2
       or not exists (
           select 1 from public.merchant
           where ledger_id = v_setup_ledger_id and name = '水道局' and website_url is null
       )
       or (
           select count(*)
           from public.merchant_tag_links link
           join public.merchant_tags t on t.id = link.tag_id
           where link.merchant_id = v_amazon_id
             and t.name in ('电商', '订阅服务')
       ) <> 2
       or (
           select count(*)
           from public.merchant_alias
           where merchant_id = v_amazon_id
             and (alias, locale) in (('亚马逊', 'zh'), ('Prime Video', 'en'))
       ) <> 2 then
        raise exception 'complete_ledger_setup merchants smoke test failed';
    end if;

    -- GUC 在 RPC 结束后不再生效。
    if coalesce(current_setting('app.ledger_setup_completion_ledger_id', true), '') <> ''
       or current_setting('app.allow_ledger_setup_update', true) is distinct from 'false' then
        raise exception 'complete_ledger_setup must reset GUC';
    end if;

    -- 完成后权限函数恢复正常：可记账、可邀请。
    if not public.current_user_can_manage_ledger(v_setup_ledger_id)
       or not public.current_user_can_write_ledger(v_setup_ledger_id) then
        raise exception 'completed ledger permission smoke test failed';
    end if;

    select id into v_category_id
      from public.category
     where ledger_id = v_setup_ledger_id and type = 'expense' and parent_id is not null
     order by sort_order, id
     limit 1;
    select id into v_account_id
      from public.account
     where ledger_id = v_setup_ledger_id and type = 'cash';

    perform public.create_transaction(
        v_setup_ledger_id,
        'expense',
        pg_catalog.now(),
        jsonb_build_array(jsonb_build_object('amount', '100', 'categoryId', v_category_id::text)),
        v_account_id,
        v_amazon_id,
        'Completed ledger smoke'
    );

    v_placeholder_id := public.create_ledger_placeholder_member(v_setup_ledger_id, 'Completed Placeholder');
    select invite.token
      into v_token
      from public.create_ledger_invite_v2(v_setup_ledger_id, 'member', v_placeholder_id) invite;
    if v_token is null then
        raise exception 'completed ledger invite smoke test failed';
    end if;

    -- 再次完成被拒（账本已 completed）。
    perform pg_temp.expect_error(
        'complete_ledger_setup twice',
        format('select public.complete_ledger_setup(%L, %L::jsonb)', v_setup_ledger_id, pg_temp.completion_payload()),
        '55000',
        'ledger_setup_not_in_progress'
    );

    -- 跳过账户与商家时也能完成。
    perform pg_temp.sign_in(v_other_id);
    select public.create_ledger_setup('Skipped Ledger', 'USD', 'Other', 'lime')
      into v_skip_ledger_id;
    perform public.complete_ledger_setup(
        v_skip_ledger_id,
        '{"accounts": [], "merchantTags": [], "merchants": [], "specialStatusEnabled": false}'::jsonb
    );

    if not exists (
        select 1
        from public.ledger l
        join public.app_user au on au.current_ledger_id = l.id and au.id = v_other_id
        where l.id = v_skip_ledger_id
          and l.setup_status = 'completed'
          and l.transaction_item_special_status_enabled = false
       )
       or (select count(*) from public.category where ledger_id = v_skip_ledger_id) <> 101
       or exists (select 1 from public.account where ledger_id = v_skip_ledger_id)
       or exists (select 1 from public.merchant where ledger_id = v_skip_ledger_id)
       or exists (select 1 from public.merchant_tags where ledger_id = v_skip_ledger_id) then
        raise exception 'complete_ledger_setup skipped smoke test failed';
    end if;
end;
$$;

-- 默认分类只在 ledger_default_categories() 中维护一份：
-- /ledgers/new 与完成写入创建的分类与抽出前完全一致，向导 RPC 返回的大分类与实际写入一致。
-- 指纹：每个分类按「type|父分类名|名称|icon|color|sort_order」拼成一行，
-- 按同样的列以 COLLATE "C"（码位顺序）排序后用换行连接，取 md5。
-- 排序必须固定为 "C"：数据库默认排序规则（本地 C.UTF-8、Supabase 的 ICU / en_US 等）
-- 对 emoji 与中文名称的顺序不同，会让同样的数据得到不同的指纹。
-- 期望值为抽出前（main）initialize_ledger_default_categories 写入结果（101 个分类）的指纹。
create function pg_temp.default_category_fingerprint(p_ledger_id uuid)
returns text
language sql
as $$
    select md5(string_agg(
        format('%s|%s|%s|%s|%s|%s', c.type, coalesce(parent.name, ''), c.name, c.icon_name, c.color, c.sort_order),
        E'\n'
        order by
            c.type collate "C",
            coalesce(parent.name, '') collate "C",
            c.sort_order,
            c.name collate "C"
    ))
    from public.category c
    left join public.category parent on parent.id = c.parent_id
    where c.ledger_id = p_ledger_id;
$$;

-- 分别断言分类总数、大分类数与指纹，失败时报出实际值。
create function pg_temp.assert_default_categories(p_label text, p_ledger_id uuid)
returns void
language plpgsql
as $$
declare
    v_expected_fingerprint constant text := '71bbe68f984544d84827496605aef755';
    v_total integer;
    v_roots integer;
    v_fingerprint text;
begin
    select count(*), count(*) filter (where parent_id is null)
      into v_total, v_roots
      from public.category
     where ledger_id = p_ledger_id;
    v_fingerprint := pg_temp.default_category_fingerprint(p_ledger_id);

    if v_total <> 101 then
        raise exception '% default category count changed: expected 101, got %', p_label, v_total;
    end if;
    if v_roots <> 12 then
        raise exception '% default root category count changed: expected 12, got %', p_label, v_roots;
    end if;
    if v_fingerprint is distinct from v_expected_fingerprint then
        raise exception '% default category fingerprint changed: expected %, got %',
            p_label, v_expected_fingerprint, v_fingerprint;
    end if;
end;
$$;

do $$
declare
    v_owner_id uuid := '39500000-0000-4000-8000-000000000021';
    v_legacy_ledger_id uuid;
    v_setup_ledger_id uuid;
    v_rpc_roots text;
    v_written_roots text;
begin
    perform pg_temp.create_test_user(v_owner_id, 'ledger-default-categories@example.invalid');
    perform pg_temp.sign_in(v_owner_id);

    select (public.create_ledger_with_owner_settings('Legacy Categories', 'JPY', 'Owner', 'jade')).id
      into v_legacy_ledger_id;

    select public.create_ledger_setup('Setup Categories', 'USD', 'Owner', 'sky')
      into v_setup_ledger_id;
    perform public.complete_ledger_setup(
        v_setup_ledger_id,
        '{"accounts": [], "merchantTags": [], "merchants": [], "specialStatusEnabled": false}'::jsonb
    );

    -- TEMP-DIAG 开始：CI 排查用的诊断输出，确认后删除。
    raise notice 'TEMP-DIAG collation %', (
        select to_jsonb(d) - 'datacl'
        from pg_database d
        where d.datname = current_database()
    );
    raise notice 'TEMP-DIAG legacy total=% roots=% fingerprint_c=% fingerprint_default_collation=%',
        (select count(*) from public.category where ledger_id = v_legacy_ledger_id),
        (select count(*) from public.category where ledger_id = v_legacy_ledger_id and parent_id is null),
        pg_temp.default_category_fingerprint(v_legacy_ledger_id),
        (
            select md5(string_agg(
                format('%s|%s|%s|%s|%s|%s', c.type, coalesce(parent.name, ''), c.name, c.icon_name, c.color, c.sort_order),
                E'\n'
                order by c.type, coalesce(parent.name, ''), c.sort_order, c.name
            ))
            from public.category c
            left join public.category parent on parent.id = c.parent_id
            where c.ledger_id = v_legacy_ledger_id
        );
    raise notice 'TEMP-DIAG rows%', (
        select string_agg(
            E'\nTEMP-DIAG-ROW ' || format('%s|%s|%s|%s|%s|%s', c.type, coalesce(parent.name, ''), c.name, c.icon_name, c.color, c.sort_order),
            ''
            order by format('%s|%s|%s|%s|%s|%s', c.type, coalesce(parent.name, ''), c.name, c.icon_name, c.color, c.sort_order) collate "C"
        )
        from public.category c
        left join public.category parent on parent.id = c.parent_id
        where c.ledger_id = v_legacy_ledger_id
    );
    -- TEMP-DIAG 结束

    perform pg_temp.assert_default_categories('/ledgers/new', v_legacy_ledger_id);
    perform pg_temp.assert_default_categories('complete_ledger_setup', v_setup_ledger_id);

    select string_agg(format('%s|%s', r.name, r.sort_order), E'\n' order by r.sort_order)
      into v_rpc_roots
      from public.get_ledger_default_root_categories() r;
    select string_agg(format('%s|%s', c.name, c.sort_order), E'\n' order by c.sort_order)
      into v_written_roots
      from public.category c
     where c.ledger_id = v_setup_ledger_id
       and c.parent_id is null;

    if v_rpc_roots is null or v_rpc_roots is distinct from v_written_roots then
        raise exception 'get_ledger_default_root_categories must match written root categories';
    end if;

    -- 只读 RPC 只授予 authenticated；默认分类定义与初始化函数不对客户端开放。
    if not has_function_privilege('authenticated', 'public.get_ledger_default_root_categories()', 'execute')
       or has_function_privilege('anon', 'public.get_ledger_default_root_categories()', 'execute')
       or has_function_privilege('authenticated', 'public.ledger_default_categories()', 'execute')
       or has_function_privilege('anon', 'public.ledger_default_categories()', 'execute')
       or has_function_privilege('authenticated', 'public.initialize_ledger_default_categories(uuid, uuid)', 'execute') then
        raise exception 'default category function privileges smoke test failed';
    end if;
end;
$$;

rollback;
