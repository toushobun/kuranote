create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
    v_settling_item_is_income boolean;
begin
    if tg_op = 'UPDATE'
       and old.special_status = 'reimbursed'
       and (
           new.special_status is distinct from old.special_status
           or new.settled_by_item_id is distinct from old.settled_by_item_id
       ) then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    if new.special_status is null then
        if new.settled_by_item_id is not null then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
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

    if new.special_status = 'pending_reimbursement' then
        if new.settled_by_item_id is not null then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
        return new;
    end if;

    if tg_op = 'INSERT'
       or old.special_status is distinct from 'pending_reimbursement'
       or current_setting('kuranote.reimbursement_link_flow', true) is distinct from 'on'
       or new.settled_by_item_id is null then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    select exists (
        select 1
        from public.transaction_item income_item
        join public.category income_category
          on income_category.id = income_item.category_id
         and income_category.ledger_id = income_item.ledger_id
        where income_item.id = new.settled_by_item_id
          and income_item.ledger_id = new.ledger_id
          and income_category.type = 'income'
    ) into v_settling_item_is_income;

    if not v_settling_item_is_income then
        raise exception 'reimbursement_income_invalid'
            using errcode = '22023', detail = 'reimbursement_income_invalid';
    end if;

    return new;
end;
$$;

drop trigger if exists transaction_item_validate_linked_amount
on public.transaction_item;

alter function public.validate_linked_transaction_item_amount()
rename to validate_linked_transaction_item_mutation;

create or replace function public.validate_linked_transaction_item_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if tg_op = 'UPDATE' and new.amount is not distinct from old.amount then
        return new;
    end if;

    if old.special_status = 'reimbursed'
       or exists (
           select 1
           from public.transaction_item settled_item
           where settled_item.ledger_id = old.ledger_id
             and settled_item.settled_by_item_id = old.id
       )
       or exists (
           select 1
           from public.transaction_item_refund_link refund_link
           where refund_link.ledger_id = old.ledger_id
             and (
                 refund_link.refunded_item_id = old.id
                 or refund_link.refund_income_item_id = old.id
             )
       ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$;

revoke all on function public.validate_linked_transaction_item_mutation()
from public, anon, authenticated;

create trigger transaction_item_validate_linked_amount
before update of amount
on public.transaction_item
for each row execute function public.validate_linked_transaction_item_mutation();

create trigger transaction_item_prevent_linked_delete
before delete
on public.transaction_item
for each row execute function public.validate_linked_transaction_item_mutation();
