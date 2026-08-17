begin;

set local search_path = public, extensions;

select plan(10);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('59870000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    '2026-08-17 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 598 PR5 测试交易 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 6) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, special_status
)
select
    ('59880000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    ('59870000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000043'::uuid,
    case item.category_type
        when 'expense' then '00000000-0000-4000-8000-000000005021'::uuid
        else '00000000-0000-4000-8000-000000005002'::uuid
    end,
    item.amount,
    0,
    case item.category_type when 'expense' then -item.amount else item.amount end,
    0,
    '00000000-0000-4000-8000-000000000031'::uuid,
    '00000000-0000-4000-8000-000000000031'::uuid,
    item.special_status::public.transaction_item_special_status
from (
    values
        (1, 'expense', 100::numeric, null),
        (2, 'income', 20::numeric, null),
        (3, 'expense', 100::numeric, 'pending_reimbursement'),
        (4, 'expense', 100::numeric, 'pending_reimbursement'),
        (5, 'income', 40::numeric, null),
        (6, 'income', 60::numeric, null)
) as item(sequence_number, category_type, amount, special_status);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(jsonb_build_object(
                    'refundedItemId',
                    '59880000-0000-4000-8000-000000000001',
                    'refundAmount',
                    20
                ))
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '普通支出可以建立用于开关防线测试的退款关联'
);

select throws_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = '00000000-0000-4000-8000-000000000032'
    $$,
    '55006',
    'special_status_has_active_items',
    '存在 active 退款关联时禁止关闭特殊状态功能'
);

delete from public.transaction_item_refund_link
where ledger_id = '00000000-0000-4000-8000-000000000032'
  and refund_income_item_id = '59880000-0000-4000-8000-000000000002';

select throws_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = '00000000-0000-4000-8000-000000000032'
    $$,
    '55006',
    'special_status_has_active_items',
    '原有 pending_reimbursement 明细仍会阻止关闭特殊状态功能'
);

update public.transaction_item
set special_status = null
where id = '59880000-0000-4000-8000-000000000003';

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'reimbursementItemId',
                '59880000-0000-4000-8000-000000000004'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '第一笔收入可以部分核销同一条待报销支出'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59880000-0000-4000-8000-000000000004'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '部分核销后目标支出仍保持 pending_reimbursement'
);

select is(
    (
        select amount - refunded_amount - reimbursement_amount
        from public.transaction_item_with_refund
        where id = '59880000-0000-4000-8000-000000000004'
    ),
    60::numeric,
    '部分报销后数据库组合剩余额度为 60'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000006',
            jsonb_build_object(
                'reimbursementItemId',
                '59880000-0000-4000-8000-000000000004'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '第二笔收入可以继续核销同一条待报销支出'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59880000-0000-4000-8000-000000000004'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '累计核销完成后目标支出进入 reimbursed 状态'
);

select throws_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = '00000000-0000-4000-8000-000000000032'
    $$,
    '55006',
    'special_status_has_active_items',
    '存在 active 报销关联或 reimbursed 明细时禁止关闭特殊状态功能'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select is(
    (
        select count(*)::integer
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'account',
            p_date_start => '2026-08-17 00:04:00+00'::timestamptz,
            p_date_end => '2026-08-17 00:05:00+00'::timestamptz,
            p_record_type => 'refundableExpense'
        )
    ),
    0,
    '已被报销完全核销的支出不会继续进入 refundableExpense 聚合候选'
);

select * from finish();
rollback;
