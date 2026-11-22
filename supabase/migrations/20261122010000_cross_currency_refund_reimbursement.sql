-- #1147：跨币种退款报销。日期汇率和两端小数位统一由 SQL 算，避免多处舍入差异。
-- 与 src/utils/transactionAmountInput.ts 相同：未知币种 0 位，BHD/KWD/OMR 3 位。
create function public.transaction_currency_decimal_places(p_currency text)
returns integer language sql immutable parallel safe
set search_path = pg_catalog, pg_temp
as $$
    select case upper(trim(coalesce(p_currency, '')))
        when 'BHD' then 3 when 'KWD' then 3 when 'OMR' then 3
        when 'CNY' then 2 when 'EUR' then 2 when 'GBP' then 2
        when 'HKD' then 2 when 'SGD' then 2 when 'THB' then 2
        when 'TWD' then 2 when 'USD' then 2
        else 0 end;
$$;
revoke all on function public.transaction_currency_decimal_places(text)
    from public, anon, authenticated, service_role;
grant execute on function public.transaction_currency_decimal_places(text)
    to authenticated, service_role;

-- 以单一原支出为键，按收入记录先后顺序在原支出币种分配抵扣。
-- 收入侧抵扣按收入币种重新取整；未保存汇率快照，改日期会即时变化。
create function public.transaction_link_allocations(
    p_ledger_id uuid, p_target_id uuid
)
returns table (
    target_id uuid,
    income_id uuid,
    is_refund boolean,
    income_amount numeric,
    income_currency text,
    target_currency text,
    converted_amount numeric,
    applied_target numeric,
    applied_income numeric,
    rate numeric,
    rate_date date
)
-- 对象引用全部写明 public；无函数级 SET 才能让 PostgreSQL 内联并优化关联查询。
language sql stable security invoker
as $
with target as (
    select
        ti.id, ti.amount,
        tr.status = 'active' as is_active,
        coalesce((
            select a.currency
            from public.transaction_payment p
            join public.account a
              on a.id = p.account_id and a.ledger_id = p.ledger_id
            where p.ledger_id = ti.ledger_id
              and p.transaction_record_id = ti.transaction_record_id
            order by p.sort_order, p.id
            limit 1
        ), ledger.base_currency) as currency,
        ledger.base_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id and tr.ledger_id = ti.ledger_id
    join public.ledger ledger on ledger.id = ti.ledger_id
    where ti.ledger_id = p_ledger_id and ti.id = p_target_id
),
links as (
    select
        l.refund_income_item_id as income_id,
        l.refund_amount as amount,
        true as is_refund
    from public.transaction_item_refund_link l
    where l.ledger_id = p_ledger_id and l.refunded_item_id = p_target_id
    union all
    select
        l.reimbursement_income_item_id,
        l.reimbursement_amount,
        false
    from public.transaction_item_reimbursement_link l
    where l.ledger_id = p_ledger_id and l.target_expense_item_id = p_target_id
),
events as (
    select
        target.id as target_id,
        target.amount as target_amount,
        target.is_active as target_active,
        target.currency as target_currency,
        link.income_id,
        link.amount as income_amount,
        link.is_refund,
        coalesce((
            select a.currency
            from public.transaction_payment p
            join public.account a
              on a.id = p.account_id and a.ledger_id = p.ledger_id
            where p.ledger_id = income.ledger_id
              and p.transaction_record_id = income.transaction_record_id
            order by p.sort_order, p.id
            limit 1
        ), target.base_currency) as income_currency,
        record.transaction_at,
        record.created_at as record_created_at,
        income.sort_order
    from target
    join links link on true
    join public.transaction_item income
      on income.id = link.income_id and income.ledger_id = p_ledger_id
    join public.transaction_record record
      on record.id = income.transaction_record_id
     and record.ledger_id = income.ledger_id
     and record.status = 'active'
),
rated as (
    select e.*, fx.rate, fx.rate_date,
        case when fx.rate > 0 then round(
            e.income_amount * fx.rate,
            public.transaction_currency_decimal_places(e.target_currency)
        ) else 0::numeric end as converted_amount
    from events e
    cross join lateral public.exchange_rate_with_date(
        e.income_currency,
        e.target_currency,
        public.transaction_record_local_date(e.transaction_at)
    ) fx
),
ordered as (
    select rated.*,
        coalesce(sum(rated.converted_amount) over (
            partition by rated.target_id
            order by rated.transaction_at, rated.record_created_at,
                     rated.sort_order, rated.income_id
            rows between unbounded preceding and 1 preceding
        ), 0::numeric) as prior_amount
    from rated
),
allocated as (
    select ordered.*,
        case when ordered.target_active and ordered.rate > 0 then
            least(
                ordered.converted_amount,
                greatest(ordered.target_amount - ordered.prior_amount, 0::numeric)
            )
        else 0::numeric end as actual_target
    from ordered
)
select
    a.target_id, a.income_id, a.is_refund, a.income_amount,
    a.income_currency, a.target_currency, a.converted_amount,
    a.actual_target as applied_target,
    case when a.rate > 0 then round(
        a.actual_target / a.rate,
        public.transaction_currency_decimal_places(a.income_currency)
    ) else 0::numeric end as applied_income,
    a.rate, a.rate_date
from allocated a;
$$;
revoke all on function public.transaction_link_allocations(uuid, uuid)
    from public, anon, authenticated, service_role;
grant execute on function public.transaction_link_allocations(uuid, uuid)
    to authenticated, service_role;

-- 将单目标权威核销扩展为批量读取，编辑小票一次查询全部关联。
create function public.transaction_link_allocations_for_targets(
    p_ledger_id uuid, p_target_ids uuid[]
)
returns table (
    target_id uuid, income_id uuid, is_refund boolean,
    income_amount numeric, income_currency text, target_currency text,
    converted_amount numeric, applied_target numeric, applied_income numeric,
    rate numeric, rate_date date
)
language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
    select allocated.*
    from unnest(p_target_ids) as target(target_id)
    cross join lateral public.transaction_link_allocations(p_ledger_id, target.target_id) allocated;
$$;
revoke all on function public.transaction_link_allocations_for_targets(uuid, uuid[])
    from public, anon, authenticated, service_role;
grant execute on function public.transaction_link_allocations_for_targets(uuid, uuid[])
    to authenticated, service_role;

create or replace function public.calculate_transaction_item_remaining_offset_amount(
    p_ledger_id uuid, p_target_expense_item_id uuid
)
returns numeric language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select target.amount - coalesce((
        select sum(a.converted_amount)
        from public.transaction_link_allocations(p_ledger_id, p_target_expense_item_id) a
    ), 0::numeric)
    from public.transaction_item target
    join public.transaction_record record
      on record.id = target.transaction_record_id
     and record.ledger_id = target.ledger_id and record.status = 'active'
    where target.ledger_id = p_ledger_id
      and target.id = p_target_expense_item_id;
$$;

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(offsets.refunded_amount, 0::numeric) as refunded_amount,
    exists (
        select 1
        from public.transaction_item_refund_link link
        join public.transaction_item target_item
          on target_item.id = link.refunded_item_id
         and target_item.ledger_id = link.ledger_id
        join public.transaction_record target_record
          on target_record.id = target_item.transaction_record_id
         and target_record.ledger_id = target_item.ledger_id
        where link.ledger_id = ti.ledger_id
          and link.refund_income_item_id = ti.id
          and target_record.status = 'active'
    ) as is_refund_income,
    exists (
        select 1
        from public.transaction_item_reimbursement_link link
        join public.transaction_item target_item
          on target_item.id = link.target_expense_item_id
         and target_item.ledger_id = link.ledger_id
        join public.transaction_record target_record
          on target_record.id = target_item.transaction_record_id
         and target_record.ledger_id = target_item.ledger_id
        where link.ledger_id = ti.ledger_id
          and link.reimbursement_income_item_id = ti.id
          and target_record.status = 'active'
    ) as is_reimbursement_income,
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
        ti.amount
        - coalesce(offsets.applied_amount, 0::numeric),
        0::numeric
    ) as business_net_amount,
    coalesce(offsets.reimbursed_amount, 0::numeric)
        as reimbursement_amount
from public.transaction_item ti
left join lateral (
    with targets as (
        select ti.id
        where exists (
            select 1 from public.transaction_item_refund_link link
            where link.ledger_id = ti.ledger_id and link.refunded_item_id = ti.id
        ) or exists (
            select 1 from public.transaction_item_reimbursement_link link
            where link.ledger_id = ti.ledger_id and link.target_expense_item_id = ti.id
        )
        union
        select l.refunded_item_id
        from public.transaction_item_refund_link l
        where l.ledger_id = ti.ledger_id and l.refund_income_item_id = ti.id
        union
        select l.target_expense_item_id
        from public.transaction_item_reimbursement_link l
        where l.ledger_id = ti.ledger_id and l.reimbursement_income_item_id = ti.id
    ), allocations as (
        select a.*
        from targets t
        cross join lateral public.transaction_link_allocations(ti.ledger_id, t.id) a
    )
    select
        sum(converted_amount) filter (
            where target_id = ti.id and is_refund
        ) as refunded_amount,
        sum(converted_amount) filter (
            where target_id = ti.id and not is_refund
        ) as reimbursed_amount,
        sum(case when target_id = ti.id then applied_target else 0::numeric end)
        + sum(case when income_id = ti.id then applied_income else 0::numeric end) as applied_amount
    from allocations
) offsets on true;


-- 关联写入、直接更新关联、修改付款账户时统一在数据库拒绝缺失汇率。
CREATE OR REPLACE FUNCTION "public"."apply_transaction_item_links"("p_ledger_id" "uuid", "p_income_item_id" "uuid", "p_item" "jsonb", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_income_amount numeric(14,2);
    v_income_category_type text;
    v_income_currency text;
    v_income_at timestamptz;
    v_reimbursement_target_id uuid;
    v_reimbursement_target_type text;
    v_reimbursement_target_currency text;
    v_reimbursement_target_status public.transaction_item_special_status;
    v_reimbursement_amount numeric(14,2);
    v_refund_target_id uuid;
    v_refund_target_type text;
    v_refund_target_currency text;
    v_refund_amount numeric(14,2);
    v_special_status_enabled boolean;
begin
    begin
        v_refund_target_id := nullif(p_item ->> 'refundedItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
    end;

    begin
        v_reimbursement_target_id :=
            nullif(p_item ->> 'reimbursementItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'reimbursement_item_invalid'
                using errcode = '22023', detail = 'reimbursement_item_invalid';
    end;

    if v_reimbursement_target_id is null and v_refund_target_id is null then
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

    select ti.amount, c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id), tr.transaction_at
    into v_income_amount, v_income_category_type, v_income_currency, v_income_at
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_reimbursement_target_id is not null and v_refund_target_id is not null then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_reimbursement_target_id is not null then
        select ti.special_status, c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
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
        where ti.ledger_id = p_ledger_id
          and ti.id = v_reimbursement_target_id
        for update of ti, tr;

        if not found
           or v_reimbursement_target_type is distinct from 'expense'
           or v_reimbursement_target_status is null
           or v_reimbursement_target_status not in (
               'pending_reimbursement',
               'reimbursed',
               'reimbursement_surplus'
           ) then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if public.exchange_rate_on(v_income_currency, v_reimbursement_target_currency, public.transaction_record_local_date(v_income_at)) is null then
            raise exception 'link_exchange_rate_missing' using errcode = '22023', detail = 'link_exchange_rate_missing';
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

        v_reimbursement_amount := v_income_amount;

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

        if v_reimbursement_amount > 0 then
            perform set_config('kuranote.reimbursement_link_flow', 'on', true);

            update public.transaction_item target_item
            set special_status = case
                    when public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        v_reimbursement_target_id
                    ) > 0
                    then 'pending_reimbursement'::public.transaction_item_special_status
                    else 'reimbursed'::public.transaction_item_special_status
                end,
                updated_by = p_user_id,
                updated_at = now()
            where target_item.ledger_id = p_ledger_id
              and target_item.id = v_reimbursement_target_id;

            perform set_config('kuranote.reimbursement_link_flow', 'off', true);
        end if;
    end if;

    if v_refund_target_id is not null then
        if v_income_amount < 0 then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
        into v_refund_target_type, v_refund_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.ledger_id = p_ledger_id
          and ti.id = v_refund_target_id
        for update of ti, tr;

        if not found or v_refund_target_type is distinct from 'expense' then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if public.exchange_rate_on(v_income_currency, v_refund_target_currency, public.transaction_record_local_date(v_income_at)) is null then
            raise exception 'link_exchange_rate_missing' using errcode = '22023', detail = 'link_exchange_rate_missing';
        end if;

        if exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = p_ledger_id
              and link.reimbursement_income_item_id = p_income_item_id
        ) then
            raise exception 'income_link_conflict'
                using errcode = '22023', detail = 'income_link_conflict';
        end if;

        v_refund_amount := v_income_amount;

        insert into public.transaction_item_refund_link (
            ledger_id,
            refunded_item_id,
            refund_income_item_id,
            refund_amount,
            created_by
        ) values (
            p_ledger_id,
            v_refund_target_id,
            p_income_item_id,
            v_refund_amount,
            p_user_id
        );
    end if;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."validate_transaction_item_reimbursement_link"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_target_category_type text;
    v_target_currency text;
    v_target_record_status text;
    v_target_special_status public.transaction_item_special_status;
    v_income_category_type text;
    v_income_currency text;
    v_income_record_status text;
    v_income_at timestamptz;
begin
    select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id), tr.status, ti.special_status
    into
        v_target_category_type,
        v_target_currency,
        v_target_record_status,
        v_target_special_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = new.target_expense_item_id
      and ti.ledger_id = new.ledger_id;

    select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id), tr.status, tr.transaction_at
    into v_income_category_type, v_income_currency, v_income_record_status, v_income_at
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = new.reimbursement_income_item_id
      and ti.ledger_id = new.ledger_id;

    if v_target_category_type is distinct from 'expense'
       or v_income_category_type is distinct from 'income'
       or v_target_record_status is distinct from 'active'
       or v_income_record_status is distinct from 'active'
       or v_target_special_status is null
       or v_target_special_status not in (
           'pending_reimbursement',
           'reimbursed',
           'reimbursement_surplus'
       ) then
        raise exception 'reimbursement_item_invalid'
            using errcode = '22023', detail = 'reimbursement_item_invalid';
    end if;

    if public.exchange_rate_on(v_income_currency, v_target_currency, public.transaction_record_local_date(v_income_at)) is null then
        raise exception 'link_exchange_rate_missing' using errcode = '22023', detail = 'link_exchange_rate_missing';
    end if;

    if exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = new.ledger_id
          and link.refund_income_item_id = new.reimbursement_income_item_id
    ) then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."validate_transaction_record_payments"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_record_ids uuid[];
    v_record_id uuid;
    v_record public.transaction_record;
    v_payment_count integer;
    v_payment_delta_total numeric;
    v_payment_currency_count integer;
    v_payments_all_outflow boolean;
    v_payments_all_inflow boolean;
    v_item_delta_total numeric;
    v_items_all_expense boolean;
    v_items_all_income boolean;
begin
    if tg_table_name = 'transaction_record' then
        v_record_ids := array[new.id];
    elsif tg_op = 'DELETE' then
        v_record_ids := array[old.transaction_record_id];
    elsif tg_op = 'UPDATE' then
        v_record_ids := array[old.transaction_record_id, new.transaction_record_id];
    else
        v_record_ids := array[new.transaction_record_id];
    end if;

    for v_record_id in select distinct unnest(v_record_ids)
    loop
        select * into v_record
        from public.transaction_record tr
        where tr.id = v_record_id;

        -- 记录已被删除（例如删除账本）时无需检查。
        continue when not found;

        select
            count(*)::integer,
            coalesce(sum(p.balance_delta), 0),
            count(distinct a.currency)::integer,
            bool_and(p.balance_delta = -p.amount),
            bool_and(p.balance_delta = p.amount)
        into
            v_payment_count,
            v_payment_delta_total,
            v_payment_currency_count,
            v_payments_all_outflow,
            v_payments_all_inflow
        from public.transaction_payment p
        join public.account a
          on a.id = p.account_id
         and a.ledger_id = p.ledger_id
        where p.transaction_record_id = v_record.id
          and p.ledger_id = v_record.ledger_id;

        if v_record.type <> 'normal' then
            if v_payment_count > 0 then
                raise exception 'payment_record_type_invalid'
                    using errcode = '22023', detail = 'payment_record_type_invalid';
            end if;
            continue;
        end if;

        if v_payment_count = 0 then
            if v_record.status = 'active' then
                raise exception 'payment_required'
                    using errcode = '22023', detail = 'payment_required';
            end if;
            continue;
        end if;

        select
            coalesce(sum(case when c.type = 'income' then ti.amount else -ti.amount end), 0),
            coalesce(bool_and(c.type is not distinct from 'expense'), false),
            coalesce(bool_and(c.type is not distinct from 'income'), false)
        into v_item_delta_total, v_items_all_expense, v_items_all_income
        from public.transaction_item ti
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.transaction_record_id = v_record.id
          and ti.ledger_id = v_record.ledger_id;

        if v_payment_count > 1 and not (
            (v_items_all_expense and v_payments_all_outflow)
            or (v_items_all_income and v_payments_all_inflow)
        ) then
            raise exception 'payment_multi_account_not_allowed'
                using errcode = '22023', detail = 'payment_multi_account_not_allowed';
        end if;

        if v_payment_delta_total <> v_item_delta_total then
            raise exception 'payment_total_mismatch'
                using errcode = '22023', detail = 'payment_total_mismatch';
        end if;

        if v_payment_currency_count > 1 then
            raise exception 'payment_currency_mismatch'
                using errcode = '22023', detail = 'payment_currency_mismatch';
        end if;

        if exists (
            select 1 from public.transaction_item ti
            join public.transaction_item_refund_link link
              on link.ledger_id = ti.ledger_id
             and (link.refund_income_item_id = ti.id or link.refunded_item_id = ti.id)
            join public.transaction_item income on income.id = link.refund_income_item_id and income.ledger_id = link.ledger_id
            join public.transaction_record income_record on income_record.id = income.transaction_record_id
              and income_record.ledger_id = income.ledger_id and income_record.status = 'active'
            join public.transaction_item expense on expense.id = link.refunded_item_id and expense.ledger_id = link.ledger_id
            where ti.transaction_record_id = v_record.id and ti.ledger_id = v_record.ledger_id
              and public.exchange_rate_on(
                  public.transaction_record_currency(income.ledger_id, income.transaction_record_id),
                  public.transaction_record_currency(expense.ledger_id, expense.transaction_record_id),
                  public.transaction_record_local_date(income_record.transaction_at)
              ) is null
        ) then
            raise exception 'link_exchange_rate_missing' using errcode = '22023', detail = 'link_exchange_rate_missing';
        end if;

        if exists (
            select 1 from public.transaction_item ti
            join public.transaction_item_reimbursement_link link
              on link.ledger_id = ti.ledger_id
             and (link.reimbursement_income_item_id = ti.id or link.target_expense_item_id = ti.id)
            join public.transaction_item income on income.id = link.reimbursement_income_item_id and income.ledger_id = link.ledger_id
            join public.transaction_record income_record on income_record.id = income.transaction_record_id
              and income_record.ledger_id = income.ledger_id and income_record.status = 'active'
            join public.transaction_item expense on expense.id = link.target_expense_item_id and expense.ledger_id = link.ledger_id
            where ti.transaction_record_id = v_record.id and ti.ledger_id = v_record.ledger_id
              and public.exchange_rate_on(
                  public.transaction_record_currency(income.ledger_id, income.transaction_record_id),
                  public.transaction_record_currency(expense.ledger_id, expense.transaction_record_id),
                  public.transaction_record_local_date(income_record.transaction_at)
              ) is null
        ) then
            raise exception 'link_exchange_rate_missing' using errcode = '22023', detail = 'link_exchange_rate_missing';
        end if;
    end loop;

    return null;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."update_linked_transaction_edit"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_at" timestamp with time zone, "p_merchant_id" "uuid", "p_note" "text", "p_item_updates" "jsonb", "p_payments" "jsonb", "p_expected_record_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_transaction_item_id uuid;
    v_expected_updated_at timestamptz;
    v_amount numeric;
    v_record_updated_at timestamptz;
    v_category_id uuid;
    v_old_refund_target uuid;
    v_old_reimbursement_target uuid;
    v_new_refund_target uuid;
    v_new_reimbursement_target uuid;
    v_new_target uuid;
    v_target_currency text;
    v_source_currency text;
    v_target_category_type text;
    v_target_status public.transaction_item_special_status;
    v_lock_item_ids uuid[];
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_mutate_transaction(
        p_ledger_id,
        p_transaction_record_id
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid'
            using errcode = '22023', detail = 'transaction_at_invalid';
    end if;

    if p_note is not null and char_length(p_note) > 2000 then
        raise exception 'note_too_long'
            using errcode = '22023', detail = 'note_too_long';
    end if;

    if jsonb_typeof(p_item_updates) is distinct from 'array' then
        raise exception 'linked_edit_items_invalid'
            using errcode = '22023', detail = 'linked_edit_items_invalid';
    end if;

    if p_merchant_id is null or (
        not exists (
            select 1
            from public.merchant m
            where m.id = p_merchant_id
              and m.ledger_id = p_ledger_id
              and m.is_archived = false
        )
        and not exists (
            select 1
            from public.transaction_record tr
            where tr.id = p_transaction_record_id
              and tr.ledger_id = p_ledger_id
              and tr.status = 'active'
              and tr.type = 'normal'
              and tr.merchant_id = p_merchant_id
        )
    ) then
        raise exception 'merchant_invalid'
            using errcode = '22023', detail = 'merchant_invalid';
    end if;

    -- 锁顺序：ledger → record（并校验记录版本）→ 明细 / 关联目标 → 账户（付款替换内）。
    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    select tr.updated_at
    into v_record_updated_at
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    -- 未提交记录版本时（直接调用 RPC）只做明细级版本校验。
    if p_expected_record_updated_at is not null
       and v_record_updated_at is distinct from p_expected_record_updated_at then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    -- 一次性按 UUID 顺序锁定全部收入明细与新旧原支出，不能逐笔按选择顺序加锁。
    -- 下层 update_linked_transaction_item 会再次取同一批锁，避免多笔互相交叉死锁。
    begin
        select array_agg(distinct item_id order by item_id)
        into v_lock_item_ids
        from (
            select nullif(entry.value ->> 'transactionItemId', '')::uuid as item_id
            from pg_catalog.jsonb_array_elements(p_item_updates) entry
            union all
            select nullif(entry.value ->> 'refundedItemId', '')::uuid
            from pg_catalog.jsonb_array_elements(p_item_updates) entry
            union all
            select nullif(entry.value ->> 'reimbursementItemId', '')::uuid
            from pg_catalog.jsonb_array_elements(p_item_updates) entry
            union all
            select link.refunded_item_id
            from public.transaction_item_refund_link link
            where link.ledger_id = p_ledger_id
              and link.refund_income_item_id in (
                  select nullif(entry.value ->> 'transactionItemId', '')::uuid
                  from pg_catalog.jsonb_array_elements(p_item_updates) entry
              )
            union all
            select link.target_expense_item_id
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = p_ledger_id
              and link.reimbursement_income_item_id in (
                  select nullif(entry.value ->> 'transactionItemId', '')::uuid
                  from pg_catalog.jsonb_array_elements(p_item_updates) entry
              )
        ) ids
        where item_id is not null;
    exception when invalid_text_representation then
        raise exception 'linked_edit_items_invalid'
            using errcode = '22023', detail = 'linked_edit_items_invalid';
    end;

    perform 1
    from public.transaction_item ti
    where ti.ledger_id = p_ledger_id
      and ti.id = any(coalesce(v_lock_item_ids, array[]::uuid[]))
    order by ti.id
    for update;

    for v_item in
        select value
        from pg_catalog.jsonb_array_elements(p_item_updates)
        order by value ->> 'transactionItemId'
    loop
        if jsonb_typeof(v_item) is distinct from 'object' then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        begin
            v_transaction_item_id :=
                nullif(v_item ->> 'transactionItemId', '')::uuid;
            v_expected_updated_at :=
                nullif(v_item ->> 'expectedUpdatedAt', '')::timestamptz;
            v_amount := nullif(v_item ->> 'amount', '')::numeric;
            v_category_id := nullif(v_item ->> 'categoryId', '')::uuid;
            v_new_refund_target := nullif(v_item ->> 'refundedItemId', '')::uuid;
            v_new_reimbursement_target :=
                nullif(v_item ->> 'reimbursementItemId', '')::uuid;
        exception
            when invalid_text_representation
                or invalid_datetime_format
                or datetime_field_overflow
                or numeric_value_out_of_range
            then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
        end;

        if v_transaction_item_id is null
           or v_expected_updated_at is null
           or v_amount is null
           or v_category_id is null then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        -- 只有原关联类型相同、目标非空的收入明细才能改选；拒绝解除和跨类型切换。
        v_old_refund_target := null;
        v_old_reimbursement_target := null;
        v_new_target := null;
        select link.refunded_item_id into v_old_refund_target
        from public.transaction_item_refund_link link
        where link.ledger_id = p_ledger_id
          and link.refund_income_item_id = v_transaction_item_id;
        select link.target_expense_item_id into v_old_reimbursement_target
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = p_ledger_id
          and link.reimbursement_income_item_id = v_transaction_item_id;

        if v_item ? 'refundedItemId' then
            if v_old_refund_target is null or v_new_refund_target is null
               or v_item ? 'reimbursementItemId' then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
            end if;
            if v_new_refund_target is distinct from v_old_refund_target then
                v_new_target := v_new_refund_target;
            end if;
        elsif v_item ? 'reimbursementItemId' then
            if v_old_reimbursement_target is null or v_new_reimbursement_target is null then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
            end if;
            if v_new_reimbursement_target is distinct from v_old_reimbursement_target then
                v_new_target := v_new_reimbursement_target;
            end if;
        end if;

        if v_new_target is not null then
            select c.type,
                   public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id),
                   ti.special_status
            into v_target_category_type, v_target_currency, v_target_status
            from public.transaction_item ti
            join public.transaction_record tr
              on tr.id = ti.transaction_record_id
             and tr.ledger_id = ti.ledger_id
             and tr.status = 'active'
            join public.category c
              on c.id = ti.category_id and c.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id and ti.id = v_new_target;

            v_source_currency := public.transaction_record_currency(
                p_ledger_id, p_transaction_record_id
            );
            if not found or v_target_category_type is distinct from 'expense' then
                raise exception 'linked_edit_target_invalid'
                    using errcode = '22023', detail = 'linked_edit_target_invalid';
            end if;
            if public.exchange_rate_on(v_source_currency, v_target_currency, public.transaction_record_local_date(p_transaction_at)) is null then
                raise exception 'link_exchange_rate_missing' using errcode = '22023', detail = 'link_exchange_rate_missing';
            end if;
            if v_old_reimbursement_target is not null
               and v_target_status not in (
                   'pending_reimbursement', 'reimbursed', 'reimbursement_surplus'
               ) then
                raise exception 'linked_edit_target_invalid'
                    using errcode = '22023', detail = 'linked_edit_target_invalid';
            end if;
        end if;

        perform public.update_linked_transaction_item(
            p_ledger_id,
            p_transaction_record_id,
            v_transaction_item_id,
            v_expected_updated_at,
            v_amount,
            v_category_id
        );

        if v_new_target is not null then
            -- 原有链接保持同一收入明细，仅原支出对象改变。
            -- 链接表没有自动重算两个原支出状态的 UPDATE 触发器，
            -- 必须显式重算旧、新目标；业务净额由 offset 视图按新链接计算。
            if v_old_refund_target is not null then
                update public.transaction_item_refund_link link
                set refunded_item_id = v_new_target
                where link.ledger_id = p_ledger_id
                  and link.refund_income_item_id = v_transaction_item_id;
            else
                update public.transaction_item_reimbursement_link link
                set target_expense_item_id = v_new_target
                where link.ledger_id = p_ledger_id
                  and link.reimbursement_income_item_id = v_transaction_item_id;
            end if;

            -- 失去本次核销的旧原支出可能由已报销退回待报销；
            -- 新原支出可能由待报销变为已报销或核销结余。
            perform public.recalculate_transaction_item_settlement_status(
                p_ledger_id, coalesce(v_old_refund_target, v_old_reimbursement_target)
            );
            perform public.recalculate_transaction_item_settlement_status(
                p_ledger_id, v_new_target
            );
        end if;
    end loop;

    -- 明细金额变化会改变 Σ明细，付款明细必须在同一事务内整组替换。
    perform public.replace_transaction_payments(
        p_ledger_id,
        p_transaction_record_id,
        p_payments,
        v_user_id
    );

    update public.transaction_record tr
    set
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal';

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    set constraints public.validate_transaction_record_payments immediate;
    set constraints public.validate_transaction_record_payments deferred;
end;
$$;


-- 候选跨币种混排；移除旧 p_currency 参数及针对同币种的筛选。
drop function if exists public.load_filtered_transaction_page(
    uuid, text, text, uuid, text, text[], boolean, integer, integer, uuid, text, date
);
create or replace function public.load_filtered_transaction_page(
    p_ledger_id uuid,
    p_scope text,
    p_query text default '',
    p_merchant_priority_id uuid default null,
    p_special_statuses text[] default null,
    p_settled boolean default false,
    p_offset integer default 0,
    p_limit integer default 20,
    p_history_merchant_id uuid default null,
    p_link_kind text default null,
    p_month date default null
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, pg_temp
as $$
with args as (
    select
        lower(left(trim(coalesce(p_query, '')), 80)) as term,
        regexp_replace(left(trim(coalesce(p_query, '')), 80), '[[:space:],，¥￥円]', '', 'g') as amount_term
),
history_merchants as materialized (
    select array(
        select distinct expense_record.merchant_id
        from public.transaction_record income_record
        join public.transaction_item income_item
          on income_item.transaction_record_id = income_record.id
         and income_item.ledger_id = income_record.ledger_id
        join lateral (
            select link.refunded_item_id as expense_item_id
            from public.transaction_item_refund_link link
            where p_link_kind = 'refund'
              and link.refund_income_item_id = income_item.id
              and link.ledger_id = income_item.ledger_id
              and link.refund_amount > 0
            union all
            select link.target_expense_item_id
            from public.transaction_item_reimbursement_link link
            where p_link_kind = 'reimbursement'
              and link.reimbursement_income_item_id = income_item.id
              and link.ledger_id = income_item.ledger_id
              and link.reimbursement_amount > 0
        ) history on true
        join public.transaction_item expense_item
          on expense_item.id = history.expense_item_id
         and expense_item.ledger_id = income_item.ledger_id
        join public.transaction_record expense_record
          on expense_record.id = expense_item.transaction_record_id
         and expense_record.ledger_id = expense_item.ledger_id
         and expense_record.status = 'active'
        where p_scope = 'candidates'
          and not coalesce(p_settled, false)
          and p_history_merchant_id is not null
          and (select public.current_user_is_active_ledger_member(p_ledger_id))
          and income_record.ledger_id = p_ledger_id
          and income_record.merchant_id = p_history_merchant_id
          and income_record.status = 'active'
          and expense_record.merchant_id is not null
    ) as ids
),
-- 账户信息在同一账本内复用，避免逐笔付款重复扫描账户并执行 RLS。
candidate_accounts as materialized (
    select id, ledger_id, currency, name
    from public.account
    where p_scope = 'candidates' and ledger_id = p_ledger_id
),
candidate_base as (
    select
        tr.id as record_id,
        ti.id as item_id,
        tr.transaction_at,
        tr.created_at,
        tr.merchant_id,
        tr.note as record_note,
        ti.note as item_note,
        cat.name as category_name,
        parent_cat.name as parent_category_name,
        first_payment.account_name,
        ti.amount as item_amount,
        greatest(
            ti.amount
            - coalesce(link_totals.positive_refund_amount, 0::numeric)
            - coalesce(link_totals.positive_reimbursement_amount, 0::numeric),
            0::numeric
        ) as business_net_amount,
        ti.sort_order,
        ti.amount
          - coalesce(link_totals.refund_amount, 0::numeric)
          - coalesce(link_totals.reimbursement_amount, 0::numeric) <= 0 as settled,
        coalesce(preferred_alias.alias, m.name) as preferred_merchant_name,
        coalesce(nullif(trim(setting.display_name), ''), au.display_name) as recorder_name
    from public.transaction_record tr
    join public.transaction_item ti
      on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
    -- 候选净额最终按零截断，无需重算各笔关联的时间轴分摊和超额部分。
    -- 无关联时不执行带汇率查询和窗口函数的抵扣计算。
    left join lateral (
        select
            sum(allocation.converted_amount) filter (where allocation.is_refund) as refund_amount,
            sum(allocation.converted_amount) filter (where not allocation.is_refund) as reimbursement_amount,
            sum(allocation.converted_amount) filter (where allocation.is_refund and allocation.converted_amount > 0) as positive_refund_amount,
            sum(allocation.converted_amount) filter (where not allocation.is_refund and allocation.converted_amount > 0) as positive_reimbursement_amount
        from (
            select ti.id where exists (
                select 1 from public.transaction_item_refund_link link
                where link.ledger_id = ti.ledger_id and link.refunded_item_id = ti.id
            ) or exists (
                select 1 from public.transaction_item_reimbursement_link link
                where link.ledger_id = ti.ledger_id and link.target_expense_item_id = ti.id
            )
        ) linked_expense
        cross join lateral public.transaction_link_allocations(tr.ledger_id, linked_expense.id) allocation
    ) link_totals on true
    join public.category cat
      on cat.id = ti.category_id and cat.ledger_id = ti.ledger_id
     and cat.type = 'expense'
    left join public.category parent_cat
      on parent_cat.id = cat.parent_id and parent_cat.ledger_id = cat.ledger_id
    left join public.merchant m
      on m.id = tr.merchant_id and m.ledger_id = tr.ledger_id
    -- 列表显示的是首选别名；搜索必须与 MerchantRepository 的显示名称一致。
    left join lateral (
        select ma.alias
        from public.merchant_alias ma
        where ma.merchant_id = tr.merchant_id
          and ma.is_preferred
          and not ma.is_archived
        limit 1
    ) preferred_alias on true
    left join public.app_user au on au.id = tr.created_by
    left join public.ledger_member_display_setting setting
      on setting.ledger_id = tr.ledger_id and setting.user_id = tr.created_by
    left join lateral (
        select a.currency, a.name as account_name
        from public.transaction_payment payment
        join candidate_accounts a
          on a.id = payment.account_id and a.ledger_id = payment.ledger_id
        where payment.ledger_id = tr.ledger_id
          and payment.transaction_record_id = tr.id
        order by payment.sort_order, payment.id
        limit 1
    ) first_payment on true
    where p_scope = 'candidates'
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
      and (
          p_month is null
          or (
              tr.transaction_at >= (date_trunc('month', p_month::timestamp) at time zone 'Asia/Tokyo')
              and tr.transaction_at < ((date_trunc('month', p_month::timestamp) + interval '1 month') at time zone 'Asia/Tokyo')
          )
      )
      and (select public.current_user_is_active_ledger_member(p_ledger_id))
      and (
          coalesce(array_length(p_special_statuses, 1), 0) = 0
          or ti.special_status::text = any(p_special_statuses)
      )
),
candidate_decorated as (
    select
        candidate_base.*,
        first_value(item_note) over (
            partition by record_id order by sort_order, item_id
        ) as first_item_note,
        sum(business_net_amount) over (partition by record_id) as record_amount,
        bool_or(
            strpos(trim_scale(item_amount)::text, (select amount_term from args)) > 0
        ) over (partition by record_id) as any_item_amount_match
    from candidate_base
),
candidate_matched as (
    select candidate_decorated.*
    from candidate_decorated
    cross join args
    where args.term = ''
       or strpos(lower(coalesce(preferred_merchant_name, '')), args.term) > 0
       or strpos(lower(coalesce(record_note, first_item_note, '')), args.term) > 0
       or strpos(lower(coalesce(item_note, '')), args.term) > 0
       or strpos(lower(coalesce(account_name, '')), args.term) > 0
       or strpos(lower(coalesce(category_name, '')), args.term) > 0
       or strpos(lower(coalesce(parent_category_name, '')), args.term) > 0
       or strpos(lower(coalesce(recorder_name, '')), args.term) > 0
       or (
           args.amount_term ~ '[0-9]'
           and (
               any_item_amount_match
               or strpos(abs(trim_scale(record_amount))::text, args.amount_term) > 0
           )
       )
),
-- 分组条件只计算一次，商家名称仅对命中的历史商家读取。
candidate_classified as materialized (
    select merchant_id,
        case
            when business_net_amount > 0 and business_net_amount < item_amount then 'partial'
            when p_link_kind = 'refund' and merchant_id = p_merchant_priority_id then 'sameMerchant'
            when merchant_id = any(array(select unnest(ids) from history_merchants)) then 'history'
            else 'other'
        end as group_key
    from candidate_matched
    where not settled
),
candidate_group_counts as (
    select
        count(*) filter (where group_key = 'history') as history,
        count(*) filter (where group_key = 'sameMerchant') as same_merchant,
        count(*) filter (where group_key = 'other') as other,
        count(*) filter (where group_key = 'partial') as partial
    from candidate_classified
),
history_names as (
    select coalesce(jsonb_agg(distinct coalesce(preferred_alias.alias, m.name)
        order by coalesce(preferred_alias.alias, m.name)), '[]'::jsonb) as names
    from public.merchant m
    left join lateral (
        select ma.alias
        from public.merchant_alias ma
        where ma.merchant_id = m.id and ma.is_preferred and not ma.is_archived
        limit 1
    ) preferred_alias on true
    where m.ledger_id = p_ledger_id
      and m.id = any(array(select unnest(ids) from history_merchants))
      and exists (
          select 1 from candidate_classified c
          where c.group_key = 'history' and c.merchant_id = m.id
      )
),
record_matched as (
    select
        tr.id as record_id,
        null::uuid as item_id,
        tr.transaction_at,
        tr.created_at,
        tr.merchant_id,
        null::integer as sort_order,
        false as settled
    from public.transaction_record tr
    left join public.merchant m
      on m.id = tr.merchant_id and m.ledger_id = tr.ledger_id
    -- 列表显示的是首选别名；搜索必须与 MerchantRepository 的显示名称一致。
    left join lateral (
        select ma.alias
        from public.merchant_alias ma
        where ma.merchant_id = tr.merchant_id
          and ma.is_preferred
          and not ma.is_archived
        limit 1
    ) preferred_alias on true
    left join public.app_user au on au.id = tr.created_by
    left join public.ledger_member_display_setting setting
      on setting.ledger_id = tr.ledger_id and setting.user_id = tr.created_by
    left join lateral (
        select
            (array_agg(ti.note order by ti.sort_order, ti.id))[1] as first_note,
            coalesce(bool_or(
                ti.category_id is null
                and (select amount_term from args) ~ '[0-9]'
                and strpos(trim_scale(ti.amount)::text, (select amount_term from args)) > 0
            ), false) as has_transfer_amount,
            (array_agg(ti.balance_delta order by ti.sort_order, ti.id))[1] as first_delta,
            coalesce(sum(
                case
                    when c.type = 'income' then ti.business_net_amount
                    when c.type = 'expense' then -ti.business_net_amount
                    else 0::numeric
                end
            ), 0::numeric) as net_amount,
            coalesce(bool_or(
                (select amount_term from args) ~ '[0-9]'
                and ti.category_id is not null
                and strpos(trim_scale(ti.amount)::text, (select amount_term from args)) > 0
            ), false) as has_item_amount
        from public.transaction_item_with_refund ti
        left join public.category c
          on c.id = ti.category_id and c.ledger_id = ti.ledger_id
        where ti.ledger_id = tr.ledger_id
          and ti.transaction_record_id = tr.id
    ) amounts on true
    cross join args
    where p_scope = 'records'
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type in ('normal', 'transfer', 'balance_adjustment')
      and (select public.current_user_is_active_ledger_member(p_ledger_id))
      and (
          args.term = ''
          or (tr.type = 'normal' and strpos(lower(left(btrim(coalesce(preferred_alias.alias, m.name, ''), U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'), 80)), args.term) > 0)
          or strpos(lower(left(btrim(coalesce(case when tr.type = 'normal' then coalesce(tr.note, amounts.first_note) else tr.note end, ''), U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'), 80)), args.term) > 0
          or strpos(lower(left(btrim(coalesce(nullif(btrim(setting.display_name, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'), ''), au.display_name, ''), U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'), 80)), args.term) > 0
          or (
              args.amount_term ~ '[0-9]'
              and (
                  (tr.type = 'normal' and strpos(abs(trim_scale(amounts.net_amount))::text, args.amount_term) > 0)
                  or (tr.type = 'transfer' and amounts.has_transfer_amount)
                  or (tr.type = 'balance_adjustment' and strpos(coalesce(trim_scale(amounts.first_delta)::text, ''), args.amount_term) > 0)
                  or (tr.type = 'normal' and amounts.has_item_amount)
              )
          )
      )
),
all_matches as (
    select
        record_id, item_id, transaction_at, created_at, merchant_id, sort_order,
        coalesce(nullif(btrim(item_note), ''), nullif(btrim(record_note), '')) as candidate_note,
        not settled and business_net_amount > 0 and business_net_amount < item_amount as partial
    from candidate_matched
    where settled = p_settled
    union all
    select
        record_id, item_id, transaction_at, created_at, merchant_id, sort_order,
        null::text as candidate_note,
        false as partial
    from record_matched
),
ordered_page as (
    select
        record_id,
        item_id,
        candidate_note,
        row_number() over (
            order by
                case
                    when p_scope = 'candidates' and not coalesce(p_settled, false) and partial then 3
                    when p_scope = 'candidates' and not coalesce(p_settled, false)
                      and p_link_kind = 'refund' and merchant_id = p_merchant_priority_id then 0
                    when p_scope = 'candidates'
                      and coalesce(merchant_id = any(array(select unnest(ids) from history_merchants)), false) then
                        case when p_link_kind = 'refund' and not coalesce(p_settled, false) then 1 else 0 end
                    when p_scope = 'candidates' and merchant_id = p_merchant_priority_id then 1
                    else 2
                end,
                transaction_at desc,
                created_at desc,
                record_id desc,
                sort_order asc nulls last,
                item_id asc nulls last
        ) as ordinal
    from all_matches
),
page as (
    select *
    from ordered_page
    where ordinal > greatest(p_offset, 0)
      and ordinal <= greatest(p_offset, 0) + least(greatest(p_limit, 1), 50) + 1
)
select jsonb_build_object(
    'entries', coalesce((
        select jsonb_agg(
            jsonb_build_object('recordId', record_id, 'itemId', item_id)
            || case when p_scope = 'candidates'
              then jsonb_build_object('note', candidate_note)
              else '{}'::jsonb end
            order by ordinal
        )
        from page
        where ordinal <= greatest(p_offset, 0) + least(greatest(p_limit, 1), 50)
    ), '[]'::jsonb),
    'nextOffset', case
        when exists (
            select 1 from page
            where ordinal > greatest(p_offset, 0) + least(greatest(p_limit, 1), 50)
        ) then greatest(p_offset, 0) + least(greatest(p_limit, 1), 50)
        else null
    end,
    'settledCount', (
        select count(*) from candidate_matched where settled
    ),
    'totalCount', (
        select count(*) from all_matches
    )
) || case when p_scope = 'candidates'
    then jsonb_build_object('historyMerchantIds', (select ids from history_merchants))
         || case when p_offset = 0 and not coalesce(p_settled, false)
             then jsonb_build_object(
                 'groupCounts',
                 (select jsonb_build_object(
                     'history', history,
                     'sameMerchant', same_merchant,
                     'other', other,
                     'partial', partial
                 ) from candidate_group_counts),
                 'historyMerchantNames', (select names from history_names)
             )
             else '{}'::jsonb
         end
    else '{}'::jsonb
end;
$$;

revoke all on function public.load_filtered_transaction_page(
    uuid, text, text, uuid, text[], boolean, integer, integer, uuid, text, date
) from public, anon, authenticated, service_role;
grant execute on function public.load_filtered_transaction_page(
    uuid, text, text, uuid, text[], boolean, integer, integer, uuid, text, date
) to authenticated;

