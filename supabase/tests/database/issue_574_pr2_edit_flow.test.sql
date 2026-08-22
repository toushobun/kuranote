begin;

set local search_path = public, extensions;

select plan(10);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            '2099-03-01 00:00:00+00',
            (
                select merchant_id
                from public.transaction_record
                where id = '00000000-0000-4000-8000-000000009001'
            ),
            null,
            jsonb_build_array(
                jsonb_build_object(
                    'transactionItemId', 'invalid-uuid',
                    'expectedUpdatedAt', '2090-01-01 00:00:00+00',
                    'amount', 100,
                    'accountId', '00000000-0000-4000-8000-000000000043',
                    'categoryId', '00000000-0000-4000-8000-000000005021'
                )
            )
        )
    $$,
    '22023',
    'linked_edit_items_invalid',
    '关联编辑编排 RPC 将畸形明细字段转换为稳定业务错误'
);

select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            '2099-03-01 00:00:00+00',
            '00000000-0000-4000-8000-000000001001',
            'PR2 编排 RPC 成功更新交易头',
            '[]'::jsonb
        )
    $$,
    '无明细变化时仍可在编排 RPC 内更新交易头字段'
);

select is(
    (
        select note
        from public.transaction_record
        where id = '00000000-0000-4000-8000-000000009001'
    ),
    'PR2 编排 RPC 成功更新交易头',
    '成功路径持久化交易头字段'
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            '2099-03-01 00:00:00+00',
            '00000000-0000-4000-8000-000000009999',
            null,
            '[]'::jsonb
        )
    $$,
    '22023',
    'merchant_invalid',
    '编排 RPC 拒绝账本内不存在的商家'
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            '2099-03-01 00:00:00+00',
            null::uuid,
            null,
            '[]'::jsonb
        )
    $$,
    '22023',
    'merchant_invalid',
    '交易商家为必填项且空值返回稳定业务错误'
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            null::timestamptz,
            '00000000-0000-4000-8000-000000001001',
            null,
            '[]'::jsonb
        )
    $$,
    '22023',
    'transaction_at_invalid',
    '编排 RPC 拒绝空交易时间'
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            '2099-03-01 00:00:00+00',
            '00000000-0000-4000-8000-000000001001',
            repeat('x', 2001),
            '[]'::jsonb
        )
    $$,
    '22023',
    'note_too_long',
    '编排 RPC 拒绝超长备注'
);

select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000034","role":"authenticated"}',
    true
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009001',
            '2099-03-01 00:00:00+00',
            '00000000-0000-4000-8000-000000001001',
            null,
            '[]'::jsonb
        )
    $$,
    '42501',
    'permission_denied',
    '普通成员不能编辑其他成员创建的交易'
);

select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select throws_ok(
    $$
        with item as (
            select id, updated_at, amount, account_id, category_id
            from public.transaction_item
            where id = '00000000-0000-4000-8000-000000009240'
        )
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009037',
            (
                select transaction_at
                from public.transaction_record
                where id = '00000000-0000-4000-8000-000000009037'
            ),
            '00000000-0000-4000-8000-000000001008',
            '第二条明细校验失败时必须整体回滚',
            (
                select jsonb_build_array(
                    jsonb_build_object(
                        'transactionItemId', id,
                        'expectedUpdatedAt', updated_at,
                        'amount', amount + 1,
                        'accountId', account_id,
                        'categoryId', category_id
                    ),
                    jsonb_build_object(
                        'transactionItemId', id,
                        'expectedUpdatedAt', updated_at,
                        'amount', -1,
                        'accountId', account_id,
                        'categoryId', category_id
                    )
                )
                from item
            )
        )
    $$,
    '22023',
    'amount_invalid',
    '后续明细校验失败时编排 RPC 整体失败'
);

select is(
    (
        select amount
        from public.transaction_item
        where id = '00000000-0000-4000-8000-000000009240'
    ),
    4200::numeric,
    '后续明细校验失败会回滚此前已经执行的明细更新'
);

select * from finish();
rollback;
