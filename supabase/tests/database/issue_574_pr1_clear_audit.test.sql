begin;

set local search_path = public, extensions;

select plan(2);

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
        '2099-03-04 00:00:00+00'::timestamptz,
        'Issue 574 PR1 清关联审计目标'
    ),
    (
        '57450000-0000-4000-8000-000000000002'::uuid,
        '2099-03-04 00:01:00+00'::timestamptz,
        'Issue 574 PR1 清关联审计收入'
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
        '00000000-0000-4000-8000-000000000034',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57451000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57450000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        40, 0, 40, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00',
        '2090-01-01 00:00:00+00',
        null
    );

select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '57451000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'reimbursementItemId',
        '57451000-0000-4000-8000-000000000001'
    ),
    '00000000-0000-4000-8000-000000000031'
);

-- 建立关联会触发状态重算；这里重新放入另一个合法用户，确认 clear 使用 p_user_id 覆盖审计字段。
update public.transaction_item
set updated_by = '00000000-0000-4000-8000-000000000034'
where id = '57451000-0000-4000-8000-000000000001';

select public.clear_transaction_item_income_links(
    '00000000-0000-4000-8000-000000000032',
    '57451000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000031'
);

select is(
    (
        select updated_by
        from public.transaction_item
        where id = '57451000-0000-4000-8000-000000000001'
    ),
    '00000000-0000-4000-8000-000000000031'::uuid,
    '清除报销关联后目标支出 updated_by 仍记录本次操作者'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57451000-0000-4000-8000-000000000002'
    ),
    0,
    '清除后不再保留报销关联'
);

select * from finish();
rollback;
