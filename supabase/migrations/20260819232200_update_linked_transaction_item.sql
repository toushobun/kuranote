-- Issue #574 PR1：提供已关联明细的原子编辑 RPC 和 updated_at 乐观锁。

create or replace function public.update_linked_transaction_item(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_item_id uuid,
    p_expected_updated_at timestamptz,
    p_amount numeric,
    p_account_id uuid,
    p_category_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_item public.transaction_item;
    v_category_type text;
    v_old_balance_delta numeric(14,2);
    v_new_balance_delta numeric(14,2);
    v_reimbursement_target_id uuid;
    v_refund_target_id uuid;
    v_is_reimbursement_target boolean;
    v_is_refund_target boolean;
    v_is_reimbursement_income boolean;
    v_is_refund_income boolean;
    v_related_item_ids uuid[] := array[]::uuid[];
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
    v_previous_reimbursement_link_flow text :=
        current_setting('kuranote.reimbursement_link_flow', true);
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    if p_expected_updated_at is null then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    if p_amount is null or p_amount < 0 or p_amount <> round(p_amount, 2) then
        raise exception 'amount_invalid'
            using errcode = '22023', detail = 'amount_invalid';
    end if;

    perform 1
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    select link.target_expense_item_id
    into v_reimbursement_target_id
    from public.transaction_item_reimbursement_link link
    where link.ledger_id = p_ledger_id
      and link.reimbursement_income_item_id = p_transaction_item_id;
    v_is_reimbursement_income := found;

    select link.refunded_item_id
    into v_refund_target_id
    from public.transaction_item_refund_link link
    where link.ledger_id = p_ledger_id
      and link.refund_income_item_id = p_transaction_item_id;
    v_is_refund_income := found;

    select exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = p_ledger_id
          and link.target_expense_item_id = p_transaction_item_id
    ) into v_is_reimbursement_target;

    select exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = p_ledger_id
          and link.refunded_item_id = p_transaction_item_id
    ) into v_is_refund_target;

    v_related_item_ids := array[p_transaction_item_id]::uuid[];
    if v_reimbursement_target_id is not null then
        v_related_item_ids := array_append(v_related_item_ids, v_reimbursement_target_id);
    end if;
    if v_refund_target_id is not null then
        v_related_item_ids := array_append(v_related_item_ids, v_refund_target_id);
    end if;

    perform 1
    from public.transaction_item item
    where item.ledger_id = p_ledger_id
      and item.id = any(v_related_item_ids)
    order by item.id
    for update;

    select item.*
    into v_item
    from public.transaction_item item
    join public.transaction_record record
      on record.id = item.transaction_record_id
     and record.ledger_id = item.ledger_id
     and record.status = 'active'
    where item.ledger_id = p_ledger_id
      and item.id = p_transaction_item_id
      and item.transaction_record_id = p_transaction_record_id;

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    if v_item.updated_at is distinct from p_expected_updated_at then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    if not (
        v_item.special_status is not null
        or v_is_reimbursement_target
        or v_is_refund_target
        or v_is_reimbursement_income
        or v_is_refund_income
    ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    select c.type
    into v_category_type
    from public.category c
    where c.id = p_category_id
      and c.ledger_id = p_ledger_id
      and c.is_archived = false
      and c.parent_id is not null;

    if v_category_type is null then
        raise exception 'category_invalid'
            using errcode = '22023', detail = 'category_invalid';
    end if;

    if (v_item.special_status is not null
        or v_is_reimbursement_target
        or v_is_refund_target)
       and v_category_type is distinct from 'expense' then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    if (v_is_reimbursement_income or v_is_refund_income)
       and v_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if not exists (
        select 1
        from public.account a
        where a.id = p_account_id
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
    ) then
        raise exception 'account_invalid'
            using errcode = '22023', detail = 'account_invalid';
    end if;

    -- 复用触发器中的最终一致性校验：退款要求同账户，报销只要求同币种。
    v_old_balance_delta := v_item.balance_delta;
    v_new_balance_delta := case
        when v_category_type = 'expense' then -p_amount
        else p_amount
    end;

    if (v_is_reimbursement_income or v_is_refund_income) and p_amount <= 0 then
        raise exception 'amount_invalid'
            using errcode = '22023', detail = 'amount_invalid';
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);
    perform set_config('kuranote.reimbursement_link_flow', 'on', true);

    update public.transaction_item item
    set account_id = p_account_id,
        category_id = p_category_id,
        amount = p_amount,
        balance_delta = v_new_balance_delta,
        updated_by = v_user_id,
        updated_at = now()
    where item.ledger_id = p_ledger_id
      and item.id = p_transaction_item_id;

    if v_item.account_id is distinct from p_account_id then
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_item.account_id,
            -v_old_balance_delta,
            v_user_id
        );
        perform public.apply_account_balance_delta(
            p_ledger_id,
            p_account_id,
            v_new_balance_delta,
            v_user_id
        );
    else
        perform public.apply_account_balance_delta(
            p_ledger_id,
            p_account_id,
            v_new_balance_delta - v_old_balance_delta,
            v_user_id
        );
    end if;

    if v_is_reimbursement_income then
        update public.transaction_item_reimbursement_link link
        set reimbursement_amount = p_amount
        where link.ledger_id = p_ledger_id
          and link.reimbursement_income_item_id = p_transaction_item_id;
    elsif v_is_refund_income then
        update public.transaction_item_refund_link link
        set refund_amount = p_amount
        where link.ledger_id = p_ledger_id
          and link.refund_income_item_id = p_transaction_item_id;
    else
        -- 母项只改 base amount；关联行完全不动，只重算派生状态。
        perform public.recalculate_transaction_item_settlement_status(
            p_ledger_id,
            p_transaction_item_id
        );
    end if;

    perform set_config(
        'kuranote.reimbursement_link_flow',
        coalesce(v_previous_reimbursement_link_flow, 'off'),
        true
    );
    perform set_config(
        'kuranote.income_link_edit_flow',
        coalesce(v_previous_income_link_edit_flow, 'off'),
        true
    );
end;
$$;

revoke all on function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) from public, anon;
grant execute on function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) to authenticated;
