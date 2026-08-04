from pathlib import Path

path = Path(
    "supabase/migrations/20260805010000_support_refund_multi_item_allocation.sql"
)
text = path.read_text(encoding="utf-8")

old_declaration = (
    "    v_refund_allocations jsonb := "
    "coalesce(p_item -> 'refundAllocations', '[]'::jsonb);"
)
new_declaration = "    v_refund_allocations jsonb;"
if text.count(old_declaration) != 1:
    raise RuntimeError("refund allocation declaration pattern not found")
text = text.replace(old_declaration, new_declaration, 1)

old_begin = """begin
    v_reimbursement_ids := array(
"""
new_begin = """begin
    v_refund_allocations := p_item -> 'refundAllocations';

    -- 数据库迁移与前端发布并非原子操作。旧页面仍可能提交单个
    -- refundedItemId，因此在数据库边界将其规范化为全额单目标分摊。
    if v_refund_allocations is null
       and nullif(p_item ->> 'refundedItemId', '') is not null then
        select ti.amount
        into v_income_amount
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        where ti.id = p_income_item_id
          and ti.ledger_id = p_ledger_id;

        v_refund_allocations := jsonb_build_array(
            jsonb_build_object(
                'refundedItemId', p_item ->> 'refundedItemId',
                'refundAmount', v_income_amount
            )
        );
    end if;

    v_refund_allocations := coalesce(v_refund_allocations, '[]'::jsonb);

    v_reimbursement_ids := array(
"""
if text.count(old_begin) != 1:
    raise RuntimeError("function begin pattern not found")
text = text.replace(old_begin, new_begin, 1)

path.write_text(text, encoding="utf-8")
print("Issue #572 database compatibility fix applied")
