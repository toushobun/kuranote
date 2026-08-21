begin;

set local search_path = public, extensions;

select plan(1);

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

select * from finish();
rollback;
