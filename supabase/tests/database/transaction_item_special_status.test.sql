begin;

set local search_path = public, extensions;

select plan(19);

select has_type(
    'public',
    'transaction_item_special_status',
    '存在交易明细特殊状态枚举'
);

select is(
    (
        select array_agg(e.enumlabel::text order by e.enumsortorder)
        from pg_catalog.pg_enum e
        join pg_catalog.pg_type t on t.oid = e.enumtypid
        join pg_catalog.pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public'
          and t.typname = 'transaction_item_special_status'
    ),
    array['pending_reimbursement', 'reimbursed'],
    '特殊状态枚举只保留待报销和已报销'
);

select has_column('public', 'transaction_item', 'settled_by_item_id', '报销结算明细列存在');
select col_is_null('public', 'transaction_item', 'settled_by_item_id', '报销结算明细列允许为空');
select has_table('public', 'transaction_item_refund_link', '退款关联表存在');
select has_column('public', 'transaction_item_refund_link', 'refunded_item_id', '退款目标明细列存在');
select has_column('public', 'transaction_item_refund_link', 'refund_income_item_id', '退款收入明细列存在');
select has_column('public', 'transaction_item_refund_link', 'refund_amount', '退款金额列存在');
select has_column('public', 'transaction_item_refund_link', 'created_by', '退款创建人列存在');
select has_column('public', 'transaction_item_refund_link', 'created_at', '退款创建时间列存在');
select is(
    (
        select c.relrowsecurity
        from pg_catalog.pg_class c
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'transaction_item_refund_link'
    ),
    true,
    '退款关联表启用 RLS'
);
select has_view('public', 'transaction_item_with_refund', '退款实时聚合视图存在');

-- 从 seed 中克隆一条支出和三条收入明细，金额固定，便于覆盖分批退款边界。
insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '55110000-0000-4000-8000-000000000001',
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    ti.category_id,
    100,
    0,
    -100,
    null,
    (select coalesce(max(existing.sort_order), 0) + 100 from public.transaction_item existing where existing.transaction_record_id = ti.transaction_record_id),
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
join public.category c on c.id = ti.category_id and c.ledger_id = ti.ledger_id
where c.type = 'expense'
limit 1;

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '55110000-0000-4000-8000-000000000002',
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    ti.category_id,
    75,
    0,
    -75,
    null,
    ti.sort_order + 1,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55110000-0000-4000-8000-000000000001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    ('55120000-0000-4000-8000-' || lpad(row_number() over ()::text, 12, '0'))::uuid,
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    ti.category_id,
    values_to_insert.amount,
    0,
    values_to_insert.amount,
    null,
    (select coalesce(max(existing.sort_order), 0) + 200 from public.transaction_item existing where existing.transaction_record_id = ti.transaction_record_id) + row_number() over (),
    ti.created_by,
    ti.updated_by
from (
    select *
    from public.transaction_item source_item
    where exists (
        select 1 from public.category c
        where c.id = source_item.category_id
          and c.ledger_id = source_item.ledger_id
          and c.type = 'income'
    )
    limit 1
) ti
cross join (values (30::numeric), (40::numeric), (50::numeric), (50::numeric)) values_to_insert(amount);

update public.transaction_item
set special_status = 'pending_reimbursement'
where id in (
    '55110000-0000-4000-8000-000000000001',
    '55110000-0000-4000-8000-000000000002'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = 'reimbursed'
        where id = '55110000-0000-4000-8000-000000000001'
    $$,
    '42501',
    'reimbursed_transition_forbidden',
    '不能直接把待报销明细改成已报销'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000001',
            jsonb_build_object(
                'reimbursementItemIds',
                jsonb_build_array(
                    '55110000-0000-4000-8000-000000000001',
                    '55110000-0000-4000-8000-000000000002'
                )
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000001')
        )
    $$,
    '报销关联在同一事务内完成状态流转'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item
        where id in (
            '55110000-0000-4000-8000-000000000001',
            '55110000-0000-4000-8000-000000000002'
        ) and special_status = 'reimbursed'
    ),
    2,
    '一次关联的多条明细都流转为已报销'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item
        where id in (
            '55110000-0000-4000-8000-000000000001',
            '55110000-0000-4000-8000-000000000002'
        ) and settled_by_item_id = '55120000-0000-4000-8000-000000000001'
    ),
    2,
    '多对一报销关联字段都指向同一收入明细'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000002',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000002')
        );
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000003',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000003')
        )
    $$,
    '同一条支出明细支持多笔分批退款'
);

select is(
    (select refunded_amount::text from public.transaction_item_with_refund where id = '55110000-0000-4000-8000-000000000001'),
    '90.00',
    '退款金额通过关联表实时聚合'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refund_amount_exceeded',
    '超过剩余可退金额时拒绝退款关联'
);

select * from finish();

rollback;
