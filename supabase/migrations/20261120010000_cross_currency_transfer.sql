-- #247：转账允许跨币种各记各的金额，不改变原有表结构。
-- 删除旧函数签名，避免 PostgREST 重载歧义。
drop function public.create_transfer_transaction(uuid, timestamptz, numeric, uuid, uuid, text);
drop function public.update_transfer_transaction(uuid, uuid, timestamptz, numeric, uuid, uuid, text);

-- 双金额只与对应账户的币种精度比较，未知币种按整数处理。
create function public.is_valid_transfer_amount(p_amount numeric, p_currency text)
returns boolean
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
    select p_amount is not null
       and p_amount > 0
       and p_amount < 1000000000000
       and p_amount = round(p_amount, 2)
       and p_amount = round(
           p_amount,
           case
             when upper(p_currency) in (
                 'CNY', 'EUR', 'GBP', 'HKD', 'SGD', 'THB', 'TWD',
                 'USD', 'BHD', 'KWD', 'OMR'
             ) then 2
             else 0
           end
       );
$$;
revoke all on function public.is_valid_transfer_amount(numeric, text)
    from public, anon, authenticated, service_role;

-- 删除、编辑使用同一套完整性校验：异币不比较两笔金额总和。
create function public.transfer_items_consistent(p_ledger_id uuid, p_transaction_record_id uuid)
returns boolean
language sql
stable
set search_path = pg_catalog, pg_temp
as $$
    select count(*) = 2
       and count(*) filter (where ti.category_id is null) = 2
       and count(*) filter (where ti.balance_delta > 0) = 1
       and count(*) filter (where ti.balance_delta < 0) = 1
       and count(*) filter (where ti.amount > 0) = 2
       and count(*) filter (where ti.amount = abs(ti.balance_delta)) = 2
       and count(distinct ti.account_id) = 2
       and (
           count(distinct a.currency) = 2
           or count(distinct ti.amount) = 1
       )
    from public.transaction_item ti
    join public.account a on a.id = ti.account_id and a.ledger_id = ti.ledger_id
    where ti.ledger_id = p_ledger_id
      and ti.transaction_record_id = p_transaction_record_id;
$$;
revoke all on function public.transfer_items_consistent(uuid, uuid)
    from public, anon, authenticated, service_role;

create or replace function public.create_transfer_transaction(
    p_ledger_id uuid,
    p_transaction_at timestamptz,
    p_amount numeric,
    p_from_account_id uuid,
    p_to_account_id uuid,
    p_note text default null,
    p_to_amount numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
    v_user_id uuid := auth.uid();
    v_from_account public.account;
    v_to_account public.account;
    v_effective_to_amount numeric;
    v_locked_account public.account;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
        raise exception 'amount_invalid' using errcode = '22023';
    end if;

    if p_from_account_id = p_to_account_id then
        raise exception 'transfer_account_invalid' using errcode = '22023';
    end if;

    for v_locked_account in
        select *
        from public.account a
        where a.id in (p_from_account_id, p_to_account_id)
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
        order by a.id
        for update
    loop
        if v_locked_account.id = p_from_account_id then
            v_from_account := v_locked_account;
        elsif v_locked_account.id = p_to_account_id then
            v_to_account := v_locked_account;
        end if;
    end loop;

    if v_from_account.id is null then
        raise exception 'from_account_invalid' using errcode = '22023';
    end if;

    if v_to_account.id is null then
        raise exception 'to_account_invalid' using errcode = '22023';
    end if;

    v_effective_to_amount := coalesce(
        p_to_amount,
        case when v_from_account.currency = v_to_account.currency then p_amount end
    );
    if not public.is_valid_transfer_amount(p_amount, v_from_account.currency)
        or not public.is_valid_transfer_amount(v_effective_to_amount, v_to_account.currency)
        or (v_from_account.currency = v_to_account.currency
            and p_amount <> v_effective_to_amount) then
        raise exception 'amount_invalid' using errcode = '22023', detail = 'amount_invalid';
    end if;

    insert into public.transaction_record (
        ledger_id,
        type,
        status,
        transaction_at,
        merchant_id,
        title,
        note,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        'transfer',
        'active',
        p_transaction_at,
        null,
        null,
        p_note,
        v_user_id,
        v_user_id
    ) returning id into v_transaction_record_id;

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
        created_by,
        updated_by
    ) values
    (
        p_ledger_id,
        v_transaction_record_id,
        p_from_account_id,
        null,
        p_amount,
        0,
        -p_amount,
        null,
        0,
        v_user_id,
        v_user_id
    ),
    (
        p_ledger_id,
        v_transaction_record_id,
        p_to_account_id,
        null,
        v_effective_to_amount,
        0,
        v_effective_to_amount,
        null,
        1,
        v_user_id,
        v_user_id
    );

    perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -p_amount, v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, v_effective_to_amount, v_user_id);

    return v_transaction_record_id;
end;
$$;

revoke all on function public.create_transfer_transaction(
    uuid, timestamptz, numeric, uuid, uuid, text, numeric
) from public, anon, authenticated, service_role;
grant execute on function public.create_transfer_transaction(
    uuid, timestamptz, numeric, uuid, uuid, text, numeric
) to authenticated;

create or replace function public.update_transfer_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_at timestamptz,
    p_amount numeric,
    p_from_account_id uuid,
    p_to_account_id uuid,
    p_note text default null,
    p_to_amount numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_old_from_account_id uuid;
    v_old_to_account_id uuid;
    v_old_amount numeric(14,2);
    v_old_to_amount numeric(14,2);
    v_all_account_ids uuid[];
    v_from_account public.account;
    v_to_account public.account;
    v_effective_to_amount numeric;
    v_locked_account public.account;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
        raise exception 'amount_invalid' using errcode = '22023';
    end if;

    if p_from_account_id = p_to_account_id then
        raise exception 'transfer_account_invalid' using errcode = '22023';
    end if;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'transfer'
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    if not public.transfer_items_consistent(p_ledger_id, p_transaction_record_id) then
        raise exception 'transfer_items_invalid' using errcode = '22023';
    end if;

    select account_id, amount
    into v_old_from_account_id, v_old_amount
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and ti.balance_delta < 0;

    select account_id, amount
    into v_old_to_account_id, v_old_to_amount
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and ti.balance_delta > 0;

    v_all_account_ids := array(
        select distinct unnest(array[
            v_old_from_account_id,
            v_old_to_account_id,
            p_from_account_id,
            p_to_account_id
        ])
        order by 1
    );

    for v_locked_account in
        select *
        from public.account a
        where a.id = any(v_all_account_ids)
          and a.ledger_id = p_ledger_id
        order by a.id
        for update
    loop
        if v_locked_account.id = p_from_account_id then
            v_from_account := v_locked_account;
        end if;
        if v_locked_account.id = p_to_account_id then
            v_to_account := v_locked_account;
        end if;
    end loop;

    if v_from_account.id is null or v_from_account.is_archived then
        raise exception 'from_account_invalid' using errcode = '22023';
    end if;

    if v_to_account.id is null or v_to_account.is_archived then
        raise exception 'to_account_invalid' using errcode = '22023';
    end if;

    v_effective_to_amount := coalesce(
        p_to_amount,
        case when v_from_account.currency = v_to_account.currency then p_amount end
    );
    if not public.is_valid_transfer_amount(p_amount, v_from_account.currency)
        or not public.is_valid_transfer_amount(v_effective_to_amount, v_to_account.currency)
        or (v_from_account.currency = v_to_account.currency
            and p_amount <> v_effective_to_amount) then
        raise exception 'amount_invalid' using errcode = '22023', detail = 'amount_invalid';
    end if;

    perform public.apply_account_balance_delta(p_ledger_id, v_old_from_account_id, v_old_amount, v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, v_old_to_account_id, -v_old_to_amount, v_user_id);

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

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
        created_by,
        updated_by
    ) values
    (
        p_ledger_id,
        p_transaction_record_id,
        p_from_account_id,
        null,
        p_amount,
        0,
        -p_amount,
        null,
        0,
        v_user_id,
        v_user_id
    ),
    (
        p_ledger_id,
        p_transaction_record_id,
        p_to_account_id,
        null,
        v_effective_to_amount,
        0,
        v_effective_to_amount,
        null,
        1,
        v_user_id,
        v_user_id
    );

    perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -p_amount, v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, v_effective_to_amount, v_user_id);

    update public.transaction_record tr
    set
        transaction_at = p_transaction_at,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id;

    return p_transaction_record_id;
end;
$$;

revoke all on function public.update_transfer_transaction(
    uuid, uuid, timestamptz, numeric, uuid, uuid, text, numeric
) from public, anon, authenticated, service_role;
grant execute on function public.update_transfer_transaction(
    uuid, uuid, timestamptz, numeric, uuid, uuid, text, numeric
) to authenticated;

CREATE OR REPLACE FUNCTION "public"."void_transaction_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_item public.transaction_item;
    v_item_count integer := 0;
    v_account_id uuid;
    v_account_delta numeric(14,2);
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type in ('normal', 'transfer', 'balance_adjustment')
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    perform 1
    from public.account a
    where a.ledger_id = p_ledger_id
      and a.id in (
          -- 普通记录的账户来自付款明细，转账 / 余额调整来自明细。
          select m.account_id
          from public.transaction_account_movement m
          where m.transaction_record_id = p_transaction_record_id
            and m.ledger_id = p_ledger_id
      )
    order by a.id
    for no key update;

    if v_record.type = 'balance_adjustment' and exists (
        select 1 from public.transaction_item ti join public.account a on a.id=ti.account_id and a.ledger_id=ti.ledger_id
        where ti.ledger_id=p_ledger_id and ti.transaction_record_id=p_transaction_record_id and a.is_archived
    ) then
        raise exception 'balance_adjustment_account_archived' using errcode='22023', detail='balance_adjustment_account_archived';
    end if;

    if v_record.type = 'transfer' then
        perform 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.account_id, ti.id
        for update;

        if not public.transfer_items_consistent(p_ledger_id, p_transaction_record_id) then
            raise exception 'transfer_items_invalid' using errcode = '22023';
        end if;
    end if;

    v_item_count := 0;

    for v_item in
        select *
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        v_item_count := v_item_count + 1;
    end loop;

    if v_item_count = 0 then
        raise exception 'transaction_item_invalid' using errcode = '22023';
    end if;

    -- 按账户回滚余额；普通记录的付款明细与明细一样保留供追溯。
    -- 余额为 0 的账户也调用一次，保持「含已归档账户的记录不可删除」。
    for v_account_id, v_account_delta in
        select m.account_id, sum(m.balance_delta)
        from public.transaction_account_movement m
        where m.transaction_record_id = p_transaction_record_id
          and m.ledger_id = p_ledger_id
        group by m.account_id
        order by m.account_id
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_account_id,
            -v_account_delta,
            v_user_id
        );
    end loop;

    update public.transaction_record tr
    set
        status = 'deleted',
        deleted_by = v_user_id,
        deleted_at = now(),
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    return p_transaction_record_id;
end;
$;

-- 金额搜索对转账的任一笔明细匹配，不改变候选搜索行为。
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
