begin;

set local search_path = public, extensions;

select plan(10);

create temporary table test_refund_edit_context as
select
    expense_item.ledger_id,
    expense_item.account_id,
    expense_item.transaction_record_id as expense_record_id,
    expense_category.id as expense_category_id,
    income_category.id as income_category_id,
    merchant.id as merchant_id,
    expense_item.created_by as user_id
from public.transaction_item expense_item
join public.category expense_category
  on expense_category.id = expense_item.category_id
 and expense_category.ledger_id = expense_item.ledger_id
 and expense_category.type = 'expense'
join public.transaction_record expense_record
  on expense_record.id = expense_item.transaction_record_id
 and expense_record.ledger_id = expense_item.ledger_id
 and expense_record.status = 'active'
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = expense_item.ledger_id
      and category.type = 'income'
      and category.parent_id is not null
      and category.is_archived = false
    limit 1
) income_category on true
join lateral (
    select m.id
    from public.merchant m
    where m.ledger_id = expense_item.ledger_id
      and m.is_archived = false
    limit 1
) merchant on true
limit 1;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_refund_edit_context);

select is(
    position(
        'refundAllocations' in pg_get_functiondef(
            'public.update_transaction(uuid,uuid,text,timestamp with time zone,jsonb,uuid,uuid,text)'::regprocedure
        )
    ),
    0,
    'update_transaction 不再读取旧 refundAllocations 协议'
);

select ok(
    position(
        'refundedItemId' in pg_get_functiondef(
            'public.update_transaction(uuid,uuid,text,timestamp with time zone,jsonb,uuid,uuid,text)'::regprocedure
        )
    ) > 0,
    'update_transaction 前置校验使用单目标 refundedItemId'
);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    values_to_insert.id,
    context.ledger_id,
    context.expense_record_id,
    context.account_id,
    context.expense_category_id,
    values_to_insert.amount,
    0,
    -values_to_insert.amount,
    null,
    5810 + values_to_insert.sort_order,
    context.user_id,
    context.user_id
from test_refund_edit_context context
cross join (values
    ('57241000-0000-4000-8000-000000000001'::uuid, 100::numeric, 1),
    ('57241000-0000-4000-8000-000000000002'::uuid, 300::numeric, 2)
) values_to_insert(id, amount, sort_order);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    '57242000-0000-4000-8000-000000000001',
    ledger_id,
    'normal',
    'active',
    now(),
    merchant_id,
    '退款编辑测试',
    null,
    user_id,
    user_id
from test_refund_edit_context;

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '57242000-0000-4000-8000-000000000002',
    ledger_id,
    '57242000-0000-4000-8000-000000000001',
    account_id,
    income_category_id,
    100,
    0,
    100,
    null,
    0,
    user_id,
    user_id
from test_refund_edit_context;

select public.apply_transaction_item_links(
    (select ledger_id from test_refund_edit_context),
    '57242000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'refundedItemId',
        '57241000-0000-4000-8000-000000000001'
    ),
    (select user_id from test_refund_edit_context)
);

select set_config(
    'request.jwt.claim.sub',
    (select user_id::text from test_refund_edit_context),
    true
);
grant select on test_refund_edit_context to authenticated;
set local role authenticated;

select lives_ok(
    $$
        select public.update_transaction(
            (select ledger_id from test_refund_edit_context),
            '57242000-0000-4000-8000-000000000001',
            'income',
            now(),
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57242000-0000-4000-8000-000000000002',
                    'amount', 80,
                    'categoryId', (select income_category_id from test_refund_edit_context),
                    'refundedItemId', '57241000-0000-4000-8000-000000000002'
                )
            ),
            (select account_id from test_refund_edit_context),
            (select merchant_id from test_refund_edit_context),
            '编辑后'
        )
    $$,
    '退款收入编辑时可以原子重建单目标关联'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    1,
    '编辑后退款收入仍只保留一条关联'
);

select is(
    (
        select refunded_item_id
        from public.transaction_item_refund_link
        where refund_income_item_id = '57242000-0000-4000-8000-000000000002'
    ),
    '57241000-0000-4000-8000-000000000002'::uuid,
    '编辑后关联切换到新的单一目标'
);

select is(
    (
        select income_item.amount::text || '/' || link.refund_amount::text
        from public.transaction_item income_item
        join public.transaction_item_refund_link link
          on link.refund_income_item_id = income_item.id
        where income_item.id = '57242000-0000-4000-8000-000000000002'
    ),
    '80.00/80.00',
    '编辑后的退款收入金额与单目标核销金额保存成功'
);

select lives_ok(
    $$
        select public.update_transaction(
            (select ledger_id from test_refund_edit_context),
            '57242000-0000-4000-8000-000000000001',
            'income',
            now(),
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57242000-0000-4000-8000-000000000002',
                    'amount', 500,
                    'categoryId', (select income_category_id from test_refund_edit_context),
                    'refundedItemId', '57241000-0000-4000-8000-000000000002'
                )
            ),
            (select account_id from test_refund_edit_context),
            (select merchant_id from test_refund_edit_context),
            '封顶编辑'
        )
    $$,
    '编辑后收入超过目标余额时继续按 LEAST 规则封顶'
);

select is(
    (
        select link.refund_amount::text || '/' || income_item.business_net_amount::text
        from public.transaction_item_refund_link link
        join public.transaction_item_with_refund income_item
          on income_item.id = link.refund_income_item_id
        where link.refund_income_item_id = '57242000-0000-4000-8000-000000000002'
    ),
    '300.00/200.00',
    '编辑后的单目标关联按最新目标余额封顶并保留净收益'
);

select lives_ok(
    $$
        select public.update_transaction(
            (select ledger_id from test_refund_edit_context),
            '57242000-0000-4000-8000-000000000001',
            'income',
            now(),
            jsonb_build_array(
                jsonb_build_object(
                    'id', '57242000-0000-4000-8000-000000000002',
                    'amount', 500,
                    'categoryId', (select income_category_id from test_refund_edit_context)
                )
            ),
            (select account_id from test_refund_edit_context),
            (select merchant_id from test_refund_edit_context),
            '取消退款关联'
        )
    $$,
    '编辑退款收入时可以移除单目标关联'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    0,
    '解除后不再保留退款关联'
);

select * from finish();
rollback;
