-- 商家别名兼作展示名候选；同一商家最多一个未归档别名可被选中。
alter table public.merchant_alias
add column is_preferred boolean not null default false;

alter table public.merchant_alias
add constraint merchant_alias_preferred_active_check
check (not is_preferred or not is_archived);

create unique index merchant_alias_single_preferred_idx
on public.merchant_alias (merchant_id)
where is_preferred = true and is_archived = false;

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
    set is_preferred = (id = p_alias_id),
        updated_by = auth.uid()
    where merchant_id = p_merchant_id
      and is_archived = false
      and is_preferred is distinct from (id = p_alias_id);

    return true;
end;
$$;

revoke all on function public.set_merchant_preferred_alias(uuid, uuid, uuid)
from public, anon;
grant execute on function public.set_merchant_preferred_alias(uuid, uuid, uuid)
to authenticated;
