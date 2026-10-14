-- #899：退款与报销统一为同币种账户约束。

CREATE OR REPLACE FUNCTION "public"."apply_transaction_item_links"("p_ledger_id" "uuid", "p_income_item_id" "uuid", "p_item" "jsonb", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_income_amount numeric(14,2);
    v_income_category_type text;
    v_income_currency text;
    v_reimbursement_target_id uuid;
    v_reimbursement_target_type text;
    v_reimbursement_target_currency text;
    v_reimbursement_target_status public.transaction_item_special_status;
    v_reimbursement_amount numeric(14,2);
    v_refund_target_id uuid;
    v_refund_target_type text;
    v_refund_target_currency text;
    v_refund_amount numeric(14,2);
    v_special_status_enabled boolean;
begin
    begin
        v_refund_target_id := nullif(p_item ->> 'refundedItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
    end;

    begin
        v_reimbursement_target_id :=
            nullif(p_item ->> 'reimbursementItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'reimbursement_item_invalid'
                using errcode = '22023', detail = 'reimbursement_item_invalid';
    end;

    if v_reimbursement_target_id is null and v_refund_target_id is null then
        return;
    end if;

    select l.transaction_item_special_status_enabled
    into v_special_status_enabled
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    if v_special_status_enabled is distinct from true then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    select ti.amount, c.type, a.currency
    into v_income_amount, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_reimbursement_target_id is not null and v_refund_target_id is not null then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_reimbursement_target_id is not null then
        select ti.special_status, c.type, a.currency
        into
            v_reimbursement_target_status,
            v_reimbursement_target_type,
            v_reimbursement_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        where ti.ledger_id = p_ledger_id
          and ti.id = v_reimbursement_target_id
        for update of ti, tr;

        if not found
           or v_reimbursement_target_type is distinct from 'expense'
           or v_reimbursement_target_status is null
           or v_reimbursement_target_status not in (
               'pending_reimbursement',
               'reimbursed',
               'reimbursement_surplus'
           ) then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if v_reimbursement_target_currency is distinct from v_income_currency then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        if exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = p_ledger_id
              and link.refund_income_item_id = p_income_item_id
        ) then
            raise exception 'income_link_conflict'
                using errcode = '22023', detail = 'income_link_conflict';
        end if;

        v_reimbursement_amount := v_income_amount;

        if v_reimbursement_amount > 0 then
            insert into public.transaction_item_reimbursement_link (
                ledger_id,
                target_expense_item_id,
                reimbursement_income_item_id,
                reimbursement_amount,
                created_by
            ) values (
                p_ledger_id,
                v_reimbursement_target_id,
                p_income_item_id,
                v_reimbursement_amount,
                p_user_id
            );

            perform set_config('kuranote.reimbursement_link_flow', 'on', true);

            update public.transaction_item target_item
            set special_status = case
                    when public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        v_reimbursement_target_id
                    ) > 0
                    then 'pending_reimbursement'::public.transaction_item_special_status
                    when public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        v_reimbursement_target_id
                    ) = 0
                    then 'reimbursed'::public.transaction_item_special_status
                    else 'reimbursement_surplus'::public.transaction_item_special_status
                end,
                updated_by = p_user_id,
                updated_at = now()
            where target_item.ledger_id = p_ledger_id
              and target_item.id = v_reimbursement_target_id;

            perform set_config('kuranote.reimbursement_link_flow', 'off', true);
        end if;
    end if;

    if v_refund_target_id is not null then
        if v_income_amount <= 0 then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        select c.type, a.currency
        into v_refund_target_type, v_refund_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        where ti.ledger_id = p_ledger_id
          and ti.id = v_refund_target_id
        for update of ti, tr;

        if not found or v_refund_target_type is distinct from 'expense' then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if v_refund_target_currency is distinct from v_income_currency then
            raise exception 'refund_currency_mismatch'
                using errcode = '22023', detail = 'refund_currency_mismatch';
        end if;

        if exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = p_ledger_id
              and link.reimbursement_income_item_id = p_income_item_id
        ) then
            raise exception 'income_link_conflict'
                using errcode = '22023', detail = 'income_link_conflict';
        end if;

        v_refund_amount := v_income_amount;

        insert into public.transaction_item_refund_link (
            ledger_id,
            refunded_item_id,
            refund_income_item_id,
            refund_amount,
            created_by
        ) values (
            p_ledger_id,
            v_refund_target_id,
            p_income_item_id,
            v_refund_amount,
            p_user_id
        );
    end if;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."validate_linked_transaction_item_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_is_reimbursement_target boolean;
    v_is_reimbursement_income boolean;
    v_is_refund_target boolean;
    v_is_refund_income boolean;
    v_new_category_type text;
    v_new_account_currency text;
    v_controlled_link_edit boolean :=
        coalesce(current_setting('kuranote.income_link_edit_flow', true) = 'on', false)
        or coalesce(
            current_setting('kuranote.reimbursement_link_flow', true) = 'on',
            false
        );
begin
    select
        exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = old.ledger_id
              and link.target_expense_item_id = old.id
        ),
        exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = old.ledger_id
              and link.reimbursement_income_item_id = old.id
        ),
        exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = old.ledger_id
              and link.refunded_item_id = old.id
        ),
        exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = old.ledger_id
              and link.refund_income_item_id = old.id
        )
    into
        v_is_reimbursement_target,
        v_is_reimbursement_income,
        v_is_refund_target,
        v_is_refund_income;

    if tg_op = 'DELETE' then
        if v_is_reimbursement_target
           or v_is_reimbursement_income
           or v_is_refund_target
           or v_is_refund_income then
            raise exception 'linked_transaction_edit_forbidden'
                using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
        end if;
        return old;
    end if;

    if new.amount is not distinct from old.amount
       and new.account_id is not distinct from old.account_id
       and new.category_id is not distinct from old.category_id then
        return new;
    end if;

    if not (
        old.special_status is not null
        or v_is_reimbursement_target
        or v_is_reimbursement_income
        or v_is_refund_target
        or v_is_refund_income
    ) then
        return new;
    end if;

    -- 只有仍存在关联的明细需要受控解锁；仅保留待报销标记但已无关联的母项
    -- 继续允许普通金额编辑，special_status 本身仍由专用状态触发器保护。
    if (v_is_reimbursement_target
        or v_is_reimbursement_income
        or v_is_refund_target
        or v_is_refund_income)
       and not v_controlled_link_edit then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    if new.category_id is distinct from old.category_id then
        select c.type
        into v_new_category_type
        from public.category c
        where c.id = new.category_id
          and c.ledger_id = new.ledger_id
          and c.is_archived = false
          and c.parent_id is not null;

        if v_new_category_type is null then
            raise exception 'category_invalid'
                using errcode = '22023', detail = 'category_invalid';
        end if;

        if (old.special_status is not null
            or v_is_reimbursement_target
            or v_is_refund_target)
           and v_new_category_type is distinct from 'expense' then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        if (v_is_reimbursement_income or v_is_refund_income)
           and v_new_category_type is distinct from 'income' then
            raise exception 'income_link_category_invalid'
                using errcode = '22023', detail = 'income_link_category_invalid';
        end if;
    end if;

    if new.account_id is distinct from old.account_id then
        select a.currency
        into v_new_account_currency
        from public.account a
        where a.id = new.account_id
          and a.ledger_id = new.ledger_id
          and a.is_archived = false;

        if v_new_account_currency is null then
            raise exception 'account_invalid'
                using errcode = '22023', detail = 'account_invalid';
        end if;

        if (v_is_refund_income or v_is_refund_target)
           and exists (
               select 1
               from public.transaction_item_refund_link link
               join public.transaction_item counterpart_item
                 on counterpart_item.id = case
                     when link.refund_income_item_id = old.id
                     then link.refunded_item_id
                     else link.refund_income_item_id
                 end
                and counterpart_item.ledger_id = link.ledger_id
               join public.account counterpart_account
                 on counterpart_account.id = counterpart_item.account_id
                and counterpart_account.ledger_id = counterpart_item.ledger_id
               where link.ledger_id = old.ledger_id
                 and (
                     link.refund_income_item_id = old.id
                     or link.refunded_item_id = old.id
                 )
                 and counterpart_account.currency is distinct from v_new_account_currency
           ) then
            raise exception 'refund_currency_mismatch'
                using errcode = '22023', detail = 'refund_currency_mismatch';
        end if;

        if (v_is_reimbursement_income or v_is_reimbursement_target)
           and exists (
               select 1
               from public.transaction_item_reimbursement_link link
               join public.transaction_item counterpart_item
                 on counterpart_item.id = case
                     when link.reimbursement_income_item_id = old.id
                     then link.target_expense_item_id
                     else link.reimbursement_income_item_id
                 end
                and counterpart_item.ledger_id = link.ledger_id
               join public.account counterpart_account
                 on counterpart_account.id = counterpart_item.account_id
                and counterpart_account.ledger_id = counterpart_item.ledger_id
               where link.ledger_id = old.ledger_id
                 and (
                     link.reimbursement_income_item_id = old.id
                     or link.target_expense_item_id = old.id
                 )
                 and counterpart_account.currency is distinct from v_new_account_currency
           ) then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;
    end if;

    return new;
end;
$$;
