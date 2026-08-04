-- 允许在收入交易编辑页维护报销、退款关联，同时继续冻结被关联的支出明细。

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
    v_is_controlled_unlink boolean;
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

    v_is_controlled_unlink :=
        tg_op = 'UPDATE'
        and old.special_status = 'reimbursed'
        and new.special_status = 'pending_reimbursement'
        and new.settled_by_item_id is null
        and current_user = 'postgres'
        and current_setting('kuranote.income_link_edit_flow', true)
            is not distinct from 'on';

    if tg_op = 'UPDATE'
       and old.special_status = 'reimbursed'
       and (
           new.special_status is distinct from old.special_status
           or new.settled_by_item_id is distinct from old.settled_by_item_id
       )
       and not v_is_controlled_unlink then
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

create or replace function public.clear_transaction_item_income_links(
    p_ledger_id uuid,
    p_income_item_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_income_category_type text;
begin
    select c.type
    into v_income_category_type
    from public.transaction_item income_item
    join public.category c
      on c.id = income_item.category_id
     and c.ledger_id = income_item.ledger_id
    where income_item.id = p_income_item_id
      and income_item.ledger_id = p_ledger_id
    for update of income_item;

    if not found or v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);

    update public.transaction_item settled_item
    set special_status = 'pending_reimbursement',
        settled_by_item_id = null,
        updated_by = p_user_id,
        updated_at = now()
    where settled_item.ledger_id = p_ledger_id
      and settled_item.settled_by_item_id = p_income_item_id
      and settled_item.special_status = 'reimbursed';

    delete from public.transaction_item_refund_link refund_link
    where refund_link.ledger_id = p_ledger_id
      and refund_link.refund_income_item_id = p_income_item_id;

    perform set_config('kuranote.income_link_edit_flow', 'off', true);
end;
$$;

revoke all on function public.clear_transaction_item_income_links(uuid, uuid, uuid)
from public, anon, authenticated;

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
    v_existing_item_ids uuid[] := array[]::uuid[];
    v_used_item_ids uuid[] := array[]::uuid[];
    v_transaction_item_ids uuid[] := array[]::uuid[];
    v_item_payloads jsonb[] := array[]::jsonb[];
    v_item jsonb;
    v_item_index integer;
    v_item_count integer;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_transaction_item_id uuid;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
    v_is_income_link_edit_request boolean;
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

    v_is_income_link_edit_request := not exists (
        select 1
        from jsonb_array_elements(p_items) item
        where not (
            item ? 'reimbursementItemIds'
            and item ? 'refundedItemId'
        )
    );

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

    -- 被报销、作为报销对象或作为退款对象的支出仍然不可编辑。
    -- 仅允许维护当前交易中收入明细发起的关联。
    if exists (
        select 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
          and (
              ti.special_status = 'reimbursed'
              or ti.settled_by_item_id is not null
              or exists (
                  select 1
                  from public.transaction_item_refund_link link
                  where link.ledger_id = ti.ledger_id
                    and link.refunded_item_id = ti.id
              )
              or (
                  not v_is_income_link_edit_request
                  and (
                      exists (
                          select 1
                          from public.transaction_item settled_item
                          where settled_item.ledger_id = ti.ledger_id
                            and settled_item.settled_by_item_id = ti.id
                      )
                      or exists (
                          select 1
                          from public.transaction_item_refund_link link
                          where link.ledger_id = ti.ledger_id
                            and link.refund_income_item_id = ti.id
                      )
                  )
              )
          )
    ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    for v_existing_item in
        select * from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        v_existing_item_ids := array_append(
            v_existing_item_ids,
            v_existing_item.id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_existing_item.account_id,
            -v_existing_item.balance_delta,
            v_user_id
        );

        if exists (
            select 1
            from public.transaction_item settled_item
            where settled_item.ledger_id = p_ledger_id
              and settled_item.settled_by_item_id = v_existing_item.id
        ) or exists (
            select 1
            from public.transaction_item_refund_link refund_link
            where refund_link.ledger_id = p_ledger_id
              and refund_link.refund_income_item_id = v_existing_item.id
        ) then
            perform public.clear_transaction_item_income_links(
                p_ledger_id,
                v_existing_item.id,
                v_user_id
            );
        end if;
    end loop;

    update public.transaction_record tr
    set type = 'normal',
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        begin
            v_item_amount := (v_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_item ->> 'categoryId')::uuid;
            v_item_special_status := nullif(
                v_item ->> 'specialStatus',
                ''
            )::public.transaction_item_special_status;
        exception when invalid_text_representation then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end;

        if v_item_amount is null or v_item_amount < 0
           or v_item_amount <> round(v_item_amount, 2) then
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

        if v_item_special_status = 'reimbursed'
           or (v_item_special_status = 'pending_reimbursement'
               and v_item_category_type <> 'expense') then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        if (
            coalesce(
                jsonb_array_length(
                    coalesce(v_item -> 'reimbursementItemIds', '[]'::jsonb)
                ),
                0
            ) > 0
            or nullif(v_item ->> 'refundedItemId', '') is not null
        ) and v_item_category_type <> 'income' then
            raise exception 'income_link_category_invalid'
                using errcode = '22023', detail = 'income_link_category_invalid';
        end if;

        v_balance_delta := case
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        v_transaction_item_id := v_existing_item_ids[v_sort_order + 1];

        if v_transaction_item_id is null then
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
                special_status,
                created_by,
                updated_by
            ) values (
                p_ledger_id,
                p_transaction_record_id,
                p_account_id,
                v_item_category_id,
                v_item_amount,
                0,
                v_balance_delta,
                null,
                v_sort_order,
                v_item_special_status,
                v_user_id,
                v_user_id
            ) returning id into v_transaction_item_id;
        else
            update public.transaction_item ti
            set account_id = p_account_id,
                category_id = v_item_category_id,
                amount = v_item_amount,
                discount_amount = 0,
                balance_delta = v_balance_delta,
                note = null,
                sort_order = v_sort_order,
                special_status = v_item_special_status,
                updated_by = v_user_id,
                updated_at = now()
            where ti.id = v_transaction_item_id
              and ti.ledger_id = p_ledger_id
              and ti.transaction_record_id = p_transaction_record_id;
        end if;

        v_used_item_ids := array_append(v_used_item_ids, v_transaction_item_id);
        v_transaction_item_ids := array_append(
            v_transaction_item_ids,
            v_transaction_item_id
        );
        v_item_payloads := array_append(v_item_payloads, v_item);

        perform public.apply_account_balance_delta(
            p_ledger_id,
            p_account_id,
            v_balance_delta,
            v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and not (ti.id = any(v_used_item_ids));

    v_item_count := coalesce(array_length(v_transaction_item_ids, 1), 0);
    if v_item_count > 0 then
        for v_item_index in 1..v_item_count
        loop
            perform public.apply_transaction_item_links(
                p_ledger_id,
                v_transaction_item_ids[v_item_index],
                v_item_payloads[v_item_index],
                v_user_id
            );
        end loop;
    end if;

    return p_transaction_record_id;
end;
$$;

revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon;
grant execute on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;
