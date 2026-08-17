-- Issue #598：验证本轮重写的 SECURITY DEFINER 报销/退款关联路径。
-- 测试数据仅存在于当前事务，最终统一回滚。

begin;

do $$
declare
    v_ledger_id uuid := '00000000-0000-4000-8000-000000000032';
    v_user_id uuid := '00000000-0000-4000-8000-000000000031';
    v_account_id uuid := '00000000-0000-4000-8000-000000000043';
    v_expense_category_id uuid := '00000000-0000-4000-8000-000000005021';
    v_income_category_id uuid := '00000000-0000-4000-8000-000000005002';
    v_merchant_id uuid;
    v_link_amount numeric(14,2);
    v_status public.transaction_item_special_status;
begin
    select merchant.id
      into v_merchant_id
      from public.merchant merchant
     where merchant.ledger_id = v_ledger_id
       and merchant.is_archived = false
     order by merchant.created_at, merchant.id
     limit 1;

    if v_merchant_id is null then
        raise exception 'Issue #598 smoke merchant fixture not found';
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
            'Issue 598 SECURITY DEFINER reimbursement',
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

        raise exception 'prevent_disable_special_status_with_active_items did not reject disable';
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
        raise exception 'clear_transaction_item_income_links smoke test failed';
    end if;

    select item.special_status
      into v_status
      from public.transaction_item item
     where item.id = '59895000-0000-4000-8000-000000000001';

    if v_status is distinct from 'pending_reimbursement' then
        raise exception 'clear_transaction_item_income_links target status smoke test failed';
    end if;
end;
$$;

rollback;
