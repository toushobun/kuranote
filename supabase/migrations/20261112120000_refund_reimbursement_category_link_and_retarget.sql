-- #944：交易系统分类和收入链接是一一匹配的不变量，延迟到写入 RPC 的事务末尾检查。
-- create_transaction 先插入明细、后创建链接，因此不能采用即时 BEFORE INSERT 校验。
create or replace function public.validate_income_system_category_link(
    p_ledger_id uuid,
    p_income_item_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_key text;
    v_type text;
    v_record_status text;
    v_has_refund boolean;
    v_has_reimbursement boolean;
begin
    select c.system_key, c.type, tr.status
    into v_key, v_type, v_record_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.ledger_id = p_ledger_id
      and ti.id = p_income_item_id;

    -- 作废交易保留历史明细，不强制其仍有有效链接。
    if not found or v_record_status <> 'active' then
        return;
    end if;

    select exists (
        select 1 from public.transaction_item_refund_link r
        where r.ledger_id = p_ledger_id
          and r.refund_income_item_id = p_income_item_id
    ) into v_has_refund;

    select exists (
        select 1 from public.transaction_item_reimbursement_link r
        where r.ledger_id = p_ledger_id
          and r.reimbursement_income_item_id = p_income_item_id
    ) into v_has_reimbursement;

    if (v_has_refund and (v_key is distinct from 'refund' or v_type <> 'income'))
       or (v_has_reimbursement and (v_key is distinct from 'reimbursement' or v_type <> 'income'))
       or (v_key = 'refund' and not v_has_refund)
       or (v_key = 'reimbursement' and not v_has_reimbursement)
       or (v_key = 'special_income') then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;
end;
$$;

revoke all on function public.validate_income_system_category_link(uuid, uuid)
    from public, anon, authenticated, service_role;

create or replace function public.check_income_system_category_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if tg_table_name = 'transaction_item' then
        perform public.validate_income_system_category_link(
            coalesce(new.ledger_id, old.ledger_id),
            coalesce(new.id, old.id)
        );
    elsif tg_table_name = 'transaction_item_refund_link' then
        perform public.validate_income_system_category_link(
            coalesce(new.ledger_id, old.ledger_id),
            coalesce(new.refund_income_item_id, old.refund_income_item_id)
        );
    else
        perform public.validate_income_system_category_link(
            coalesce(new.ledger_id, old.ledger_id),
            coalesce(new.reimbursement_income_item_id, old.reimbursement_income_item_id)
        );
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$$;

revoke all on function public.check_income_system_category_link()
    from public, anon, authenticated, service_role;

create constraint trigger transaction_item_income_system_category_link
after insert or update on public.transaction_item
deferrable initially deferred
for each row execute function public.check_income_system_category_link();

create constraint trigger refund_income_system_category_link
after insert or update or delete on public.transaction_item_refund_link
deferrable initially deferred
for each row execute function public.check_income_system_category_link();

create constraint trigger reimbursement_income_system_category_link
after insert or update or delete on public.transaction_item_reimbursement_link
deferrable initially deferred
for each row execute function public.check_income_system_category_link();

-- 编辑入口是唯一可公开调用的关联目标改选入口。

CREATE OR REPLACE FUNCTION "public"."update_linked_transaction_edit"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_at" timestamp with time zone, "p_merchant_id" "uuid", "p_note" "text", "p_item_updates" "jsonb", "p_payments" "jsonb", "p_expected_record_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_transaction_item_id uuid;
    v_expected_updated_at timestamptz;
    v_amount numeric;
    v_record_updated_at timestamptz;
    v_category_id uuid;
    v_old_refund_target uuid;
    v_old_reimbursement_target uuid;
    v_new_refund_target uuid;
    v_new_reimbursement_target uuid;
    v_new_target uuid;
    v_target_currency text;
    v_source_currency text;
    v_target_category_type text;
    v_target_status public.transaction_item_special_status;
    v_lock_item_ids uuid[];
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_mutate_transaction(
        p_ledger_id,
        p_transaction_record_id
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid'
            using errcode = '22023', detail = 'transaction_at_invalid';
    end if;

    if p_note is not null and char_length(p_note) > 2000 then
        raise exception 'note_too_long'
            using errcode = '22023', detail = 'note_too_long';
    end if;

    if jsonb_typeof(p_item_updates) is distinct from 'array' then
        raise exception 'linked_edit_items_invalid'
            using errcode = '22023', detail = 'linked_edit_items_invalid';
    end if;

    if p_merchant_id is null or (
        not exists (
            select 1
            from public.merchant m
            where m.id = p_merchant_id
              and m.ledger_id = p_ledger_id
              and m.is_archived = false
        )
        and not exists (
            select 1
            from public.transaction_record tr
            where tr.id = p_transaction_record_id
              and tr.ledger_id = p_ledger_id
              and tr.status = 'active'
              and tr.type = 'normal'
              and tr.merchant_id = p_merchant_id
        )
    ) then
        raise exception 'merchant_invalid'
            using errcode = '22023', detail = 'merchant_invalid';
    end if;

    -- 锁顺序：ledger → record（并校验记录版本）→ 明细 / 关联目标 → 账户（付款替换内）。
    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    select tr.updated_at
    into v_record_updated_at
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    -- 未提交记录版本时（直接调用 RPC）只做明细级版本校验。
    if p_expected_record_updated_at is not null
       and v_record_updated_at is distinct from p_expected_record_updated_at then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    -- 一次性按 UUID 顺序锁定全部收入明细与新旧原支出，不能逐笔按选择顺序加锁。
    -- 下层 update_linked_transaction_item 会再次取同一批锁，避免多笔互相交叉死锁。
    begin
        select array_agg(distinct item_id order by item_id)
        into v_lock_item_ids
        from (
            select nullif(entry.value ->> 'transactionItemId', '')::uuid as item_id
            from pg_catalog.jsonb_array_elements(p_item_updates) entry
            union all
            select nullif(entry.value ->> 'refundedItemId', '')::uuid
            from pg_catalog.jsonb_array_elements(p_item_updates) entry
            union all
            select nullif(entry.value ->> 'reimbursementItemId', '')::uuid
            from pg_catalog.jsonb_array_elements(p_item_updates) entry
            union all
            select link.refunded_item_id
            from public.transaction_item_refund_link link
            where link.ledger_id = p_ledger_id
              and link.refund_income_item_id in (
                  select nullif(entry.value ->> 'transactionItemId', '')::uuid
                  from pg_catalog.jsonb_array_elements(p_item_updates) entry
              )
            union all
            select link.target_expense_item_id
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = p_ledger_id
              and link.reimbursement_income_item_id in (
                  select nullif(entry.value ->> 'transactionItemId', '')::uuid
                  from pg_catalog.jsonb_array_elements(p_item_updates) entry
              )
        ) ids
        where item_id is not null;
    exception when invalid_text_representation then
        raise exception 'linked_edit_items_invalid'
            using errcode = '22023', detail = 'linked_edit_items_invalid';
    end;

    perform 1
    from public.transaction_item ti
    where ti.ledger_id = p_ledger_id
      and ti.id = any(coalesce(v_lock_item_ids, array[]::uuid[]))
    order by ti.id
    for update;

    for v_item in
        select value
        from pg_catalog.jsonb_array_elements(p_item_updates)
        order by value ->> 'transactionItemId'
    loop
        if jsonb_typeof(v_item) is distinct from 'object' then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        begin
            v_transaction_item_id :=
                nullif(v_item ->> 'transactionItemId', '')::uuid;
            v_expected_updated_at :=
                nullif(v_item ->> 'expectedUpdatedAt', '')::timestamptz;
            v_amount := nullif(v_item ->> 'amount', '')::numeric;
            v_category_id := nullif(v_item ->> 'categoryId', '')::uuid;
            v_new_refund_target := nullif(v_item ->> 'refundedItemId', '')::uuid;
            v_new_reimbursement_target :=
                nullif(v_item ->> 'reimbursementItemId', '')::uuid;
        exception
            when invalid_text_representation
                or invalid_datetime_format
                or datetime_field_overflow
                or numeric_value_out_of_range
            then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
        end;

        if v_transaction_item_id is null
           or v_expected_updated_at is null
           or v_amount is null
           or v_category_id is null then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        -- 只有原关联类型相同、目标非空的收入明细才能改选；拒绝解除和跨类型切换。
        v_old_refund_target := null;
        v_old_reimbursement_target := null;
        v_new_target := null;
        select link.refunded_item_id into v_old_refund_target
        from public.transaction_item_refund_link link
        where link.ledger_id = p_ledger_id
          and link.refund_income_item_id = v_transaction_item_id;
        select link.target_expense_item_id into v_old_reimbursement_target
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = p_ledger_id
          and link.reimbursement_income_item_id = v_transaction_item_id;

        if v_item ? 'refundedItemId' then
            if v_old_refund_target is null or v_new_refund_target is null
               or v_item ? 'reimbursementItemId' then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
            end if;
            if v_new_refund_target is distinct from v_old_refund_target then
                v_new_target := v_new_refund_target;
            end if;
        elsif v_item ? 'reimbursementItemId' then
            if v_old_reimbursement_target is null or v_new_reimbursement_target is null then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
            end if;
            if v_new_reimbursement_target is distinct from v_old_reimbursement_target then
                v_new_target := v_new_reimbursement_target;
            end if;
        end if;

        if v_new_target is not null then
            select c.type,
                   public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id),
                   ti.special_status
            into v_target_category_type, v_target_currency, v_target_status
            from public.transaction_item ti
            join public.transaction_record tr
              on tr.id = ti.transaction_record_id
             and tr.ledger_id = ti.ledger_id
             and tr.status = 'active'
            join public.category c
              on c.id = ti.category_id and c.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id and ti.id = v_new_target;

            v_source_currency := public.transaction_record_currency(
                p_ledger_id, p_transaction_record_id
            );
            if not found or v_target_category_type is distinct from 'expense' then
                raise exception 'linked_edit_target_invalid'
                    using errcode = '22023', detail = 'linked_edit_target_invalid';
            end if;
            if v_source_currency is null or v_target_currency is distinct from v_source_currency then
                raise exception 'linked_edit_target_currency_mismatch'
                    using errcode = '22023', detail = 'linked_edit_target_currency_mismatch';
            end if;
            if v_old_reimbursement_target is not null
               and v_target_status not in (
                   'pending_reimbursement', 'reimbursed', 'reimbursement_surplus'
               ) then
                raise exception 'linked_edit_target_invalid'
                    using errcode = '22023', detail = 'linked_edit_target_invalid';
            end if;
        end if;

        perform public.update_linked_transaction_item(
            p_ledger_id,
            p_transaction_record_id,
            v_transaction_item_id,
            v_expected_updated_at,
            v_amount,
            v_category_id
        );

        if v_new_target is not null then
            -- 原有链接保持同一收入明细，仅原支出对象改变。
            -- 链接表没有自动重算两个原支出状态的 UPDATE 触发器，
            -- 必须显式重算旧、新目标；业务净额由 offset 视图按新链接计算。
            if v_old_refund_target is not null then
                update public.transaction_item_refund_link link
                set refunded_item_id = v_new_target
                where link.ledger_id = p_ledger_id
                  and link.refund_income_item_id = v_transaction_item_id;
            else
                update public.transaction_item_reimbursement_link link
                set target_expense_item_id = v_new_target
                where link.ledger_id = p_ledger_id
                  and link.reimbursement_income_item_id = v_transaction_item_id;
            end if;

            -- 失去本次核销的旧原支出可能由已报销退回待报销；
            -- 新原支出可能由待报销变为已报销或核销结余。
            perform public.recalculate_transaction_item_settlement_status(
                p_ledger_id, coalesce(v_old_refund_target, v_old_reimbursement_target)
            );
            perform public.recalculate_transaction_item_settlement_status(
                p_ledger_id, v_new_target
            );
        end if;
    end loop;

    -- 明细金额变化会改变 Σ明细，付款明细必须在同一事务内整组替换。
    perform public.replace_transaction_payments(
        p_ledger_id,
        p_transaction_record_id,
        p_payments,
        v_user_id
    );

    update public.transaction_record tr
    set
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal';

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    set constraints public.validate_transaction_record_payments immediate;
    set constraints public.validate_transaction_record_payments deferred;
end;
$$;
