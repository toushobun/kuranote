begin;

set local search_path = public, extensions;

select plan(5);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    values_to_insert.id,
    '00000000-0000-4000-8000-000000000032',
    'normal',
    'active',
    values_to_insert.transaction_at,
    source_record.merchant_id,
    values_to_insert.title,
    values_to_insert.created_by,
    values_to_insert.created_by
from public.transaction_record source_record
cross join (values
    (
        '57460000-0000-4000-8000-000000000001'::uuid,
        '2099-04-01 00:00:00+00'::timestamptz,
        'Issue 574 跨成员退款目标',
        '00000000-0000-4000-8000-000000000031'::uuid
    ),
    (
        '57460000-0000-4000-8000-000000000002'::uuid,
        '2099-04-01 00:01:00+00'::timestamptz,
        'Issue 574 跨成员退款收入',
        '00000000-0000-4000-8000-000000000034'::uuid
    )
) values_to_insert(id, transaction_at, title, created_by)
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, created_at, updated_at, special_status
)
values
    (
        '57461000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57460000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2000-01-01 00:00:00+00',
        '2000-01-01 00:00:00+00',
        null
    ),
    (
        '57461000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57460000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        40, 0, 40, 0,
        '00000000-0000-4000-8000-000000000034',
        '00000000-0000-4000-8000-000000000034',
        '2000-01-01 00:01:00+00',
        '2000-01-01 00:01:00+00',
        null
    );

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000034","role":"authenticated"}',
    true
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            '57460000-0000-4000-8000-000000000002',
            'income',
            '2099-04-01 00:01:00+00',
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57461000-0000-4000-8000-000000000002',
                    'amount', 40,
                    'categoryId', '00000000-0000-4000-8000-000000005002',
                    'refundedItemId', '57461000-0000-4000-8000-000000000001'
                )
            ),
            '00000000-0000-4000-8000-000000000043',
            (
                select merchant_id
                from public.transaction_record
                where id = '57460000-0000-4000-8000-000000000002'
            ),
            '跨成员退款关联'
        )
    $$,
    'member 可以用自己的退款收入关联账本内其他成员的普通支出'
);

select is(
    (
        select refund_amount
        from public.transaction_item_refund_link
        where refund_income_item_id = '57461000-0000-4000-8000-000000000002'
          and refunded_item_id = '57461000-0000-4000-8000-000000000001'
    ),
    40::numeric,
    '跨成员退款关联仍按收入完整金额保存'
);

select ok(
    (
        select updated_at > '2000-01-01 00:00:00+00'::timestamptz
        from public.transaction_item
        where id = '57461000-0000-4000-8000-000000000001'
    ),
    '关联变化仍刷新目标支出 updated_at 供乐观锁识别'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57461000-0000-4000-8000-000000000001'
    ),
    null::public.transaction_item_special_status,
    '普通退款目标继续保持 special_status NULL'
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57460000-0000-4000-8000-000000000001',
            '57461000-0000-4000-8000-000000000001',
            (
                select updated_at
                from public.transaction_item
                where id = '57461000-0000-4000-8000-000000000001'
            ),
            100,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '42501',
    'permission_denied',
    '即使业务字段完全不变，member 也不能直接调用编辑 RPC 刷新其他成员目标的版本'
);

select * from finish();
rollback;
