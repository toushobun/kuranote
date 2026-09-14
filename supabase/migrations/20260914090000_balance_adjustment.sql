-- 余额调整复用 transaction_item.balance_delta；amount 保留绝对值以遵守现有金额约束。
alter table public.transaction_record drop constraint transaction_record_type_check;
alter table public.transaction_record add constraint transaction_record_type_check check (type in ('normal', 'transfer', 'balance_adjustment'));
alter table public.transaction_record drop constraint transaction_record_merchant_required_for_non_transfer;
alter table public.transaction_record add constraint transaction_record_merchant_required_for_non_transfer check (type in ('transfer', 'balance_adjustment') or merchant_id is not null);
alter table public.transaction_record add constraint balance_adjustment_no_merchant check (type <> 'balance_adjustment' or merchant_id is null);

create function public.update_account_with_balance_adjustment(
 p_ledger_id uuid, p_account_id uuid, p_name text, p_type text,
 p_currency text, p_holder_user_ids uuid[], p_target_balance numeric default null,
 p_adjustment_note text default null
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog', 'pg_temp' as $$
declare
 v_balance numeric;
 v_delta numeric;
 v_record_id uuid;
 v_user_id uuid := auth.uid();
begin
 if v_user_id is null then
  raise exception 'not_authenticated' using errcode = '28000', detail = 'not_authenticated';
 end if;
 if not public.current_user_can_manage_ledger(p_ledger_id) then
  raise exception 'ledger_forbidden' using errcode = '42501', detail = 'ledger_forbidden';
 end if;
 if p_target_balance is not null and (p_target_balance::text in ('NaN','Infinity','-Infinity') or abs(p_target_balance) >= 1000000000000 or p_target_balance <> round(p_target_balance,2)) then
  raise exception 'account_balance_invalid' using errcode = '22023', detail = 'account_balance_invalid';
 end if;
 if length(p_adjustment_note) > 2000 then
  raise exception 'account_adjustment_note_invalid' using errcode = '22023', detail = 'account_adjustment_note_invalid';
 end if;
 -- 与既有账户资料 RPC 保持锁定顺序，资料更新取得账户行锁后再读取最新余额。
 perform public.update_account_with_holders(p_ledger_id,p_account_id,p_name,p_type,p_currency,p_holder_user_ids);
 select current_balance into strict v_balance from public.account where id=p_account_id and ledger_id=p_ledger_id for update;
 v_delta := p_target_balance - v_balance;
 if v_delta is not null and v_delta <> 0 then
  if abs(v_delta) >= 1000000000000 then
   raise exception 'account_balance_invalid' using errcode = '22023', detail = 'account_balance_invalid';
  end if;
  insert into public.transaction_record(ledger_id,type,transaction_at,note,created_by,updated_by)
  values(p_ledger_id,'balance_adjustment',now(),nullif(btrim(p_adjustment_note),''),v_user_id,v_user_id)
  returning id into v_record_id;
  insert into public.transaction_item(ledger_id,transaction_record_id,account_id,amount,balance_delta,created_by,updated_by)
  values(p_ledger_id,v_record_id,p_account_id,abs(v_delta),v_delta,v_user_id,v_user_id);
  perform public.apply_account_balance_delta(p_ledger_id,p_account_id,v_delta,v_user_id);
 end if;
 return p_account_id;
end;
$$;
revoke all on function public.update_account_with_balance_adjustment(uuid,uuid,text,text,text,uuid[],numeric,text) from public, anon;
grant execute on function public.update_account_with_balance_adjustment(uuid,uuid,text,text,text,uuid[],numeric,text) to authenticated;

create function public.update_balance_adjustment_transaction(p_ledger_id uuid,p_transaction_record_id uuid,p_transaction_at timestamptz,p_note text default null)
returns uuid language plpgsql security definer set search_path to 'pg_catalog', 'pg_temp' as $$
begin
 if auth.uid() is null then
  raise exception 'not_authenticated' using errcode='28000', detail='not_authenticated';
 end if;
 perform 1 from public.transaction_record where id=p_transaction_record_id and ledger_id=p_ledger_id and type='balance_adjustment' and status='active' for update;
 if not found then
  raise exception 'transaction_not_found' using errcode='22023', detail='transaction_not_found';
 end if;
 if not public.current_user_can_mutate_transaction(p_ledger_id,p_transaction_record_id) then
  raise exception 'ledger_forbidden' using errcode='42501', detail='ledger_forbidden';
 end if;
 if p_transaction_at is null or not isfinite(p_transaction_at) then
  raise exception 'transaction_at_invalid' using errcode='22023', detail='transaction_at_invalid';
 end if;
 if length(p_note)>2000 then
  raise exception 'note_too_long' using errcode='22023', detail='note_too_long';
 end if;
 update public.transaction_record set transaction_at=p_transaction_at,note=nullif(btrim(p_note),''),updated_by=auth.uid()
 where id=p_transaction_record_id and ledger_id=p_ledger_id;
 return p_transaction_record_id;
end;
$$;
revoke all on function public.update_balance_adjustment_transaction(uuid,uuid,timestamptz,text) from public,anon;
grant execute on function public.update_balance_adjustment_transaction(uuid,uuid,timestamptz,text) to authenticated;


CREATE OR REPLACE FUNCTION "public"."void_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_income_item_id uuid;
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    -- 与关联编辑入口一致，先锁当前交易及关联两端的交易记录，且固定按 id 排序。
    perform 1
    from public.transaction_record record_row
    where record_row.ledger_id = p_ledger_id
      and record_row.id in (
          select p_transaction_record_id
          union
          select target_item.transaction_record_id
          from public.transaction_item income_item
          join public.transaction_item_reimbursement_link reimbursement_link
            on reimbursement_link.ledger_id = income_item.ledger_id
           and reimbursement_link.reimbursement_income_item_id = income_item.id
          join public.transaction_item target_item
            on target_item.ledger_id = reimbursement_link.ledger_id
           and target_item.id = reimbursement_link.target_expense_item_id
          where income_item.ledger_id = p_ledger_id
            and income_item.transaction_record_id = p_transaction_record_id
          union
          select refunded_item.transaction_record_id
          from public.transaction_item income_item
          join public.transaction_item_refund_link refund_link
            on refund_link.ledger_id = income_item.ledger_id
           and refund_link.refund_income_item_id = income_item.id
          join public.transaction_item refunded_item
            on refunded_item.ledger_id = refund_link.ledger_id
           and refunded_item.id = refund_link.refunded_item_id
          where income_item.ledger_id = p_ledger_id
            and income_item.transaction_record_id = p_transaction_record_id
          union
          select reimbursement_income.transaction_record_id
          from public.transaction_item target_item
          join public.transaction_item_reimbursement_link reimbursement_link
            on reimbursement_link.ledger_id = target_item.ledger_id
           and reimbursement_link.target_expense_item_id = target_item.id
          join public.transaction_item reimbursement_income
            on reimbursement_income.ledger_id = reimbursement_link.ledger_id
           and reimbursement_income.id =
               reimbursement_link.reimbursement_income_item_id
          where target_item.ledger_id = p_ledger_id
            and target_item.transaction_record_id = p_transaction_record_id
          union
          select refund_income.transaction_record_id
          from public.transaction_item target_item
          join public.transaction_item_refund_link refund_link
            on refund_link.ledger_id = target_item.ledger_id
           and refund_link.refunded_item_id = target_item.id
          join public.transaction_item refund_income
            on refund_income.ledger_id = refund_link.ledger_id
           and refund_income.id = refund_link.refund_income_item_id
          where target_item.ledger_id = p_ledger_id
            and target_item.transaction_record_id = p_transaction_record_id
      )
    order by record_row.id
    for update;

    if not exists (
        select 1
        from public.transaction_record record_row
        where record_row.id = p_transaction_record_id
          and record_row.ledger_id = p_ledger_id
          and record_row.status = 'active'
          and record_row.type in ('normal', 'transfer', 'balance_adjustment')
    ) then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    -- 母项删除仍保持原有拒绝口径，不能先清掉指向它的子项关联。
    if exists (
        select 1
        from public.transaction_item target_item
        where target_item.ledger_id = p_ledger_id
          and target_item.transaction_record_id = p_transaction_record_id
          and (
              exists (
                  select 1
                  from public.transaction_item_reimbursement_link reimbursement_link
                  where reimbursement_link.ledger_id = target_item.ledger_id
                    and reimbursement_link.target_expense_item_id = target_item.id
              )
              or exists (
                  select 1
                  from public.transaction_item_refund_link refund_link
                  where refund_link.ledger_id = target_item.ledger_id
                    and refund_link.refunded_item_id = target_item.id
              )
          )
    ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    for v_income_item_id in
        select income_item_id
        from (
            select reimbursement_link.reimbursement_income_item_id as income_item_id
            from public.transaction_item income_item
            join public.transaction_item_reimbursement_link reimbursement_link
              on reimbursement_link.ledger_id = income_item.ledger_id
             and reimbursement_link.reimbursement_income_item_id = income_item.id
            where income_item.ledger_id = p_ledger_id
              and income_item.transaction_record_id = p_transaction_record_id
            union
            select refund_link.refund_income_item_id
            from public.transaction_item income_item
            join public.transaction_item_refund_link refund_link
              on refund_link.ledger_id = income_item.ledger_id
             and refund_link.refund_income_item_id = income_item.id
            where income_item.ledger_id = p_ledger_id
              and income_item.transaction_record_id = p_transaction_record_id
        ) linked_income_items
        order by income_item_id
    loop
        perform public.clear_transaction_item_income_links(
            p_ledger_id,
            v_income_item_id,
            v_user_id
        );
    end loop;

    return public.void_transaction_locked_impl(
        p_ledger_id,
        p_transaction_record_id
    );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."void_transaction_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_item public.transaction_item;
    v_item_count integer := 0;
    v_category_null_item_count integer := 0;
    v_positive_item_count integer := 0;
    v_negative_item_count integer := 0;
    v_positive_amount_count integer := 0;
    v_amount_delta_match_count integer := 0;
    v_distinct_amount_count integer := 0;
    v_balance_delta_total numeric(14,2) := 0;
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
          select distinct ti.account_id
          from public.transaction_item ti
          where ti.transaction_record_id = p_transaction_record_id
            and ti.ledger_id = p_ledger_id
      )
    order by a.id
    for update;

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

        select
            count(*)::integer,
            count(*) filter (where ti.category_id is null)::integer,
            count(*) filter (where ti.balance_delta > 0)::integer,
            count(*) filter (where ti.balance_delta < 0)::integer,
            count(*) filter (where ti.amount > 0)::integer,
            count(*) filter (where ti.amount = abs(ti.balance_delta))::integer,
            count(distinct ti.amount)::integer,
            coalesce(sum(ti.balance_delta), 0)
        into
            v_item_count,
            v_category_null_item_count,
            v_positive_item_count,
            v_negative_item_count,
            v_positive_amount_count,
            v_amount_delta_match_count,
            v_distinct_amount_count,
            v_balance_delta_total
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id;

        if v_item_count <> 2
            or v_category_null_item_count <> 2
            or v_positive_item_count <> 1
            or v_negative_item_count <> 1
            or v_positive_amount_count <> 2
            or v_amount_delta_match_count <> 2
            or v_distinct_amount_count <> 1
            or v_balance_delta_total <> 0 then
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

        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_item.account_id,
            -v_item.balance_delta,
            v_user_id
        );
    end loop;

    if v_item_count = 0 then
        raise exception 'transaction_item_invalid' using errcode = '22023';
    end if;

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
$$;

CREATE OR REPLACE FUNCTION "public"."load_transaction_group_summaries"("p_ledger_id" "uuid", "p_group_by" "text", "p_date_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_date_end" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_record_type" "text" DEFAULT 'all'::"text", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_account_id" "uuid" DEFAULT NULL::"uuid", "p_parent_category_id" "uuid" DEFAULT NULL::"uuid", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_member_id" "uuid" DEFAULT NULL::"uuid", "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 20) RETURNS TABLE("group_id" "text", "group_key" "text", "group_label" "text", "income" numeric, "expense" numeric, "balance" numeric, "transaction_count" integer, "latest_transaction_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
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
          and tr.type in ('normal', 'transfer', 'balance_adjustment')
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
                when fr.type in ('transfer', 'balance_adjustment') then 0
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
                when fr.type in ('transfer', 'balance_adjustment') then 0
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

CREATE OR REPLACE FUNCTION "public"."load_transaction_group_summaries_with_special_status"("p_ledger_id" "uuid", "p_group_by" "text", "p_date_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_date_end" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_record_type" "text" DEFAULT 'all'::"text", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_account_id" "uuid" DEFAULT NULL::"uuid", "p_parent_category_id" "uuid" DEFAULT NULL::"uuid", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_member_id" "uuid" DEFAULT NULL::"uuid", "p_special_statuses" "text"[] DEFAULT NULL::"text"[], "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 20) RETURNS TABLE("group_id" "text", "group_key" "text", "group_label" "text", "income" numeric, "expense" numeric, "balance" numeric, "transaction_count" integer, "latest_transaction_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
with base_items as (
    select
        tr.id as record_id,
        tr.type as record_type,
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

CREATE OR REPLACE FUNCTION "public"."validate_transaction_item_category_shape"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_record_type text;
begin
    select tr.type
    into v_record_type
    from public.transaction_record tr
    where tr.id = new.transaction_record_id
      and tr.ledger_id = new.ledger_id;

    if v_record_type is null then
        raise exception 'transaction_record_invalid' using errcode = '23503';
    end if;

    if v_record_type in ('transfer', 'balance_adjustment') and new.category_id is not null then
        raise exception 'transaction_item_category_invalid' using errcode = '23514';
    end if;

    if v_record_type = 'normal' and new.category_id is null then
        raise exception 'transaction_item_category_required' using errcode = '23514';
    end if;

    return new;
end;
$$;

-- 余额调整明细创建后不可改写；客户端不得直接创建或删除，防止绕过余额原子操作。
create function public.guard_balance_adjustment_item() returns trigger language plpgsql
set search_path to 'pg_catalog', 'pg_temp' as $$
declare v_type text;
begin
 select type into v_type from public.transaction_record where id=coalesce(new.transaction_record_id,old.transaction_record_id);
 if v_type='balance_adjustment' then
  if tg_op <> 'INSERT' or current_user <> 'postgres' then
   raise exception 'transaction_type_invalid' using errcode='22023',detail='transaction_type_invalid';
  end if;
  if new.category_id is not null or new.special_status is not null or new.balance_delta=0 or new.amount<>abs(new.balance_delta)
     or exists(select 1 from public.transaction_item where transaction_record_id=new.transaction_record_id) then
   raise exception 'items_invalid' using errcode='22023',detail='items_invalid';
  end if;
 end if;
 return coalesce(new,old);
end;
$$;
revoke all on function public.guard_balance_adjustment_item() from public;
create trigger transaction_item_guard_balance_adjustment before insert or update or delete on public.transaction_item for each row execute function public.guard_balance_adjustment_item();

create function public.guard_balance_adjustment_record() returns trigger language plpgsql
set search_path to 'pg_catalog', 'pg_temp' as $$
begin
 if tg_op='INSERT' and new.type='balance_adjustment' and current_user<>'postgres' then
  raise exception 'permission_denied' using errcode='42501',detail='permission_denied';
 end if;
 if tg_op='UPDATE' and (old.type='balance_adjustment' or new.type='balance_adjustment') then
  if new.type is distinct from old.type or new.created_by is distinct from old.created_by or new.ledger_id is distinct from old.ledger_id or new.id is distinct from old.id
     or (new.status is distinct from old.status and current_user<>'postgres') then
   raise exception 'transaction_type_invalid' using errcode='22023',detail='transaction_type_invalid';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function public.guard_balance_adjustment_record() from public;
create trigger transaction_record_guard_balance_adjustment before insert or update on public.transaction_record for each row execute function public.guard_balance_adjustment_record();

