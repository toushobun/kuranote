-- 修复明细特殊状态评审发现的关联、统计与功能开关问题。

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
    ) as is_refund_income,
    exists (
        select 1
        from public.transaction_item settled_item
        join public.transaction_record settled_record
          on settled_record.id = settled_item.transaction_record_id
         and settled_record.ledger_id = settled_item.ledger_id
        where settled_item.settled_by_item_id = ti.id
          and settled_item.ledger_id = ti.ledger_id
          and settled_record.status = 'active'
    ) as is_reimbursement_income,
    exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.refunded_item_id = ti.id
              or link.refund_income_item_id = ti.id
          )
    ) as has_refund_link
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

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
    v_settling_item_is_income boolean;
    v_special_status_enabled boolean;
begin
    if new.special_status is not null then
        select l.transaction_item_special_status_enabled
        into v_special_status_enabled
        from public.ledger l
        where l.id = new.ledger_id;

        if v_special_status_enabled is distinct from true then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;
    end if;

    if tg_op = 'UPDATE'
       and old.special_status = 'reimbursed'
       and (
           new.special_status is distinct from old.special_status
           or new.settled_by_item_id is distinct from old.settled_by_item_id
       ) then
        raise exception 'reimbursed_transition_forbidden'
            using errcode = '42501', detail = 'reimbursed_transition_forbidden';
    end if;

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

    if v_category_type is distinct from 'expense' then
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
       or current_setting('kuranote.reimbursement_link_flow', true) is distinct from 'on'
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
    v_income_account_id uuid;
    v_income_category_type text;
    v_income_currency text;
    v_refunded_item_id uuid;
    v_refunded_amount numeric(14,2);
    v_refunded_account_id uuid;
    v_refunded_category_type text;
    v_refunded_currency text;
    v_reimbursement_ids uuid[];
    v_requested_count integer;
    v_updated_count integer;
    v_special_status_enabled boolean;
begin
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

    select l.transaction_item_special_status_enabled
    into v_special_status_enabled
    from public.ledger l
    where l.id = p_ledger_id;

    if v_special_status_enabled is distinct from true then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    select ti.amount, ti.account_id, c.type, a.currency
    into v_income_amount, v_income_account_id, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_requested_count > 0 and v_refunded_item_id is not null then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_requested_count > 0 then
        with locked_items as (
            select ti.id
            from public.transaction_item ti
            join public.transaction_record tr
              on tr.id = ti.transaction_record_id
             and tr.ledger_id = ti.ledger_id
             and tr.status = 'active'
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_reimbursement_ids)
              and ti.special_status = 'pending_reimbursement'
              and ti.settled_by_item_id is null
            for update of ti, tr
        )
        select count(*)::integer into v_updated_count from locked_items;

        if v_updated_count <> v_requested_count then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

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
    end if;

    if v_refunded_item_id is not null then
        select ti.amount, ti.account_id, c.type, a.currency
        into v_refunded_amount, v_refunded_account_id,
             v_refunded_category_type, v_refunded_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        where ti.id = v_refunded_item_id
          and ti.ledger_id = p_ledger_id
        for update of ti, tr;

        if not found or v_refunded_category_type is distinct from 'expense' then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if v_income_currency is distinct from v_refunded_currency then
            raise exception 'refund_currency_mismatch'
                using errcode = '22023', detail = 'refund_currency_mismatch';
        end if;

        if v_income_account_id is distinct from v_refunded_account_id then
            raise exception 'refund_account_mismatch'
                using errcode = '22023', detail = 'refund_account_mismatch';
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
        ti.refunded_amount,
        c.type as category_type,
        c.parent_id,
        case
            when tr.type = 'transfer' then 0::numeric
            when c.type = 'expense' and ti.special_status = 'reimbursed' then 0::numeric
            when c.type = 'income' and ti.is_refund_income then 0::numeric
            when c.type = 'income' and ti.is_reimbursement_income then 0::numeric
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
