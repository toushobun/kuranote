-- 修复代码评审发现的两个问题：
-- 1. 同一笔支出明细可以同时被标记待报销又建立退款关联，导致统计口径重复冲销。
--    通过互斥校验禁止两者共存：已有生效退款关联的支出不能再被报销关联或标记待报销，
--    已标记待报销/已报销的支出不能再建立退款关联。
-- 2. 账本特殊状态开关的关闭校验与状态/关联写入之间没有共同的行锁，
--    并发场景下可能读到对方事务提交前的旧值。通过对 ledger 行加 FOR UPDATE
--    锁，使写入路径与关闭开关的触发器（其 BEFORE UPDATE 隐式锁定同一行）互相等待。

create or replace function public.validate_transaction_item_special_status()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_category_type text;
    v_settling_item_is_income boolean;
    v_special_status_enabled boolean;
    v_has_active_refund_link boolean;
begin
    if new.special_status is not null then
        select l.transaction_item_special_status_enabled
        into v_special_status_enabled
        from public.ledger l
        where l.id = new.ledger_id
        for update;

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

        select exists (
            select 1
            from public.transaction_item_refund_link link
            join public.transaction_item refund_income
              on refund_income.id = link.refund_income_item_id
             and refund_income.ledger_id = link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where link.ledger_id = new.ledger_id
              and link.refunded_item_id = new.id
              and refund_record.status = 'active'
        ) into v_has_active_refund_link;

        if v_has_active_refund_link then
            raise exception 'special_status_refund_conflict'
                using errcode = '22023', detail = 'special_status_refund_conflict';
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
    v_refunded_special_status text;
    v_reimbursement_ids uuid[];
    v_reimbursement_amount numeric(14,2);
    v_reimbursement_currency text;
    v_reimbursement_currency_count integer;
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
    where l.id = p_ledger_id
    for update;

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
            select ti.id, ti.amount, a.currency
            from public.transaction_item ti
            join public.transaction_record tr
              on tr.id = ti.transaction_record_id
             and tr.ledger_id = ti.ledger_id
             and tr.status = 'active'
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_reimbursement_ids)
              and ti.special_status = 'pending_reimbursement'
              and ti.settled_by_item_id is null
              and not exists (
                  select 1
                  from public.transaction_item_refund_link link
                  join public.transaction_item refund_income
                    on refund_income.id = link.refund_income_item_id
                   and refund_income.ledger_id = link.ledger_id
                  join public.transaction_record refund_record
                    on refund_record.id = refund_income.transaction_record_id
                   and refund_record.ledger_id = refund_income.ledger_id
                  where link.ledger_id = p_ledger_id
                    and link.refunded_item_id = ti.id
                    and refund_record.status = 'active'
              )
            for update of ti, tr, a
        )
        select
            count(*)::integer,
            coalesce(sum(amount), 0),
            min(currency),
            count(distinct currency)::integer
        into
            v_updated_count,
            v_reimbursement_amount,
            v_reimbursement_currency,
            v_reimbursement_currency_count
        from locked_items;

        if v_updated_count <> v_requested_count then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if v_reimbursement_currency_count <> 1
           or v_income_currency is distinct from v_reimbursement_currency then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        if v_income_amount is distinct from v_reimbursement_amount then
            raise exception 'reimbursement_amount_mismatch'
                using errcode = '22023', detail = 'reimbursement_amount_mismatch';
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
        select ti.amount, ti.account_id, c.type, a.currency, ti.special_status
        into v_refunded_amount, v_refunded_account_id,
             v_refunded_category_type, v_refunded_currency, v_refunded_special_status
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

        if v_refunded_special_status is not null then
            raise exception 'refunded_item_special_status_conflict'
                using errcode = '22023', detail = 'refunded_item_special_status_conflict';
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
