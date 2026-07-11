-- Issue #387：修正 transaction_record 更新策略的逻辑分组。
-- 明确要求所有角色都先通过可修改记账校验，再判断记录者一致或具备账本管理权限。

drop policy if exists transaction_record_update_authorized on public.transaction_record;
create policy transaction_record_update_authorized
on public.transaction_record
for update
to authenticated
using (
    public.current_user_can_mutate_transaction(
        transaction_record.ledger_id,
        transaction_record.id
    )
)
with check (
    public.current_user_can_mutate_transaction(
        transaction_record.ledger_id,
        transaction_record.id
    )
    and (
        transaction_record.created_by is not distinct from auth.uid()
        or public.current_user_can_manage_ledger(transaction_record.ledger_id)
    )
);
