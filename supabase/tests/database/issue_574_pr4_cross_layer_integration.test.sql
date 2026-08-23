begin;

set local search_path = public, extensions;

select plan(29);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('57490000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    '2099-03-04 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 574 PR4 跨层组合测试 ' || sequence_number,
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
        '57491000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57490000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57491000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57490000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        40, 0, 40, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57491000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000032',
        '57490000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        60, 0, 60, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57491000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000032',
        '57490000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        30, 0, 30, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    );

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57491000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57491000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '第一笔报销收入可建立关联'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '部分核销后母项保持待报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57491000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'reimbursementItemId',
                '57491000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '第二笔报销收入可继续累加'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'reimbursed'::public.transaction_item_special_status,
    '累计核销恰好等于母项金额时进入已结清'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57491000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'refundedItemId',
                '57491000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '结清后仍可叠加退款收入'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '报销与退款累计超过母项金额时进入核销结余'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57491000-0000-4000-8000-000000000001'),
    -30::numeric,
    '核销结余时母项业务净额为负值'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '57490000-0000-4000-8000-000000000003',
            (select transaction_at from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000003'),
            (select merchant_id from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000003'),
            '子项金额确认同步为 30',
            jsonb_build_array(
                jsonb_build_object(
                    'transactionItemId', '57491000-0000-4000-8000-000000000003',
                    'expectedUpdatedAt', (select updated_at from public.transaction_item
                                          where id = '57491000-0000-4000-8000-000000000003'),
                    'amount', 30,
                    'accountId', '00000000-0000-4000-8000-000000000043',
                    'categoryId', '00000000-0000-4000-8000-000000005002'
                )
            )
        )
    $$,
    '完整编辑 RPC 原子更新已关联报销收入'
);

select is(
    (
        select income_item.amount::text || '/' || link.reimbursement_amount::text
        from public.transaction_item income_item
        join public.transaction_item_reimbursement_link link
          on link.reimbursement_income_item_id = income_item.id
        where income_item.id = '57491000-0000-4000-8000-000000000003'
    ),
    '30.00/30.00',
    '子项本体金额与报销关联金额同步为新值'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'reimbursed'::public.transaction_item_special_status,
    '编辑子项减少核销额后从核销结余回落到已结清'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57491000-0000-4000-8000-000000000001'),
    0::numeric,
    '回落到已结清时母项业务净额为零'
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            '57490000-0000-4000-8000-000000000004',
            'income',
            (select transaction_at from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000004'),
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57491000-0000-4000-8000-000000000004',
                    'amount', 30,
                    'categoryId', '00000000-0000-4000-8000-000000005002'
                )
            ),
            '00000000-0000-4000-8000-000000000043',
            (select merchant_id from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000004'),
            '解除退款关联'
        )
    $$,
    '解除退款关联沿正式更新流程完成'
);

select is(
    (select count(*)::integer from public.transaction_item_refund_link
     where refund_income_item_id = '57491000-0000-4000-8000-000000000004'),
    0,
    '退款关联已被解除'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '解除关联后母项从已结清回落到待报销'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57491000-0000-4000-8000-000000000001'),
    30::numeric,
    '解除关联后母项业务净额同步回升'
);

select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '57490000-0000-4000-8000-000000000001',
            (select transaction_at from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            (select merchant_id from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            '客户端一保存成功',
            jsonb_build_array(
                jsonb_build_object(
                    'transactionItemId', '57491000-0000-4000-8000-000000000001',
                    'expectedUpdatedAt', (select updated_at from public.transaction_item
                                          where id = '57491000-0000-4000-8000-000000000001'),
                    'amount', 70,
                    'accountId', '00000000-0000-4000-8000-000000000043',
                    'categoryId', '00000000-0000-4000-8000-000000005021'
                )
            )
        )
    $$,
    '客户端一通过完整编辑 RPC 修改母项 base 金额'
);

select is(
    (select amount from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    70::numeric,
    '母项 base 金额更新为客户端一提交值'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'reimbursed'::public.transaction_item_special_status,
    '母项 base 金额等于关联总额时推导为已结清'
);

select is(
    (select sum(reimbursement_amount) from public.transaction_item_reimbursement_link
     where target_expense_item_id = '57491000-0000-4000-8000-000000000001'),
    70::numeric,
    '编辑母项不会改动两个报销子项的关联金额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57491000-0000-4000-8000-000000000001'),
    0::numeric,
    '母项 base 金额更新后业务净额同步重算'
);

select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '57490000-0000-4000-8000-000000000001',
            (select transaction_at from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            (select merchant_id from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            '客户端二不应覆盖交易头',
            jsonb_build_array(
                jsonb_build_object(
                    'transactionItemId', '57491000-0000-4000-8000-000000000001',
                    'expectedUpdatedAt', '2000-01-01 00:00:00+00',
                    'amount', 90,
                    'accountId', '00000000-0000-4000-8000-000000000043',
                    'categoryId', '00000000-0000-4000-8000-000000005021'
                )
            )
        )
    $$,
    'P0001',
    'transaction_item_version_conflict',
    '客户端二使用过期版本时完整编辑 RPC 返回稳定冲突'
);

select is(
    (select amount from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    70::numeric,
    '并发冲突不会静默覆盖客户端一的母项金额'
);

select is(
    (select note from public.transaction_record
     where id = '57490000-0000-4000-8000-000000000001'),
    '客户端一保存成功',
    '并发冲突会回滚客户端二的交易头更新'
);

select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '57490000-0000-4000-8000-000000000001',
            (select transaction_at from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            (select merchant_id from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            '母项进入核销结余',
            jsonb_build_array(
                jsonb_build_object(
                    'transactionItemId', '57491000-0000-4000-8000-000000000001',
                    'expectedUpdatedAt', (select updated_at from public.transaction_item
                                          where id = '57491000-0000-4000-8000-000000000001'),
                    'amount', 50,
                    'accountId', '00000000-0000-4000-8000-000000000043',
                    'categoryId', '00000000-0000-4000-8000-000000005021'
                )
            )
        )
    $$,
    '母项 base 金额可继续减到关联总额以下'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '母项净额转正后进入核销结余'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57491000-0000-4000-8000-000000000001'),
    -20::numeric,
    '母项核销结余的业务净额正确'
);

select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '57490000-0000-4000-8000-000000000001',
            (select transaction_at from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            (select merchant_id from public.transaction_record
             where id = '57490000-0000-4000-8000-000000000001'),
            '母项回落待报销',
            jsonb_build_array(
                jsonb_build_object(
                    'transactionItemId', '57491000-0000-4000-8000-000000000001',
                    'expectedUpdatedAt', (select updated_at from public.transaction_item
                                          where id = '57491000-0000-4000-8000-000000000001'),
                    'amount', 120,
                    'accountId', '00000000-0000-4000-8000-000000000043',
                    'categoryId', '00000000-0000-4000-8000-000000005021'
                )
            )
        )
    $$,
    '母项 base 金额再次增大时允许反向回落'
);

select is(
    (select special_status from public.transaction_item
     where id = '57491000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '母项可从核销结余双向回落到待报销'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id = '57491000-0000-4000-8000-000000000001'),
    50::numeric,
    '双向回落后母项业务净额保持一致'
);

select * from finish();
rollback;
