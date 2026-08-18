begin;

set local search_path = public, extensions;

select plan(29);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('59850000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    source_record.transaction_at + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 598 PR2 测试交易 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 17) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, special_status
)
select
    ('59860000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    ('59850000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    case
        when item.sequence_number = 17
        then '00000000-0000-4000-8000-000000000042'::uuid
        else '00000000-0000-4000-8000-000000000043'::uuid
    end,
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
        (1, 'expense', 100::numeric, 'pending_reimbursement'),
        (2, 'income', 40::numeric, null),
        (3, 'income', 100::numeric, null),
        (4, 'income', 10::numeric, null),
        (5, 'expense', 100::numeric, null),
        (6, 'income', 30::numeric, null),
        (7, 'income', 100::numeric, null),
        (8, 'expense', 100::numeric, null),
        (9, 'income', 100::numeric, null),
        (10, 'expense', 100::numeric, null),
        (11, 'income', 30::numeric, null),
        (12, 'expense', 100::numeric, 'pending_reimbursement'),
        (13, 'income', 20::numeric, null),
        (14, 'expense', 100::numeric, 'pending_reimbursement'),
        (15, 'income', 30::numeric, null),
        (16, 'income', 100::numeric, null),
        (17, 'expense', 100::numeric, 'pending_reimbursement')
) as item(sequence_number, category_type, amount, special_status);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '小额报销收入可以建立部分报销关联'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59860000-0000-4000-8000-000000000002'
    ),
    40::numeric,
    '部分报销关联金额等于收入明细金额'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '部分报销后目标支出保持待报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '收入超过剩余余额时仍可建立报销关联'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59860000-0000-4000-8000-000000000003'
    ),
    60::numeric,
    '报销关联按目标剩余可核销余额截断'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000001'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '累计核销达到原始金额后目标支出变为已报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '剩余可核销余额为零时收入仍可作为普通收入保存'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59860000-0000-4000-8000-000000000004'
    ),
    0,
    '剩余可核销余额为零时不写入报销关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000007',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000005'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    'P0001',
    'reimbursement_item_invalid',
    '普通支出不能直接建立报销关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000007',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000017'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '22023',
    'reimbursement_currency_mismatch',
    '报销收入与目标支出币种不一致时拒绝建立关联'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000006',
            jsonb_build_object(
                'refundedItemId',
                '59860000-0000-4000-8000-000000000005'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '普通支出仍可建立退款关联'
);

select lives_ok(
    $$
        update public.transaction_item
        set special_status = 'pending_reimbursement'
        where id = '59860000-0000-4000-8000-000000000005'
    $$,
    '只有退款关联的普通支出可以转入报销流程'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000005'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '转入报销流程时按部分退款余额保持待报销'
);

select lives_ok(
    $$
        update public.transaction_item
        set special_status = null
        where id = '59860000-0000-4000-8000-000000000005'
    $$,
    '只有退款关联且无报销关联时可以退出报销流程'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000009',
            jsonb_build_object(
                'refundedItemId',
                '59860000-0000-4000-8000-000000000008'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '普通支出可以被全额退款'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000008'
    ),
    null,
    '普通支出被全额退款后仍保持普通状态'
);

select lives_ok(
    $$
        update public.transaction_item
        set special_status = 'pending_reimbursement'
        where id = '59860000-0000-4000-8000-000000000008'
    $$,
    '全额退款的普通支出可以转入报销流程'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000008'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '全额退款支出转入报销流程后立即派生为已报销'
);

select lives_ok(
    $$
        update public.transaction_item
        set special_status = null
        where id = '59860000-0000-4000-8000-000000000008'
    $$,
    '全额退款且无报销关联的支出可以退出报销流程'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000011',
            jsonb_build_object(
                'refundedItemId',
                '59860000-0000-4000-8000-000000000010'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000011',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000012'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '22023',
    'income_link_conflict',
    '已经作为退款来源的收入不能再作为报销来源'
);

select lives_ok(
    $$
        select set_config('kuranote.reimbursement_link_flow', 'on', true);
        update public.transaction_item
        set special_status = 'reimbursed'
        where id = '59860000-0000-4000-8000-000000000012';
        select set_config('kuranote.reimbursement_link_flow', 'off', true);
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000013',
            jsonb_build_object(
                'refundedItemId',
                '59860000-0000-4000-8000-000000000012'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '已报销状态的支出仍可建立退款关联'
);

select is(
    (
        select refund_amount
        from public.transaction_item_refund_link
        where refund_income_item_id =
              '59860000-0000-4000-8000-000000000013'
    ),
    20::numeric,
    '已报销目标的退款关联保留原有分摊金额'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000015',
            jsonb_build_object(
                'refundedItemId',
                '59860000-0000-4000-8000-000000000014'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59860000-0000-4000-8000-000000000016',
            jsonb_build_object(
                'reimbursementItemId',
                '59860000-0000-4000-8000-000000000014'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '同一支出可以先建立退款关联再建立报销关联'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59860000-0000-4000-8000-000000000016'
    ),
    70::numeric,
    '报销关联金额会扣除目标支出已有退款分摊'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = null
        where id = '59860000-0000-4000-8000-000000000014'
    $$,
    'P0001',
    'reimbursement_link_exists',
    '存在有效报销关联时不能退出报销流程'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = 101
        where id = '59860000-0000-4000-8000-000000000014'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '新关联路径建立报销后目标支出仍被冻结'
);

select throws_ok(
    $$
        delete from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000014'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '新关联路径建立报销后目标支出仍不能删除'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = 101
        where id = '59860000-0000-4000-8000-000000000016'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '新关联路径建立报销后收入明细仍被冻结'
);

select throws_ok(
    $$
        delete from public.transaction_item
        where id = '59860000-0000-4000-8000-000000000016'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '新关联路径建立报销后收入明细仍不能删除'
);

select * from finish();

rollback;
