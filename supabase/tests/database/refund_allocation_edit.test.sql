begin;

set local search_path = public, extensions;

select plan(8);

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
        'refundAllocations',
        jsonb_build_array(
            jsonb_build_object(
                'refundedItemId', '57241000-0000-4000-8000-000000000001',
                'refundAmount', 25
            ),
            jsonb_build_object(
                'refundedItemId', '57241000-0000-4000-8000-000000000002',
                'refundAmount', 75
            )
        )
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
                    'refundAllocations', jsonb_build_array(
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000001',
                            'refundAmount', 20
                        ),
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000002',
                            'refundAmount', 60
                        )
                    )
                )
            ),
            (select account_id from test_refund_edit_context),
            (select merchant_id from test_refund_edit_context),
            '编辑后'
        )
    $$,
    '退款收入编辑时可以原子重建分摊'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    2,
    '编辑后只保留新建的两条退款分摊'
);

select is(
    (
        select string_agg(link.refund_amount::text, ',' order by link.refunded_item_id)
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    '20.00,60.00',
    '编辑后按新金额重新分摊'
);

select is(
    (
        select amount
        from public.transaction_item
        where transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    80::numeric,
    '编辑后的退款收入金额保存成功'
);

select throws_ok(
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
                    'refundAllocations', jsonb_build_array(
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000001',
                            'refundAmount', 125
                        ),
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000002',
                            'refundAmount', 375
                        )
                    )
                )
            ),
            (select account_id from test_refund_edit_context),
            (select merchant_id from test_refund_edit_context),
            '无效编辑'
        )
    $$,
    '22023',
    'refund_amount_exceeded',
    '编辑时超过剩余可退金额会拒绝'
);

select is(
    (
        select income_item.amount::text || '/' ||
               coalesce(string_agg(link.refund_amount::text, ',' order by link.refunded_item_id), '')
        from public.transaction_item income_item
        left join public.transaction_item_refund_link link
          on link.refund_income_item_id = income_item.id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
        group by income_item.amount
    ),
    '80.00/20.00,60.00',
    '无效编辑回滚后保留原金额和原分摊'
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
                    'amount', 80,
                    'categoryId', (select income_category_id from test_refund_edit_context)
                )
            ),
            (select account_id from test_refund_edit_context),
            (select merchant_id from test_refund_edit_context),
            '取消退款关联'
        )
    $$,
    '编辑退款收入时可以移除全部分摊'
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
    '移除后不再保留退款分摊'
);

select * from finish();
rollback;
