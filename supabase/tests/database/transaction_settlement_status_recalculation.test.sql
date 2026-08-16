begin;

set local search_path = public, extensions;

select plan(20);

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
    source_record.transaction_at + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 598 PR4 状态重算测试 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 11) sequence_number
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
        (2, 'expense', 100::numeric, 'pending_reimbursement'),
        (3, 'expense', 100::numeric, 'pending_reimbursement'),
        (4, 'expense', 100::numeric, 'pending_reimbursement'),
        (5, 'income', 100::numeric, null),
        (6, 'income', 40::numeric, null),
        (7, 'income', 60::numeric, null),
        (8, 'income', 100::numeric, null),
        (9, 'income', 100::numeric, null),
        (10, 'income', 40::numeric, null),
        (11, 'income', 100::numeric, null)
) as item(sequence_number, category_type, amount, special_status);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(jsonb_build_object(
                    'refundedItemId', '59880000-0000-4000-8000-000000000001',
                    'refundAmount', 100
                ))
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '普通支出可以被全额退款'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000001'),
    null::public.transaction_item_special_status,
    '普通支出被全额退款后仍保持 NULL'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000006',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(jsonb_build_object(
                    'refundedItemId', '59880000-0000-4000-8000-000000000002',
                    'refundAmount', 40
                ))
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '报销流程支出可以新增部分退款关联'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000002'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '剩余可核销余额大于零时保持待报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000007',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(jsonb_build_object(
                    'refundedItemId', '59880000-0000-4000-8000-000000000002',
                    'refundAmount', 60
                ))
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '新增退款关联可以补齐剩余可核销余额'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000002'),
    'reimbursed'::public.transaction_item_special_status,
    '剩余可核销余额为零时变为已结清'
);

select lives_ok(
    $$
        delete from public.transaction_item_refund_link
        where refund_income_item_id =
              '59880000-0000-4000-8000-000000000007'
    $$,
    '删除退款关联会触发状态重算'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000002'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '删除退款关联后从已结清回到待报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000008',
            jsonb_build_object(
                'reimbursementItemId',
                '59880000-0000-4000-8000-000000000002'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '新增报销关联会按剩余余额核销'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000002'),
    'reimbursed'::public.transaction_item_special_status,
    '退款与报销组合补齐余额后变为已结清'
);

select lives_ok(
    $$
        delete from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59880000-0000-4000-8000-000000000008'
    $$,
    '删除报销关联会触发状态重算'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000002'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '删除报销关联后从已结清回到待报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000009',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(jsonb_build_object(
                    'refundedItemId', '59880000-0000-4000-8000-000000000003',
                    'refundAmount', 100
                ))
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '为收入失活场景建立全额退款关联'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000003'),
    'reimbursed'::public.transaction_item_special_status,
    '收入失活前目标处于已结清状态'
);

alter table public.transaction_record
disable trigger transaction_record_prevent_linked_void;

select lives_ok(
    $$
        update public.transaction_record
        set status = 'deleted',
            deleted_at = now(),
            deleted_by = '00000000-0000-4000-8000-000000000031'
        where id = '59870000-0000-4000-8000-000000000009'
    $$,
    '关联收入变为非 active 时触发状态重算'
);

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000003'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '关联收入失活后排除其核销金额并回到待报销'
);

select lives_ok(
    $$
        update public.transaction_record
        set status = 'active', deleted_at = null, deleted_by = null
        where id = '59870000-0000-4000-8000-000000000009'
    $$,
    '关联收入恢复 active 时再次触发状态重算'
);

alter table public.transaction_record
enable trigger transaction_record_prevent_linked_void;

select is(
    (select special_status from public.transaction_item
     where id = '59880000-0000-4000-8000-000000000003'),
    'reimbursed'::public.transaction_item_special_status,
    '关联收入恢复 active 后重新计入核销并变为已结清'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000010',
            jsonb_build_object(
                'refundAllocations',
                jsonb_build_array(jsonb_build_object(
                    'refundedItemId', '59880000-0000-4000-8000-000000000004',
                    'refundAmount', 40
                ))
            ),
            '00000000-0000-4000-8000-000000000031'
        );
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '59880000-0000-4000-8000-000000000011',
            jsonb_build_object(
                'reimbursementItemId',
                '59880000-0000-4000-8000-000000000004'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '同一支出可以依次新增退款与报销关联'
);

select is(
    (
        select concat(
            coalesce(sum(refund_link.refund_amount), 0),
            '/',
            coalesce(sum(reimbursement_link.reimbursement_amount), 0),
            '/',
            target.special_status
        )
        from public.transaction_item target
        left join public.transaction_item_refund_link refund_link
          on refund_link.refunded_item_id = target.id
        left join public.transaction_item_reimbursement_link reimbursement_link
          on reimbursement_link.target_expense_item_id = target.id
        where target.id = '59880000-0000-4000-8000-000000000004'
        group by target.special_status
    ),
    '40.00/60.00/reimbursed',
    '退款与报销核销金额可以同时非零且以剩余余额为零判定已结清'
);

select * from finish();
rollback;
