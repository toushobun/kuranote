-- 统一退款与报销关联后的业务净额派生口径。

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(expense_refunds.refunded_amount, 0::numeric)::numeric(14,2) as refunded_amount,
    coalesce(income_refunds.refunded_amount, 0::numeric) > 0 as is_refund_income,
    coalesce(income_reimbursements.reimbursed_amount, 0::numeric) > 0 as is_reimbursement_income,
    exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.refunded_item_id = ti.id
              or link.refund_income_item_id = ti.id
          )
    ) as has_refund_link,
    greatest(
        ti.amount - coalesce(business_offsets.offset_amount, 0::numeric),
        0::numeric
    )::numeric(14,2) as business_net_amount
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
) expense_refunds on true
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item refunded_item
      on refunded_item.id = link.refunded_item_id
     and refunded_item.ledger_id = link.ledger_id
    join public.transaction_record refunded_record
      on refunded_record.id = refunded_item.transaction_record_id
     and refunded_record.ledger_id = refunded_item.ledger_id
    where link.refund_income_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and refunded_record.status = 'active'
) income_refunds on true
left join lateral (
    select sum(settled_item.amount) as reimbursed_amount
    from public.transaction_item settled_item
    join public.transaction_record settled_record
      on settled_record.id = settled_item.transaction_record_id
     and settled_record.ledger_id = settled_item.ledger_id
    where settled_item.settled_by_item_id = ti.id
      and settled_item.ledger_id = ti.ledger_id
      and settled_record.status = 'active'
) income_reimbursements on true
left join lateral (
    select sum(offsets.amount) as offset_amount
    from (
        select coalesce(expense_refunds.refunded_amount, 0::numeric) as amount
        union all
        select coalesce(income_refunds.refunded_amount, 0::numeric)
        union all
        select coalesce(income_reimbursements.reimbursed_amount, 0::numeric)
        union all
        select case
            when exists (
                select 1
                from public.transaction_item settling_income
                join public.transaction_record settling_record
                  on settling_record.id = settling_income.transaction_record_id
                 and settling_record.ledger_id = settling_income.ledger_id
                where settling_income.id = ti.settled_by_item_id
                  and settling_income.ledger_id = ti.ledger_id
                  and settling_record.status = 'active'
            ) then ti.amount
            else 0::numeric
        end
    ) offsets
) business_offsets on true;

grant select on table public.transaction_item_with_refund to authenticated;

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
        ti.amount,
        ti.business_net_amount,
        ti.refunded_amount,
        c.type as category_type,
        c.parent_id,
        case
            when tr.type = 'transfer' then 0::numeric
            when c.type = 'income' then ti.business_net_amount
            when c.type = 'expense' then -ti.business_net_amount
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
      and public.current_user_is_active_ledger_member(p_ledger_id)
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
        or (
            p_record_type = 'refundableExpense'
            and bi.category_type = 'expense'
            and bi.amount > bi.refunded_amount
        )
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
