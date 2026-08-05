-- 将退款收入从单目标关联扩展为多目标分摊。
-- 分摊以 0.01 为最小单位，采用最大余数法，并以目标明细 ID 作为稳定尾差顺序。

alter table public.transaction_item_refund_link
    drop constraint if exists transaction_item_refund_link_income_unique;

alter table public.transaction_item_refund_link
    add constraint transaction_item_refund_link_income_target_unique
    unique (refund_income_item_id, refunded_item_id);

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
    v_reimbursement_ids uuid[];
    v_reimbursement_amount numeric(14,2);
    v_reimbursement_currency text;
    v_reimbursement_currency_count integer;
    v_requested_count integer;
    v_updated_count integer;
    v_special_status_enabled boolean;
    v_refund_allocations jsonb;
    v_refund_count integer := 0;
    v_refund_distinct_count integer := 0;
    v_refund_total numeric(14,2) := 0;
    v_refund_target_ids uuid[] := array[]::uuid[];
    v_locked_count integer := 0;
    v_invalid_count integer := 0;
begin
    v_refund_allocations := p_item -> 'refundAllocations';

    -- 数据库迁移与前端发布并非原子操作。旧页面仍可能提交单个
    -- refundedItemId，因此在数据库边界将其规范化为全额单目标分摊。
    if v_refund_allocations is null
       and nullif(p_item ->> 'refundedItemId', '') is not null then
        select ti.amount
        into v_income_amount
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        where ti.id = p_income_item_id
          and ti.ledger_id = p_ledger_id;

        v_refund_allocations := jsonb_build_array(
            jsonb_build_object(
                'refundedItemId', p_item ->> 'refundedItemId',
                'refundAmount', v_income_amount
            )
        );
    end if;

    v_refund_allocations := coalesce(v_refund_allocations, '[]'::jsonb);

    v_reimbursement_ids := array(
        select value::uuid
        from jsonb_array_elements_text(
            coalesce(p_item -> 'reimbursementItemIds', '[]'::jsonb)
        ) as value
    );
    v_requested_count := coalesce(array_length(v_reimbursement_ids, 1), 0);

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

    if v_requested_count = 0 and v_refund_count = 0 then
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

    if v_requested_count > 0 and v_refund_count > 0 then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_requested_count > 0 then
        with locked_items as (
            select ti.id, ti.amount, a.currency
            from public.transaction_item ti
            join public.transaction_record tr
              on tr.id = ti.transaction_record_id
             and tr.ledger_id = ti.ledger_id
             and tr.status = 'active'
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_reimbursement_ids)
              and ti.special_status = 'pending_reimbursement'
              and ti.settled_by_item_id is null
              and not exists (
                  select 1
                  from public.transaction_item_refund_link link
                  join public.transaction_item refund_income
                    on refund_income.id = link.refund_income_item_id
                   and refund_income.ledger_id = link.ledger_id
                  join public.transaction_record refund_record
                    on refund_record.id = refund_income.transaction_record_id
                   and refund_record.ledger_id = refund_income.ledger_id
                  where link.ledger_id = p_ledger_id
                    and link.refunded_item_id = ti.id
                    and refund_record.status = 'active'
              )
            for update of ti, tr, a
        )
        select
            count(*)::integer,
            coalesce(sum(amount), 0),
            min(currency),
            count(distinct currency)::integer
        into
            v_updated_count,
            v_reimbursement_amount,
            v_reimbursement_currency,
            v_reimbursement_currency_count
        from locked_items;

        if v_updated_count <> v_requested_count then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if v_reimbursement_currency_count <> 1
           or v_income_currency is distinct from v_reimbursement_currency then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        if v_income_amount is distinct from v_reimbursement_amount then
            raise exception 'reimbursement_amount_mismatch'
                using errcode = '22023', detail = 'reimbursement_amount_mismatch';
        end if;

        perform set_config('kuranote.reimbursement_link_flow', 'on', true);

        update public.transaction_item ti
        set special_status = 'reimbursed',
            settled_by_item_id = p_income_item_id,
            updated_by = p_user_id,
            updated_at = now()
        where ti.ledger_id = p_ledger_id
          and ti.id = any(v_reimbursement_ids)
          and ti.special_status = 'pending_reimbursement'
          and ti.settled_by_item_id is null;
    end if;

    if v_refund_count > 0 then
        if v_refund_total is distinct from v_income_amount then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

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
                  or ti.special_status is not null
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

            if exists (
                select 1
                from public.transaction_item ti
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                  and ti.special_status is not null
            ) then
                raise exception 'refunded_item_special_status_conflict'
                    using errcode = '22023', detail = 'refunded_item_special_status_conflict';
            end if;

            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        with requested as (
            select
                (allocation ->> 'refundedItemId')::uuid as refunded_item_id,
                round((allocation ->> 'refundAmount')::numeric * 100)::bigint
                    as requested_units
            from jsonb_array_elements(v_refund_allocations) allocation
        ), existing_refunds as (
            select
                link.refunded_item_id,
                coalesce(sum(link.refund_amount), 0) as refunded_amount
            from public.transaction_item_refund_link link
            join public.transaction_item refund_income
              on refund_income.id = link.refund_income_item_id
             and refund_income.ledger_id = link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where link.ledger_id = p_ledger_id
              and link.refunded_item_id = any(v_refund_target_ids)
              and link.refund_income_item_id <> p_income_item_id
              and refund_record.status = 'active'
            group by link.refunded_item_id
        ), targets as (
            select
                requested.refunded_item_id,
                requested.requested_units,
                round(
                    (ti.amount - coalesce(existing_refunds.refunded_amount, 0)) * 100
                )::bigint as remaining_units
            from requested
            join public.transaction_item ti
              on ti.id = requested.refunded_item_id
             and ti.ledger_id = p_ledger_id
            left join existing_refunds
              on existing_refunds.refunded_item_id = requested.refunded_item_id
        ), allocation_base as (
            select
                targets.*,
                sum(remaining_units) over () as total_remaining_units,
                floor(
                    round(v_income_amount * 100)::numeric * remaining_units
                    / nullif(sum(remaining_units) over (), 0)
                )::bigint as base_units,
                mod(
                    round(v_income_amount * 100)::bigint * remaining_units,
                    nullif(sum(remaining_units) over (), 0)
                ) as remainder_units
            from targets
        ), ranked as (
            select
                allocation_base.*,
                row_number() over (
                    order by remainder_units desc, refunded_item_id
                ) as remainder_rank,
                round(v_income_amount * 100)::bigint
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
        where total_remaining_units < round(v_income_amount * 100)::bigint
           or expected_units <= 0
           or expected_units > remaining_units
           or requested_units <> expected_units;

        if v_invalid_count > 0 then
            if exists (
                with existing_refunds as (
                    select
                        link.refunded_item_id,
                        coalesce(sum(link.refund_amount), 0) as refunded_amount
                    from public.transaction_item_refund_link link
                    join public.transaction_item refund_income
                      on refund_income.id = link.refund_income_item_id
                     and refund_income.ledger_id = link.ledger_id
                    join public.transaction_record refund_record
                      on refund_record.id = refund_income.transaction_record_id
                     and refund_record.ledger_id = refund_income.ledger_id
                    where link.ledger_id = p_ledger_id
                      and link.refunded_item_id = any(v_refund_target_ids)
                      and link.refund_income_item_id <> p_income_item_id
                      and refund_record.status = 'active'
                    group by link.refunded_item_id
                )
                select 1
                from public.transaction_item ti
                left join existing_refunds
                  on existing_refunds.refunded_item_id = ti.id
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                having sum(
                    ti.amount - coalesce(existing_refunds.refunded_amount, 0)
                ) < v_income_amount
            ) then
                raise exception 'refund_amount_exceeded'
                    using errcode = '22023', detail = 'refund_amount_exceeded';
            end if;

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

revoke all on function public.apply_transaction_item_links(uuid, uuid, jsonb, uuid)
from public, anon, authenticated;
