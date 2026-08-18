-- Issue #605 PR1：解除报销/退款核销封顶，并把剩余额度改为可正可负的状态判定值。
-- 符号约定沿用既有“原始金额 - 有效核销合计”：
--   > 0 仍有未核销金额；= 0 恰好结清；< 0 核销超过原始支出（倒赚）。

create or replace function public.calculate_transaction_item_remaining_offset_amount(
    p_ledger_id uuid,
    p_target_expense_item_id uuid
)
returns numeric
language sql
stable
set search_path = pg_catalog, pg_temp
as $$
    select
        target_item.amount
        - coalesce((
            select sum(refund_link.refund_amount)
            from public.transaction_item_refund_link refund_link
            join public.transaction_item refund_income
              on refund_income.id = refund_link.refund_income_item_id
             and refund_income.ledger_id = refund_link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where refund_link.ledger_id = target_item.ledger_id
              and refund_link.refunded_item_id = target_item.id
              and refund_record.status = 'active'
        ), 0)
        - coalesce((
            select sum(reimbursement_link.reimbursement_amount)
            from public.transaction_item_reimbursement_link reimbursement_link
            join public.transaction_item reimbursement_income
              on reimbursement_income.id =
                 reimbursement_link.reimbursement_income_item_id
             and reimbursement_income.ledger_id = reimbursement_link.ledger_id
            join public.transaction_record reimbursement_record
              on reimbursement_record.id =
                 reimbursement_income.transaction_record_id
             and reimbursement_record.ledger_id = reimbursement_income.ledger_id
            where reimbursement_link.ledger_id = target_item.ledger_id
              and reimbursement_link.target_expense_item_id = target_item.id
              and reimbursement_record.status = 'active'
        ), 0)
    from public.transaction_item target_item
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
     and target_record.status = 'active'
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id;
$$;

revoke all on function public.calculate_transaction_item_remaining_offset_amount(
    uuid, uuid
) from public, anon, authenticated;

create or replace function public.validate_transaction_item_reimbursement_link()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_target_category_type text;
    v_target_currency text;
    v_target_record_status text;
    v_target_special_status public.transaction_item_special_status;
    v_income_category_type text;
    v_income_currency text;
    v_income_record_status text;
begin
    select c.type, a.currency, tr.status, ti.special_status
    into
        v_target_category_type,
        v_target_currency,
        v_target_record_status,
        v_target_special_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = new.target_expense_item_id
      and ti.ledger_id = new.ledger_id;

    select c.type, a.currency, tr.status
    into v_income_category_type, v_income_currency, v_income_record_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = new.reimbursement_income_item_id
      and ti.ledger_id = new.ledger_id;

    if v_target_category_type is distinct from 'expense'
       or v_income_category_type is distinct from 'income'
       or v_target_record_status is distinct from 'active'
       or v_income_record_status is distinct from 'active'
       or v_target_special_status is null
       or v_target_special_status not in (
           'pending_reimbursement',
           'reimbursed',
           'reimbursement_surplus'
       ) then
        raise exception 'reimbursement_item_invalid'
            using errcode = '22023', detail = 'reimbursement_item_invalid';
    end if;

    if v_target_currency is distinct from v_income_currency then
        raise exception 'reimbursement_currency_mismatch'
            using errcode = '22023', detail = 'reimbursement_currency_mismatch';
    end if;

    if exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = new.ledger_id
          and link.refund_income_item_id = new.reimbursement_income_item_id
    ) then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    return new;
end;
$$;

revoke all on function public.validate_transaction_item_reimbursement_link()
from public, anon, authenticated;

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
    v_special_status_enabled boolean;
    v_has_active_refund_link boolean;
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

        select exists (
            select 1
            from public.transaction_item_refund_link link
            join public.transaction_item refund_income
              on refund_income.id = link.refund_income_item_id
             and refund_income.ledger_id = link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where link.ledger_id = new.ledger_id
              and link.refunded_item_id = new.id
              and refund_record.status = 'active'
        ) into v_has_active_refund_link;

        if v_has_active_refund_link then
            raise exception 'refund_link_exists'
                using errcode = 'P0001', detail = 'refund_link_exists';
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
            when v_remaining_amount = 0
            then 'reimbursed'::public.transaction_item_special_status
            else 'reimbursement_surplus'::public.transaction_item_special_status
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

revoke all on function public.validate_transaction_item_special_status()
from public, anon, authenticated;

create or replace function public.recalculate_transaction_item_settlement_status(
    p_ledger_id uuid,
    p_target_expense_item_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_current_status public.transaction_item_special_status;
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
    v_previous_reimbursement_link_flow text :=
        current_setting('kuranote.reimbursement_link_flow', true);
    v_remaining_amount numeric;
    v_next_status public.transaction_item_special_status;
begin
    select target_item.special_status
    into v_current_status
    from public.transaction_item target_item
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id
    for update;

    -- 普通支出不进入报销状态机，退款多少都保持 NULL。
    if not found or v_current_status is null then
        return;
    end if;

    v_remaining_amount := public.calculate_transaction_item_remaining_offset_amount(
        p_ledger_id,
        p_target_expense_item_id
    );
    v_next_status := case
        when v_remaining_amount > 0
        then 'pending_reimbursement'::public.transaction_item_special_status
        when v_remaining_amount = 0
        then 'reimbursed'::public.transaction_item_special_status
        else 'reimbursement_surplus'::public.transaction_item_special_status
    end;

    if v_next_status is not distinct from v_current_status then
        return;
    end if;

    -- 复用既有受控解锁通道，禁止普通写入绕过状态转换约束。
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

revoke all on function public.recalculate_transaction_item_settlement_status(
    uuid, uuid
) from public, anon, authenticated;

create or replace function public.apply_transaction_item_links(
    p_ledger_id uuid,
    p_income_item_id uuid,
    p_item jsonb,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_income_amount numeric(14,2);
    v_income_account_id uuid;
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
    v_refund_target_account_id uuid;
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

    select ti.amount, ti.account_id, c.type, a.currency
    into v_income_amount, v_income_account_id, v_income_category_type, v_income_currency
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

        select c.type, a.currency, ti.account_id
        into v_refund_target_type, v_refund_target_currency, v_refund_target_account_id
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

        if v_refund_target_account_id is distinct from v_income_account_id then
            raise exception 'refund_account_mismatch'
                using errcode = '22023', detail = 'refund_account_mismatch';
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
