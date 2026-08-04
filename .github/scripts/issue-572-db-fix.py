from pathlib import Path

migration_path = Path(
    "supabase/migrations/20260805010000_support_refund_multi_item_allocation.sql"
)
migration = migration_path.read_text(encoding="utf-8")

old_declaration = (
    "    v_refund_allocations jsonb := "
    "coalesce(p_item -> 'refundAllocations', '[]'::jsonb);"
)
new_declaration = "    v_refund_allocations jsonb;"
if migration.count(old_declaration) != 1:
    raise RuntimeError("refund allocation declaration pattern not found")
migration = migration.replace(old_declaration, new_declaration, 1)

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
if migration.count(old_begin) != 1:
    raise RuntimeError("function begin pattern not found")
migration = migration.replace(old_begin, new_begin, 1)

old_target_validation = """        if exists (
            select 1
            from public.transaction_item ti
            join public.category c
              on c.id = ti.category_id
             and c.ledger_id = ti.ledger_id
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_refund_target_ids)
"""
new_target_validation = """        if exists (
            select 1
            from public.transaction_item ti
            left join public.category c
              on c.id = ti.category_id
             and c.ledger_id = ti.ledger_id
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_refund_target_ids)
"""
if migration.count(old_target_validation) != 1:
    raise RuntimeError("refund target validation pattern not found")
migration = migration.replace(old_target_validation, new_target_validation, 1)
migration_path.write_text(migration, encoding="utf-8")

statistics_path = Path(
    "supabase/tests/database/transaction_item_special_status_statistics.test.sql"
)
statistics = statistics_path.read_text(encoding="utf-8")
old_statistics_anchor = """update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_special_status_context);

insert into public.merchant (
"""
new_statistics_anchor = """update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_special_status_context);

-- 使用专用账户隔离统计断言，避免本地种子交易影响整月合计。
insert into public.account (
    id, ledger_id, name, type, currency, initial_balance,
    current_balance, sort_order, created_by, updated_by
)
select
    '55194800-0000-4000-8000-000000000001',
    context.ledger_id,
    '特殊状态统计隔离账户',
    source_account.type,
    source_account.currency,
    0,
    0,
    (
        select coalesce(max(existing.sort_order), 0) + 1
        from public.account existing
        where existing.ledger_id = context.ledger_id
    ),
    context.user_id,
    context.user_id
from test_special_status_context context
join public.account source_account
  on source_account.id = context.account_id
 and source_account.ledger_id = context.ledger_id;

update test_special_status_context
set account_id = '55194800-0000-4000-8000-000000000001';

insert into public.merchant (
"""
if statistics.count(old_statistics_anchor) != 1:
    raise RuntimeError("statistics isolation anchor not found")
statistics = statistics.replace(old_statistics_anchor, new_statistics_anchor, 1)
statistics_path.write_text(statistics, encoding="utf-8")

print("Issue #572 database compatibility and validation fixes applied")
