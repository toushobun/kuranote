-- 用收入侧单目标关联表替换 transaction_item.settled_by_item_id。
create table public.transaction_item_reimbursement_link (
    ledger_id uuid not null references public.ledger(id) on delete cascade,
    target_expense_item_id uuid not null,
    reimbursement_income_item_id uuid not null,
    reimbursement_amount numeric(14,2) not null,
    created_by uuid references public.app_user(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint transaction_item_reimbursement_link_income_unique
        unique (reimbursement_income_item_id),
    constraint transaction_item_reimbursement_link_different_items_check
        check (target_expense_item_id <> reimbursement_income_item_id),
    constraint transaction_item_reimbursement_link_amount_check
        check (reimbursement_amount > 0),
    constraint transaction_item_reimbursement_link_target_same_ledger_fk
        foreign key (target_expense_item_id, ledger_id)
        references public.transaction_item(id, ledger_id) on delete restrict,
    constraint transaction_item_reimbursement_link_income_same_ledger_fk
        foreign key (reimbursement_income_item_id, ledger_id)
        references public.transaction_item(id, ledger_id) on delete restrict
);

create index transaction_item_reimbursement_link_target_idx
on public.transaction_item_reimbursement_link (ledger_id, target_expense_item_id);

alter table public.transaction_item_reimbursement_link enable row level security;

create policy transaction_item_reimbursement_link_select_active_member
on public.transaction_item_reimbursement_link
for select
to authenticated
using (
    public.current_user_is_active_ledger_member(
        transaction_item_reimbursement_link.ledger_id
    )
);

grant select on table public.transaction_item_reimbursement_link to authenticated;
revoke insert, update, delete, truncate
on table public.transaction_item_reimbursement_link
from public, anon, authenticated, service_role;

create or replace function public.validate_transaction_item_reimbursement_link()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_target_category_type text;
    v_target_currency text;
    v_target_record_status text;
    v_income_category_type text;
    v_income_currency text;
    v_income_record_status text;
begin
    select c.type, a.currency, tr.status
    into v_target_category_type, v_target_currency, v_target_record_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = new.target_expense_item_id
      and ti.ledger_id = new.ledger_id;

    select c.type, a.currency, tr.status
    into v_income_category_type, v_income_currency, v_income_record_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = new.reimbursement_income_item_id
      and ti.ledger_id = new.ledger_id;

    if v_target_category_type is distinct from 'expense'
       or v_income_category_type is distinct from 'income'
       or v_target_record_status is distinct from 'active'
       or v_income_record_status is distinct from 'active' then
        raise exception 'reimbursement_item_invalid'
            using errcode = '22023', detail = 'reimbursement_item_invalid';
    end if;

    if v_target_currency is distinct from v_income_currency then
        raise exception 'reimbursement_currency_mismatch'
            using errcode = '22023', detail = 'reimbursement_currency_mismatch';
    end if;

    if exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = new.ledger_id
          and (
              link.refund_income_item_id = new.reimbursement_income_item_id
              or link.refunded_item_id = new.target_expense_item_id
          )
    ) then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    return new;
end;
$$;

revoke all on function public.validate_transaction_item_reimbursement_link()
from public, anon, authenticated;

create trigger transaction_item_reimbursement_link_validate
before insert or update
on public.transaction_item_reimbursement_link
for each row execute function public.validate_transaction_item_reimbursement_link();

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

    if exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = old.ledger_id
          and (
              link.target_expense_item_id = old.id
              or link.reimbursement_income_item_id = old.id
          )
    ) or exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = old.ledger_id
          and (
              link.refunded_item_id = old.id
              or link.refund_income_item_id = old.id
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

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
    v_special_status_enabled boolean;
    v_has_active_refund_link boolean;
    v_is_controlled_unlink boolean;
begin
    if new.special_status is not null then
        select l.transaction_item_special_status_enabled
        into v_special_status_enabled
        from public.ledger l
        where l.id = new.ledger_id
        for update;

        if v_special_status_enabled is distinct from true then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
    end if;

    v_is_controlled_unlink :=
        tg_op = 'UPDATE'
        and old.special_status = 'reimbursed'
        and new.special_status = 'pending_reimbursement'
        and current_user = 'postgres'
        and current_setting('kuranote.income_link_edit_flow', true)
            is not distinct from 'on';

    if tg_op = 'UPDATE'
       and old.special_status = 'reimbursed'
       and new.special_status is distinct from old.special_status
       and not v_is_controlled_unlink then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    if new.special_status is null then
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
        select exists (
            select 1
            from public.transaction_item_refund_link link
            join public.transaction_item refund_income
              on refund_income.id = link.refund_income_item_id
             and refund_income.ledger_id = link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where link.ledger_id = new.ledger_id
              and link.refunded_item_id = new.id
              and refund_record.status = 'active'
        ) into v_has_active_refund_link;

        if v_has_active_refund_link then
            raise exception 'special_status_refund_conflict'
                using errcode = '22023', detail = 'special_status_refund_conflict';
        end if;
        return new;
    end if;

    if tg_op = 'INSERT'
       or old.special_status is distinct from 'pending_reimbursement'
       or current_setting('kuranote.reimbursement_link_flow', true)
            is distinct from 'on' then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    return new;
end;
$$;

create or replace function public.clear_transaction_item_income_links(
    p_ledger_id uuid,
    p_income_item_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_income_category_type text;
begin
    select c.type
    into v_income_category_type
    from public.transaction_item income_item
    join public.category c
      on c.id = income_item.category_id
     and c.ledger_id = income_item.ledger_id
    where income_item.id = p_income_item_id
      and income_item.ledger_id = p_ledger_id
    for update of income_item;

    if not found or v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);

    with deleted_links as (
        delete from public.transaction_item_reimbursement_link link
        where link.ledger_id = p_ledger_id
          and link.reimbursement_income_item_id = p_income_item_id
        returning link.target_expense_item_id
    )
    update public.transaction_item target_item
    set special_status = 'pending_reimbursement',
        updated_by = p_user_id,
        updated_at = now()
    where target_item.ledger_id = p_ledger_id
      and target_item.id in (
          select deleted_links.target_expense_item_id
          from deleted_links
      )
      and target_item.special_status = 'reimbursed';

    delete from public.transaction_item_refund_link link
    where link.ledger_id = p_ledger_id
      and link.refund_income_item_id = p_income_item_id;

    perform set_config('kuranote.income_link_edit_flow', 'off', true);
end;
$$;

revoke all on function public.clear_transaction_item_income_links(uuid, uuid, uuid)
from public, anon, authenticated;


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

    v_refund_allocations := coalesce(v_refund_allocations, '[]'::jsonb);


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

    if v_refund_count = 0 then
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
                    round(v_income_amount * 100)::numeric * remaining_units,
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

create or replace function public.update_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_existing_item public.transaction_item;
    v_existing_item_ids uuid[] := array[]::uuid[];
    v_used_item_ids uuid[] := array[]::uuid[];
    v_transaction_item_ids uuid[] := array[]::uuid[];
    v_item_payloads jsonb[] := array[]::jsonb[];
    v_item jsonb;
    v_item_index integer;
    v_item_count integer;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_transaction_item_id uuid;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
    v_is_income_link_edit_request boolean;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    v_is_income_link_edit_request := p_type = 'income';

    if not exists (
        select 1 from public.account a
        where a.id = p_account_id
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
    ) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id
          and m.ledger_id = p_ledger_id
          and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    select * into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    -- 目标支出始终冻结；收入侧只有受控编辑流程可以先清空关联再编辑。
    if exists (
        select 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
          and (
              ti.special_status = 'reimbursed'
              or exists (
                  select 1
                  from public.transaction_item_reimbursement_link link
                  where link.ledger_id = ti.ledger_id
                    and link.target_expense_item_id = ti.id
              )
              or exists (
                  select 1
                  from public.transaction_item_refund_link link
                  where link.ledger_id = ti.ledger_id
                    and link.refunded_item_id = ti.id
              )
              or (
                  not v_is_income_link_edit_request
                  and (
                      exists (
                          select 1
                          from public.transaction_item_reimbursement_link link
                          where link.ledger_id = ti.ledger_id
                            and link.reimbursement_income_item_id = ti.id
                      )
                      or exists (
                          select 1
                          from public.transaction_item_refund_link link
                          where link.ledger_id = ti.ledger_id
                            and link.refund_income_item_id = ti.id
                      )
                  )
              )
          )
    ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    for v_existing_item in
        select * from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        v_existing_item_ids := array_append(
            v_existing_item_ids,
            v_existing_item.id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_existing_item.account_id,
            -v_existing_item.balance_delta,
            v_user_id
        );

        if exists (
            select 1
            from public.transaction_item_reimbursement_link reimbursement_link
            where reimbursement_link.ledger_id = p_ledger_id
              and reimbursement_link.reimbursement_income_item_id =
                  v_existing_item.id
        ) or exists (
            select 1
            from public.transaction_item_refund_link refund_link
            where refund_link.ledger_id = p_ledger_id
              and refund_link.refund_income_item_id = v_existing_item.id
        ) then
            perform public.clear_transaction_item_income_links(
                p_ledger_id,
                v_existing_item.id,
                v_user_id
            );
        end if;
    end loop;

    update public.transaction_record tr
    set type = 'normal',
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        begin
            v_transaction_item_id := nullif(v_item ->> 'id', '')::uuid;
        exception when invalid_text_representation then
            raise exception 'items_invalid'
                using errcode = '22023', detail = 'items_invalid';
        end;

        begin
            v_item_amount := (v_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_item ->> 'categoryId')::uuid;
            v_item_special_status := nullif(
                v_item ->> 'specialStatus',
                ''
            )::public.transaction_item_special_status;
        exception when invalid_text_representation then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end;

        if v_item_amount is null or v_item_amount < 0
           or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        if v_item_special_status = 'reimbursed'
           or (v_item_special_status = 'pending_reimbursement'
               and v_item_category_type <> 'expense') then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        if coalesce(
            jsonb_array_length(
                coalesce(v_item -> 'refundAllocations', '[]'::jsonb)
            ),
            0
        ) > 0 and v_item_category_type <> 'income' then
            raise exception 'income_link_category_invalid'
                using errcode = '22023', detail = 'income_link_category_invalid';
        end if;

        v_balance_delta := case
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        if v_transaction_item_id is not null and (
            not (v_transaction_item_id = any(v_existing_item_ids))
            or v_transaction_item_id = any(v_used_item_ids)
        ) then
            raise exception 'items_invalid'
                using errcode = '22023', detail = 'items_invalid';
        end if;

        if v_transaction_item_id is null then
            insert into public.transaction_item (
                ledger_id,
                transaction_record_id,
                account_id,
                category_id,
                amount,
                discount_amount,
                balance_delta,
                note,
                sort_order,
                special_status,
                created_by,
                updated_by
            ) values (
                p_ledger_id,
                p_transaction_record_id,
                p_account_id,
                v_item_category_id,
                v_item_amount,
                0,
                v_balance_delta,
                null,
                v_sort_order,
                v_item_special_status,
                v_user_id,
                v_user_id
            ) returning id into v_transaction_item_id;
        else
            update public.transaction_item ti
            set account_id = p_account_id,
                category_id = v_item_category_id,
                amount = v_item_amount,
                discount_amount = 0,
                balance_delta = v_balance_delta,
                note = null,
                sort_order = v_sort_order,
                special_status = v_item_special_status,
                updated_by = v_user_id,
                updated_at = now()
            where ti.id = v_transaction_item_id
              and ti.ledger_id = p_ledger_id
              and ti.transaction_record_id = p_transaction_record_id;
        end if;

        v_used_item_ids := array_append(v_used_item_ids, v_transaction_item_id);
        v_transaction_item_ids := array_append(
            v_transaction_item_ids,
            v_transaction_item_id
        );
        v_item_payloads := array_append(v_item_payloads, v_item);

        perform public.apply_account_balance_delta(
            p_ledger_id,
            p_account_id,
            v_balance_delta,
            v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and not (ti.id = any(v_used_item_ids));

    v_item_count := coalesce(array_length(v_transaction_item_ids, 1), 0);
    if v_item_count > 0 then
        for v_item_index in 1..v_item_count
        loop
            perform public.apply_transaction_item_links(
                p_ledger_id,
                v_transaction_item_ids[v_item_index],
                v_item_payloads[v_item_index],
                v_user_id
            );
        end loop;
    end if;

    return p_transaction_record_id;
end;
$$;

revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon;
grant execute on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;


create or replace function public.prevent_linked_transaction_void()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
    if old.status = 'active'
       and new.status = 'deleted'
       and exists (
           select 1
           from public.transaction_item ti
           where ti.transaction_record_id = old.id
             and ti.ledger_id = old.ledger_id
             and (
                 exists (
                     select 1
                     from public.transaction_item_reimbursement_link link
                     where link.ledger_id = ti.ledger_id
                       and (
                           link.target_expense_item_id = ti.id
                           or link.reimbursement_income_item_id = ti.id
                       )
                 )
                 or exists (
                     select 1
                     from public.transaction_item_refund_link link
                     where link.ledger_id = ti.ledger_id
                       and (
                           link.refunded_item_id = ti.id
                           or link.refund_income_item_id = ti.id
                       )
                 )
             )
       ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;
    return new;
end;
$$;

drop trigger if exists transaction_item_validate_special_status
on public.transaction_item;
drop view public.transaction_item_with_refund;
alter table public.transaction_item drop column settled_by_item_id;

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(expense_refunds.refunded_amount, 0::numeric)::numeric(14,2)
        as refunded_amount,
    coalesce(income_refunds.refunded_amount, 0::numeric) > 0
        as is_refund_income,
    coalesce(income_reimbursements.reimbursed_amount, 0::numeric) > 0
        as is_reimbursement_income,
    exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.refunded_item_id = ti.id
              or link.refund_income_item_id = ti.id
          )
    ) as has_refund_link,
    exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.target_expense_item_id = ti.id
              or link.reimbursement_income_item_id = ti.id
          )
    ) as has_reimbursement_link,
    greatest(
        ti.amount - coalesce(business_offsets.offset_amount, 0::numeric),
        0::numeric
    )::numeric(14,2) as business_net_amount
from public.transaction_item ti
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item income_item
      on income_item.id = link.refund_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
    where link.refunded_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and income_record.status = 'active'
) expense_refunds on true
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item target_item
      on target_item.id = link.refunded_item_id
     and target_item.ledger_id = link.ledger_id
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
    where link.refund_income_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and target_record.status = 'active'
) income_refunds on true
left join lateral (
    select ti.amount as reimbursed_amount
    from public.transaction_item_reimbursement_link link
    join public.transaction_item income_item
      on income_item.id = link.reimbursement_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
    where link.target_expense_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and income_record.status = 'active'
    limit 1
) expense_reimbursements on true
left join lateral (
    select sum(target_item.amount) as reimbursed_amount
    from public.transaction_item_reimbursement_link link
    join public.transaction_item target_item
      on target_item.id = link.target_expense_item_id
     and target_item.ledger_id = link.ledger_id
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
    where link.reimbursement_income_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and target_record.status = 'active'
) income_reimbursements on true
left join lateral (
    select sum(offsets.amount) as offset_amount
    from (
        select coalesce(expense_refunds.refunded_amount, 0::numeric) as amount
        union all
        select coalesce(income_refunds.refunded_amount, 0::numeric)
        union all
        select coalesce(expense_reimbursements.reimbursed_amount, 0::numeric)
        union all
        select coalesce(income_reimbursements.reimbursed_amount, 0::numeric)
    ) offsets
) business_offsets on true;

grant select on table public.transaction_item_with_refund to authenticated;

create trigger transaction_item_validate_special_status
before insert or update of special_status, category_id
on public.transaction_item
for each row execute function public.validate_transaction_item_special_status();
