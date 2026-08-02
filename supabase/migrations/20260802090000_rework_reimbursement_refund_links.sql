-- PostgreSQL 不支持从 enum 中安全删除值，因此保留历史 migration，使用
-- “旧类型改名 → 新类型建同名 → 列换型 → 删除旧类型”的方式收窄枚举。
-- 三种旧状态没有新模型中的等价语义，迁移时清空，避免错误映射为报销或退款。
drop trigger if exists transaction_item_validate_special_status
on public.transaction_item;
drop function if exists public.validate_transaction_item_special_status();

alter type public.transaction_item_special_status
rename to transaction_item_special_status_legacy;

create type public.transaction_item_special_status as enum (
    'pending_reimbursement',
    'reimbursed'
);

alter table public.transaction_item
alter column special_status drop default;

alter table public.transaction_item
alter column special_status type public.transaction_item_special_status
using (
    case special_status::text
        when 'pending_reimbursement' then 'pending_reimbursement'
        when 'reimbursed' then 'reimbursed'
        else null
    end
)::public.transaction_item_special_status;

drop type public.transaction_item_special_status_legacy;

alter table public.transaction_item
add column settled_by_item_id uuid null
references public.transaction_item(id) on delete restrict;

create index transaction_item_settled_by_item_idx
on public.transaction_item (ledger_id, settled_by_item_id)
where settled_by_item_id is not null;

create table public.transaction_item_refund_link (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null references public.ledger(id) on delete cascade,
    refunded_item_id uuid not null references public.transaction_item(id) on delete restrict,
    refund_income_item_id uuid not null references public.transaction_item(id) on delete restrict,
    refund_amount numeric(14,2) not null check (refund_amount > 0),
    created_by uuid references public.app_user(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint transaction_item_refund_link_different_items_check
        check (refunded_item_id <> refund_income_item_id),
    constraint transaction_item_refund_link_income_unique
        unique (refund_income_item_id)
);

create index transaction_item_refund_link_refunded_item_idx
on public.transaction_item_refund_link (ledger_id, refunded_item_id);

alter table public.transaction_item_refund_link enable row level security;

create policy transaction_item_refund_link_select_active_member
on public.transaction_item_refund_link
for select
to authenticated
using (
    exists (
        select 1
        from public.ledger_member lm
        where lm.ledger_id = transaction_item_refund_link.ledger_id
          and lm.user_id = auth.uid()
          and lm.status = 'active'
    )
);

grant select on table public.transaction_item_refund_link to authenticated;
revoke insert, update, delete on table public.transaction_item_refund_link
from public, anon, authenticated;

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
    v_settling_item_is_income boolean;
begin
    if new.special_status is null then
        if new.settled_by_item_id is not null then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
        return new;
    end if;

    select c.type into v_category_type
    from public.category c
    where c.id = new.category_id
      and c.ledger_id = new.ledger_id;

    if v_category_type <> 'expense' then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    if new.special_status = 'pending_reimbursement' then
        if new.settled_by_item_id is not null then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
        return new;
    end if;

    if tg_op = 'INSERT'
       or old.special_status is distinct from 'pending_reimbursement'
       or current_setting('kuranote.reimbursement_link_flow', true) <> 'on'
       or new.settled_by_item_id is null then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

    select exists (
        select 1
        from public.transaction_item income_item
        join public.category income_category
          on income_category.id = income_item.category_id
         and income_category.ledger_id = income_item.ledger_id
        where income_item.id = new.settled_by_item_id
          and income_item.ledger_id = new.ledger_id
          and income_category.type = 'income'
    ) into v_settling_item_is_income;

    if not v_settling_item_is_income then
        raise exception 'reimbursement_income_invalid'
            using errcode = '22023', detail = 'reimbursement_income_invalid';
    end if;

    return new;
end;
$$;

revoke all on function public.validate_transaction_item_special_status()
from public, anon, authenticated;

create trigger transaction_item_validate_special_status
before insert or update of special_status, settled_by_item_id, category_id
on public.transaction_item
for each row execute function public.validate_transaction_item_special_status();

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
    v_income_category_type text;
    v_refunded_item_id uuid;
    v_refunded_amount numeric(14,2);
    v_refunded_category_type text;
    v_reimbursement_ids uuid[];
    v_requested_count integer;
    v_updated_count integer;
begin
    select ti.amount, c.type
    into v_income_amount, v_income_category_type
    from public.transaction_item ti
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    v_reimbursement_ids := array(
        select value::uuid
        from jsonb_array_elements_text(
            coalesce(p_item -> 'reimbursementItemIds', '[]'::jsonb)
        ) as value
    );
    v_requested_count := coalesce(array_length(v_reimbursement_ids, 1), 0);
    v_refunded_item_id := nullif(p_item ->> 'refundedItemId', '')::uuid;

    if v_requested_count = 0 and v_refunded_item_id is null then
        return;
    end if;

    if v_income_category_type <> 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_requested_count > 0 and v_refunded_item_id is not null then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_requested_count > 0 then
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

        get diagnostics v_updated_count = row_count;
        if v_updated_count <> v_requested_count then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;
    end if;

    if v_refunded_item_id is not null then
        perform 1
        from public.transaction_item ti
        where ti.id = v_refunded_item_id
          and ti.ledger_id = p_ledger_id
        for update;

        if not found then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        select ti.amount, c.type
        into v_refunded_amount, v_refunded_category_type
        from public.transaction_item ti
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.id = v_refunded_item_id
          and ti.ledger_id = p_ledger_id;

        if v_refunded_category_type <> 'expense' then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if v_income_amount > v_refunded_amount - coalesce((
            select sum(link.refund_amount)
            from public.transaction_item_refund_link link
            join public.transaction_item refund_income
              on refund_income.id = link.refund_income_item_id
             and refund_income.ledger_id = link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where link.ledger_id = p_ledger_id
              and link.refunded_item_id = v_refunded_item_id
              and refund_record.status = 'active'
        ), 0) then
            raise exception 'refund_amount_exceeded'
                using errcode = '22023', detail = 'refund_amount_exceeded';
        end if;

        insert into public.transaction_item_refund_link (
            ledger_id,
            refunded_item_id,
            refund_income_item_id,
            refund_amount,
            created_by
        ) values (
            p_ledger_id,
            v_refunded_item_id,
            p_income_item_id,
            v_income_amount,
            p_user_id
        );
    end if;
end;
$$;

revoke all on function public.apply_transaction_item_links(uuid, uuid, jsonb, uuid)
from public, anon, authenticated;

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(refunds.refunded_amount, 0::numeric)::numeric(14,2) as refunded_amount,
    exists (
        select 1
        from public.transaction_item_refund_link income_link
        join public.transaction_record income_record
          on income_record.id = ti.transaction_record_id
         and income_record.ledger_id = ti.ledger_id
        where income_link.refund_income_item_id = ti.id
          and income_link.ledger_id = ti.ledger_id
          and income_record.status = 'active'
    ) as is_refund_income
from public.transaction_item ti
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item refund_income
      on refund_income.id = link.refund_income_item_id
     and refund_income.ledger_id = link.ledger_id
    join public.transaction_record refund_record
      on refund_record.id = refund_income.transaction_record_id
     and refund_record.ledger_id = refund_income.ledger_id
    where link.refunded_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and refund_record.status = 'active'
) refunds on true;

grant select on table public.transaction_item_with_refund to authenticated;

create or replace function public.create_transaction(
    p_ledger_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid default null,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
    v_transaction_item_id uuid;
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
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

    insert into public.transaction_record (
        ledger_id, type, status, transaction_at, merchant_id, title, note,
        created_by, updated_by
    ) values (
        p_ledger_id, 'normal', 'active', p_transaction_at, p_merchant_id, null,
        p_note, v_user_id, v_user_id
    ) returning id into v_transaction_record_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        begin
            v_item_amount := (v_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_item ->> 'categoryId')::uuid;
            v_item_special_status := nullif(v_item ->> 'specialStatus', '')::public.transaction_item_special_status;
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

        v_balance_delta := case
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        insert into public.transaction_item (
            ledger_id, transaction_record_id, account_id, category_id, amount,
            discount_amount, balance_delta, note, sort_order, special_status,
            created_by, updated_by
        ) values (
            p_ledger_id, v_transaction_record_id, p_account_id,
            v_item_category_id, v_item_amount, 0, v_balance_delta, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        ) returning id into v_transaction_item_id;

        perform public.apply_transaction_item_links(
            p_ledger_id,
            v_transaction_item_id,
            v_item,
            v_user_id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id, p_account_id, v_balance_delta, v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon;
grant execute on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;

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
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
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

    if exists (
        select 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
          and (
              ti.special_status = 'reimbursed'
              or ti.settled_by_item_id is not null
              or exists (
                  select 1
                  from public.transaction_item_refund_link link
                  where link.refunded_item_id = ti.id
                     or link.refund_income_item_id = ti.id
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
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_existing_item.account_id,
            -v_existing_item.balance_delta,
            v_user_id
        );
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

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
            v_item_amount := (v_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_item ->> 'categoryId')::uuid;
            v_item_special_status := nullif(v_item ->> 'specialStatus', '')::public.transaction_item_special_status;
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

        if coalesce(jsonb_array_length(coalesce(v_item -> 'reimbursementItemIds', '[]'::jsonb)), 0) > 0
           or nullif(v_item ->> 'refundedItemId', '') is not null then
            raise exception 'income_links_create_only'
                using errcode = '22023', detail = 'income_links_create_only';
        end if;

        v_balance_delta := case
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        insert into public.transaction_item (
            ledger_id, transaction_record_id, account_id, category_id, amount,
            discount_amount, balance_delta, note, sort_order, special_status,
            created_by, updated_by
        ) values (
            p_ledger_id, p_transaction_record_id, p_account_id,
            v_item_category_id, v_item_amount, 0, v_balance_delta, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id, p_account_id, v_balance_delta, v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;

    return p_transaction_record_id;
end;
$$;

create or replace function public.load_transaction_group_summaries_with_special_status(
    p_ledger_id uuid,
    p_group_by text,
    p_date_start timestamptz default null,
    p_date_end timestamptz default null,
    p_record_type text default 'all',
    p_merchant_id uuid default null,
    p_account_id uuid default null,
    p_parent_category_id uuid default null,
    p_category_id uuid default null,
    p_member_id uuid default null,
    p_special_statuses text[] default null,
    p_offset integer default 0,
    p_limit integer default 20
)
returns table (
    group_id text,
    group_key text,
    group_label text,
    income numeric,
    expense numeric,
    balance numeric,
    transaction_count integer,
    latest_transaction_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
with base_items as (
    select
        tr.id as record_id,
        tr.transaction_at,
        tr.merchant_id,
        tr.created_by,
        ti.id as item_id,
        ti.account_id,
        ti.category_id,
        ti.special_status,
        c.type as category_type,
        c.parent_id,
        case
            when tr.type = 'transfer' then 0::numeric
            when c.type = 'income' and ti.is_refund_income then 0::numeric
            when c.type = 'income' then ti.amount
            when c.type = 'expense' then -greatest(ti.amount - ti.refunded_amount, 0)
            else 0::numeric
        end as signed_amount
    from public.transaction_record tr
    join public.transaction_item_with_refund ti
      on ti.transaction_record_id = tr.id
     and ti.ledger_id = tr.ledger_id
    left join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type in ('normal', 'transfer')
      and (p_date_start is null or tr.transaction_at >= p_date_start)
      and (p_date_end is null or tr.transaction_at < p_date_end)
      and (p_merchant_id is null or tr.merchant_id = p_merchant_id)
      and (p_member_id is null or tr.created_by = p_member_id)
),
record_profiles as (
    select
        record_id,
        bool_or(category_type = 'expense') as has_expense,
        bool_or(category_type = 'income') as has_income,
        sum(signed_amount) as net_amount
    from base_items
    group by record_id
),
matched_items as (
    select bi.*
    from base_items bi
    join record_profiles rp on rp.record_id = bi.record_id
    where (
        p_record_type = 'all'
        or (p_record_type = 'transfer' and bi.category_type is null)
        or (p_record_type = 'income' and rp.net_amount > 0)
        or (p_record_type = 'expense' and (rp.net_amount < 0 or (rp.net_amount = 0 and rp.has_expense)))
    )
      and (p_account_id is null or bi.account_id = p_account_id)
      and (p_parent_category_id is null or bi.parent_id = p_parent_category_id or bi.category_id = p_parent_category_id)
      and (p_category_id is null or bi.category_id = p_category_id)
      and (
          coalesce(array_length(p_special_statuses, 1), 0) = 0
          or bi.special_status::text = any(p_special_statuses)
      )
),
grouped as (
    select
        case p_group_by
            when 'merchant' then coalesce(mi.merchant_id::text, 'unknown')
            when 'account' then mi.account_id::text
            when 'parentCategory' then coalesce(mi.parent_id, mi.category_id)::text
            when 'category' then coalesce(mi.category_id::text, 'unknown')
            when 'member' then coalesce(mi.created_by::text, 'unknown')
            when 'specialStatus' then mi.special_status::text
            else 'unknown'
        end as key,
        count(distinct case
            when p_group_by = 'specialStatus' then mi.item_id::text
            else mi.record_id::text
        end) as count_value,
        sum(case when mi.signed_amount > 0 then mi.signed_amount else 0 end) as income_value,
        sum(case when mi.signed_amount < 0 then -mi.signed_amount else 0 end) as expense_value,
        sum(mi.signed_amount) as balance_value,
        max(mi.transaction_at) as latest_at
    from matched_items mi
    where p_group_by <> 'specialStatus' or mi.special_status is not null
    group by 1
),
labeled as (
    select
        g.*,
        case p_group_by
            when 'merchant' then coalesce((select m.name from public.merchant m where m.id::text = g.key and m.ledger_id = p_ledger_id), '未知商家')
            when 'account' then coalesce((select a.name from public.account a where a.id::text = g.key and a.ledger_id = p_ledger_id), '未知账户')
            when 'parentCategory' then coalesce((select c.name from public.category c where c.id::text = g.key and c.ledger_id = p_ledger_id), '未知大分类')
            when 'category' then coalesce((select c.name from public.category c where c.id::text = g.key and c.ledger_id = p_ledger_id), '未知小分类')
            when 'member' then coalesce((
                select coalesce(nullif(trim(setting.display_name), ''), u.display_name)
                from public.app_user u
                left join public.ledger_member_display_setting setting
                  on setting.user_id = u.id and setting.ledger_id = p_ledger_id
                where u.id::text = g.key
            ), '未知成员')
            when 'specialStatus' then case g.key
                when 'pending_reimbursement' then '待报销'
                when 'reimbursed' then '已报销'
                else '未知状态'
            end
            else '未知分组'
        end as label
    from grouped g
)
select
    p_group_by || ':' || labeled.key,
    labeled.key,
    labeled.label,
    coalesce(labeled.income_value, 0),
    coalesce(labeled.expense_value, 0),
    coalesce(labeled.balance_value, 0),
    labeled.count_value::integer,
    labeled.latest_at
from labeled
order by
    case when p_group_by = 'specialStatus' then
        case labeled.key when 'pending_reimbursement' then 1 when 'reimbursed' then 2 else 3 end
    end,
    labeled.latest_at desc,
    labeled.label
offset greatest(p_offset, 0)
limit greatest(p_limit, 1);
$$;

revoke all on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, text[], integer, integer
) from public, anon;
grant execute on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, text[], integer, integer
) to authenticated;
