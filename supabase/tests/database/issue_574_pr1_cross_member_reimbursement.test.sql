begin;

set local search_path = public, extensions;

select plan(7);

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
        '57462000-0000-4000-8000-000000000001'::uuid,
        '2099-04-02 00:00:00+00'::timestamptz,
        'Issue 574 跨成员报销目标',
        '00000000-0000-4000-8000-000000000031'::uuid
    ),
    (
        '57462000-0000-4000-8000-000000000002'::uuid,
        '2099-04-02 00:01:00+00'::timestamptz,
        'Issue 574 跨成员报销收入',
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
        '57463000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57462000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        40, 0, -40, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2000-01-02 00:00:00+00',
        '2000-01-02 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57463000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57462000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        40, 0, 40, 0,
        '00000000-0000-4000-8000-000000000034',
        '00000000-0000-4000-8000-000000000034',
        '2000-01-02 00:01:00+00',
        '2000-01-02 00:01:00+00',
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
            '57462000-0000-4000-8000-000000000002',
            'income',
            '2099-04-02 00:01:00+00',
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57463000-0000-4000-8000-000000000002',
                    'amount', 40,
                    'categoryId', '00000000-0000-4000-8000-000000005002',
                    'reimbursementItemId', '57463000-0000-4000-8000-000000000001'
                )
            ),
            '00000000-0000-4000-8000-000000000043',
            (
                select merchant_id
                from public.transaction_record
                where id = '57462000-0000-4000-8000-000000000002'
            ),
            '跨成员报销关联'
        )
    $$,
    'member 可以用自己的报销收入结清其他成员的待报销支出'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id = '57463000-0000-4000-8000-000000000002'
          and target_expense_item_id = '57463000-0000-4000-8000-000000000001'
    ),
    40::numeric,
    '跨成员报销关联保存收入完整金额'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57463000-0000-4000-8000-000000000001'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '跨成员报销可以把目标从 pending_reimbursement 推导为 reimbursed'
);

select ok(
    (
        select updated_at > '2000-01-02 00:00:00+00'::timestamptz
        from public.transaction_item
        where id = '57463000-0000-4000-8000-000000000001'
    ),
    '跨成员报销状态变化同时推进目标 updated_at'
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            '57462000-0000-4000-8000-000000000002',
            'income',
            '2099-04-02 00:01:00+00',
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57463000-0000-4000-8000-000000000002',
                    'amount', 40,
                    'categoryId', '00000000-0000-4000-8000-000000005002'
                )
            ),
            '00000000-0000-4000-8000-000000000043',
            (
                select merchant_id
                from public.transaction_record
                where id = '57462000-0000-4000-8000-000000000002'
            ),
            '解除跨成员报销关联'
        )
    $$,
    'member 可以解除自己的报销收入与其他成员支出的关联'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id = '57463000-0000-4000-8000-000000000002'
    ),
    0,
    '解除后报销关联行被删除'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57463000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '跨成员解除关联可以把目标从 reimbursed 反向推导回 pending_reimbursement'
);

select * from finish();
rollback;
