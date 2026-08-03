create or replace function public.validate_linked_transaction_item_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if tg_op = 'UPDATE'
       and new.amount is not distinct from old.amount
       and new.account_id is not distinct from old.account_id
       and new.category_id is not distinct from old.category_id then
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

drop trigger if exists transaction_item_validate_linked_amount
on public.transaction_item;

-- 命名为 freeze_linked_mutation（而非 validate_...）是为了让它在同名前缀的
-- BEFORE 触发器按字母序执行时排在 transaction_item_validate_category_shape
-- 之前，避免关联明细的 category_id 置空先触发分类校验，掩盖本应抛出的
-- linked_transaction_edit_forbidden。
create trigger transaction_item_freeze_linked_mutation
before update of amount, account_id, category_id
on public.transaction_item
for each row execute function public.validate_linked_transaction_item_mutation();
