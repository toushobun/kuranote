-- Issue #598：验证本轮重写的 SECURITY DEFINER 报销/退款关联路径。
-- 本文件不能依赖 seed；schema snapshot check 只回放 migrations。
-- 测试数据仅存在于当前事务，最终统一回滚。

begin;

do $$
declare
    v_user_id uuid := '59896000-0000-4000-8000-000000000001';
    v_ledger_id uuid;
    v_account_id uuid;
    v_merchant_id uuid;
    v_expense_category_id uuid;
    v_income_category_id uuid;
    v_link_amount numeric(14,2);
    v_status public.transaction_item_special_status;
    v_special_status_enabled boolean;
begin
    -- 按真实认证链路准备 owner，让既存 on_auth_user_created trigger 创建 app_user。
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
    ) values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        'issue-598-security-owner@example.invalid',
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
        '{"display_name": "Issue 598 SECURITY DEFINER Owner"}'::jsonb,
        false,
        false,
        false,
        pg_catalog.now(),
        pg_catalog.now()
    );

    perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        v_user_id::text,
        true
    );

    select (public.create_ledger_with_owner_settings(
        'Issue 598 SECURITY DEFINER Smoke',
        'JPY',
        'Owner',
        'jade'
    )).id
      into v_ledger_id;

    select public.create_account_with_holders(
        v_ledger_id,
        'Issue 598 SECURITY DEFINER Account',
        'cash',
        'JPY',
        0,
        array[v_user_id]
    )
      into v_account_id;

    insert into public.merchant (
        ledger_id,
        name,
        created_by,
        updated_by
    ) values (
        v_ledger_id,
        'Issue 598 SECURITY DEFINER Merchant',
        v_user_id,
        v_user_id
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

    select category.id
      into v_income_category_id
      from public.category category
     where category.ledger_id = v_ledger_id
       and category.type = 'income'
       and category.parent_id is not null
       and category.is_archived = false
     order by category.sort_order, category.id
     limit 1;

    if v_expense_category_id is null or v_income_category_id is null then
        raise exception 'Issue #598 smoke category fixture not found';
    end if;

    update public.ledger
       set transaction_item_special_status_enabled = true
     where id = v_ledger_id;

    insert into public.transaction_record (
        id,
        ledger_id,
        type,
        status,
        transaction_at,
        merchant_id,
        title,
        created_by,
        updated_by
    ) values
        (
            '59894000-0000-4000-8000-000000000001',
            v_ledger_id,
            'normal',
            'active',
            '2026-08-18 07:00:00+00',
            v_merchant_id,
            'Issue 598 SECURITY DEFINER target',
            v_user_id,
            v_user_id
        ),
        (
            '59894000-0000-4000-8000-000000000002',
            v_ledger_id,
            'normal',
            'active',
            '2026-08-18 08:00:00+00',
            v_merchant_id,
            'Issue 598 SECURITY DEFINER reimbursement/refund',
            v_user_id,
            v_user_id
        );

    insert into public.transaction_item (
        id,
        ledger_id,
        transaction_record_id,
        account_id,
        category_id,
        amount,
        discount_amount,
        balance_delta,
        sort_order,
        special_status,
        created_by,
        updated_by
    ) values
        (
            '59895000-0000-4000-8000-000000000001',
            v_ledger_id,
            '59894000-0000-4000-8000-000000000001',
            v_account_id,
            v_expense_category_id,
            100,
            0,
            -100,
            0,
            'pending_reimbursement',
            v_user_id,
            v_user_id
        ),
        (
            '59895000-0000-4000-8000-000000000002',
            v_ledger_id,
            '59894000-0000-4000-8000-000000000002',
            v_account_id,
            v_income_category_id,
            40,
            0,
            40,
            0,
            null,
            v_user_id,
            v_user_id
        );

    -- 先覆盖报销路径：部分核销、冻结防线、开关关闭防线与受控清理。
    perform public.apply_transaction_item_links(
        v_ledger_id,
        '59895000-0000-4000-8000-000000000002',
        pg_catalog.jsonb_build_object(
            'reimbursementItemId',
            '59895000-0000-4000-8000-000000000001'
        ),
        v_user_id
    );

    select link.reimbursement_amount
      into v_link_amount
      from public.transaction_item_reimbursement_link link
     where link.reimbursement_income_item_id =
           '59895000-0000-4000-8000-000000000002';

    if v_link_amount is distinct from 40 then
        raise exception 'apply_transaction_item_links reimbursement smoke test failed';
    end if;

    select item.special_status
      into v_status
      from public.transaction_item item
     where item.id = '59895000-0000-4000-8000-000000000001';

    if v_status is distinct from 'pending_reimbursement' then
        raise exception 'reimbursement partial settlement smoke test failed';
    end if;

    begin
        update public.transaction_item
           set amount = 99
         where id = '59895000-0000-4000-8000-000000000001';

        raise exception 'validate_linked_transaction_item_mutation did not reject update';
    exception
        when sqlstate 'P0001' then
            if sqlerrm <> 'linked_transaction_edit_forbidden' then
                raise;
            end if;
    end;

    begin
        update public.ledger
           set transaction_item_special_status_enabled = false
         where id = v_ledger_id;

        raise exception 'prevent_disable_special_status_with_active_items did not reject reimbursement disable';
    exception
        when sqlstate '55006' then
            if sqlerrm <> 'special_status_has_active_items' then
                raise;
            end if;
    end;

    perform public.clear_transaction_item_income_links(
        v_ledger_id,
        '59895000-0000-4000-8000-000000000002',
        v_user_id
    );

    if exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.reimbursement_income_item_id =
              '59895000-0000-4000-8000-000000000002'
    ) then
        raise exception 'clear_transaction_item_income_links reimbursement smoke test failed';
    end if;

    select item.special_status
      into v_status
      from public.transaction_item item
     where item.id = '59895000-0000-4000-8000-000000000001';

    if v_status is distinct from 'pending_reimbursement' then
        raise exception 'clear_transaction_item_income_links reimbursement target status smoke test failed';
    end if;

    -- 清空报销关系后退出报销流程，再用同一组明细覆盖普通支出退款路径。
    update public.transaction_item
       set special_status = null,
           updated_by = v_user_id,
           updated_at = pg_catalog.now()
     where id = '59895000-0000-4000-8000-000000000001';

    select item.special_status
      into v_status
      from public.transaction_item item
     where item.id = '59895000-0000-4000-8000-000000000001';

    if v_status is not null then
        raise exception 'reimbursement target did not return to normal status before refund smoke';
    end if;

    perform public.apply_transaction_item_links(
        v_ledger_id,
        '59895000-0000-4000-8000-000000000002',
        pg_catalog.jsonb_build_object(
            'refundAllocations',
            pg_catalog.jsonb_build_array(
                pg_catalog.jsonb_build_object(
                    'refundedItemId',
                    '59895000-0000-4000-8000-000000000001',
                    'refundAmount',
                    40
                )
            )
        ),
        v_user_id
    );

    select link.refund_amount
      into v_link_amount
      from public.transaction_item_refund_link link
     where link.refund_income_item_id =
           '59895000-0000-4000-8000-000000000002';

    if v_link_amount is distinct from 40 then
        raise exception 'apply_transaction_item_links refund smoke test failed';
    end if;

    select item.special_status
      into v_status
      from public.transaction_item item
     where item.id = '59895000-0000-4000-8000-000000000001';

    if v_status is not null then
        raise exception 'normal expense refund unexpectedly changed special_status';
    end if;

    -- 这一段必须只靠活跃退款关联阻止关闭：目标支出仍是 special_status = NULL。
    begin
        update public.ledger
           set transaction_item_special_status_enabled = false
         where id = v_ledger_id;

        raise exception 'prevent_disable_special_status_with_active_items did not reject refund disable';
    exception
        when sqlstate '55006' then
            if sqlerrm <> 'special_status_has_active_items' then
                raise;
            end if;
    end;

    perform public.clear_transaction_item_income_links(
        v_ledger_id,
        '59895000-0000-4000-8000-000000000002',
        v_user_id
    );

    if exists (
        select 1
        from public.transaction_item_refund_link link
        where link.refund_income_item_id =
              '59895000-0000-4000-8000-000000000002'
    ) then
        raise exception 'clear_transaction_item_income_links refund smoke test failed';
    end if;

    select item.special_status
      into v_status
      from public.transaction_item item
     where item.id = '59895000-0000-4000-8000-000000000001';

    if v_status is not null then
        raise exception 'clear_transaction_item_income_links refund target status smoke test failed';
    end if;

    -- 所有关联清理后应允许正常关闭开关，证明前两次拒绝来自活跃状态/关联而非 fixture 本身。
    update public.ledger
       set transaction_item_special_status_enabled = false
     where id = v_ledger_id;

    select ledger.transaction_item_special_status_enabled
      into v_special_status_enabled
      from public.ledger ledger
     where ledger.id = v_ledger_id;

    if v_special_status_enabled is distinct from false then
        raise exception 'special status toggle did not disable after all links were cleared';
    end if;
end;
$$;

rollback;
