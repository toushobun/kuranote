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
    ('60591000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    source_record.transaction_at + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 605 PR1 大额核销状态测试 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 8) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, special_status
)
select
    ('60592000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    ('60591000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
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
        (2, 'income', 600000000000::numeric, null),
        (3, 'income', 600000000000::numeric, null),
        (4, 'expense', 100::numeric, null),
        (5, 'income', 600000000000::numeric, null),
        (6, 'income', 600000000000::numeric, null),
        (7, 'income', 600000000000::numeric, null),
        (8, 'income', 600000000000::numeric, null)
) as item(sequence_number, category_type, amount, special_status);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60592000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'refundedItemId',
                '60592000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60592000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'refundedItemId',
                '60592000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    $$,
    '多笔合法大额核销累计超过 numeric(14,2) 范围时状态重算仍成功'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '60592000-0000-4000-8000-000000000001'
    ),
    '-1199999999900'::numeric,
    '有符号剩余额度保留超过单条金额 typmod 的大额负值'
);

select is(
    (select special_status
     from public.transaction_item
     where id = '60592000-0000-4000-8000-000000000001'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '报销流程中的大额超额核销进入核销结余状态'
);

select is(
    (select refunded_amount
     from public.transaction_item_with_refund
     where id = '60592000-0000-4000-8000-000000000001'),
    1200000000000::numeric,
    '视图可以读取超过 numeric(14,2) 范围的累计退款金额'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60592000-0000-4000-8000-000000000007',
            jsonb_build_object(
                'reimbursementItemId',
                '60592000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60592000-0000-4000-8000-000000000008',
            jsonb_build_object(
                'reimbursementItemId',
                '60592000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    $$,
    '同一目标可以继续累计超过 numeric(14,2) 范围的报销金额'
);

select is(
    (select reimbursement_amount
     from public.transaction_item_with_refund
     where id = '60592000-0000-4000-8000-000000000001'),
    1200000000000::numeric,
    '视图可以读取超过 numeric(14,2) 范围的累计报销金额'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60592000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'refundedItemId',
                '60592000-0000-4000-8000-000000000004'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60592000-0000-4000-8000-000000000006',
            jsonb_build_object(
                'refundedItemId',
                '60592000-0000-4000-8000-000000000004'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    $$,
    '普通支出可以先累计多笔大额退款而不进入报销状态机'
);

select is(
    (select special_status
     from public.transaction_item
     where id = '60592000-0000-4000-8000-000000000004'),
    null::public.transaction_item_special_status,
    '只有退款关联时普通支出继续保持 NULL'
);

select lives_ok(
    $$
        update public.transaction_item
        set special_status = 'pending_reimbursement'
        where id = '60592000-0000-4000-8000-000000000004'
    $$,
    '已有大额超额退款的普通支出转入报销流程时可以重新派生状态'
);

select is(
    (select special_status
     from public.transaction_item
     where id = '60592000-0000-4000-8000-000000000004'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    'NULL 转入报销流程时大额负剩余额度直接派生为核销结余'
);

select * from finish();
rollback;
