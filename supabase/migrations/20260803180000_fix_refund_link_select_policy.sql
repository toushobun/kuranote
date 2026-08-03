drop policy if exists transaction_item_refund_link_select_active_member
on public.transaction_item_refund_link;

create policy transaction_item_refund_link_select_active_member
on public.transaction_item_refund_link
for select
to authenticated
using (
    public.current_user_is_active_ledger_member(
        transaction_item_refund_link.ledger_id
    )
);
