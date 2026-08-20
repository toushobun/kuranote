-- Issue #574 PR1 自查：关联编辑还需要与既有 void_transaction 的 record -> account -> item
-- 加锁顺序协调。虽然关联交易最终会被 transaction_record_prevent_linked_void 拒绝作废，
-- 但该触发器在 void_transaction 已取得 account / item 锁后才执行；若关联编辑已经持有
-- item 并等待同一 account，仍可能先形成循环等待并触发 deadlock。
--
-- 公开关联编辑入口因此固定为 ledger -> 涉及的 transaction_record（按 id）-> 内部
-- item/account 原子实现。void 若先拿 record，关联编辑会在碰 item 前等待；关联编辑先拿
-- record，void 会在碰 account 前等待。只收紧关联编辑路径，不扩大普通 void 的锁范围。

create or replace function public.update_linked_transaction_item(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_item_id uuid,
    p_expected_updated_at timestamptz,
    p_amount numeric,
    p_account_id uuid,
    p_category_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_mutate_transaction(
        p_ledger_id,
        p_transaction_record_id
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    -- 正式关联写路径统一从 ledger 开始；随后先锁涉及的 transaction_record，
    -- 让 void_transaction 在取得 account/item 锁之前与关联编辑串行化。
    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    perform 1
    from public.transaction_record record_row
    where record_row.ledger_id = p_ledger_id
      and record_row.id in (
          select p_transaction_record_id
          union
          select target_item.transaction_record_id
          from public.transaction_item_reimbursement_link reimbursement_link
          join public.transaction_item target_item
            on target_item.id = reimbursement_link.target_expense_item_id
           and target_item.ledger_id = reimbursement_link.ledger_id
          where reimbursement_link.ledger_id = p_ledger_id
            and reimbursement_link.reimbursement_income_item_id =
                p_transaction_item_id
          union
          select reimbursement_income.transaction_record_id
          from public.transaction_item_reimbursement_link reimbursement_link
          join public.transaction_item reimbursement_income
            on reimbursement_income.id =
               reimbursement_link.reimbursement_income_item_id
           and reimbursement_income.ledger_id = reimbursement_link.ledger_id
          where reimbursement_link.ledger_id = p_ledger_id
            and reimbursement_link.target_expense_item_id =
                p_transaction_item_id
          union
          select refunded_item.transaction_record_id
          from public.transaction_item_refund_link refund_link
          join public.transaction_item refunded_item
            on refunded_item.id = refund_link.refunded_item_id
           and refunded_item.ledger_id = refund_link.ledger_id
          where refund_link.ledger_id = p_ledger_id
            and refund_link.refund_income_item_id = p_transaction_item_id
          union
          select refund_income.transaction_record_id
          from public.transaction_item_refund_link refund_link
          join public.transaction_item refund_income
            on refund_income.id = refund_link.refund_income_item_id
           and refund_income.ledger_id = refund_link.ledger_id
          where refund_link.ledger_id = p_ledger_id
            and refund_link.refunded_item_id = p_transaction_item_id
      )
    order by record_row.id
    for update;

    perform public.update_linked_transaction_item_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_transaction_item_id,
        p_expected_updated_at,
        p_amount,
        p_account_id,
        p_category_id
    );
end;
$$;

revoke all on function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) from public, anon;
grant execute on function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) to authenticated;
