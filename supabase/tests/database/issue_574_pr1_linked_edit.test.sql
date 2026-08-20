begin;

set local search_path = public, extensions;

select plan(21);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('57410000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    '2099-03-01 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 574 PR1 关联编辑测试 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 4) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, created_at, updated_at, special_status
)
values
    (
        '57420000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57420000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        120, 0, 120, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57420000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57420000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        50, 0, 50, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    );

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57420000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57420000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '建立超额报销关联后可进入关联编辑场景'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57420000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'refundedItemId',
                '57420000-0000-4000-8000-000000000003'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '建立退款关联后可进入退款账户一致性测试'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '初始超额报销把母项推导为核销结余'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select lives_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000002',
            '57420000-0000-4000-8000-000000000002',
            '2090-01-01 00:00:00+00',
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '编辑已关联报销收入时直接覆盖收入金额与关联金额'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57420000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '报销关联金额直接等于收入新金额'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '关联金额减少后可从核销结余回落为待报销'
);

select is(
    (
        select amount
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '已关联收入本体金额与关联金额同步更新'
);

select lives_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额可直接改到与累计核销额相等'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '母项 base 金额与核销额相等时推导为恰好结清'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57420000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '编辑母项金额不会改动已有子项关联金额'
);

select lives_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            60,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额小于累计核销额时仍允许保存'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '母项净额转正后推导为核销结余'
);

select lives_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            100,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额再次增大时允许从核销结余反向回落'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '核销结余可双向回落到待报销'
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            '2000-01-01 00:00:00+00',
            101,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    'P0001',
    'transaction_item_version_conflict',
    'updated_at 版本过期时稳定返回并发冲突'
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            100,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'special_status_invalid',
    '母项分类不能改成收入分类以破坏报销语义'
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000002',
            '57420000-0000-4000-8000-000000000002',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000002'),
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '22023',
    'income_link_category_invalid',
    '已关联收入不能改成支出分类'
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000002',
            '57420000-0000-4000-8000-000000000002',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000002'),
            80,
            '00000000-0000-4000-8000-000000000042',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'reimbursement_currency_mismatch',
    '报销收入换到不同币种账户时拒绝保存'
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000004',
            '57420000-0000-4000-8000-000000000004',
            '2090-01-01 00:00:00+00',
            50,
            '00000000-0000-4000-8000-000000000042',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'refund_account_mismatch',
    '退款收入换到账户不一致时拒绝保存'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = null
        where id = '57420000-0000-4000-8000-000000000001'
    $$,
    'P0001',
    'reimbursement_link_exists',
    '母项仍有报销关联时不能直接清除待报销流程标记'
);

reset role;

select throws_ok(
    $$
        delete from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000003'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '仍有关联的母项不能直接删除'
);

select * from finish();
rollback;
