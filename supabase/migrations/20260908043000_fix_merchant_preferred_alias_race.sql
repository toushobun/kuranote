create or replace function public.set_merchant_preferred_alias(
    p_ledger_id uuid,
    p_merchant_id uuid,
    p_alias_id uuid default null
)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
begin
    perform 1
    from public.merchant m
    where m.id = p_merchant_id
      and m.ledger_id = p_ledger_id
      and m.is_archived = false
    for update;

    if not found then
        return false;
    end if;

    if p_alias_id is not null and not exists (
        select 1
        from public.merchant_alias ma
        where ma.id = p_alias_id
          and ma.merchant_id = p_merchant_id
          and ma.is_archived = false
    ) then
        return false;
    end if;

    update public.merchant_alias
    set is_preferred = false,
        updated_by = auth.uid()
    where merchant_id = p_merchant_id
      and is_archived = false
      and is_preferred = true;

    if p_alias_id is not null then
        update public.merchant_alias
        set is_preferred = true,
            updated_by = auth.uid()
        where id = p_alias_id
          and merchant_id = p_merchant_id
          and is_archived = false;
    end if;

    return true;
end;
$$;

revoke all on function public.set_merchant_preferred_alias(uuid, uuid, uuid)
from public, anon;
grant execute on function public.set_merchant_preferred_alias(uuid, uuid, uuid)
to authenticated;
