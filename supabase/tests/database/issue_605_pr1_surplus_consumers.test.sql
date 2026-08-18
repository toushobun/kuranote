begin;

set local search_path = public, extensions;

select plan(8);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('60593000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    '2026-08-19 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 605 PR1 核销结余消费者测试 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 5) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, special_status
)
select
    ('60594000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    ('60593000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
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
        (1, 'expense', 100::numeric, 'pending_reimbursement'),
        (2, 'income', 40::numeric, null),
        (3, 'income', 60::numeric, null),
        (4, 'income', 100::numeric, null),
        (5, 'expense', 100::numeric, 'pending_reimbursement')
) as item(sequence_number, category_type, amount, special_status);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundedItemId',
                '60594000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'reimbursementItemId',
                '60594000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemId',
                '60594000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    $$,
    '退款与两笔报销叠加后可以进入核销结余状态'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '60594000-0000-4000-8000-000000000001'
    ),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '累计核销 200 大于原始支出 100 时为核销结余'
);

select lives_ok(
    $$
        select public.clear_transaction_item_income_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000004',
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '收入编辑清除一笔超额报销关联时由删除触发器重新派生状态'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '60594000-0000-4000-8000-000000000001'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '清除超额部分后剩余退款 40 与报销 60 恰好结清时保持已结清而非误回待报销'
);

-- 清空第一条目标的剩余关联，使后续账本开关断言只依赖第三态本身，
-- 避免旧实现因“仍有 active link”而误打误撞通过测试。
select public.clear_transaction_item_income_links(
    '00000000-0000-4000-8000-000000000032',
    '60594000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000031'
);
select public.clear_transaction_item_income_links(
    '00000000-0000-4000-8000-000000000032',
    '60594000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000031'
);

select lives_ok(
    $$
        select set_config('kuranote.reimbursement_link_flow', 'on', true);
        update public.transaction_item
        set special_status = 'reimbursement_surplus'
        where id = '60594000-0000-4000-8000-000000000005';
        select set_config('kuranote.reimbursement_link_flow', 'off', true);
    $$,
    '受控状态通道可以构造仅靠状态防线识别的核销结余明细'
);

select throws_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = '00000000-0000-4000-8000-000000000032'
    $$,
    '55006',
    'special_status_has_active_items',
    '存在 active 核销结余明细时禁止关闭特殊状态功能'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundedItemId',
                '60594000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'reimbursementItemId',
                '60594000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60594000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemId',
                '60594000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    $$,
    '清空关联后重新建立完整组合可以再次进入核销结余'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select is(
    (
        select group_label
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'specialStatus',
            p_special_statuses => array['reimbursement_surplus']
        )
        where group_key = 'reimbursement_surplus'
        limit 1
    ),
    '核销结余'::text,
    '数据库特殊状态分组为第三态返回核销结余而不是未知状态'
);

select * from finish();
rollback;
