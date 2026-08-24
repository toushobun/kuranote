-- Issue #574 PR5：删除只含收入子项关联的交易时，在同一事务内先解除关联再沿用既有删除实现。
-- 公开入口继续遵循 PR1 的 ledger -> transaction_record -> item -> account 锁顺序；
-- 清关联和三态重算完全复用 clear_transaction_item_income_links 及既有触发器。
alter function public.void_transaction(uuid, uuid)
rename to void_transaction_locked_impl;

revoke all on function public.void_transaction_locked_impl(uuid, uuid)
from public, anon, authenticated;

create function public.void_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
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
          and record_row.type in ('normal', 'transfer')
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

revoke all on function public.void_transaction(uuid, uuid)
from public, anon;
grant execute on function public.void_transaction(uuid, uuid)
to authenticated;
