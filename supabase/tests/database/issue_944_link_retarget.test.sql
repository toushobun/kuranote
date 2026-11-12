-- #944：已保存的退款／报销在同一笔事务中改选原支出。
-- 使用 seed 已存在的关联，验证旧、新目标净额与状态、乐观锁及异常回滚。
begin;

set local search_path = public, extensions;
select plan(12);

-- 现有退款收入 9241（4200）原关联 9240（4200），改选 9242（6800，已退 2500）。
set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000034","role":"authenticated"}',
    true
);

select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009038',
            (select transaction_at from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009038'),
            (select merchant_id from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009038'),
            (select note from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009038'),
            (select jsonb_build_array(jsonb_build_object(
                'transactionItemId', id,
                'expectedUpdatedAt', updated_at,
                'amount', amount,
                'categoryId', category_id,
                'refundedItemId', '00000000-0000-4000-8000-000000009242'
            )) from public.transaction_item
               where id = '00000000-0000-4000-8000-000000009241'),
            tests.current_transaction_payments('00000000-0000-4000-8000-000000009038'),
            (select updated_at from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009038')
        )
    $$,
    '已关联退款允许改选同币种另一笔原支出'
);

select is(
    (select refunded_item_id from public.transaction_item_refund_link
      where refund_income_item_id = '00000000-0000-4000-8000-000000009241'),
    '00000000-0000-4000-8000-000000009242'::uuid,
    '退款链接改为新原支出'
);
-- 内部金额计算函数仅供可信数据库角色调用，业务 RPC 仍按 authenticated 验证。
reset role;
select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '00000000-0000-4000-8000-000000009240'
    ),
    4200::numeric,
    '旧原支出恢复全部未核销金额'
);
select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '00000000-0000-4000-8000-000000009242'
    ),
    100::numeric,
    '新原支出同时计入原有 2500 退款与本次 4200 退款'
);

set local role authenticated;
select throws_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009038',
            (select transaction_at from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009038'),
            (select merchant_id from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009038'),
            null,
            (select jsonb_build_array(jsonb_build_object(
                'transactionItemId', id,
                'expectedUpdatedAt', '1990-01-01 00:00:00+00',
                'amount', amount,
                'categoryId', category_id,
                'refundedItemId', '00000000-0000-4000-8000-000000009240'
            )) from public.transaction_item
               where id = '00000000-0000-4000-8000-000000009241'),
            tests.current_transaction_payments('00000000-0000-4000-8000-000000009038'),
            null
        )
    $$,
    'P0001', 'transaction_item_version_conflict',
    '原明细版本过期时拒绝改选且不写入'
);

select is(
    (select refunded_item_id from public.transaction_item_refund_link
      where refund_income_item_id = '00000000-0000-4000-8000-000000009241'),
    '00000000-0000-4000-8000-000000009242'::uuid,
    '乐观锁冲突后原有已完成的改选不回滚'
);

-- 报销收入 9232（7800）原关联支出 9230，改选到已报销完的 9231。
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);
select lives_ok(
    $$
        select public.update_linked_transaction_edit(
            '00000000-0000-4000-8000-000000000032',
            '00000000-0000-4000-8000-000000009035',
            (select transaction_at from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009035'),
            (select merchant_id from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009035'),
            (select note from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009035'),
            (select jsonb_build_array(jsonb_build_object(
                'transactionItemId', id,
                'expectedUpdatedAt', updated_at,
                'amount', amount,
                'categoryId', category_id,
                'reimbursementItemId', '00000000-0000-4000-8000-000000009231'
            )) from public.transaction_item
               where id = '00000000-0000-4000-8000-000000009232'),
            tests.current_transaction_payments('00000000-0000-4000-8000-000000009035'),
            (select updated_at from public.transaction_record
             where id = '00000000-0000-4000-8000-000000009035')
        )
    $$,
    '已关联报销允许改选其他报销流程内的原支出'
);
select is(
    (select target_expense_item_id from public.transaction_item_reimbursement_link
      where reimbursement_income_item_id = '00000000-0000-4000-8000-000000009232'),
    '00000000-0000-4000-8000-000000009231'::uuid,
    '报销链接变为新原支出'
);
select is(
    (select special_status::text from public.transaction_item
      where id = '00000000-0000-4000-8000-000000009230'),
    'pending_reimbursement'::text,
    '旧原支出从已报销回退为待报销'
);
select is(
    (select special_status::text from public.transaction_item
      where id = '00000000-0000-4000-8000-000000009231'),
    'reimbursement_surplus'::text,
    '新原支出累积核销超过原金额，重新派生核销结余'
);
reset role;
select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '00000000-0000-4000-8000-000000009231'
    ),
    -7800::numeric,
    '新原支出净核销结余为 7800'
);
select is(
    (select reimbursement_amount from public.transaction_item_reimbursement_link
      where reimbursement_income_item_id = '00000000-0000-4000-8000-000000009232'),
    7800::numeric,
    '改选目标时保留当前报销明细的核销金额'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
select * from finish();
rollback;
