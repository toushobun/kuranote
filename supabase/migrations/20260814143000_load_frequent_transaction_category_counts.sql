-- Issue #567: load frequent transaction categories without one remote query per month.
-- The function walks complete calendar months inside PostgreSQL and returns no rows
-- when all available valid items still do not reach the minimum sample size.

create or replace function public.load_frequent_transaction_category_counts(
    p_ledger_id uuid,
    p_date_start timestamptz,
    p_date_end timestamptz,
    p_minimum_item_count integer default 20
)
returns table (
    category_id uuid,
    occurrence_count bigint
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
stable
as $$
declare
    v_range_start timestamptz := p_date_start;
    v_range_end constant timestamptz := p_date_end;
    v_month_end timestamptz := p_date_end;
    v_month_item_count bigint;
    v_total_item_count bigint := 0;
    v_previous_transaction_at timestamptz;
begin
    if p_ledger_id is null
       or p_date_start is null
       or p_date_end is null
       or p_date_start >= p_date_end
       or p_minimum_item_count <= 0
       or not public.current_user_is_active_ledger_member(p_ledger_id) then
        return;
    end if;

    loop
        select count(*)
        into v_month_item_count
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type = 'normal'
          and tr.transaction_at >= v_range_start
          and tr.transaction_at < v_month_end
          and ti.category_id is not null;

        v_total_item_count := v_total_item_count + v_month_item_count;
        exit when v_total_item_count >= p_minimum_item_count;

        select max(tr.transaction_at)
        into v_previous_transaction_at
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type = 'normal'
          and tr.transaction_at < v_range_start
          and ti.category_id is not null;

        -- Exhausted the ledger history before reaching the minimum sample size.
        if v_previous_transaction_at is null then
            return;
        end if;

        -- KuraNote's calendar month boundary is Asia/Tokyo throughout the app.
        -- Jump directly over empty months while keeping the selected month complete.
        v_month_end := v_range_start;
        v_range_start := date_trunc(
            'month',
            v_previous_transaction_at at time zone 'Asia/Tokyo'
        ) at time zone 'Asia/Tokyo';
    end loop;

    return query
    select
        ti.category_id,
        count(*)::bigint as occurrence_count
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    where tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
      and tr.transaction_at >= v_range_start
      and tr.transaction_at < v_range_end
      and ti.category_id is not null
    group by ti.category_id;
end;
$$;

revoke all on function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
) from public;
revoke all on function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
) from anon;
grant execute on function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
) to authenticated;
