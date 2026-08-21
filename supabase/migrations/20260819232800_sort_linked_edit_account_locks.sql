-- Issue #574 PR1 再次自查：关联明细换账户时，旧账户 -> 新账户的余额更新顺序
-- 可能与 update_transfer_transaction 既有的“按 account id 升序锁定全部账户”顺序相反。
-- ledger 锁只串行化关联路径，普通 transfer 不拿 ledger 锁，因此两个不同交易并发时仍可能
-- 形成 account A -> B / B -> A 的循环等待。
--
-- 公开关联编辑入口已经先锁 ledger 和所有相关 transaction_record。这里继续在进入内部
-- item 更新前，把当前账户和目标账户按 UUID 升序预锁。内部余额函数随后只会重复取得已经
-- 持有的账户锁，从而与 transfer 的多账户锁顺序一致，并保持同一 transaction_record 上
-- void / convert 先在 record 层串行化。

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
declare
    v_old_account_id uuid;
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

    -- 正式路径都先锁对应 transaction_record，因此读取当前 account 后不会再被另一个
    -- 正式交易写入口改掉。找不到明细时仍交给内部实现返回既有 transaction_not_found。
    select item.account_id
    into v_old_account_id
    from public.transaction_item item
    where item.ledger_id = p_ledger_id
      and item.transaction_record_id = p_transaction_record_id
      and item.id = p_transaction_item_id;

    perform 1
    from public.account account_row
    where account_row.ledger_id = p_ledger_id
      and account_row.id = any(array[v_old_account_id, p_account_id]::uuid[])
    order by account_row.id
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
