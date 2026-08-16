create or replace function public.apply_transaction_item_links(
    p_ledger_id uuid,
    p_income_item_id uuid,
    p_item jsonb,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_income_amount numeric(14,2);
    v_income_account_id uuid;
    v_income_category_type text;
    v_income_currency text;
    v_reimbursement_target_id uuid;
    v_reimbursement_target_type text;
    v_reimbursement_target_currency text;
    v_reimbursement_target_status public.transaction_item_special_status;
    v_reimbursement_amount numeric(14,2);
    v_remaining_amount numeric(14,2);
    v_special_status_enabled boolean;
    v_refund_allocations jsonb;
    v_refund_count integer := 0;
    v_refund_distinct_count integer := 0;
    v_refund_total numeric(14,2) := 0;
    v_refund_allocatable_amount numeric(14,2) := 0;
    v_refund_remaining_units_by_target jsonb := '{}'::jsonb;
    v_refund_target_ids uuid[] := array[]::uuid[];
    v_locked_count integer := 0;
    v_invalid_count integer := 0;
begin
    v_refund_allocations := coalesce(
        p_item -> 'refundAllocations',
        '[]'::jsonb
    );

    begin
        v_reimbursement_target_id :=
            nullif(p_item ->> 'reimbursementItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'reimbursement_item_invalid'
                using errcode = '22023', detail = 'reimbursement_item_invalid';
    end;

    if jsonb_typeof(v_refund_allocations) is distinct from 'array' then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;

    if jsonb_array_length(v_refund_allocations) > 100 then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;

    begin
        select
            count(*)::integer,
            count(distinct (allocation ->> 'refundedItemId')::uuid)::integer,
            coalesce(sum((allocation ->> 'refundAmount')::numeric), 0),
            coalesce(
                array_agg(
                    (allocation ->> 'refundedItemId')::uuid
                    order by (allocation ->> 'refundedItemId')::uuid
                ),
                array[]::uuid[]
            )
        into
            v_refund_count,
            v_refund_distinct_count,
            v_refund_total,
            v_refund_target_ids
        from jsonb_array_elements(v_refund_allocations) allocation;
    exception
        when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
    end;

    if exists (
        select 1
        from jsonb_array_elements(v_refund_allocations) allocation
        where jsonb_typeof(allocation) is distinct from 'object'
           or nullif(allocation ->> 'refundedItemId', '') is null
           or nullif(allocation ->> 'refundAmount', '') is null
           or (allocation ->> 'refundAmount')::numeric <= 0
           or (allocation ->> 'refundAmount')::numeric
                <> round((allocation ->> 'refundAmount')::numeric, 2)
    ) or v_refund_count <> v_refund_distinct_count then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;

    if v_reimbursement_target_id is null and v_refund_count = 0 then
        return;
    end if;

    select l.transaction_item_special_status_enabled
    into v_special_status_enabled
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    if v_special_status_enabled is distinct from true then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    select ti.amount, ti.account_id, c.type, a.currency
    into v_income_amount, v_income_account_id, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_reimbursement_target_id is not null and v_refund_count > 0 then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_reimbursement_target_id is not null then
        select ti.special_status, c.type, a.currency
        into
            v_reimbursement_target_status,
            v_reimbursement_target_type,
            v_reimbursement_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        where ti.ledger_id = p_ledger_id
          and ti.id = v_reimbursement_target_id
        for update of ti, tr;

        if not found
           or v_reimbursement_target_type is distinct from 'expense'
           or v_reimbursement_target_status is null
           or v_reimbursement_target_status not in (
               'pending_reimbursement',
               'reimbursed'
           ) then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if v_reimbursement_target_currency is distinct from v_income_currency then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        if exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = p_ledger_id
              and link.refund_income_item_id = p_income_item_id
        ) then
            raise exception 'income_link_conflict'
                using errcode = '22023', detail = 'income_link_conflict';
        end if;

        v_remaining_amount :=
            public.calculate_transaction_item_remaining_offset_amount(
                p_ledger_id,
                v_reimbursement_target_id
            );
        v_reimbursement_amount := least(v_income_amount, v_remaining_amount);

        if v_reimbursement_amount > 0 then
            insert into public.transaction_item_reimbursement_link (
                ledger_id,
                target_expense_item_id,
                reimbursement_income_item_id,
                reimbursement_amount,
                created_by
            ) values (
                p_ledger_id,
                v_reimbursement_target_id,
                p_income_item_id,
                v_reimbursement_amount,
                p_user_id
            );

            perform set_config('kuranote.reimbursement_link_flow', 'on', true);

            update public.transaction_item target_item
            set special_status = case
                    when public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        v_reimbursement_target_id
                    ) <= 0
                    then 'reimbursed'::public.transaction_item_special_status
                    else 'pending_reimbursement'::public.transaction_item_special_status
                end,
                updated_by = p_user_id,
                updated_at = now()
            where target_item.ledger_id = p_ledger_id
              and target_item.id = v_reimbursement_target_id;

            perform set_config('kuranote.reimbursement_link_flow', 'off', true);
        end if;
    end if;

    if v_refund_count > 0 then
        perform 1
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        where ti.ledger_id = p_ledger_id
          and ti.id = any(v_refund_target_ids)
        order by ti.id
        for update of ti, tr;

        get diagnostics v_locked_count = row_count;
        if v_locked_count <> v_refund_count then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if exists (
            select 1
            from public.transaction_item ti
            left join public.category c
              on c.id = ti.category_id
             and c.ledger_id = ti.ledger_id
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_refund_target_ids)
              and (
                  c.type is distinct from 'expense'
                  or a.currency is distinct from v_income_currency
                  or ti.account_id is distinct from v_income_account_id
              )
        ) then
            if exists (
                select 1
                from public.transaction_item ti
                join public.account a
                  on a.id = ti.account_id
                 and a.ledger_id = ti.ledger_id
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                  and a.currency is distinct from v_income_currency
            ) then
                raise exception 'refund_currency_mismatch'
                    using errcode = '22023', detail = 'refund_currency_mismatch';
            end if;

            if exists (
                select 1
                from public.transaction_item ti
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                  and ti.account_id is distinct from v_income_account_id
            ) then
                raise exception 'refund_account_mismatch'
                    using errcode = '22023', detail = 'refund_account_mismatch';
            end if;

            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        with targets as materialized (
            select
                target_id,
                round(
                    public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        target_id
                    ) * 100
                )::bigint as remaining_units
            from unnest(v_refund_target_ids) target_id
        )
        select
            least(
                round(v_income_amount * 100)::bigint,
                coalesce(sum(remaining_units), 0)
            )::numeric / 100,
            coalesce(
                jsonb_object_agg(target_id::text, remaining_units),
                '{}'::jsonb
            )
        into
            v_refund_allocatable_amount,
            v_refund_remaining_units_by_target
        from targets;

        if v_refund_total is distinct from v_refund_allocatable_amount then
            if v_refund_total > v_refund_allocatable_amount then
                raise exception 'refund_amount_exceeded'
                    using errcode = '22023', detail = 'refund_amount_exceeded';
            end if;

            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        with requested as (
            select
                (allocation ->> 'refundedItemId')::uuid as refunded_item_id,
                round((allocation ->> 'refundAmount')::numeric * 100)::bigint
                    as requested_units
            from jsonb_array_elements(v_refund_allocations) allocation
        ), targets as (
            select
                requested.refunded_item_id,
                requested.requested_units,
                (
                    v_refund_remaining_units_by_target
                        ->> requested.refunded_item_id::text
                )::bigint as remaining_units
            from requested
        ), allocation_base as (
            select
                targets.*,
                sum(remaining_units) over () as total_remaining_units,
                floor(
                    round(v_refund_allocatable_amount * 100)::numeric
                    * remaining_units
                    / nullif(sum(remaining_units) over (), 0)
                )::bigint as base_units,
                mod(
                    round(v_refund_allocatable_amount * 100)::numeric
                    * remaining_units,
                    nullif(sum(remaining_units) over (), 0)
                ) as remainder_units
            from targets
        ), ranked as (
            select
                allocation_base.*,
                row_number() over (
                    order by remainder_units desc, refunded_item_id
                ) as remainder_rank,
                round(v_refund_allocatable_amount * 100)::bigint
                    - sum(base_units) over () as tail_units
            from allocation_base
        ), expected as (
            select
                *,
                base_units + case when remainder_rank <= tail_units then 1 else 0 end
                    as expected_units
            from ranked
        )
        select count(*)::integer
        into v_invalid_count
        from expected
        where expected_units <= 0
           or expected_units > remaining_units
           or requested_units <> expected_units;

        if v_invalid_count > 0 then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        insert into public.transaction_item_refund_link (
            ledger_id,
            refunded_item_id,
            refund_income_item_id,
            refund_amount,
            created_by
        )
        select
            p_ledger_id,
            (allocation ->> 'refundedItemId')::uuid,
            p_income_item_id,
            (allocation ->> 'refundAmount')::numeric(14,2),
            p_user_id
        from jsonb_array_elements(v_refund_allocations) allocation
        order by (allocation ->> 'refundedItemId')::uuid;
    end if;
end;
$$;
