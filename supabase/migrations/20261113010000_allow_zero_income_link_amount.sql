-- Issue #1086：退款 / 报销允许以 0 金额建立待定关联，后续可编辑补金额。
-- 现有非负金额校验仍生效；不改变负数、币种、分类及关联目标的校验。

alter table public.transaction_item_refund_link
    drop constraint transaction_item_refund_link_refund_amount_check;
alter table public.transaction_item_refund_link
    add constraint transaction_item_refund_link_refund_amount_check
        check (refund_amount >= 0);

alter table public.transaction_item_reimbursement_link
    drop constraint transaction_item_reimbursement_link_amount_check;
alter table public.transaction_item_reimbursement_link
    add constraint transaction_item_reimbursement_link_amount_check
        check (reimbursement_amount >= 0);

-- 新增报销为零时同样建立关联行，但不触发额外的手工状态修改。
-- 原支出派生剩余通过现有链接触发器按金额合计重新计算。
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

    select ti.amount, c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
    into v_income_amount, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
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
        select ti.special_status, c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
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


        if v_reimbursement_amount > 0 then
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
        if v_income_amount < 0 then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
        into v_refund_target_type, v_refund_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
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

-- 编辑已有的零金额关联仍走既有乐观锁、目标校验和关联更新流程。
CREATE OR REPLACE FUNCTION "public"."update_linked_transaction_item_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_item_id" "uuid", "p_expected_updated_at" timestamp with time zone, "p_amount" numeric, "p_category_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_item public.transaction_item;
    v_category_type text;
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

    -- 退款 / 报销都只要求同币种（#899），由付款明细的记录级延迟校验保证。
    perform set_config('kuranote.income_link_edit_flow', 'on', true);
    perform set_config('kuranote.reimbursement_link_flow', 'on', true);

    update public.transaction_item item
    set category_id = p_category_id,
        amount = p_amount,
        updated_by = v_user_id,
        updated_at = now()
    where item.ledger_id = p_ledger_id
      and item.id = p_transaction_item_id;

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

-- 零金额链接只保留关联关系，不应使原支出状态或版本产生虚假变化。
CREATE OR REPLACE FUNCTION "public"."recalculate_refund_link_target_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(old.ledger_id) then
        return old;
    end if;
    if tg_op in ('DELETE', 'UPDATE') and old.refund_amount > 0 then
        perform public.recalculate_transaction_item_settlement_status(
            old.ledger_id,
            old.refunded_item_id
        );
    end if;

    if tg_op in ('INSERT', 'UPDATE')
       and new.refund_amount > 0
       and (
           tg_op = 'INSERT'
           or new.ledger_id is distinct from old.ledger_id
           or new.refunded_item_id is distinct from old.refunded_item_id
           or new.refund_amount is distinct from old.refund_amount
           or new.refund_income_item_id is distinct from old.refund_income_item_id
       ) then
        perform public.recalculate_transaction_item_settlement_status(
            new.ledger_id,
            new.refunded_item_id
        );
    end if;

    return coalesce(new, old);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."recalculate_reimbursement_link_target_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(old.ledger_id) then
        return old;
    end if;
    if tg_op in ('DELETE', 'UPDATE') and old.reimbursement_amount > 0 then
        perform public.recalculate_transaction_item_settlement_status(
            old.ledger_id,
            old.target_expense_item_id
        );
    end if;

    if tg_op in ('INSERT', 'UPDATE')
       and new.reimbursement_amount > 0
       and (
           tg_op = 'INSERT'
           or new.ledger_id is distinct from old.ledger_id
           or new.target_expense_item_id is distinct from old.target_expense_item_id
           or new.reimbursement_amount is distinct from old.reimbursement_amount
           or new.reimbursement_income_item_id is distinct from
              old.reimbursement_income_item_id
       ) then
        perform public.recalculate_transaction_item_settlement_status(
            new.ledger_id,
            new.target_expense_item_id
        );
    end if;

    return coalesce(new, old);
end;
$$;
