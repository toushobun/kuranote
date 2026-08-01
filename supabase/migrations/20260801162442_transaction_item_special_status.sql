create type public.transaction_item_special_status as enum (
    'pending_reimbursement',
    'pending_refund',
    'reimbursed',
    'refunded',
    'excluded'
);

alter table public.transaction_item
add column special_status public.transaction_item_special_status default null;

alter table public.ledger
add column transaction_item_special_status_enabled boolean not null default false;

create index transaction_item_special_status_idx
on public.transaction_item (ledger_id, special_status, transaction_record_id);

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
begin
    if new.special_status <> 'excluded' then
        return new;
    end if;

    select c.type
    into v_category_type
    from public.category c
    where c.id = new.category_id
      and c.ledger_id = new.ledger_id;

    if v_category_type is distinct from 'expense' then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    return new;
end;
$$;

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
security definer
set search_path = pg_catalog, pg_temp
stable
as $$
    with record_amounts as (
        select
            tr.id,
            tr.type,
            tr.transaction_at,
            tr.merchant_id,
            tr.created_by,
            coalesce(sum(case
                when c.type = 'income' then ti.amount
                when c.type = 'expense' and ti.special_status is distinct from 'excluded' then -ti.amount
                else 0
            end), 0) as net_amount,
            coalesce(bool_or(c.type = 'expense'), false) as has_expense,
            coalesce(bool_or(c.type = 'income'), false) as has_income
        from public.transaction_record tr
        left join public.transaction_item ti
          on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
        left join public.category c
          on c.id = ti.category_id and c.ledger_id = ti.ledger_id
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type in ('normal', 'transfer')
          and public.current_user_is_active_ledger_member(p_ledger_id)
        group by tr.id, tr.type, tr.transaction_at, tr.merchant_id, tr.created_by
    ),
    record_profiles as (
        select ra.*, case
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
            'merchant', 'account', 'parentCategory', 'category', 'member',
            'specialStatus'
        )
          and p_record_type in ('all', 'income', 'expense', 'transfer')
          and (p_date_start is null or rp.transaction_at >= p_date_start)
          and (p_date_end is null or rp.transaction_at < p_date_end)
          and (p_record_type = 'all' or rp.computed_record_type = p_record_type)
          and (p_merchant_id is null or rp.merchant_id = p_merchant_id)
          and (p_member_id is null or rp.created_by = p_member_id)
    ),
    matching_items as (
        select ti.*, c.type as category_type, c.name as category_name,
            c.parent_id, parent.name as parent_category_name
        from public.transaction_item ti
        join filtered_records fr on fr.id = ti.transaction_record_id
        left join public.category c
          on c.id = ti.category_id and c.ledger_id = ti.ledger_id
        left join public.category parent
          on parent.id = c.parent_id and parent.ledger_id = c.ledger_id
        where ti.ledger_id = p_ledger_id
          and (p_account_id is null or ti.account_id = p_account_id)
          and (p_category_id is null or ti.category_id = p_category_id)
          and (
              p_parent_category_id is null
              or coalesce(parent.id, c.id) = p_parent_category_id
          )
          and (
              coalesce(array_length(p_special_statuses, 1), 0) = 0
              or coalesce(ti.special_status::text, 'none') = any(p_special_statuses)
          )
    ),
    record_group_rows as (
        select
            case when p_group_by = 'merchant'
                then 'merchant:' || coalesce(fr.merchant_id::text, 'unknown')
                else 'member:' || coalesce(fr.created_by::text, 'unknown')
            end as group_id,
            case when p_group_by = 'merchant'
                then coalesce(fr.merchant_id::text, 'unknown')
                else coalesce(fr.created_by::text, 'unknown')
            end as group_key,
            case when p_group_by = 'merchant'
                then coalesce(m.name, '未知商家')
                else coalesce(nullif(btrim(lmds.display_name), ''), au.display_name, '未知成员')
            end as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            coalesce(sum(case
                when fr.type = 'transfer' then 0
                when mi.category_type = 'income' then mi.amount
                when mi.category_type = 'expense' and mi.special_status is distinct from 'excluded' then -mi.amount
                else 0
            end), 0) as signed_amount,
            count(mi.id)::integer as item_count
        from filtered_records fr
        join matching_items mi on mi.transaction_record_id = fr.id
        left join public.merchant m on m.id = fr.merchant_id and m.ledger_id = p_ledger_id
        left join public.app_user au on au.id = fr.created_by
        left join public.ledger_member_display_setting lmds
          on lmds.ledger_id = p_ledger_id and lmds.user_id = fr.created_by
        where p_group_by in ('merchant', 'member')
        group by fr.id, fr.type, fr.transaction_at, fr.merchant_id, fr.created_by,
            m.name, lmds.display_name, au.display_name
    ),
    item_group_rows as (
        select
            case
                when p_group_by = 'account' then 'account:' || mi.account_id::text
                when p_group_by = 'parentCategory' then 'parentCategory:' || coalesce(coalesce(mi.parent_id, mi.category_id)::text, 'unknown')
                when p_group_by = 'category' then 'category:' || coalesce(mi.category_id::text, 'unknown')
                else 'specialStatus:' || coalesce(mi.special_status::text, 'none')
            end as group_id,
            case
                when p_group_by = 'account' then mi.account_id::text
                when p_group_by = 'parentCategory' then coalesce(coalesce(mi.parent_id, mi.category_id)::text, 'unknown')
                when p_group_by = 'category' then coalesce(mi.category_id::text, 'unknown')
                else coalesce(mi.special_status::text, 'none')
            end as group_key,
            case
                when p_group_by = 'account' then coalesce(a.name, '未知账户')
                when p_group_by = 'parentCategory' then coalesce(mi.parent_category_name, mi.category_name, '未知大分类')
                when p_group_by = 'category' then coalesce(mi.category_name, '未知小分类')
                when mi.special_status = 'pending_reimbursement' then '待报销'
                when mi.special_status = 'pending_refund' then '待退款'
                when mi.special_status = 'reimbursed' then '已报销'
                when mi.special_status = 'refunded' then '已退款'
                when mi.special_status = 'excluded' then '不计入支出（不计入合计）'
                else '无特殊状态'
            end as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                when p_group_by = 'specialStatus' and mi.special_status = 'excluded' then -mi.amount
                when mi.category_type = 'income' then mi.amount
                when mi.category_type = 'expense' and mi.special_status is distinct from 'excluded' then -mi.amount
                else 0
            end as signed_amount,
            1 as item_count
        from filtered_records fr
        join matching_items mi on mi.transaction_record_id = fr.id
        left join public.account a on a.id = mi.account_id and a.ledger_id = mi.ledger_id
        where p_group_by in ('account', 'parentCategory', 'category', 'specialStatus')
    ),
    all_group_rows as (
        select * from record_group_rows
        union all
        select * from item_group_rows
    ),
    aggregated_groups as (
        select agr.group_id, agr.group_key, agr.group_label,
            coalesce(sum(case when agr.signed_amount > 0 then agr.signed_amount else 0 end), 0) as income,
            coalesce(sum(case when agr.signed_amount < 0 then abs(agr.signed_amount) else 0 end), 0) as expense,
            coalesce(sum(agr.signed_amount), 0) as balance,
            case when p_group_by = 'specialStatus' then sum(agr.item_count)::integer
                else count(distinct agr.transaction_record_id)::integer end as transaction_count,
            max(agr.transaction_at) as latest_transaction_at
        from all_group_rows agr
        group by agr.group_id, agr.group_key, agr.group_label
    )
    select ag.* from aggregated_groups ag
    order by
        case when p_group_by = 'specialStatus' then case ag.group_key
            when 'pending_reimbursement' then 1 when 'pending_refund' then 2
            when 'reimbursed' then 3 when 'refunded' then 4
            when 'excluded' then 5 else 6 end end,
        ag.latest_transaction_at desc,
        ag.group_id asc
    limit greatest(coalesce(p_limit, 20), 0)
    offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid,
    text[], integer, integer
) from public;
revoke all on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid,
    text[], integer, integer
) from anon;
grant execute on function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid,
    text[], integer, integer
) to authenticated;

revoke all on function public.validate_transaction_item_special_status() from public;
revoke all on function public.validate_transaction_item_special_status() from anon;
revoke all on function public.validate_transaction_item_special_status() from authenticated;

create trigger transaction_item_validate_special_status
before insert or update of special_status, category_id on public.transaction_item
for each row execute function public.validate_transaction_item_special_status();

create or replace function public.create_transaction(
    p_ledger_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid default null,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    if not exists (
        select 1 from public.account a
        where a.id = p_account_id
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
    ) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id
          and m.ledger_id = p_ledger_id
          and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    insert into public.transaction_record (
        ledger_id, type, status, transaction_at, merchant_id, title, note,
        created_by, updated_by
    ) values (
        p_ledger_id, 'normal', 'active', p_transaction_at, p_merchant_id, null,
        p_note, v_user_id, v_user_id
    ) returning id into v_transaction_record_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_item_amount := (v_item ->> 'amount')::numeric(14,2);
        v_item_category_id := (v_item ->> 'categoryId')::uuid;
        begin
            v_item_special_status := nullif(v_item ->> 'specialStatus', '')::public.transaction_item_special_status;
        exception when invalid_text_representation then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end;

        if v_item_amount is null or v_item_amount < 0 or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        if v_item_special_status = 'excluded' and v_item_category_type <> 'expense' then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        v_balance_delta := case
            when v_item_special_status = 'excluded' then 0
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        insert into public.transaction_item (
            ledger_id, transaction_record_id, account_id, category_id, amount,
            discount_amount, balance_delta, note, sort_order, special_status,
            created_by, updated_by
        ) values (
            p_ledger_id, v_transaction_record_id, p_account_id,
            v_item_category_id, v_item_amount, 0, v_balance_delta, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id, p_account_id, v_balance_delta, v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;

    return v_transaction_record_id;
end;
$$;

create or replace function public.update_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_existing_item public.transaction_item;
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    if not exists (
        select 1 from public.account a
        where a.id = p_account_id and a.ledger_id = p_ledger_id and a.is_archived = false
    ) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id and m.ledger_id = p_ledger_id and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    select * into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    for v_existing_item in
        select * from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id, v_existing_item.account_id,
            -v_existing_item.balance_delta, v_user_id
        );
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

    update public.transaction_record tr
    set type = 'normal', transaction_at = p_transaction_at,
        merchant_id = p_merchant_id, note = p_note,
        updated_by = v_user_id, updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_item_amount := (v_item ->> 'amount')::numeric(14,2);
        v_item_category_id := (v_item ->> 'categoryId')::uuid;
        begin
            v_item_special_status := nullif(v_item ->> 'specialStatus', '')::public.transaction_item_special_status;
        exception when invalid_text_representation then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end;

        if v_item_amount is null or v_item_amount < 0 or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        if v_item_special_status = 'excluded' and v_item_category_type <> 'expense' then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        v_balance_delta := case
            when v_item_special_status = 'excluded' then 0
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        insert into public.transaction_item (
            ledger_id, transaction_record_id, account_id, category_id, amount,
            discount_amount, balance_delta, note, sort_order, special_status,
            created_by, updated_by
        ) values (
            p_ledger_id, p_transaction_record_id, p_account_id,
            v_item_category_id, v_item_amount, 0, v_balance_delta, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id, p_account_id, v_balance_delta, v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;

    return p_transaction_record_id;
end;
$$;

-- 类型转换原有 RPC 会先完成记录形态与账户锁定；转换为普通交易后，再在同一个
-- 数据库事务内通过已支持特殊状态的更新 RPC 重建明细，保证状态与余额口径原子一致。
create or replace function public.convert_transaction_type_with_special_status(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_target_type text,
    p_transaction_at timestamptz,
    p_note text default null,
    p_account_id uuid default null,
    p_merchant_id uuid default null,
    p_items jsonb default null,
    p_from_account_id uuid default null,
    p_to_account_id uuid default null,
    p_transfer_amount numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
begin
    v_transaction_record_id := public.convert_transaction_type(
        p_ledger_id,
        p_transaction_record_id,
        p_target_type,
        p_transaction_at,
        p_note,
        p_account_id,
        p_merchant_id,
        p_items,
        p_from_account_id,
        p_to_account_id,
        p_transfer_amount
    );

    if p_target_type <> 'transfer' then
        perform public.update_transaction(
            p_ledger_id,
            p_transaction_record_id,
            p_target_type,
            p_transaction_at,
            p_items,
            p_account_id,
            p_merchant_id,
            p_note
        );
    end if;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from public;
revoke all on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from anon;
grant execute on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) to authenticated;
