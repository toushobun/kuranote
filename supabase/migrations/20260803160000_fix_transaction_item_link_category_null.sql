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
    v_income_category_type text;
    v_income_currency text;
    v_refunded_item_id uuid;
    v_refunded_amount numeric(14,2);
    v_refunded_category_type text;
    v_refunded_currency text;
    v_reimbursement_ids uuid[];
    v_requested_count integer;
    v_updated_count integer;
begin
    select ti.amount, c.type, a.currency
    into v_income_amount, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

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

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_requested_count > 0 and v_refunded_item_id is not null then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_requested_count > 0 then
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

        get diagnostics v_updated_count = row_count;
        if v_updated_count <> v_requested_count then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;
    end if;

    if v_refunded_item_id is not null then
        perform 1
        from public.transaction_item ti
        where ti.id = v_refunded_item_id
          and ti.ledger_id = p_ledger_id
        for update;

        if not found then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        select ti.amount, c.type, a.currency
        into v_refunded_amount, v_refunded_category_type, v_refunded_currency
        from public.transaction_item ti
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        where ti.id = v_refunded_item_id
          and ti.ledger_id = p_ledger_id;

        if v_refunded_category_type is distinct from 'expense' then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if v_income_currency is distinct from v_refunded_currency then
            raise exception 'refund_currency_mismatch'
                using errcode = '22023', detail = 'refund_currency_mismatch';
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
