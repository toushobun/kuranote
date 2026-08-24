begin;

set local search_path = public, extensions;

select plan(13);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

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
        '57450000-0000-4000-8000-000000000001'::uuid,
        '2099-03-10 00:00:00+00'::timestamptz,
        'Issue 574 PR5 恰好核销母项'
    ),
    (
        '57450000-0000-4000-8000-000000000002'::uuid,
        '2099-03-10 00:01:00+00'::timestamptz,
        'Issue 574 PR5 核销结余母项'
    ),
    (
        '57450000-0000-4000-8000-000000000003'::uuid,
        '2099-03-10 00:02:00+00'::timestamptz,
        'Issue 574 PR5 多子项收入'
    ),
    (
        '57450000-0000-4000-8000-000000000004'::uuid,
        '2099-03-10 00:03:00+00'::timestamptz,
        'Issue 574 PR5 退款母项'
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
        '57451000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57451000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57451000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        100, 0, 100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57451000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        150, 0, 150, 1,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57451000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        80, 0, -80, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57451000-0000-4000-8000-000000000006',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        30, 0, 30, 2,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        null
    );

select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '57451000-0000-4000-8000-000000000003',
    jsonb_build_object(
        'reimbursementItemId',
        '57451000-0000-4000-8000-000000000001'
    ),
    '00000000-0000-4000-8000-000000000031'
);
select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '57451000-0000-4000-8000-000000000006',
    jsonb_build_object(
        'refundedItemId',
        '57451000-0000-4000-8000-000000000005'
    ),
    '00000000-0000-4000-8000-000000000031'
);
select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '57451000-0000-4000-8000-000000000004',
    jsonb_build_object(
        'reimbursementItemId',
        '57451000-0000-4000-8000-000000000002'
    ),
    '00000000-0000-4000-8000-000000000031'
);

select is(
    (select special_status from public.transaction_item
     where id = '57451000-0000-4000-8000-000000000001'),
    'reimbursed'::public.transaction_item_special_status,
    '删除前恰好核销母项处于已核销状态'
);
select is(
    (select special_status from public.transaction_item
     where id = '57451000-0000-4000-8000-000000000002'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '删除前超额核销母项处于核销结余状态'
);
select is(
    (select count(*) from public.transaction_item_refund_link
     where refund_income_item_id =
         '57451000-0000-4000-8000-000000000006'),
    1::bigint,
    '删除前退款收入子项已建立单目标关联'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select throws_ok(
    $$
        select public.void_transaction(
            '00000000-0000-4000-8000-000000000032',
            '57450000-0000-4000-8000-000000000001'
        )
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '删除仍被子项关联的母项时维持原有拒绝'
);

select lives_ok(
    $$
        select public.void_transaction(
            '00000000-0000-4000-8000-000000000032',
            '57450000-0000-4000-8000-000000000003'
        )
    $$,
    '删除只包含收入子项关联的交易时自动解除关联并完成删除'
);

reset role;

select is(
    (select count(*) from public.transaction_item_reimbursement_link
     where reimbursement_income_item_id in (
         '57451000-0000-4000-8000-000000000003',
         '57451000-0000-4000-8000-000000000004'
     )),
    0::bigint,
    '收入交易的全部报销关联均已清空'
);
select is(
    (select count(*) from public.transaction_item_refund_link
     where refund_income_item_id =
         '57451000-0000-4000-8000-000000000006'),
    0::bigint,
    '收入交易的退款关联也已清空'
);
select is(
    (select status from public.transaction_record
     where id = '57450000-0000-4000-8000-000000000003'),
    'deleted'::text,
    '解除关联后收入交易完成软删除'
);
select is(
    (select special_status from public.transaction_item
     where id = '57451000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '恰好核销母项在子项删除后回落为待报销'
);
select is(
    (select special_status from public.transaction_item
     where id = '57451000-0000-4000-8000-000000000002'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '核销结余母项在子项删除后回落为待报销'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57451000-0000-4000-8000-000000000001'),
    100::numeric,
    '恰好核销母项的业务净额回落为原始支出'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57451000-0000-4000-8000-000000000002'),
    100::numeric,
    '核销结余母项的业务净额回落为原始支出'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57451000-0000-4000-8000-000000000005'),
    80::numeric,
    '退款母项的业务净额回落为原始支出'
);

select * from finish();
rollback;
