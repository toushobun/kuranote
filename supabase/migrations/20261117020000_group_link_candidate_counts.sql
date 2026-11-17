-- #1112：候选首页额外返回未结清历史商家 / 同商家 / 其他候选笔数；records 模式不变。
create or replace function public.load_filtered_transaction_page(
    p_ledger_id uuid,
    p_scope text,
    p_query text default '',
    p_merchant_priority_id uuid default null,
    p_currency text default null,
    p_special_statuses text[] default null,
    p_settled boolean default false,
    p_offset integer default 0,
    p_limit integer default 20,
    p_history_merchant_id uuid default null,
    p_link_kind text default null
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
            - coalesce(refund_totals.positive_amount, 0::numeric)
            - coalesce(reimbursement_totals.positive_amount, 0::numeric),
            0::numeric
        ) as business_net_amount,
        ti.sort_order,
        ti.amount
          - coalesce(refund_totals.total_amount, 0::numeric)
          - coalesce(reimbursement_totals.total_amount, 0::numeric) <= 0 as settled,
        coalesce(preferred_alias.alias, m.name) as preferred_merchant_name,
        coalesce(nullif(trim(setting.display_name), ''), au.display_name) as recorder_name
    from public.transaction_record tr
    join public.transaction_item ti
      on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
    -- 候选净额最终按零截断，无需重算各笔关联的时间轴分摊和超额部分。
    left join lateral (
        select
            sum(link.refund_amount) as total_amount,
            sum(link.refund_amount) filter (where link.refund_amount > 0) as positive_amount
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
         and income_item.ledger_id = link.ledger_id
        join public.transaction_record income_record
          on income_record.id = income_item.transaction_record_id
         and income_record.ledger_id = income_item.ledger_id
         and income_record.status = 'active'
        where link.ledger_id = ti.ledger_id
          and link.refunded_item_id = ti.id
    ) refund_totals on true
    left join lateral (
        select
            sum(link.reimbursement_amount) as total_amount,
            sum(link.reimbursement_amount) filter (where link.reimbursement_amount > 0) as positive_amount
        from public.transaction_item_reimbursement_link link
        join public.transaction_item income_item
          on income_item.id = link.reimbursement_income_item_id
         and income_item.ledger_id = link.ledger_id
        join public.transaction_record income_record
          on income_record.id = income_item.transaction_record_id
         and income_record.ledger_id = income_item.ledger_id
         and income_record.status = 'active'
        where link.ledger_id = ti.ledger_id
          and link.target_expense_item_id = ti.id
    ) reimbursement_totals on true
    join public.category cat
      on cat.id = ti.category_id and cat.ledger_id = ti.ledger_id
     and cat.type = 'expense'
    join public.ledger ledger on ledger.id = tr.ledger_id
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
        join public.account a
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
      and (select public.current_user_is_active_ledger_member(p_ledger_id))
      and (p_currency is null or coalesce(first_payment.currency, ledger.base_currency) = p_currency)
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
candidate_group_counts as (
    select
        count(*) filter (
            where coalesce(merchant_id = any((select ids from history_merchants)), false)
        ) as history,
        count(*) filter (
            where not coalesce(merchant_id = any((select ids from history_merchants)), false)
              and p_link_kind = 'refund'
              and p_merchant_priority_id is not null
              and merchant_id = p_merchant_priority_id
        ) as same_merchant,
        count(*) filter (
            where not coalesce(merchant_id = any((select ids from history_merchants)), false)
              and not (
                  p_link_kind = 'refund'
                  and p_merchant_priority_id is not null
                  and coalesce(merchant_id = p_merchant_priority_id, false)
              )
        ) as other
    from candidate_matched
    where not settled
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
            (array_agg(ti.amount order by (case when ti.balance_delta < 0 then 0 else 1 end), ti.sort_order, ti.id))[1] as first_amount,
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
                  or (tr.type = 'transfer' and strpos(coalesce(trim_scale(amounts.first_amount)::text, ''), args.amount_term) > 0)
                  or (tr.type = 'balance_adjustment' and strpos(coalesce(trim_scale(amounts.first_delta)::text, ''), args.amount_term) > 0)
                  or (tr.type = 'normal' and amounts.has_item_amount)
              )
          )
      )
),
all_matches as (
    select
        record_id, item_id, transaction_at, created_at, merchant_id, sort_order,
        coalesce(nullif(btrim(item_note), ''), nullif(btrim(record_note), '')) as candidate_note
    from candidate_matched
    where settled = p_settled
    union all
    select
        record_id, item_id, transaction_at, created_at, merchant_id, sort_order,
        null::text as candidate_note
    from record_matched
),
ordered_page as (
    select
        record_id,
        item_id,
        candidate_note,
        row_number() over (
            order by
                case when p_scope = 'candidates'
                      and merchant_id = any(array(select unnest(ids) from history_merchants))
                    then 0
                    when p_scope = 'candidates' and merchant_id = p_merchant_priority_id
                    then 1
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
         || case when p_offset = 0
             then jsonb_build_object(
                 'groupCounts',
                 (select jsonb_build_object(
                     'history', history,
                     'sameMerchant', same_merchant,
                     'other', other
                 ) from candidate_group_counts)
             )
             else '{}'::jsonb
         end
    else '{}'::jsonb
end;
$$;

revoke all on function public.load_filtered_transaction_page(
    uuid, text, text, uuid, text, text[], boolean, integer, integer, uuid, text
) from public, anon, authenticated, service_role;
grant execute on function public.load_filtered_transaction_page(
    uuid, text, text, uuid, text, text[], boolean, integer, integer, uuid, text
) to authenticated;
