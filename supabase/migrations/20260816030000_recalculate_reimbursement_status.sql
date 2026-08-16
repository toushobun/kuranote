-- 关联变化后统一按有效退款与报销合计双向派生报销流程状态。
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

    v_next_status := case
        when public.calculate_transaction_item_remaining_offset_amount(
            p_ledger_id,
            p_target_expense_item_id
        ) <= 0
        then 'reimbursed'::public.transaction_item_special_status
        else 'pending_reimbursement'::public.transaction_item_special_status
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

create or replace function public.recalculate_refund_link_target_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
    if tg_op in ('DELETE', 'UPDATE') then
        perform public.recalculate_transaction_item_settlement_status(
            old.ledger_id,
            old.refunded_item_id
        );
    end if;

    if tg_op in ('INSERT', 'UPDATE')
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

revoke all on function public.recalculate_refund_link_target_status()
from public, anon, authenticated;

create or replace function public.recalculate_reimbursement_link_target_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
    if tg_op in ('DELETE', 'UPDATE') then
        perform public.recalculate_transaction_item_settlement_status(
            old.ledger_id,
            old.target_expense_item_id
        );
    end if;

    if tg_op in ('INSERT', 'UPDATE')
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

revoke all on function public.recalculate_reimbursement_link_target_status()
from public, anon, authenticated;

create trigger transaction_item_refund_link_recalculate_target_status
after insert or update or delete
on public.transaction_item_refund_link
for each row execute function public.recalculate_refund_link_target_status();

create trigger transaction_item_reimbursement_link_recalculate_target_status
after insert or update or delete
on public.transaction_item_reimbursement_link
for each row execute function public.recalculate_reimbursement_link_target_status();

create or replace function public.recalculate_targets_for_income_status_change()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_target record;
begin
    if new.status is not distinct from old.status then
        return new;
    end if;

    for v_target in
        select link.ledger_id, link.refunded_item_id as target_item_id
        from public.transaction_item income_item
        join public.transaction_item_refund_link link
          on link.ledger_id = income_item.ledger_id
         and link.refund_income_item_id = income_item.id
        where income_item.ledger_id = new.ledger_id
          and income_item.transaction_record_id = new.id
        union
        select link.ledger_id, link.target_expense_item_id
        from public.transaction_item income_item
        join public.transaction_item_reimbursement_link link
          on link.ledger_id = income_item.ledger_id
         and link.reimbursement_income_item_id = income_item.id
        where income_item.ledger_id = new.ledger_id
          and income_item.transaction_record_id = new.id
    loop
        perform public.recalculate_transaction_item_settlement_status(
            v_target.ledger_id,
            v_target.target_item_id
        );
    end loop;

    return new;
end;
$$;

revoke all on function public.recalculate_targets_for_income_status_change()
from public, anon, authenticated;

create trigger transaction_record_recalculate_link_targets
after update of status
on public.transaction_record
for each row execute function public.recalculate_targets_for_income_status_change();

-- 状态重算与既有 RPC 可能连续写入相同状态；无实际变化时无需重复校验转换。
drop trigger transaction_item_validate_special_status
on public.transaction_item;

create trigger transaction_item_validate_special_status
before update of special_status, category_id
on public.transaction_item
for each row
when (
    old.special_status is distinct from new.special_status
    or old.category_id is distinct from new.category_id
)
execute function public.validate_transaction_item_special_status();

create trigger transaction_item_validate_special_status_insert
before insert
on public.transaction_item
for each row execute function public.validate_transaction_item_special_status();
