-- Issue #605 PR3：Picker 候选只按是否处于报销流程判断，不再要求剩余可核销金额大于 0。

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
        ti.reimbursement_amount,
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
        or (
            p_record_type = 'income'
            and (
                rp.net_amount > 0
                or (
                    rp.net_amount = 0
                    and rp.has_income
                    and not rp.has_expense
                )
            )
        )
        or (
            p_record_type = 'expense'
            and (
                rp.net_amount < 0
                or (
                    rp.net_amount = 0
                    and rp.has_expense
                    and not rp.has_income
                )
            )
        )
        or (
            p_record_type = 'refundableExpense'
            and bi.category_type = 'expense'
            and bi.special_status is not null
        )
    )
      and (p_account_id is null or bi.account_id = p_account_id)
      and (
          p_parent_category_id is null
          or bi.parent_id = p_parent_category_id
          or bi.category_id = p_parent_category_id
      )
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
            when 'merchant' then coalesce((
                select m.name
                from public.merchant m
                where m.id::text = g.key
                  and m.ledger_id = p_ledger_id
            ), '未知商家')
            when 'account' then coalesce((
                select a.name
                from public.account a
                where a.id::text = g.key
                  and a.ledger_id = p_ledger_id
            ), '未知账户')
            when 'parentCategory' then coalesce((
                select c.name
                from public.category c
                where c.id::text = g.key
                  and c.ledger_id = p_ledger_id
            ), '未知大分类')
            when 'category' then coalesce((
                select c.name
                from public.category c
                where c.id::text = g.key
                  and c.ledger_id = p_ledger_id
            ), '未知小分类')
            when 'member' then coalesce((
                select coalesce(nullif(trim(setting.display_name), ''), u.display_name)
                from public.app_user u
                left join public.ledger_member_display_setting setting
                  on setting.user_id = u.id
                 and setting.ledger_id = p_ledger_id
                where u.id::text = g.key
            ), '未知成员')
            when 'specialStatus' then case g.key
                when 'pending_reimbursement' then '待报销'
                when 'reimbursed' then '已报销'
                when 'reimbursement_surplus' then '核销结余'
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
        case labeled.key
            when 'pending_reimbursement' then 1
            when 'reimbursed' then 2
            when 'reimbursement_surplus' then 3
            else 4
        end
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
