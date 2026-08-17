-- Issue #435：对 SECURITY DEFINER 的账户、交易、转换、作废、转账、trigger 与邀请路径执行运行时烟雾测试。
-- 测试数据仅存在于当前事务，最终统一回滚。

begin;

do $$
declare
    v_owner_id uuid := '43500000-0000-4000-8000-000000000001';
    v_member_id uuid := '43500000-0000-4000-8000-000000000002';
    v_ledger_id uuid;
    v_account_id uuid;
    v_transfer_account_id uuid;
    v_merchant_id uuid;
    v_expense_category_id uuid;
    v_transaction_id uuid;
    v_transfer_transaction_id uuid;
    v_result_id uuid;
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

    -- 账户 RPC 会同时触发账户初始化和基础数据管理权限 trigger。
    select public.create_account_with_holders(
        v_ledger_id,
        'SECURITY DEFINER Account',
        'cash',
        'JPY',
        100,
        array[v_owner_id]
    )
      into v_account_id;

    select public.create_account_with_holders(
        v_ledger_id,
        'SECURITY DEFINER Transfer Account',
        'bank',
        'JPY',
        50,
        array[v_owner_id]
    )
      into v_transfer_account_id;

    if not exists (
        select 1
        from public.account account
        where account.id = v_account_id
          and account.ledger_id = v_ledger_id
          and account.initial_balance = 100
          and account.current_balance = 100
    ) then
        raise exception 'create_account_with_holders smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account account
        where account.id = v_transfer_account_id
          and account.ledger_id = v_ledger_id
          and account.initial_balance = 50
          and account.current_balance = 50
    ) then
        raise exception 'create_account_with_holders transfer account smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account_holder holder
        where holder.account_id = v_account_id
          and holder.user_id = v_owner_id
          and holder.role = 'owner'
    ) then
        raise exception 'create_account_with_holders holder smoke test failed';
    end if;

    -- 普通交易要求关联商家；该写入同时经过基础数据权限 trigger。
    insert into public.merchant (
        ledger_id,
        name,
        created_by,
        updated_by
    )
    values (
        v_ledger_id,
        'SECURITY DEFINER Merchant',
        v_owner_id,
        v_owner_id
    )
    returning id into v_merchant_id;

    select category.id
      into v_expense_category_id
      from public.category category
     where category.ledger_id = v_ledger_id
       and category.type = 'expense'
       and category.parent_id is not null
       and category.is_archived = false
     order by category.sort_order, category.id
     limit 1;

    if v_expense_category_id is null then
        raise exception 'default expense category fixture setup failed';
    end if;

    -- 交易 RPC 会进一步执行余额同步及交易表 trigger。
    select public.create_transaction(
        v_ledger_id,
        'expense',
        pg_catalog.now(),
        pg_catalog.jsonb_build_array(
            pg_catalog.jsonb_build_object(
                'amount',
                '12.34',
                'categoryId',
                v_expense_category_id::text
            )
        ),
        v_account_id,
        v_merchant_id,
        'SECURITY DEFINER Smoke'
    )
      into v_transaction_id;

    if not exists (
        select 1
        from public.transaction_record record
        where record.id = v_transaction_id
          and record.ledger_id = v_ledger_id
          and record.merchant_id = v_merchant_id
          and record.status = 'active'
          and record.created_by = v_owner_id
    ) then
        raise exception 'create_transaction record smoke test failed';
    end if;

    if not exists (
        select 1
        from public.transaction_item item
        where item.transaction_record_id = v_transaction_id
          and item.account_id = v_account_id
          and item.category_id = v_expense_category_id
          and item.amount = 12.34
          and item.balance_delta = -12.34
    ) then
        raise exception 'create_transaction item smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account account
        where account.id = v_account_id
          and account.current_balance = 87.66
    ) then
        raise exception 'apply_account_balance_delta smoke test failed';
    end if;

    -- 普通交易转换为转账：先回滚原支出，再写入转出/转入两条明细。
    select public.convert_transaction_type(
        p_ledger_id => v_ledger_id,
        p_transaction_record_id => v_transaction_id,
        p_target_type => 'transfer',
        p_transaction_at => pg_catalog.now(),
        p_note => 'SECURITY DEFINER Converted Transfer',
        p_from_account_id => v_account_id,
        p_to_account_id => v_transfer_account_id,
        p_transfer_amount => 20
    )
      into v_result_id;

    if v_result_id <> v_transaction_id then
        raise exception 'convert_transaction_type returned unexpected transaction id';
    end if;

    if not exists (
        select 1
        from public.transaction_record record
        where record.id = v_transaction_id
          and record.type = 'transfer'
          and record.status = 'active'
          and record.merchant_id is null
          and record.note = 'SECURITY DEFINER Converted Transfer'
    ) then
        raise exception 'convert_transaction_type record smoke test failed';
    end if;

    if (
        select pg_catalog.count(*)
        from public.transaction_item item
        where item.transaction_record_id = v_transaction_id
    ) <> 2
       or not exists (
           select 1
           from public.transaction_item item
           where item.transaction_record_id = v_transaction_id
             and item.account_id = v_account_id
             and item.category_id is null
             and item.amount = 20
             and item.balance_delta = -20
       )
       or not exists (
           select 1
           from public.transaction_item item
           where item.transaction_record_id = v_transaction_id
             and item.account_id = v_transfer_account_id
             and item.category_id is null
             and item.amount = 20
             and item.balance_delta = 20
       ) then
        raise exception 'convert_transaction_type items smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account account
        where account.id = v_account_id
          and account.current_balance = 80
    ) or not exists (
        select 1
        from public.account account
        where account.id = v_transfer_account_id
          and account.current_balance = 70
    ) then
        raise exception 'convert_transaction_type balance smoke test failed';
    end if;

    -- 作废转换后的转账，验证两侧余额均被冲回。
    select public.void_transaction(v_ledger_id, v_transaction_id)
      into v_result_id;

    if v_result_id <> v_transaction_id then
        raise exception 'void_transaction returned unexpected transaction id';
    end if;

    if not exists (
        select 1
        from public.transaction_record record
        where record.id = v_transaction_id
          and record.status = 'deleted'
          and record.deleted_by = v_owner_id
          and record.deleted_at is not null
    ) then
        raise exception 'void_transaction record smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account account
        where account.id = v_account_id
          and account.current_balance = 100
    ) or not exists (
        select 1
        from public.account account
        where account.id = v_transfer_account_id
          and account.current_balance = 50
    ) then
        raise exception 'void_transaction balance smoke test failed';
    end if;

    -- 单独创建转账，验证一条转出和一条转入明细及两侧余额。
    select public.create_transfer_transaction(
        v_ledger_id,
        pg_catalog.now(),
        10,
        v_account_id,
        v_transfer_account_id,
        'SECURITY DEFINER Transfer'
    )
      into v_transfer_transaction_id;

    if not exists (
        select 1
        from public.transaction_record record
        where record.id = v_transfer_transaction_id
          and record.type = 'transfer'
          and record.status = 'active'
          and record.note = 'SECURITY DEFINER Transfer'
    ) then
        raise exception 'create_transfer_transaction record smoke test failed';
    end if;

    if (
        select pg_catalog.count(*)
        from public.transaction_item item
        where item.transaction_record_id = v_transfer_transaction_id
    ) <> 2
       or not exists (
           select 1
           from public.transaction_item item
           where item.transaction_record_id = v_transfer_transaction_id
             and item.account_id = v_account_id
             and item.amount = 10
             and item.balance_delta = -10
       )
       or not exists (
           select 1
           from public.transaction_item item
           where item.transaction_record_id = v_transfer_transaction_id
             and item.account_id = v_transfer_account_id
             and item.amount = 10
             and item.balance_delta = 10
       ) then
        raise exception 'create_transfer_transaction items smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account account
        where account.id = v_account_id
          and account.current_balance = 90
    ) or not exists (
        select 1
        from public.account account
        where account.id = v_transfer_account_id
          and account.current_balance = 60
    ) then
        raise exception 'create_transfer_transaction balance smoke test failed';
    end if;

    -- 更新转账会先冲回旧金额，再按新金额重建转出/转入明细。
    select public.update_transfer_transaction(
        v_ledger_id,
        v_transfer_transaction_id,
        pg_catalog.now(),
        15,
        v_account_id,
        v_transfer_account_id,
        'SECURITY DEFINER Updated Transfer'
    )
      into v_result_id;

    if v_result_id <> v_transfer_transaction_id then
        raise exception 'update_transfer_transaction returned unexpected transaction id';
    end if;

    if not exists (
        select 1
        from public.transaction_record record
        where record.id = v_transfer_transaction_id
          and record.type = 'transfer'
          and record.status = 'active'
          and record.note = 'SECURITY DEFINER Updated Transfer'
    ) then
        raise exception 'update_transfer_transaction record smoke test failed';
    end if;

    if (
        select pg_catalog.count(*)
        from public.transaction_item item
        where item.transaction_record_id = v_transfer_transaction_id
    ) <> 2
       or not exists (
           select 1
           from public.transaction_item item
           where item.transaction_record_id = v_transfer_transaction_id
             and item.account_id = v_account_id
             and item.amount = 15
             and item.balance_delta = -15
       )
       or not exists (
           select 1
           from public.transaction_item item
           where item.transaction_record_id = v_transfer_transaction_id
             and item.account_id = v_transfer_account_id
             and item.amount = 15
             and item.balance_delta = 15
       ) then
        raise exception 'update_transfer_transaction items smoke test failed';
    end if;

    if not exists (
        select 1
        from public.account account
        where account.id = v_account_id
          and account.current_balance = 85
    ) or not exists (
        select 1
        from public.account account
        where account.id = v_transfer_account_id
          and account.current_balance = 65
    ) then
        raise exception 'update_transfer_transaction balance smoke test failed';
    end if;

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

    -- member 可以记账但不能维护基础数据，直接更新商家应被 trigger 拒绝。
    begin
        update public.merchant
           set name = 'SECURITY DEFINER Trigger Bypass'
         where id = v_merchant_id;

        raise exception 'enforce_ledger_management_permission did not reject member update';
    exception
        when sqlstate '42501' then
            null;
    end;

    if not exists (
        select 1
        from public.merchant merchant
        where merchant.id = v_merchant_id
          and merchant.name = 'SECURITY DEFINER Merchant'
    ) then
        raise exception 'enforce_ledger_management_permission rollback smoke test failed';
    end if;
end;
$$;

rollback;
