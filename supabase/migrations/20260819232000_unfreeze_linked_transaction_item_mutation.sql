-- Issue #574 PR1：解冻已关联明细的受控编辑，并统一关联写入的锁顺序。

create or replace function public.validate_linked_transaction_item_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
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

        if v_is_refund_income and exists (
            select 1
            from public.transaction_item_refund_link link
            join public.transaction_item target_item
              on target_item.id = link.refunded_item_id
             and target_item.ledger_id = link.ledger_id
            where link.ledger_id = old.ledger_id
              and link.refund_income_item_id = old.id
              and target_item.account_id is distinct from new.account_id
        ) then
            raise exception 'refund_account_mismatch'
                using errcode = '22023', detail = 'refund_account_mismatch';
        end if;

        if v_is_refund_target and exists (
            select 1
            from public.transaction_item_refund_link link
            join public.transaction_item income_item
              on income_item.id = link.refund_income_item_id
             and income_item.ledger_id = link.ledger_id
            where link.ledger_id = old.ledger_id
              and link.refunded_item_id = old.id
              and income_item.account_id is distinct from new.account_id
        ) then
            raise exception 'refund_account_mismatch'
                using errcode = '22023', detail = 'refund_account_mismatch';
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

revoke all on function public.validate_linked_transaction_item_mutation()
from public, anon, authenticated;
