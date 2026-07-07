alter table public.app_user
add column if not exists current_ledger_id uuid references public.ledger(id) on delete set null;

create index if not exists app_user_current_ledger_id_idx
on public.app_user (current_ledger_id)
where current_ledger_id is not null;

update public.app_user au
set
    current_ledger_id = candidate.ledger_id,
    updated_at = now()
from (
    select distinct on (lm.user_id)
        lm.user_id,
        lm.ledger_id
    from public.ledger_member lm
    join public.ledger l
      on l.id = lm.ledger_id
    where lm.status = 'active'
      and l.is_archived = false
    order by
        lm.user_id,
        lm.joined_at nulls last,
        lm.created_at,
        lm.ledger_id
) candidate
where au.id = candidate.user_id
  and au.current_ledger_id is null;

create or replace function public.validate_app_user_current_ledger()
returns trigger
language plpgsql
as $$
begin
    if new.current_ledger_id is null then
        return new;
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.ledger l
          on l.id = lm.ledger_id
        where lm.user_id = new.id
          and lm.ledger_id = new.current_ledger_id
          and lm.status = 'active'
          and l.is_archived = false
    ) then
        raise exception 'current_ledger_id must reference an active ledger member';
    end if;

    return new;
end;
$$;

drop trigger if exists app_user_validate_current_ledger on public.app_user;

create trigger app_user_validate_current_ledger
before insert or update of current_ledger_id on public.app_user
for each row
execute function public.validate_app_user_current_ledger();

create or replace function public.create_ledger_with_owner(
    p_name text,
    p_base_currency text default 'JPY'
)
returns public.ledger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'login required';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_user_id
          and au.status = 'active'
    ) then
        raise exception 'active app_user required';
    end if;

    insert into public.ledger (
        name,
        base_currency,
        owner_user_id,
        created_by,
        updated_by
    )
    values (
        p_name,
        p_base_currency,
        v_user_id,
        v_user_id,
        v_user_id
    )
    returning * into v_ledger;

    insert into public.ledger_member (
        ledger_id,
        user_id,
        role,
        status,
        invited_by,
        invited_at,
        joined_at,
        created_by,
        updated_by
    )
    values (
        v_ledger.id,
        v_user_id,
        'owner',
        'active',
        v_user_id,
        now(),
        now(),
        v_user_id,
        v_user_id
    );

    perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);

    update public.app_user
    set
        current_ledger_id = v_ledger.id,
        updated_by = v_user_id
    where id = v_user_id;

    return v_ledger;
end;
$$;

revoke all on function public.create_ledger_with_owner(text, text) from public;
revoke all on function public.create_ledger_with_owner(text, text) from anon;
grant execute on function public.create_ledger_with_owner(text, text) to authenticated;