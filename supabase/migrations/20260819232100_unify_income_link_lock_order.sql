-- Issue #574 PR1：统一正式退款 / 报销写路径的锁顺序。
-- apply_transaction_item_links 已经以 ledger -> target 顺序加锁，本迁移把旧编辑、清关联和状态重算对齐到同一顺序。

-- 旧 update_transaction 会在调用 clear_transaction_item_income_links() 前先锁收入明细。
-- 用轻量包装器把 ledger 锁提升到整个正式更新 RPC 的最外层，避免 income -> ledger
-- 与新编辑路径 ledger -> income 形成新的循环等待。
alter function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) rename to update_transaction_locked_impl;

revoke all on function public.update_transaction_locked_impl(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon, authenticated;

create function public.update_transaction(
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
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    return public.update_transaction_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_type,
        p_transaction_at,
        p_items,
        p_account_id,
        p_merchant_id,
        p_note
    );
end;
$$;

revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon;
grant execute on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;

create or replace function public.recalculate_transaction_item_settlement_status(
    p_ledger_id uuid,
    p_target_expense_item_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_current_status public.transaction_item_special_status;
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
    v_previous_reimbursement_link_flow text :=
        current_setting('kuranote.reimbursement_link_flow', true);
    v_remaining_amount numeric;
    v_next_status public.transaction_item_special_status;
begin
    -- 所有关联写路径统一从账本锁开始，再进入目标明细锁。
    perform 1
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    select target_item.special_status
    into v_current_status
    from public.transaction_item target_item
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id
    for update;

    if not found then
        return;
    end if;

    -- 即使状态值没有变化，关联变化也会改变业务净额；更新时间戳使乐观锁可见。
    if v_current_status is null then
        update public.transaction_item target_item
        set updated_at = now()
        where target_item.ledger_id = p_ledger_id
          and target_item.id = p_target_expense_item_id;
        return;
    end if;

    v_remaining_amount := public.calculate_transaction_item_remaining_offset_amount(
        p_ledger_id,
        p_target_expense_item_id
    );
    v_next_status := case
        when v_remaining_amount > 0
        then 'pending_reimbursement'::public.transaction_item_special_status
        when v_remaining_amount = 0
        then 'reimbursed'::public.transaction_item_special_status
        else 'reimbursement_surplus'::public.transaction_item_special_status
    end;

    if v_next_status is not distinct from v_current_status then
        update public.transaction_item target_item
        set updated_at = now()
        where target_item.ledger_id = p_ledger_id
          and target_item.id = p_target_expense_item_id;
        return;
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);
    perform set_config('kuranote.reimbursement_link_flow', 'on', true);

    update public.transaction_item target_item
    set special_status = v_next_status,
        updated_at = now()
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id;

    perform set_config(
        'kuranote.reimbursement_link_flow',
        coalesce(v_previous_reimbursement_link_flow, 'off'),
        true
    );
    perform set_config(
        'kuranote.income_link_edit_flow',
        coalesce(v_previous_income_link_edit_flow, 'off'),
        true
    );
end;
$$;

revoke all on function public.recalculate_transaction_item_settlement_status(
    uuid, uuid
) from public, anon, authenticated;

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
    v_reimbursement_target_ids uuid[] := array[]::uuid[];
    v_target_ids uuid[] := array[]::uuid[];
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
begin
    perform 1
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    select coalesce(
        array_agg(link.target_expense_item_id order by link.target_expense_item_id),
        array[]::uuid[]
    )
    into v_reimbursement_target_ids
    from public.transaction_item_reimbursement_link link
    where link.ledger_id = p_ledger_id
      and link.reimbursement_income_item_id = p_income_item_id;

    select coalesce(array_agg(target_id order by target_id), array[]::uuid[])
    into v_target_ids
    from (
        select link.target_expense_item_id as target_id
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = p_ledger_id
          and link.reimbursement_income_item_id = p_income_item_id
        union
        select link.refunded_item_id
        from public.transaction_item_refund_link link
        where link.ledger_id = p_ledger_id
          and link.refund_income_item_id = p_income_item_id
    ) targets;

    perform 1
    from public.transaction_item item
    where item.ledger_id = p_ledger_id
      and item.id = any(array_append(v_target_ids, p_income_item_id))
    order by item.id
    for update;

    select c.type
    into v_income_category_type
    from public.transaction_item income_item
    join public.category c
      on c.id = income_item.category_id
     and c.ledger_id = income_item.ledger_id
    where income_item.id = p_income_item_id
      and income_item.ledger_id = p_ledger_id;

    if not found or v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);

    delete from public.transaction_item_reimbursement_link link
    where link.ledger_id = p_ledger_id
      and link.reimbursement_income_item_id = p_income_item_id;

    -- 保留旧实现的审计语义：清除报销关联后，目标支出的最后修改者仍记为本次操作者。
    update public.transaction_item target_item
    set updated_by = p_user_id,
        updated_at = now()
    where target_item.ledger_id = p_ledger_id
      and target_item.id = any(v_reimbursement_target_ids);

    delete from public.transaction_item_refund_link link
    where link.ledger_id = p_ledger_id
      and link.refund_income_item_id = p_income_item_id;

    perform set_config(
        'kuranote.income_link_edit_flow',
        coalesce(v_previous_income_link_edit_flow, 'off'),
        true
    );
end;
$$;

revoke all on function public.clear_transaction_item_income_links(uuid, uuid, uuid)
from public, anon, authenticated;
