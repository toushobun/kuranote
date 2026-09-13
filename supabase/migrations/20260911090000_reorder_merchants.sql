create or replace function public.reorder_merchants(
    p_ledger_id uuid,
    p_merchant_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_merchant_count integer;
    v_distinct_count integer;
    v_active_ids uuid[];
    v_submitted_ids uuid[];
    v_updated_count integer;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    v_merchant_count := coalesce(cardinality(p_merchant_ids), 0);
    if p_ledger_id is null or v_merchant_count < 1 then
        raise exception 'merchant_order_invalid'
            using errcode = '22023', detail = 'merchant_order_invalid';
    end if;

    if exists (
        select 1 from unnest(p_merchant_ids) submitted(merchant_id)
        where submitted.merchant_id is null
    ) then
        raise exception 'merchant_order_invalid'
            using errcode = '22023', detail = 'merchant_order_invalid';
    end if;

    select count(distinct submitted.merchant_id)
      into v_distinct_count
      from unnest(p_merchant_ids) submitted(merchant_id);

    if v_distinct_count <> v_merchant_count then
        raise exception 'merchant_order_invalid'
            using errcode = '22023', detail = 'merchant_order_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    perform pg_advisory_xact_lock(hashtext(p_ledger_id::text));

    if not exists (
        select 1 from public.ledger l
        where l.id = p_ledger_id and l.is_archived = false
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    select coalesce(array_agg(locked_merchant.id order by locked_merchant.id), '{}'::uuid[])
      into v_active_ids
      from (
          select mt.id
          from public.merchant mt
          where mt.ledger_id = p_ledger_id
            and mt.is_archived = false
          order by mt.id
          for update
      ) locked_merchant;

    select coalesce(array_agg(submitted.merchant_id order by submitted.merchant_id), '{}'::uuid[])
      into v_submitted_ids
      from unnest(p_merchant_ids) submitted(merchant_id);

    if v_submitted_ids is distinct from v_active_ids then
        raise exception 'merchant_set_invalid'
            using errcode = '22023', detail = 'merchant_set_invalid';
    end if;

    with submitted_order as (
        select submitted.merchant_id, submitted.position
        from unnest(p_merchant_ids) with ordinality submitted(merchant_id, position)
    )
    update public.merchant mt
       set sort_order = (submitted_order.position - 1)::integer
      from submitted_order
     where mt.id = submitted_order.merchant_id
       and mt.ledger_id = p_ledger_id
       and mt.is_archived = false;

    get diagnostics v_updated_count = row_count;
    if v_updated_count <> v_merchant_count then
        raise exception 'merchant_write_failed'
            using errcode = 'P0001', detail = 'merchant_write_failed';
    end if;

    return v_updated_count;
end;
$$;

revoke all on function public.reorder_merchants(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_merchants(uuid, uuid[]) to authenticated;
