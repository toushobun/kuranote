begin;

set local search_path = public, extensions;

select plan(4);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
) values
    (
        '57491000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        'normal',
        'active',
        '2099-03-09 00:00:00+00',
        '00000000-0000-4000-8000-000000001013',
        'Issue 574 PR1 归档旧账户目标',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '57491000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        'normal',
        'active',
        '2099-03-09 00:01:00+00',
        '00000000-0000-4000-8000-000000001013',
        'Issue 574 PR1 归档旧账户收入',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order, special_status,
    created_by, updated_by, created_at, updated_at
) values
    (
        '57492000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57491000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0, 'pending_reimbursement',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00'
    ),
    (
        '57492000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57491000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        40, 0, 40, 0, null,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00'
    );

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57492000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57492000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '归档前可正常建立报销关联'
);

-- 模拟交易建立后账户被管理员归档。测试事务当前为 postgres，权限 trigger 对
-- auth.uid() 为空的系统维护写入保持兼容；最终 rollback 会恢复 seed 账户状态。
update public.account
set is_archived = true,
    archived_by = '00000000-0000-4000-8000-000000000031',
    archived_at = now()
where id = '00000000-0000-4000-8000-000000000043'
  and ledger_id = '00000000-0000-4000-8000-000000000032';

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select throws_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57491000-0000-4000-8000-000000000002',
            '57492000-0000-4000-8000-000000000002',
            (select updated_at
             from public.transaction_item
             where id = '57492000-0000-4000-8000-000000000002'),
            40,
            '00000000-0000-4000-8000-000000000044',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'account_invalid',
    '旧账户已归档时返回稳定 account_invalid 而不是底层余额异常'
);

select is(
    (
        select account_id
        from public.transaction_item
        where id = '57492000-0000-4000-8000-000000000002'
    ),
    '00000000-0000-4000-8000-000000000043'::uuid,
    '归档旧账户校验失败后收入明细不发生部分更新'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57492000-0000-4000-8000-000000000002'
    ),
    40::numeric,
    '归档旧账户校验失败后关联金额保持不变'
);

select * from finish();
rollback;
