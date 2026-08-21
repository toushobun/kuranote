begin;

set local search_path = public, extensions;

select plan(3);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    values_to_insert.id,
    source_record.ledger_id,
    'normal',
    'active',
    values_to_insert.transaction_at,
    source_record.merchant_id,
    values_to_insert.title,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join (values
    (
        '57440000-0000-4000-8000-000000000001'::uuid,
        '2099-03-03 00:01:00+00'::timestamptz,
        'Issue 574 PR1 退款目标'
    ),
    (
        '57440000-0000-4000-8000-000000000002'::uuid,
        '2099-03-03 00:02:00+00'::timestamptz,
        'Issue 574 PR1 退款收入'
    )
) values_to_insert(id, transaction_at, title)
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, created_at, updated_at, special_status
)
values
    (
        '57441000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57440000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57441000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57440000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        50, 0, 50, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    );

select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '57441000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'refundedItemId',
        '57441000-0000-4000-8000-000000000001'
    ),
    '00000000-0000-4000-8000-000000000031'
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
            '57440000-0000-4000-8000-000000000002',
            '57441000-0000-4000-8000-000000000002',
            '2090-01-01 00:00:00+00',
            70,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '已关联退款收入可以通过原子 RPC 直接修改金额'
);

select is(
    (
        select income_item.amount::text || '/' || link.refund_amount::text
        from public.transaction_item income_item
        join public.transaction_item_refund_link link
          on link.ledger_id = income_item.ledger_id
         and link.refund_income_item_id = income_item.id
        where income_item.id = '57441000-0000-4000-8000-000000000002'
    ),
    '70.00/70.00',
    '退款收入本体与退款关联金额同步更新为新金额'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link link
        where link.refund_income_item_id =
              '57441000-0000-4000-8000-000000000002'
    ),
    1,
    '退款收入编辑后仍保留同一条单目标关联'
);

select * from finish();
rollback;
