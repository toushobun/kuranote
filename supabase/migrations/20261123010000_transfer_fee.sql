-- #1134：转账手续费按转出币种扣款；第三明细仅计入支出，不影响汇率差额。
begin;
alter table public.category drop constraint category_system_key_check;
alter table public.category add constraint category_system_key_check
  check (system_key in ('special_income','refund','reimbursement','transfer_fee'));

CREATE OR REPLACE FUNCTION "public"."guard_system_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
  v_parent_key text;
  v_normalized_name text;
  v_allow_system_write boolean :=
    current_user = 'postgres'
    and current_setting('app.allow_system_category_write', true) = 'true';
begin
  if tg_op = 'DELETE' then
    -- 删除整个账本由既有的受控 RPC 执行，不能被系统分类防线阻断。
    if public.ledger_deletion_allows_delete(old.ledger_id) then
      return old;
    end if;
    if old.system_key is not null then
      raise exception 'category_system_locked'
        using errcode = '22023', detail = 'category_system_locked';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.system_key is not null then
    -- 排序可以改变，但系统分类的身份、名称、图标及归档等业务字段不可改变。
    if (to_jsonb(new) - array['sort_order', 'updated_at', 'updated_by'])
       is distinct from
       (to_jsonb(old) - array['sort_order', 'updated_at', 'updated_by']) then
      raise exception 'category_system_locked'
        using errcode = '22023', detail = 'category_system_locked';
    end if;
    return new;
  end if;

  if new.system_key is not null and not v_allow_system_write then
    raise exception 'category_system_locked'
      using errcode = '22023', detail = 'category_system_locked';
  end if;

  if new.parent_id is not null then
    select c.system_key into v_parent_key
      from public.category c
     where c.id = new.parent_id
       and c.ledger_id = new.ledger_id;
    if v_parent_key = 'transfer_fee' then
      raise exception 'category_system_parent_locked' using errcode = '22023', detail = 'category_system_parent_locked';
    end if;
    if v_parent_key = 'special_income'
       and coalesce(new.system_key, '') not in ('refund', 'reimbursement') then
      raise exception 'category_system_parent_locked'
        using errcode = '22023', detail = 'category_system_parent_locked';
    end if;
  end if;

  if new.system_key is not null then
    if (new.system_key = 'transfer_fee' and (new.type <> 'expense' or new.parent_id is not null))
       or (new.system_key <> 'transfer_fee' and new.type <> 'income')
       or (new.system_key = 'special_income' and new.parent_id is not null)
       or (new.system_key in ('refund', 'reimbursement')
           and (new.parent_id is null or v_parent_key is distinct from 'special_income')) then
      raise exception 'category_system_invalid'
        using errcode = '22023', detail = 'category_system_invalid';
    end if;
  else
    -- 分类库在存储名称前加 emoji 前缀，保留名称按用户实际看到的名称判断。
    v_normalized_name := btrim(
      regexp_replace(btrim(new.name), '^[^[:space:]]+[[:space:]]+', '')
    );
    if v_normalized_name in ('特殊收入', '退款', '报销')
       and (tg_op = 'INSERT' or v_normalized_name is distinct from btrim(
         regexp_replace(btrim(old.name), '^[^[:space:]]+[[:space:]]+', '')
       )) then
      raise exception 'category_name_reserved'
        using errcode = '22023', detail = 'category_name_reserved';
    end if;
  end if;

  return new;
end;
$$;
CREATE OR REPLACE FUNCTION "public"."initialize_ledger_system_categories"("p_ledger_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
  v_root_id uuid;
begin
  perform set_config('app.allow_system_category_write', 'true', true);

  insert into public.category (
    ledger_id, parent_id, type, name, icon_name, color,
    system_key, sort_order, created_by, updated_by
  )
  values (
    p_ledger_id, null, 'income', '💸 特殊收入', '💸', '#DBEAFE',
    'special_income', 30, p_user_id, p_user_id
  )
  on conflict (ledger_id, system_key) where system_key is not null do nothing;

  select id into strict v_root_id
    from public.category
   where ledger_id = p_ledger_id and system_key = 'special_income';

  insert into public.category (
    ledger_id, parent_id, type, name, icon_name, color,
    system_key, sort_order, created_by, updated_by
  )
  values
    (p_ledger_id, v_root_id, 'income', '💴 退款', '💴', '#DBEAFE',
     'refund', 10, p_user_id, p_user_id),
    (p_ledger_id, v_root_id, 'income', '📄 报销', '📄', '#DBEAFE',
     'reimbursement', 20, p_user_id, p_user_id)
  on conflict (ledger_id, system_key) where system_key is not null do nothing;

  insert into public.category (ledger_id,parent_id,type,name,icon_name,color,system_key,sort_order,created_by,updated_by)
  values (p_ledger_id,null,'expense','🏧 手续费','🏧','#FDE68A','transfer_fee',99999,p_user_id,p_user_id)
  on conflict (ledger_id,system_key) where system_key is not null do nothing;

  perform set_config('app.allow_system_category_write', 'false', true);
end;
$$;
create function public.get_or_create_transfer_fee_category(p_ledger_id uuid,p_user_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare v_id uuid;
begin
  perform set_config('app.allow_system_category_write','true',true);
  insert into public.category(ledger_id,parent_id,type,name,icon_name,color,system_key,sort_order,created_by,updated_by)
  values(p_ledger_id,null,'expense','🏧 手续费','🏧','#FDE68A','transfer_fee',99999,p_user_id,p_user_id)
  on conflict (ledger_id,system_key) where system_key is not null do nothing;
  select c.id into strict v_id from public.category c where c.ledger_id=p_ledger_id and c.system_key='transfer_fee';
  perform set_config('app.allow_system_category_write','false',true);
  return v_id;
end;
$$;
revoke all on function public.get_or_create_transfer_fee_category(uuid,uuid) from public,anon,authenticated,service_role;
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

    if (v_record_type = 'balance_adjustment' and new.category_id is not null)
      or (v_record_type = 'transfer' and new.category_id is not null and not exists (
        select 1 from public.category c where c.id=new.category_id and c.ledger_id=new.ledger_id
          and c.system_key='transfer_fee' and c.type='expense' and c.parent_id is null
      )) then
        raise exception 'transaction_item_category_invalid' using errcode = '23514';
    end if;

    if v_record_type = 'normal' and new.category_id is null then
        raise exception 'transaction_item_category_required' using errcode = '23514';
    end if;

    -- 普通记录的余额来自付款明细，明细不再保存 balance_delta。
    if (v_record_type = 'normal') = (new.balance_delta is not null) then
        raise exception 'transaction_item_balance_delta_invalid' using errcode = '23514';
    end if;

    -- 普通记录的账户来自付款明细，明细不再保存 account_id；转账 / 余额调整的账户仍在明细上。
    if (v_record_type = 'normal') = (new.account_id is not null) then
        raise exception 'transaction_item_account_invalid' using errcode = '23514';
    end if;

    return new;
end;
$$;
create or replace function public.transfer_items_consistent(p_ledger_id uuid,p_transaction_record_id uuid)
returns boolean language sql stable set search_path = pg_catalog, pg_temp as $$
with rows as (
 select ti.account_id,ti.category_id,ti.amount,ti.balance_delta,a.currency,c.system_key
 from public.transaction_item ti
 join public.account a on a.id=ti.account_id and a.ledger_id=ti.ledger_id
 left join public.category c on c.id=ti.category_id and c.ledger_id=ti.ledger_id
 where ti.ledger_id=p_ledger_id and ti.transaction_record_id=p_transaction_record_id
), base as (select * from rows where category_id is null),
 source as (select account_id from base where balance_delta<0)
select (select count(*) from rows) between 2 and 3
 and (select count(*) from base)=2
 and (select count(*) from base where balance_delta<0)=1
 and (select count(*) from base where balance_delta>0)=1
 and (select count(*) from base where public.is_valid_transfer_amount(amount) and amount=abs(balance_delta))=2
 and (select count(distinct account_id) from base)=2
 and ((select count(distinct currency) from base)=2 or (select count(distinct amount) from base)=1)
 and (select count(*) from rows where category_id is not null)<=1
 and not exists (select 1 from rows r where r.category_id is not null and (
  r.system_key is distinct from 'transfer_fee'
  or r.account_id is distinct from (select account_id from source)
  or not public.is_valid_transfer_amount(r.amount)
  or r.balance_delta is distinct from -r.amount
 ));
$$;
revoke all on function public.transfer_items_consistent(uuid,uuid) from public,anon,authenticated,service_role;

drop function public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text,numeric);
drop function public.update_transfer_transaction(uuid,uuid,timestamptz,numeric,uuid,uuid,text,numeric);
create or replace function public.create_transfer_transaction(
    p_ledger_id uuid,
    p_transaction_at timestamptz,
    p_amount numeric,
    p_from_account_id uuid,
    p_to_account_id uuid,
    p_note text default null,
    p_to_amount numeric default null,
    p_fee_amount numeric default null
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
    if not public.is_valid_transfer_amount(p_amount)
        or not public.is_valid_transfer_amount(v_effective_to_amount)
        or (v_from_account.currency = v_to_account.currency
            and p_amount <> v_effective_to_amount) then
        raise exception 'amount_invalid' using errcode = '22023', detail = 'amount_invalid';
    end if;

    if p_fee_amount is not null and not public.is_valid_transfer_amount(p_fee_amount) then
        raise exception 'transfer_fee_amount_invalid' using errcode='22023', detail='transfer_fee_amount_invalid';
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

    if p_fee_amount is not null then
        insert into public.transaction_item
          (ledger_id,transaction_record_id,account_id,category_id,amount,discount_amount,balance_delta,note,sort_order,created_by,updated_by)
        values (p_ledger_id,v_transaction_record_id,p_from_account_id,
          public.get_or_create_transfer_fee_category(p_ledger_id,v_user_id),
          p_fee_amount,0,-p_fee_amount,null,2,v_user_id,v_user_id);
    end if;

    perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -(p_amount + coalesce(p_fee_amount,0)), v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, v_effective_to_amount, v_user_id);

    return v_transaction_record_id;
end;
$$;
revoke all on function public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text,numeric,numeric) from public,anon,authenticated,service_role;
grant execute on function public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text,numeric,numeric) to authenticated;
create or replace function public.update_transfer_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_at timestamptz,
    p_amount numeric,
    p_from_account_id uuid,
    p_to_account_id uuid,
    p_note text default null,
    p_to_amount numeric default null,
    p_fee_amount numeric default null
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
    v_old_fee_amount numeric(14,2);
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
      and ti.category_id is null
      and ti.balance_delta < 0;

    select coalesce(sum(ti.amount),0) into v_old_fee_amount
    from public.transaction_item ti where ti.transaction_record_id=p_transaction_record_id
      and ti.ledger_id=p_ledger_id and ti.category_id is not null;

    select account_id, amount
    into v_old_to_account_id, v_old_to_amount
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and ti.category_id is null
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
    if not public.is_valid_transfer_amount(p_amount)
        or not public.is_valid_transfer_amount(v_effective_to_amount)
        or (v_from_account.currency = v_to_account.currency
            and p_amount <> v_effective_to_amount) then
        raise exception 'amount_invalid' using errcode = '22023', detail = 'amount_invalid';
    end if;

    if p_fee_amount is not null and not public.is_valid_transfer_amount(p_fee_amount) then
        raise exception 'transfer_fee_amount_invalid' using errcode='22023', detail='transfer_fee_amount_invalid';
    end if;

    perform public.apply_account_balance_delta(p_ledger_id, v_old_from_account_id, v_old_amount + v_old_fee_amount, v_user_id);
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

    if p_fee_amount is not null then
        insert into public.transaction_item
          (ledger_id,transaction_record_id,account_id,category_id,amount,discount_amount,balance_delta,note,sort_order,created_by,updated_by)
        values (p_ledger_id,p_transaction_record_id,p_from_account_id,
          public.get_or_create_transfer_fee_category(p_ledger_id,v_user_id),
          p_fee_amount,0,-p_fee_amount,null,2,v_user_id,v_user_id);
    end if;

    perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -(p_amount + coalesce(p_fee_amount,0)), v_user_id);
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
revoke all on function public.update_transfer_transaction(uuid,uuid,timestamptz,numeric,uuid,uuid,text,numeric,numeric) from public,anon,authenticated,service_role;
grant execute on function public.update_transfer_transaction(uuid,uuid,timestamptz,numeric,uuid,uuid,text,numeric,numeric) to authenticated;

create or replace view public.transaction_record_ledger_rate with (security_invoker = true) as
select tr.ledger_id, tr.id as record_id,
       case when tr.type in ('normal','transfer')
            then rc.currency
            else null end as currency,
       case when tr.type in ('normal','transfer')
            then public.exchange_rate_on(
                rc.currency,
                l.base_currency,
                public.transaction_record_local_date(tr.transaction_at)
            )
            else 1::numeric end as ledger_rate
from public.transaction_record tr
join public.ledger l on l.id = tr.ledger_id
left join lateral (
    -- 与内部 transaction_record_currency 的普通记录分支同语义，
    -- 但通过 security_invoker 视图与各表 RLS 读取，不放开内部函数 EXECUTE。
    select a.currency
    from public.transaction_account_movement m
    join public.account a
      on a.id = m.account_id
     and a.ledger_id = m.ledger_id
    where m.ledger_id = tr.ledger_id
      and m.transaction_record_id = tr.id
      and tr.type in ('normal','transfer')
    order by m.sort_order, m.account_id
    limit 1
) rc on true;
revoke all on public.transaction_record_ledger_rate from public, anon, authenticated, service_role;
grant select on public.transaction_record_ledger_rate to authenticated, service_role;

create view public.account_ledger_rate with (security_invoker = true) as
select a.ledger_id, a.id as account_id, a.currency,
       public.exchange_rate_on(a.currency, l.base_currency,
           (now() at time zone 'UTC')::date) as ledger_rate
from public.account a
join public.ledger l on l.id = a.ledger_id;
revoke all on public.account_ledger_rate from public, anon, authenticated, service_role;
grant select on public.account_ledger_rate to authenticated, service_role;

drop function public.load_transaction_group_summaries_with_special_status(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid,
    uuid, text[], integer, integer, text
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
    shared_payment_record_total_amount numeric,
    group_currency text,
    missing_rate_count integer,
    has_foreign_currency boolean
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
      -- 分类分组只纳入普通记录：转账、余额调整没有分类，不进入「未知」组。
      and (p_group_by not in ('parentCategory', 'category') or mi.record_type = 'normal')
      and not exists (
          select 1
          from share_records sr
          where sr.record_id = mi.record_id
      )
),
group_rows_per_record as (
    -- 只在每笔、每组内分别累计收入与支出：逐明细及持有人混合收支不可净额化。
    select gr.key, gr.record_id, max(gr.transaction_at) as latest_at,
           count(distinct gr.item_id) as item_count,
           sum(case when gr.signed_amount > 0 then gr.signed_amount else 0 end) as raw_income,
           sum(case when gr.signed_amount < 0 then -gr.signed_amount else 0 end) as raw_expense
    from group_rows gr
    group by gr.key, gr.record_id
),
group_rows_converted as (
    select gr.*,
        case when p_group_by = 'account' then gr.raw_income
             else public.convert_ledger_amount(gr.raw_income, rr.ledger_rate) end as converted_income,
        case when p_group_by = 'account' then gr.raw_expense
             else public.convert_ledger_amount(gr.raw_expense, rr.ledger_rate) end as converted_expense,
        case when p_group_by <> 'account' and rr.ledger_rate is null
             then 1 else 0 end as missing_rate,
        (p_group_by <> 'account'
         and rr.currency is not null
         and rr.currency <> (select l.base_currency from public.ledger l where l.id = p_ledger_id)
        ) as has_foreign_currency
    from group_rows_per_record gr
    left join public.transaction_record_ledger_rate rr
      on rr.ledger_id = p_ledger_id and rr.record_id = gr.record_id
),
grouped as (
    select gr.key,
        (case when p_group_by = 'specialStatus'
              then sum(gr.item_count) else count(*) end)::bigint as count_value,
        sum(gr.converted_income) as income_value,
        sum(gr.converted_expense) as expense_value,
        sum(gr.converted_income - gr.converted_expense) as balance_value,
        sum(gr.missing_rate)::integer as missing_rate_count,
        coalesce(bool_or(gr.has_foreign_currency), false) as has_foreign_currency,
        max(gr.latest_at) as latest_at
    from group_rows_converted gr
    group by gr.key
),
shared_grouped as (
    -- 一笔记录在一个组内只计一次。
    select
        gr.key,
        count(*) as record_count,
        sum(case when p_group_by = 'account' then sr.record_total_amount
                 else public.convert_ledger_amount(sr.record_total_amount, rr.ledger_rate)
            end) as record_total_amount
    from (
        select distinct key, record_id
        from group_rows
    ) gr
    join shared_records sr on sr.record_id = gr.record_id
    left join public.transaction_record_ledger_rate rr on rr.ledger_id = p_ledger_id and rr.record_id = gr.record_id
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
    coalesce(sg.record_total_amount, 0),
    case when p_group_by = 'account'
         then (select a.currency from public.account a where a.id::text = labeled.key and a.ledger_id = p_ledger_id)
         else (select l.base_currency from public.ledger l where l.id = p_ledger_id)
    end,
    coalesce(labeled.missing_rate_count, 0),
    coalesce(labeled.has_foreign_currency, false)
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
    shared_payment_record_total_amount numeric,
    group_currency text,
    missing_rate_count integer
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
        ti.account_id,
        ti.sort_order,
        ti.category_id,
        c.system_key as category_system_key,
        ti.special_status,
        ti.amount,
        ti.business_net_amount,
        ti.refunded_amount,
        ti.reimbursement_amount,
        c.type as category_type,
        c.parent_id,
        case
            when tr.type = 'balance_adjustment' then 0::numeric
            when tr.type = 'transfer' and c.system_key = 'transfer_fee' then -ti.business_net_amount
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
      and (bi.record_type <> 'transfer' or bi.category_system_key is distinct from 'transfer_fee'
           or not ff.has_account_scope or bi.account_id in (select account_id from scope_accounts))
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
            when mr.record_type = 'transfer' and m.sort_order = 2 then m.balance_delta
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
      -- 分类分组只纳入普通记录：转账、余额调整没有分类，不进入「未知」组。
      and (p_group_by not in ('parentCategory', 'category') or mi.record_type = 'normal'
           or (mi.record_type = 'transfer' and mi.category_system_key = 'transfer_fee'))
      and not exists (
          select 1
          from share_records sr
          where sr.record_id = mi.record_id
      )
),
group_rows_per_record as (
    -- 只在每笔、每组内分别累计收入与支出：逐明细及持有人混合收支不可净额化。
    select gr.key, gr.record_id, max(gr.transaction_at) as latest_at,
           count(distinct gr.item_id) as item_count,
           sum(case when gr.signed_amount > 0 then gr.signed_amount else 0 end) as raw_income,
           sum(case when gr.signed_amount < 0 then -gr.signed_amount else 0 end) as raw_expense
    from group_rows gr
    group by gr.key, gr.record_id
),
group_rows_converted as (
    select gr.*,
        case when p_group_by = 'account' then gr.raw_income
             else public.convert_ledger_amount(gr.raw_income, rr.ledger_rate) end as converted_income,
        case when p_group_by = 'account' then gr.raw_expense
             else public.convert_ledger_amount(gr.raw_expense, rr.ledger_rate) end as converted_expense,
        case when p_group_by <> 'account' and rr.ledger_rate is null
             then 1 else 0 end as missing_rate
    from group_rows_per_record gr
    left join public.transaction_record_ledger_rate rr
      on rr.ledger_id = p_ledger_id and rr.record_id = gr.record_id
),
grouped as (
    select gr.key,
        (case when p_group_by = 'specialStatus'
              then sum(gr.item_count) else count(*) end)::bigint as count_value,
        sum(gr.converted_income) as income_value,
        sum(gr.converted_expense) as expense_value,
        sum(gr.converted_income - gr.converted_expense) as balance_value,
        sum(gr.missing_rate)::integer as missing_rate_count,
        max(gr.latest_at) as latest_at
    from group_rows_converted gr
    group by gr.key
),
shared_grouped as (
    -- 一笔记录在一个组内只计一次。
    select
        gr.key,
        count(*) as record_count,
        sum(case when p_group_by = 'account' then sr.record_total_amount
                 else public.convert_ledger_amount(sr.record_total_amount, rr.ledger_rate)
            end) as record_total_amount
    from (
        select distinct key, record_id
        from group_rows
    ) gr
    join shared_records sr on sr.record_id = gr.record_id
    left join public.transaction_record_ledger_rate rr on rr.ledger_id = p_ledger_id and rr.record_id = gr.record_id
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
    coalesce(sg.record_total_amount, 0),
    case when p_group_by = 'account'
         then (select a.currency from public.account a where a.id::text = labeled.key and a.ledger_id = p_ledger_id)
         else (select l.base_currency from public.ledger l where l.id = p_ledger_id)
    end,
    coalesce(labeled.missing_rate_count, 0)
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
commit;
