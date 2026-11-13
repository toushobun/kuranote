-- Issue #1078：原支出只抵到 0，按收入记录时间和明细顺序分配抵消。
-- 零金额链接保留角色，不消耗原支出的额度。

-- 原始剩余可为负，供编辑小票的实时抵消计算使用。

CREATE OR REPLACE FUNCTION "public"."recalculate_transaction_item_settlement_status"("p_ledger_id" "uuid", "p_target_expense_item_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_current_status public.transaction_item_special_status;
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
    v_previous_reimbursement_link_flow text :=
        current_setting('kuranote.reimbursement_link_flow', true);
    v_remaining_amount numeric;
    v_next_status public.transaction_item_special_status;
begin
    perform 1
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    select target_item.special_status
    into v_current_status
    from public.transaction_item target_item
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id
    for update;

    if not found then
        return;
    end if;

    if v_current_status is null then
        perform set_config('kuranote.income_link_edit_flow', 'on', true);
        perform set_config('kuranote.reimbursement_link_flow', 'on', true);

        update public.transaction_item target_item
        set updated_at = now()
        where target_item.ledger_id = p_ledger_id
          and target_item.id = p_target_expense_item_id;

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
        return;
    end if;

    v_remaining_amount := public.calculate_transaction_item_remaining_offset_amount(
        p_ledger_id,
        p_target_expense_item_id
    );
    v_next_status := case
        when v_remaining_amount > 0
        then 'pending_reimbursement'::public.transaction_item_special_status
        else 'reimbursed'::public.transaction_item_special_status
    end;

    if v_next_status is not distinct from v_current_status then
        perform set_config('kuranote.income_link_edit_flow', 'on', true);
        perform set_config('kuranote.reimbursement_link_flow', 'on', true);

        update public.transaction_item target_item
        set updated_at = now()
        where target_item.ledger_id = p_ledger_id
          and target_item.id = p_target_expense_item_id;

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
        return;
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);
    perform set_config('kuranote.reimbursement_link_flow', 'on', true);

    update public.transaction_item target_item
    set special_status = v_next_status,
        updated_at = now()
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id;

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


CREATE OR REPLACE FUNCTION "public"."validate_transaction_item_special_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_category_type text;
    v_special_status_enabled boolean;
    v_has_active_reimbursement_link boolean;
    v_is_controlled_transition boolean;
    v_remaining_amount numeric;
begin
    if new.special_status is not null then
        select l.transaction_item_special_status_enabled
        into v_special_status_enabled
        from public.ledger l
        where l.id = new.ledger_id
        for update;

        if v_special_status_enabled is distinct from true then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
    end if;

    v_is_controlled_transition :=
        tg_op = 'UPDATE'
        and current_user = 'postgres'
        and (
            current_setting('kuranote.income_link_edit_flow', true)
                is not distinct from 'on'
            or current_setting('kuranote.reimbursement_link_flow', true)
                is not distinct from 'on'
        );

    if tg_op = 'UPDATE'
       and old.special_status is not null
       and new.special_status is null then
        select exists (
            select 1
            from public.transaction_item_reimbursement_link link
            join public.transaction_item reimbursement_income
              on reimbursement_income.id = link.reimbursement_income_item_id
             and reimbursement_income.ledger_id = link.ledger_id
            join public.transaction_record reimbursement_record
              on reimbursement_record.id =
                 reimbursement_income.transaction_record_id
             and reimbursement_record.ledger_id = reimbursement_income.ledger_id
            where link.ledger_id = new.ledger_id
              and link.target_expense_item_id = new.id
              and reimbursement_record.status = 'active'
        ) into v_has_active_reimbursement_link;

        if v_has_active_reimbursement_link then
            raise exception 'reimbursement_link_exists'
                using errcode = 'P0001', detail = 'reimbursement_link_exists';
        end if;

        return new;
    end if;

    if tg_op = 'UPDATE'
       and old.special_status in ('reimbursed', 'reimbursement_surplus')
       and new.special_status is distinct from old.special_status
       and not v_is_controlled_transition then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    if new.special_status is null then
        return new;
    end if;

    select c.type into v_category_type
    from public.category c
    where c.id = new.category_id
      and c.ledger_id = new.ledger_id;

    if v_category_type is distinct from 'expense' then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    if tg_op = 'UPDATE'
       and old.special_status is null
       and new.special_status = 'pending_reimbursement' then
        v_remaining_amount :=
            public.calculate_transaction_item_remaining_offset_amount(
                new.ledger_id,
                new.id
            );
        new.special_status := case
            when v_remaining_amount > 0
            then 'pending_reimbursement'::public.transaction_item_special_status
            else 'reimbursed'::public.transaction_item_special_status
        end;
        return new;
    end if;

    if new.special_status = 'pending_reimbursement' then
        return new;
    end if;

    if tg_op = 'INSERT'
       or old.special_status is null
       or old.special_status not in (
           'pending_reimbursement',
           'reimbursed',
           'reimbursement_surplus'
       )
       or not v_is_controlled_transition then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    return new;
end;
$$;


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
                    else 'reimbursed'::public.transaction_item_special_status
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


CREATE OR REPLACE FUNCTION "public"."enforce_transaction_child_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_old_ledger_id uuid;
    v_old_record_id uuid;
    v_new_ledger_id uuid;
    v_new_record_id uuid;
    v_is_link_edit_flow boolean := false;
    v_is_link_derived_touch boolean := false;
    v_remaining_amount numeric;
    v_expected_special_status public.transaction_item_special_status;
    v_special_status_is_derived boolean := false;
begin
    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(old.ledger_id) then
        return old;
    end if;
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_table_name = 'transaction_item' and tg_op = 'UPDATE' then
        v_is_link_edit_flow :=
            current_setting('kuranote.income_link_edit_flow', true)
                is not distinct from 'on'
            or current_setting('kuranote.reimbursement_link_flow', true)
                is not distinct from 'on';

        -- special_status 非 NULL 的目标已经处于报销流程。受控关联写入如果需要改变
        -- 结清状态，只接受与当前有效核销合计重新计算结果完全一致的值；NULL -> pending
        -- 仍然属于用户主动开启待报销标记，不在这个权限例外内。
        if v_is_link_edit_flow
           and old.special_status is not null
           and new.special_status is not null then
            v_remaining_amount :=
                public.calculate_transaction_item_remaining_offset_amount(
                    new.ledger_id,
                    new.id
                );

            if v_remaining_amount is not null then
                v_expected_special_status := case
                    when v_remaining_amount > 0
                    then 'pending_reimbursement'::public.transaction_item_special_status
                    else 'reimbursed'::public.transaction_item_special_status
                end;
                v_special_status_is_derived :=
                    new.special_status is not distinct from v_expected_special_status;
            end if;
        end if;

        v_is_link_derived_touch :=
            v_is_link_edit_flow
            and old.id is not distinct from new.id
            and old.ledger_id is not distinct from new.ledger_id
            and old.transaction_record_id is not distinct from new.transaction_record_id
            and old.account_id is not distinct from new.account_id
            and old.category_id is not distinct from new.category_id
            and old.amount is not distinct from new.amount
            and old.discount_amount is not distinct from new.discount_amount
            and old.balance_delta is not distinct from new.balance_delta
            and old.note is not distinct from new.note
            and old.sort_order is not distinct from new.sort_order
            and old.created_by is not distinct from new.created_by
            and old.created_at is not distinct from new.created_at
            and (
                (
                    old.special_status is null
                    and new.special_status is null
                )
                or v_special_status_is_derived
            )
            and (
                new.updated_by is not distinct from old.updated_by
                or new.updated_by is not distinct from auth.uid()
            );

        if v_is_link_derived_touch
           and public.current_user_can_write_ledger(old.ledger_id) then
            return new;
        end if;
    end if;

    if tg_op <> 'INSERT' then
        v_old_ledger_id := old.ledger_id;
        v_old_record_id := old.transaction_record_id;

        if not public.current_user_can_mutate_transaction(
            v_old_ledger_id,
            v_old_record_id
        ) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op <> 'DELETE' then
        v_new_ledger_id := new.ledger_id;
        v_new_record_id := new.transaction_record_id;

        if not public.current_user_can_mutate_transaction(
            v_new_ledger_id,
            v_new_record_id
        ) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
with link_events as (
    -- 有效收入和有效原支出才参与；两种关联共用同一时间轴。
    select
        link.ledger_id,
        link.refunded_item_id as target_id,
        link.refund_income_item_id as income_id,
        'refund'::text as kind,
        link.refund_amount as amount,
        target_item.amount as target_amount,
        income_record.transaction_at,
        income_record.created_at as record_created_at,
        income_item.sort_order
    from public.transaction_item_refund_link link
    join public.transaction_item target_item
      on target_item.id = link.refunded_item_id
     and target_item.ledger_id = link.ledger_id
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
     and target_record.status = 'active'
    join public.transaction_item income_item
      on income_item.id = link.refund_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
     and income_record.status = 'active'
    where link.refund_amount > 0

    union all

    select
        link.ledger_id,
        link.target_expense_item_id,
        link.reimbursement_income_item_id,
        'reimbursement'::text,
        link.reimbursement_amount,
        target_item.amount,
        income_record.transaction_at,
        income_record.created_at,
        income_item.sort_order
    from public.transaction_item_reimbursement_link link
    join public.transaction_item target_item
      on target_item.id = link.target_expense_item_id
     and target_item.ledger_id = link.ledger_id
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
     and target_record.status = 'active'
    join public.transaction_item income_item
      on income_item.id = link.reimbursement_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
     and income_record.status = 'active'
    where link.reimbursement_amount > 0
),
ordered_links as (
    select
        events.*,
        coalesce(
            sum(events.amount) over (
                partition by events.ledger_id, events.target_id
                order by
                    events.transaction_at,
                    events.record_created_at,
                    events.sort_order,
                    events.income_id
                rows between unbounded preceding and 1 preceding
            ),
            0::numeric
        ) as prior_amount
    from link_events events
),
allocated_links as (
    select
        ordered.ledger_id,
        ordered.target_id,
        ordered.income_id,
        ordered.kind,
        least(
            ordered.amount,
            greatest(ordered.target_amount - ordered.prior_amount, 0::numeric)
        ) as applied_amount
    from ordered_links ordered
)
select
    ti.*,
    coalesce(expense_refunds.refunded_amount, 0::numeric) as refunded_amount,
    exists (
        select 1
        from public.transaction_item_refund_link link
        join public.transaction_item target_item
          on target_item.id = link.refunded_item_id
         and target_item.ledger_id = link.ledger_id
        join public.transaction_record target_record
          on target_record.id = target_item.transaction_record_id
         and target_record.ledger_id = target_item.ledger_id
        where link.ledger_id = ti.ledger_id
          and link.refund_income_item_id = ti.id
          and target_record.status = 'active'
    ) as is_refund_income,
    exists (
        select 1
        from public.transaction_item_reimbursement_link link
        join public.transaction_item target_item
          on target_item.id = link.target_expense_item_id
         and target_item.ledger_id = link.ledger_id
        join public.transaction_record target_record
          on target_record.id = target_item.transaction_record_id
         and target_record.ledger_id = target_item.ledger_id
        where link.ledger_id = ti.ledger_id
          and link.reimbursement_income_item_id = ti.id
          and target_record.status = 'active'
    ) as is_reimbursement_income,
    exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.refunded_item_id = ti.id
              or link.refund_income_item_id = ti.id
          )
    ) as has_refund_link,
    exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.target_expense_item_id = ti.id
              or link.reimbursement_income_item_id = ti.id
          )
    ) as has_reimbursement_link,
    greatest(
        ti.amount
        - coalesce(applied_expense_refunds.amount, 0::numeric)
        - coalesce(applied_income_refunds.amount, 0::numeric)
        - coalesce(applied_expense_reimbursements.amount, 0::numeric)
        - coalesce(applied_income_reimbursements.amount, 0::numeric),
        0::numeric
    ) as business_net_amount,
    coalesce(expense_reimbursements.reimbursed_amount, 0::numeric)
        as reimbursement_amount
from public.transaction_item ti
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item income_item
      on income_item.id = link.refund_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
     and income_record.status = 'active'
    where link.ledger_id = ti.ledger_id and link.refunded_item_id = ti.id
) expense_refunds on true
left join lateral (
    select sum(link.reimbursement_amount) as reimbursed_amount
    from public.transaction_item_reimbursement_link link
    join public.transaction_item income_item
      on income_item.id = link.reimbursement_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
     and income_record.status = 'active'
    where link.ledger_id = ti.ledger_id and link.target_expense_item_id = ti.id
) expense_reimbursements on true
left join lateral (
    select sum(link.applied_amount) as amount
    from allocated_links link
    where link.ledger_id = ti.ledger_id and link.target_id = ti.id and link.kind = 'refund'
) applied_expense_refunds on true
left join lateral (
    select sum(link.applied_amount) as amount
    from allocated_links link
    where link.ledger_id = ti.ledger_id and link.income_id = ti.id and link.kind = 'refund'
) applied_income_refunds on true
left join lateral (
    select sum(link.applied_amount) as amount
    from allocated_links link
    where link.ledger_id = ti.ledger_id and link.target_id = ti.id and link.kind = 'reimbursement'
) applied_expense_reimbursements on true
left join lateral (
    select sum(link.applied_amount) as amount
    from allocated_links link
    where link.ledger_id = ti.ledger_id and link.income_id = ti.id and link.kind = 'reimbursement'
) applied_income_reimbursements on true;

-- PostgreSQL 枚举成员不能原地删除：旧值仍存在于枚举定义中，
-- 但新写入 / 重算均不再产生 reimbursement_surplus。
-- 根据上线前规则，不做历史数据自动迁移。
