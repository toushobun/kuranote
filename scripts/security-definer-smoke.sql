-- Issue #435：对依赖 pgcrypto 的邀请 RPC 执行最小烟雾测试。
-- 测试数据仅存在于当前事务，最终统一回滚。

begin;

do $$
declare
    v_owner_id uuid := '43500000-0000-4000-8000-000000000001';
    v_member_id uuid := '43500000-0000-4000-8000-000000000002';
    v_ledger_id uuid;
    v_token text;
    v_preview_status text;
    v_accept_result text;
begin
    -- 按真实认证链路准备用户，让既存 on_auth_user_created trigger 创建 app_user。
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
    values
        (
            '00000000-0000-0000-0000-000000000000',
            v_owner_id,
            'authenticated',
            'authenticated',
            'security-owner@example.invalid',
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
            '{"display_name": "SECURITY DEFINER Owner"}'::jsonb,
            false,
            false,
            false,
            pg_catalog.now(),
            pg_catalog.now()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            v_member_id,
            'authenticated',
            'authenticated',
            'security-member@example.invalid',
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
            '{"display_name": "SECURITY DEFINER Member"}'::jsonb,
            false,
            false,
            false,
            pg_catalog.now(),
            pg_catalog.now()
        );

    if not exists (
        select 1
        from public.app_user app_user
        where app_user.id in (v_owner_id, v_member_id)
        having pg_catalog.count(*) = 2
    ) then
        raise exception 'on_auth_user_created fixture setup failed';
    end if;

    perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        v_owner_id::text,
        true
    );

    select (public.create_ledger_with_owner_settings(
        'SECURITY DEFINER Smoke',
        'JPY',
        'Owner',
        'jade'
    )).id
      into v_ledger_id;

    select invite.token
      into v_token
      from public.create_ledger_invite_v2(v_ledger_id, 'member') invite;

    if v_token is null or pg_catalog.length(v_token) <> 64 then
        raise exception 'create_ledger_invite_v2 smoke test failed';
    end if;

    perform pg_catalog.set_config('request.jwt.claim.sub', '', true);

    select preview.invite_status
      into v_preview_status
      from public.get_ledger_invite_preview(v_token) preview;

    if v_preview_status <> 'valid' then
        raise exception 'get_ledger_invite_preview smoke test failed: %',
            v_preview_status;
    end if;

    perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        v_member_id::text,
        true
    );

    select accepted.result
      into v_accept_result
      from public.accept_ledger_invite(v_token) accepted;

    if v_accept_result <> 'joined' then
        raise exception 'accept_ledger_invite smoke test failed: %',
            v_accept_result;
    end if;

    if not exists (
        select 1
        from public.ledger_member member
        where member.ledger_id = v_ledger_id
          and member.user_id = v_member_id
          and member.status = 'active'
          and member.role = 'member'
    ) then
        raise exception 'accept_ledger_invite member state smoke test failed';
    end if;
end;
$$;

rollback;
