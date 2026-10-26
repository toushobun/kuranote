-- #909：交易统计支持按账户持有人筛选和分组。
-- 账户筛选推广为「账户集合」：账户筛选、持有人筛选取交集（scope_accounts），沿用 #914 方案 D；
-- 按持有人分组与按账户分组共用实际收付的分组行，只是分组键换成账户的持有人。
-- 签名在末尾新增 p_holder_id（默认 null），现有按参数名调用不受影响；旧签名删除，避免重载歧义。
begin;

drop function if exists public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, text[], integer, integer
);

create function public.load_transaction_group_summaries_with_special_status(
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
    p_limit integer default 20,
    p_holder_id text default null
)
returns table (
    group_id text,
    group_key text,
    group_label text,
    income numeric,
    expense numeric,
    balance numeric,
    transaction_count integer,
    latest_transaction_at timestamptz,
    shared_payment_record_count integer,
    shared_payment_account_share_amount numeric,
    shared_payment_record_total_amount numeric
)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
with filter_flags as (
    select
        -- 账户以外的明细级筛选：存在时命中部分由明细决定，账户筛选只决定记录是否出现。
        (
            p_parent_category_id is not null
            or p_category_id is not null
            or coalesce(array_length(p_special_statuses, 1), 0) > 0
            or p_record_type = 'refundableExpense'
        ) as has_other_item_filters,
        (p_account_id is not null or p_holder_id is not null) as has_account_scope
),
-- 账户的持有人：持有人 ID 为成员 user_id 或占位 placeholder_id，无持有人的账户归入 'none'。
account_holders as (
    select
        a.id as account_id,
        coalesce(ah.user_id, ah.placeholder_id)::text as holder_id
    from public.account a
    join public.account_holder ah
      on ah.account_id = a.id
     and ah.ledger_id = a.ledger_id
    where a.ledger_id = p_ledger_id

    union all

    select a.id, 'none'
    from public.account a
    where a.ledger_id = p_ledger_id
      and not exists (
          select 1
          from public.account_holder ah
          where ah.account_id = a.id
            and ah.ledger_id = a.ledger_id
      )
),
-- 账户集合筛选：账户筛选与持有人筛选的交集；没有这两个筛选时不使用。
scope_accounts as (
    select distinct ah.account_id
    from account_holders ah
    where (p_account_id is null or ah.account_id = p_account_id)
      and (p_holder_id is null or ah.holder_id = p_holder_id)
),
base_items as (
    select
        tr.id as record_id,
        tr.type as record_type,
        tr.transaction_at,
        tr.merchant_id,
        tr.created_by,
        ti.id as item_id,
        ti.category_id,
        ti.special_status,
        ti.amount,
        ti.business_net_amount,
        ti.refunded_amount,
        ti.reimbursement_amount,
        c.type as category_type,
        c.parent_id,
        case
            when tr.type in ('transfer', 'balance_adjustment') then 0::numeric
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
      and tr.type in ('normal', 'transfer', 'balance_adjustment')
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
record_payments as (
    select
        p.transaction_record_id as record_id,
        count(*) as payment_count,
        count(sa.account_id) as scope_payment_count,
        sum(p.amount) as record_total_amount,
        coalesce(sum(p.amount) filter (where sa.account_id is not null), 0) as account_share_amount,
        coalesce(sum(p.balance_delta) filter (where sa.account_id is not null), 0) as account_share_delta
    from public.transaction_payment p
    left join scope_accounts sa on sa.account_id = p.account_id
    where p.ledger_id = p_ledger_id
      and p.transaction_record_id in (select bi.record_id from base_items bi)
    group by p.transaction_record_id
),
-- 有账户集合筛选时，付款账户一部分在集合内、一部分在集合外的记录（「共同支付」）。
-- 付款账户全在集合内（例如同一持有人的两个账户）时份额 = 整笔，不算共同支付。
shared_records as (
    select
        rp.record_id,
        rp.account_share_amount,
        rp.account_share_delta,
        rp.record_total_amount
    from record_payments rp
    cross join filter_flags ff
    where ff.has_account_scope
      and rp.scope_payment_count >= 1
      and rp.scope_payment_count < rp.payment_count
),
matched_items as (
    select bi.*
    from base_items bi
    join record_profiles rp on rp.record_id = bi.record_id
    cross join filter_flags ff
    where (
        p_record_type = 'all'
        or (p_record_type = 'transfer' and bi.record_type = 'transfer')
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
        )
    )
      and (
          not ff.has_account_scope
          or exists (
              select 1
              from public.transaction_account_movement m
              join scope_accounts sa on sa.account_id = m.account_id
              where m.ledger_id = p_ledger_id
                and m.transaction_record_id = bi.record_id
          )
      )
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
matched_records as (
    select distinct
        mi.record_id,
        mi.record_type,
        mi.transaction_at,
        mi.merchant_id,
        mi.created_by
    from matched_items mi
),
share_records as (
    -- 记录级维度下只计账户集合份额（实际收付）的记录：共同支付记录；
    -- 持有人筛选时（#909 口径 1）为所有普通记录，退款 / 报销收入也按实际进入的账户计入。
    select rp.record_id, rp.account_share_delta
    from record_payments rp
    cross join filter_flags ff
    where p_group_by in ('merchant', 'member')
      and not ff.has_other_item_filters
      and (
          rp.record_id in (select sr.record_id from shared_records sr)
          or (p_holder_id is not null and rp.scope_payment_count >= 1)
      )
),
group_rows as (
    -- 按账户 / 按持有人分组：命中记录在账户集合内的实际收付，按账户或账户的持有人归组。
    select
        k.key,
        mr.record_id,
        null::uuid as item_id,
        mr.transaction_at,
        case
            when mr.record_type = 'normal' then m.balance_delta
            else 0::numeric
        end as signed_amount
    from matched_records mr
    join public.transaction_account_movement m
      on m.ledger_id = p_ledger_id
     and m.transaction_record_id = mr.record_id
    cross join filter_flags ff
    cross join lateral (
        select m.account_id::text as key
        where p_group_by = 'account'

        union all

        select ah.holder_id
        from account_holders ah
        where p_group_by = 'holder'
          and ah.account_id = m.account_id
    ) k
    where p_group_by in ('account', 'holder')
      and (
          not ff.has_account_scope
          or m.account_id in (select sa.account_id from scope_accounts sa)
      )

    union all

    -- 记录级维度下的份额行：每笔记录一行。
    select
        case p_group_by
            when 'merchant' then coalesce(mr.merchant_id::text, 'unknown')
            else coalesce(mr.created_by::text, 'unknown')
        end,
        mr.record_id,
        null::uuid,
        mr.transaction_at,
        sr.account_share_delta
    from matched_records mr
    join share_records sr on sr.record_id = mr.record_id

    union all

    -- #917：记录级维度先抵消同一笔内的收入与支出，再分收入 / 支出桶。
    select
        case p_group_by
            when 'merchant' then coalesce(mi.merchant_id::text, 'unknown')
            else coalesce(mi.created_by::text, 'unknown')
        end,
        mi.record_id,
        null::uuid,
        max(mi.transaction_at),
        sum(mi.signed_amount)
    from matched_items mi
    cross join filter_flags ff
    where p_group_by in ('merchant', 'member')
      and not ff.has_account_scope
      and not exists (
          select 1 from share_records sr where sr.record_id = mi.record_id
      )
    group by mi.record_id, mi.merchant_id, mi.created_by

    union all

    -- 明细级维度仍逐行统计，不分摊同笔抵扣。

    select
        case p_group_by
            when 'merchant' then coalesce(mi.merchant_id::text, 'unknown')
            when 'parentCategory' then coalesce(mi.parent_id, mi.category_id)::text
            when 'category' then coalesce(mi.category_id::text, 'unknown')
            when 'member' then coalesce(mi.created_by::text, 'unknown')
            when 'specialStatus' then mi.special_status::text
            else 'unknown'
        end,
        mi.record_id,
        mi.item_id,
        mi.transaction_at,
        mi.signed_amount
    from matched_items mi
    cross join filter_flags ff
    where p_group_by not in ('account', 'holder')
      and (p_group_by not in ('merchant', 'member') or ff.has_account_scope)
      and (p_group_by <> 'specialStatus' or mi.special_status is not null)
      and not exists (
          select 1
          from share_records sr
          where sr.record_id = mi.record_id
      )
),
grouped as (
    select
        gr.key,
        count(distinct case
            when p_group_by = 'specialStatus' then gr.item_id::text
            else gr.record_id::text
        end) as count_value,
        sum(case when gr.signed_amount > 0 then gr.signed_amount else 0 end) as income_value,
        sum(case when gr.signed_amount < 0 then -gr.signed_amount else 0 end) as expense_value,
        sum(gr.signed_amount) as balance_value,
        max(gr.transaction_at) as latest_at
    from group_rows gr
    group by gr.key
),
shared_grouped as (
    -- 一笔记录在一个组内只计一次。
    select
        gr.key,
        count(*) as record_count,
        sum(sr.account_share_amount) as account_share_amount,
        sum(sr.record_total_amount) as record_total_amount
    from (
        select distinct key, record_id
        from group_rows
    ) gr
    join shared_records sr on sr.record_id = gr.record_id
    group by gr.key
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
            when 'member' then coalesce(member_label.name, '未知成员')
            -- 占位成员与正式成员一样显示名称。
            when 'holder' then case
                when g.key = 'none' then '未指定持有人'
                else coalesce(
                    member_label.name,
                    (
                        select p.display_name
                        from public.ledger_placeholder_member p
                        where p.id::text = g.key
                          and p.ledger_id = p_ledger_id
                    ),
                    '未知持有人'
                )
            end
            when 'specialStatus' then case g.key
                when 'pending_reimbursement' then '待报销'
                when 'reimbursed' then '已报销'
                when 'reimbursement_surplus' then '核销结余'
                else '未知状态'
            end
            else '未知分组'
        end as label
    from grouped g
    left join lateral (
        select coalesce(nullif(trim(setting.display_name), ''), u.display_name) as name
        from public.app_user u
        left join public.ledger_member_display_setting setting
          on setting.user_id = u.id
         and setting.ledger_id = p_ledger_id
        where p_group_by in ('member', 'holder')
          and u.id::text = g.key
    ) member_label on true
)
select
    p_group_by || ':' || labeled.key,
    labeled.key,
    labeled.label,
    coalesce(labeled.income_value, 0),
    coalesce(labeled.expense_value, 0),
    coalesce(labeled.balance_value, 0),
    labeled.count_value::integer,
    labeled.latest_at,
    coalesce(sg.record_count, 0)::integer,
    coalesce(sg.account_share_amount, 0),
    coalesce(sg.record_total_amount, 0)
from labeled
left join shared_grouped sg on sg.key = labeled.key
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
    uuid, text[], integer, integer, text
) from public, anon;
grant execute on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, text[], integer, integer, text
) to authenticated;

commit;
