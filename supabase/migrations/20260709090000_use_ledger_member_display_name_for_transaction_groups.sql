-- Issue #406：非时间维度成员分组优先使用当前账本内成员昵称。
-- 与交易列表 loader 保持同一显示优先级：ledger_member_display_setting.display_name → app_user.display_name → fallback。

create or replace function public.load_transaction_group_summaries(
    p_ledger_id uuid,
    p_group_by text,
    p_date_start timestamptz default null,
    p_date_end timestamptz default null,
    p_record_type text default 'all',
    p_merchant_id uuid default null,
    p_account_id uuid default null,
    p_parent_category_id uuid default null,
    p_category_id uuid default null,
    p_tag_id uuid default null,
    p_member_id uuid default null,
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
security definer
set search_path = public
stable
as $$
    with record_amounts as (
        select
            tr.id,
            tr.ledger_id,
            tr.type,
            tr.transaction_at,
            tr.merchant_id,
            tr.created_by,
            coalesce(sum(
                case
                    when c.type = 'income' then ti.amount
                    when c.type = 'expense' then -ti.amount
                    else 0
                end
            ), 0) as net_amount,
            coalesce(bool_or(c.type = 'expense'), false) as has_expense,
            coalesce(bool_or(c.type = 'income'), false) as has_income
        from public.transaction_record tr
        left join public.transaction_item ti
          on ti.transaction_record_id = tr.id
         and ti.ledger_id = tr.ledger_id
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type in ('normal', 'transfer')
          and public.current_user_is_active_ledger_member(p_ledger_id)
        group by
            tr.id,
            tr.ledger_id,
            tr.type,
            tr.transaction_at,
            tr.merchant_id,
            tr.created_by
    ),
    record_profiles as (
        select
            ra.*,
            case
                when ra.type = 'transfer' then 'transfer'
                when ra.net_amount > 0 then 'income'
                when ra.net_amount < 0 then 'expense'
                when ra.has_expense then 'expense'
                when ra.has_income then 'income'
                else 'expense'
            end as computed_record_type
        from record_amounts ra
    ),
    filtered_records as (
        select rp.*
        from record_profiles rp
        where p_group_by in (
            'merchant',
            'account',
            'parentCategory',
            'category',
            'tag',
            'member'
        )
          and p_record_type in ('all', 'income', 'expense', 'transfer')
          and (p_date_start is null or rp.transaction_at >= p_date_start)
          and (p_date_end is null or rp.transaction_at < p_date_end)
          and (
              p_record_type = 'all'
              or rp.computed_record_type = p_record_type
          )
          and (p_merchant_id is null or rp.merchant_id = p_merchant_id)
          and (p_member_id is null or rp.created_by = p_member_id)
          and (
              p_account_id is null
              or exists (
                  select 1
                  from public.transaction_item ti
                  where ti.ledger_id = p_ledger_id
                    and ti.transaction_record_id = rp.id
                    and ti.account_id = p_account_id
              )
          )
          and (
              p_category_id is null
              or exists (
                  select 1
                  from public.transaction_item ti
                  where ti.ledger_id = p_ledger_id
                    and ti.transaction_record_id = rp.id
                    and ti.category_id = p_category_id
              )
          )
          and (
              p_parent_category_id is null
              or exists (
                  select 1
                  from public.transaction_item ti
                  left join public.category c
                    on c.id = ti.category_id
                   and c.ledger_id = ti.ledger_id
                  left join public.category parent
                    on parent.id = c.parent_id
                   and parent.ledger_id = c.ledger_id
                  where ti.ledger_id = p_ledger_id
                    and ti.transaction_record_id = rp.id
                    and coalesce(parent.id, c.id) = p_parent_category_id
              )
          )
          and (
              p_tag_id is null
              or exists (
                  select 1
                  from public.transaction_record_tag trt
                  where trt.ledger_id = p_ledger_id
                    and trt.transaction_record_id = rp.id
                    and trt.tag_id = p_tag_id
              )
          )
    ),
    record_group_rows as (
        select
            case
                when p_group_by = 'merchant' then 'merchant:' || coalesce(fr.merchant_id::text, 'unknown')
                else 'member:' || coalesce(fr.created_by::text, 'unknown')
            end as group_id,
            case
                when p_group_by = 'merchant' then coalesce(fr.merchant_id::text, 'unknown')
                else coalesce(fr.created_by::text, 'unknown')
            end as group_key,
            case
                when p_group_by = 'merchant' then coalesce(m.name, '未知商家')
                else coalesce(nullif(btrim(lmds.display_name), ''), au.display_name, '未知成员')
            end as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                else fr.net_amount
            end as signed_amount
        from filtered_records fr
        left join public.merchant m
          on m.id = fr.merchant_id
         and m.ledger_id = p_ledger_id
        left join public.app_user au
          on au.id = fr.created_by
        left join public.ledger_member_display_setting lmds
          on lmds.ledger_id = p_ledger_id
         and lmds.user_id = fr.created_by
        where p_group_by in ('merchant', 'member')
    ),
    active_record_tags as (
        select
            trt.transaction_record_id,
            tt.id as tag_id,
            tt.name as tag_name
        from public.transaction_record_tag trt
        join public.transaction_tag tt
          on tt.id = trt.tag_id
         and tt.ledger_id = trt.ledger_id
         and tt.is_archived = false
        where trt.ledger_id = p_ledger_id
    ),
    tag_group_rows as (
        select
            'tag:' || art.tag_id::text as group_id,
            art.tag_id::text as group_key,
            art.tag_name as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                else fr.net_amount
            end as signed_amount
        from filtered_records fr
        join active_record_tags art
          on art.transaction_record_id = fr.id
        where p_group_by = 'tag'

        union all

        select
            'tag:untagged' as group_id,
            'untagged' as group_key,
            '无标签' as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                else fr.net_amount
            end as signed_amount
        from filtered_records fr
        where p_group_by = 'tag'
          and not exists (
              select 1
              from active_record_tags art
              where art.transaction_record_id = fr.id
          )
    ),
    item_group_rows as (
        select
            case
                when p_group_by = 'account' then 'account:' || ti.account_id::text
                when p_group_by = 'parentCategory' then 'parentCategory:' || coalesce(coalesce(parent.id, c.id)::text, 'unknown')
                else 'category:' || coalesce(c.id::text, 'unknown')
            end as group_id,
            case
                when p_group_by = 'account' then ti.account_id::text
                when p_group_by = 'parentCategory' then coalesce(coalesce(parent.id, c.id)::text, 'unknown')
                else coalesce(c.id::text, 'unknown')
            end as group_key,
            case
                when p_group_by = 'account' then coalesce(a.name, '未知账户')
                when p_group_by = 'parentCategory' then coalesce(parent.name, c.name, '未知大分类')
                else coalesce(c.name, '未知小分类')
            end as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                when c.type = 'income' then ti.amount
                when c.type = 'expense' then -ti.amount
                else 0
            end as signed_amount
        from filtered_records fr
        join public.transaction_item ti
          on ti.transaction_record_id = fr.id
         and ti.ledger_id = p_ledger_id
        left join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        left join public.category parent
          on parent.id = c.parent_id
         and parent.ledger_id = c.ledger_id
        where p_group_by in ('account', 'parentCategory', 'category')
    ),
    all_group_rows as (
        select * from record_group_rows
        union all
        select * from tag_group_rows
        union all
        select * from item_group_rows
    ),
    aggregated_groups as (
        select
            agr.group_id,
            agr.group_key,
            agr.group_label,
            coalesce(sum(
                case when agr.signed_amount > 0 then agr.signed_amount else 0 end
            ), 0) as income,
            coalesce(sum(
                case when agr.signed_amount < 0 then abs(agr.signed_amount) else 0 end
            ), 0) as expense,
            coalesce(sum(agr.signed_amount), 0) as balance,
            count(distinct agr.transaction_record_id)::integer as transaction_count,
            max(agr.transaction_at) as latest_transaction_at
        from all_group_rows agr
        group by agr.group_id, agr.group_key, agr.group_label
    )
    select
        ag.group_id,
        ag.group_key,
        ag.group_label,
        ag.income,
        ag.expense,
        ag.balance,
        ag.transaction_count,
        ag.latest_transaction_at
    from aggregated_groups ag
    order by ag.latest_transaction_at desc, ag.group_id asc
    limit greatest(coalesce(p_limit, 20), 0)
    offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.load_transaction_group_summaries(
    uuid,
    text,
    timestamptz,
    timestamptz,
    text,
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer
) from public;
revoke all on function public.load_transaction_group_summaries(
    uuid,
    text,
    timestamptz,
    timestamptz,
    text,
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer
) from anon;
grant execute on function public.load_transaction_group_summaries(
    uuid,
    text,
    timestamptz,
    timestamptz,
    text,
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer
) to authenticated;
