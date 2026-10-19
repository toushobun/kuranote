-- #914：交易列表的非时间维度分组按付款明细实现统计口径方案 D
-- （docs/design/issue-834-split-payment.md 2.1 / 2.3 / 2.4）。
--
-- - 账户筛选改为记录级：记录的账户来源（transaction_account_movement）包含该账户即命中，
--   不再按明细 account_id 剔除明细。
-- - 「有账户筛选 ∧ 多账户记录 ∧ 没有其他明细级筛选」时，记录级维度（商家 / 成员）
--   只计该账户的付款份额（balance_delta），每笔记录一行。
-- - 按账户分组取 transaction_account_movement 的实际收付：普通记录为付款明细的
--   balance_delta（单账户也一样），转账 / 余额调整仍为 0；有账户筛选时只保留该账户一组。
-- - 明细级维度（大分类 / 小分类 / 特殊状态）金额不变（命中明细的业务净额）。
-- - 新增 shared_payment_* 三列：有账户筛选时，按组内去重后的多账户记录统计笔数、
--   该账户付款金额合计与整笔金额合计，供「共同支付」标识使用；无账户筛选时为 0。
--
-- 返回列变化，先 drop 再 create，并重新授予 EXECUTE。
-- 基础版 load_transaction_group_summaries 已无应用调用方（已决事项第 2 条），一并删除。

begin;

drop function public.load_transaction_group_summaries(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, integer, integer
);

drop function public.load_transaction_group_summaries_with_special_status(
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
    -- 账户以外的明细级筛选：存在时命中部分由明细决定，账户筛选只决定记录是否出现。
    select (
        p_parent_category_id is not null
        or p_category_id is not null
        or coalesce(array_length(p_special_statuses, 1), 0) > 0
        or p_record_type = 'refundableExpense'
    ) as has_other_item_filters
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
        sum(p.amount) as record_total_amount,
        coalesce(sum(p.amount) filter (where p.account_id = p_account_id), 0) as account_share_amount,
        coalesce(sum(p.balance_delta) filter (where p.account_id = p_account_id), 0) as account_share_delta
    from public.transaction_payment p
    where p.ledger_id = p_ledger_id
      and p.transaction_record_id in (select bi.record_id from base_items bi)
    group by p.transaction_record_id
),
-- 有账户筛选时的多账户记录（「共同支付」）。
shared_records as (
    select
        rp.record_id,
        rp.account_share_amount,
        rp.account_share_delta,
        rp.record_total_amount
    from record_payments rp
    where p_account_id is not null
      and rp.payment_count >= 2
),
matched_items as (
    select bi.*
    from base_items bi
    join record_profiles rp on rp.record_id = bi.record_id
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
          p_account_id is null
          or exists (
              select 1
              from public.transaction_account_movement m
              where m.ledger_id = p_ledger_id
                and m.transaction_record_id = bi.record_id
                and m.account_id = p_account_id
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
    -- 记录级维度下只计账户份额的记录。
    select sr.record_id, sr.account_share_delta
    from shared_records sr
    cross join filter_flags ff
    where p_group_by in ('merchant', 'member')
      and not ff.has_other_item_filters
),
group_rows as (
    -- 按账户分组：命中记录的实际收付。
    select
        m.account_id::text as key,
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
    where p_group_by = 'account'
      and (p_account_id is null or m.account_id = p_account_id)

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

    -- 其他情况：命中明细逐行（与 #914 之前相同）。
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
    where p_group_by <> 'account'
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
    uuid, text[], integer, integer
) from public, anon;
grant execute on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, text[], integer, integer
) to authenticated;

commit;
