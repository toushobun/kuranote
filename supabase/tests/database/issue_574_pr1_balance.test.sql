begin;

set local search_path = public, extensions;

select plan(9);

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
        '57470000-0000-4000-8000-000000000001'::uuid,
        '2099-03-05 00:00:00+00'::timestamptz,
        'Issue 574 PR1 余额测试目标'
    ),
    (
        '57470000-0000-4000-8000-000000000002'::uuid,
        '2099-03-05 00:01:00+00'::timestamptz,
        'Issue 574 PR1 余额测试收入'
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
        '57471000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57470000-0000-4000-8000-000000000001',
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
        '57471000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57470000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        120, 0, 120, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        null
    );

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57471000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57471000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '余额测试先建立完整报销关联'
);

create temp table issue_574_pr1_balance_before as
select id as account_id, current_balance as balance
from public.account
where id in (
    '00000000-0000-4000-8000-000000000043',
    '00000000-0000-4000-8000-000000000044'
)
  and ledger_id = '00000000-0000-4000-8000-000000000032';

grant select on table issue_574_pr1_balance_before to authenticated;

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
            '57470000-0000-4000-8000-000000000002',
            '57471000-0000-4000-8000-000000000002',
            '2090-01-01 00:00:00+00',
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '已关联收入金额减少时原子 RPC 同步更新真实现金流'
);

select is(
    (
        select current_balance
        from public.account
        where id = '00000000-0000-4000-8000-000000000043'
          and ledger_id = '00000000-0000-4000-8000-000000000032'
    ),
    (
        select balance - 40::numeric
        from issue_574_pr1_balance_before
        where account_id = '00000000-0000-4000-8000-000000000043'
    ),
    '报销收入从 120 减到 80 后账户余额同步减少 40'
);

select lives_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57470000-0000-4000-8000-000000000001',
            '57471000-0000-4000-8000-000000000001',
            (
                select updated_at
                from public.transaction_item
                where id = '57471000-0000-4000-8000-000000000001'
            ),
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额减少时只按支出真实现金流差额更新账户余额'
);

select is(
    (
        select current_balance
        from public.account
        where id = '00000000-0000-4000-8000-000000000043'
          and ledger_id = '00000000-0000-4000-8000-000000000032'
    ),
    (
        select balance - 20::numeric
        from issue_574_pr1_balance_before
        where account_id = '00000000-0000-4000-8000-000000000043'
    ),
    '收入减少 40 后再把支出从 100 减到 80，账户余额最终相对原值减少 20'
);

select lives_ok(
    $$
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57470000-0000-4000-8000-000000000002',
            '57471000-0000-4000-8000-000000000002',
            (
                select updated_at
                from public.transaction_item
                where id = '57471000-0000-4000-8000-000000000002'
            ),
            80,
            '00000000-0000-4000-8000-000000000044',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '报销收入允许在币种一致时换到不同账户'
);

select is(
    (
        select current_balance
        from public.account
        where id = '00000000-0000-4000-8000-000000000043'
          and ledger_id = '00000000-0000-4000-8000-000000000032'
    ),
    (
        select balance - 100::numeric
        from issue_574_pr1_balance_before
        where account_id = '00000000-0000-4000-8000-000000000043'
    ),
    '报销收入换账户后旧账户回滚原收入 80'
);

select is(
    (
        select current_balance
        from public.account
        where id = '00000000-0000-4000-8000-000000000044'
          and ledger_id = '00000000-0000-4000-8000-000000000032'
    ),
    (
        select balance + 80::numeric
        from issue_574_pr1_balance_before
        where account_id = '00000000-0000-4000-8000-000000000044'
    ),
    '报销收入换账户后新账户写入收入 80'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57471000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '同币种换账户不改变既有报销关联金额'
);

select * from finish();
rollback;
