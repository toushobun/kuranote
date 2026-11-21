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
language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
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
        round(
            e.income_amount * fx.rate,
            public.transaction_currency_decimal_places(e.target_currency)
        ) as converted_amount
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
        case when ordered.target_active then
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
    round(
        a.actual_target / nullif(a.rate, 0),
        public.transaction_currency_decimal_places(a.income_currency)
    ) as applied_income,
    a.rate, a.rate_date
from allocated a;
$$;
revoke all on function public.transaction_link_allocations(uuid, uuid)
    from public, anon, authenticated, service_role;
grant execute on function public.transaction_link_allocations(uuid, uuid)
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
