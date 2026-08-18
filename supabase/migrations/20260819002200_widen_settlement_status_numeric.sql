-- Issue #605 PR1 自查修复：解除核销封顶后，累计核销金额可能超过单条金额的 numeric(14,2) 范围。
-- 状态判定只需要比较有符号剩余额度，因此中间变量使用无 typmod 的 numeric，避免多笔合法关联累计后溢出。

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
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
