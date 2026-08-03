create or replace function public.prevent_disable_special_status_with_active_items()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if new.transaction_item_special_status_enabled = false
       and old.transaction_item_special_status_enabled = true
       and exists (
           select 1
           from public.transaction_item ti
           join public.transaction_record tr
             on tr.id = ti.transaction_record_id
            and tr.ledger_id = ti.ledger_id
           where ti.ledger_id = new.id
             and ti.special_status is not null
             and tr.status = 'active'
       ) then
        raise exception 'special_status_has_active_items'
            using errcode = '55006', detail = 'special_status_has_active_items';
    end if;

    return new;
end;
$$;

revoke all on function public.prevent_disable_special_status_with_active_items()
from public, anon, authenticated;

create trigger ledger_validate_special_status_disable
before update of transaction_item_special_status_enabled
on public.ledger
for each row execute function public.prevent_disable_special_status_with_active_items();
