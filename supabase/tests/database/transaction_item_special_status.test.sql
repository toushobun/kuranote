begin;

set local search_path = public, extensions;

select plan(65);

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

insert into public.account (
    id, ledger_id, name, type, currency, initial_balance,
    current_balance, sort_order, created_by, updated_by
)
select
    '55110100-0000-4000-8000-000000000001',
    a.ledger_id,
    '退款币种不一致测试账户',
    a.type,
    case when a.currency = 'USD' then 'JPY' else 'USD' end,
    0,
    0,
    (select coalesce(max(existing.sort_order), 0) + 1 from public.account existing where existing.ledger_id = a.ledger_id),
    a.created_by,
    a.updated_by
from public.account a
join public.transaction_item ti
  on ti.account_id = a.id
 and ti.ledger_id = a.ledger_id
where ti.id = '55110000-0000-4000-8000-000000000001';

insert into public.account (
    id, ledger_id, name, type, currency, initial_balance,
    current_balance, sort_order, created_by, updated_by
)
select
    '55110100-0000-4000-8000-000000000002',
    a.ledger_id,
    '交易类型转换测试账户',
    a.type,
    a.currency,
    0,
    0,
    (select coalesce(max(existing.sort_order), 0) + 1 from public.account existing where existing.ledger_id = a.ledger_id),
    a.created_by,
    a.updated_by
from public.account a
join public.transaction_item ti
  on ti.account_id = a.id
 and ti.ledger_id = a.ledger_id
where ti.id = '55110000-0000-4000-8000-000000000001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '55120000-0000-4000-8000-000000000005',
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    ti.category_id,
    175,
    0,
    175,
    null,
    ti.sort_order + 10,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55120000-0000-4000-8000-000000000001';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    '55130000-0000-4000-8000-000000000001',
    tr.ledger_id,
    'transfer',
    'active',
    tr.transaction_at,
    null,
    '特殊状态 NULL 比较测试',
    null,
    tr.created_by,
    tr.updated_by
from public.transaction_record tr
join public.transaction_item ti
  on ti.transaction_record_id = tr.id
 and ti.ledger_id = tr.ledger_id
where ti.id = '55110000-0000-4000-8000-000000000001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    created_by, updated_by
)
select
    '55130100-0000-4000-8000-000000000001',
    ti.ledger_id,
    '55130000-0000-4000-8000-000000000001',
    ti.account_id,
    null,
    10,
    0,
    -10,
    null,
    0,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55110000-0000-4000-8000-000000000001';

update public.ledger
set transaction_item_special_status_enabled = true
where id = (
    select ledger_id from public.transaction_item
    where id = '55110000-0000-4000-8000-000000000001'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = 'pending_reimbursement'
        where id = '55130100-0000-4000-8000-000000000001'
    $$,
    '22023',
    'special_status_invalid',
    '没有分类的转账明细不能设置为待报销'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55130100-0000-4000-8000-000000000001'),
            '55130100-0000-4000-8000-000000000001',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55130100-0000-4000-8000-000000000001')
        )
    $$,
    '22023',
    'income_link_category_invalid',
    '转账明细不能作为报销或退款收入明细'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55130100-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('refundedItemId', '55130100-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refunded_item_invalid',
    '转账明细不能作为被退款支出明细'
);

update public.ledger
set transaction_item_special_status_enabled = false
where id = (
    select ledger_id from public.transaction_item
    where id = '55110000-0000-4000-8000-000000000001'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = 'pending_reimbursement'
        where id = '55120000-0000-4000-8000-000000000004'
    $$,
    '22023',
    'special_status_invalid',
    '账本关闭特殊状态后数据库触发器拒绝写入状态'
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
    'special_status_invalid',
    '账本关闭特殊状态后数据库函数拒绝建立关联'
);

update public.ledger
set transaction_item_special_status_enabled = true
where id = (
    select ledger_id from public.transaction_item
    where id = '55110000-0000-4000-8000-000000000001'
);

update public.transaction_item
set special_status = 'pending_reimbursement'
where id in (
    '55110000-0000-4000-8000-000000000001',
    '55110000-0000-4000-8000-000000000002'
);

select throws_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = (
            select ledger_id from public.transaction_item
            where id = '55110000-0000-4000-8000-000000000001'
        )
    $$,
    '55006',
    'special_status_has_active_items',
    '账本存在待报销明细时不能关闭特殊状态功能'
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

select throws_ok(
    $$
        update public.transaction_item
        set special_status = 'reimbursed',
            settled_by_item_id = '55120000-0000-4000-8000-000000000001'
        where id = '55110000-0000-4000-8000-000000000001'
    $$,
    '42501',
    'reimbursed_transition_forbidden',
    '不能通过同时设置结算明细绕过报销关联流程'
);

select throws_ok(
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
    '22023',
    'reimbursement_amount_mismatch',
    '报销收入金额与待报销明细合计不一致时拒绝关联'
);

update public.transaction_item
set account_id = '55110100-0000-4000-8000-000000000001'
where id = '55120000-0000-4000-8000-000000000005';

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'reimbursementItemIds',
                jsonb_build_array(
                    '55110000-0000-4000-8000-000000000001',
                    '55110000-0000-4000-8000-000000000002'
                )
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000005')
        )
    $$,
    '22023',
    'reimbursement_currency_mismatch',
    '报销收入与待报销明细币种不一致时拒绝关联'
);

update public.transaction_item
set account_id = (
    select account_id
    from public.transaction_item
    where id = '55110000-0000-4000-8000-000000000001'
)
where id = '55120000-0000-4000-8000-000000000005';

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000005',
            jsonb_build_object(
                'reimbursementItemIds',
                jsonb_build_array(
                    '55110000-0000-4000-8000-000000000001',
                    '55110000-0000-4000-8000-000000000002'
                )
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000005')
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

select throws_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = (
            select ledger_id from public.transaction_item
            where id = '55110000-0000-4000-8000-000000000001'
        )
    $$,
    '55006',
    'special_status_has_active_items',
    '账本存在已报销明细时不能关闭特殊状态功能'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item
        where id in (
            '55110000-0000-4000-8000-000000000001',
            '55110000-0000-4000-8000-000000000002'
        ) and settled_by_item_id = '55120000-0000-4000-8000-000000000005'
    ),
    2,
    '多对一报销关联字段都指向同一收入明细'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = null,
            settled_by_item_id = null
        where id = '55110000-0000-4000-8000-000000000001'
    $$,
    '42501',
    'reimbursed_transition_forbidden',
    '不能直接清空已报销明细的状态和结算关联'
);

select set_config(
    'request.jwt.claim.sub',
    (select created_by::text from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
    true
);
set local role authenticated;

select throws_ok(
    $$
        select public.update_transaction(
            (select ledger_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            (select transaction_record_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            'expense',
            now(),
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'amount', ti.amount,
                        'categoryId', ti.category_id,
                        'id', ti.id,
                        'refundedItemId', (
                            select link.refunded_item_id
                            from public.transaction_item_refund_link link
                            where link.refund_income_item_id = ti.id
                        ),
                        'reimbursementItemIds', coalesce((
                            select jsonb_agg(settled_item.id order by settled_item.id)
                            from public.transaction_item settled_item
                            where settled_item.settled_by_item_id = ti.id
                        ), '[]'::jsonb),
                        'specialStatus', ti.special_status
                    )
                    order by ti.sort_order, ti.id
                )
                from public.transaction_item ti
                where ti.transaction_record_id = (
                    select transaction_record_id
                    from public.transaction_item
                    where id = '55120000-0000-4000-8000-000000000005'
                )
            ),
            (select account_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            (
                select tr.merchant_id
                from public.transaction_record tr
                join public.transaction_item ti on ti.transaction_record_id = tr.id
                where ti.id = '55120000-0000-4000-8000-000000000005'
            ),
            null
        )
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '完整前端 payload 不能绕过普通编辑流程的收入关联保护'
);

select lives_ok(
    $$
        select public.update_transaction(
            (select ledger_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            (select transaction_record_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            'income',
            now(),
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'amount', ti.amount,
                        'categoryId', ti.category_id,
                        'id', ti.id,
                        'refundedItemId', (
                            select link.refunded_item_id
                            from public.transaction_item_refund_link link
                            where link.refund_income_item_id = ti.id
                        ),
                        'reimbursementItemIds', coalesce((
                            select jsonb_agg(settled_item.id order by settled_item.id)
                            from public.transaction_item settled_item
                            where settled_item.settled_by_item_id = ti.id
                        ), '[]'::jsonb),
                        'specialStatus', ti.special_status
                    )
                    order by ti.sort_order, ti.id
                )
                from public.transaction_item ti
                where ti.transaction_record_id = (
                    select transaction_record_id
                    from public.transaction_item
                    where id = '55120000-0000-4000-8000-000000000005'
                )
            ),
            (select account_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            (
                select tr.merchant_id
                from public.transaction_record tr
                join public.transaction_item ti on ti.transaction_record_id = tr.id
                where ti.id = '55120000-0000-4000-8000-000000000005'
            ),
            null
        )
    $$,
    '收入编辑流程可以使用完整前端 payload 维护既有关联'
);

select throws_ok(
    $$
        select public.void_transaction(
            (select ledger_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
            (select transaction_record_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005')
        )
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '结算其他明细的收入交易不能作废'
);

select throws_ok(
    $$
        select public.convert_transaction_type(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            (select transaction_record_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            'transfer',
            now(),
            null,
            null,
            null,
            null,
            (select account_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55110100-0000-4000-8000-000000000002',
            100
        )
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已关联交易不能通过类型转换删除明细'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

-- 创建确定性的其他账本支出明细，避免依赖 seed 是否包含跨账本交易。
insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by
) values (
    '55190000-0000-4000-8000-000000000001',
    '跨账本退款测试',
    'JPY',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.account (
    id, ledger_id, name, type, currency, initial_balance,
    current_balance, sort_order, created_by, updated_by
) values (
    '55190100-0000-4000-8000-000000000001',
    '55190000-0000-4000-8000-000000000001',
    '跨账本测试账户',
    'cash',
    'JPY',
    0,
    0,
    0,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.category (
    id, ledger_id, parent_id, type, name, sort_order,
    created_by, updated_by
) values
    (
        '55190200-0000-4000-8000-000000000001',
        '55190000-0000-4000-8000-000000000001',
        null,
        'expense',
        '跨账本支出',
        0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '55190200-0000-4000-8000-000000000002',
        '55190000-0000-4000-8000-000000000001',
        '55190200-0000-4000-8000-000000000001',
        'expense',
        '跨账本支出明细',
        0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.merchant (
    id, ledger_id, name, sort_order, created_by, updated_by
) values (
    '55190250-0000-4000-8000-000000000001',
    '55190000-0000-4000-8000-000000000001',
    '跨账本测试商家',
    0,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
) values (
    '55190300-0000-4000-8000-000000000001',
    '55190000-0000-4000-8000-000000000001',
    'normal',
    'active',
    now(),
    '55190250-0000-4000-8000-000000000001',
    '跨账本退款测试记录',
    null,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    created_by, updated_by
) values (
    '55190400-0000-4000-8000-000000000001',
    '55190000-0000-4000-8000-000000000001',
    '55190300-0000-4000-8000-000000000001',
    '55190100-0000-4000-8000-000000000001',
    '55190200-0000-4000-8000-000000000002',
    100,
    0,
    -100,
    null,
    0,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '55190000-0000-4000-8000-000000000001';

select lives_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = '55190000-0000-4000-8000-000000000001'
    $$,
    '账本没有特殊状态明细时可以关闭特殊状态功能'
);

select lives_ok(
    $$
        update public.ledger
        set transaction_item_special_status_enabled = false
        where id = '55190000-0000-4000-8000-000000000001'
    $$,
    '特殊状态功能已关闭时重复保存 false 不触发校验'
);

select lives_ok(
    $$
        update public.ledger
        set name = '跨账本普通设置更新测试',
            base_currency = 'USD'
        where id = '55190000-0000-4000-8000-000000000001'
    $$,
    '不修改特殊状态开关时普通账本设置更新不受影响'
);

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000034',
    true
);
set local role authenticated;

select is(
    (
        select count(*)::integer
        from public.load_transaction_group_summaries_with_special_status(
            '55190000-0000-4000-8000-000000000001',
            'merchant'
        )
    ),
    0,
    '非账本成员不能读取特殊状态交易分组汇总'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'refundedItemId', '55190400-0000-4000-8000-000000000001'
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refunded_item_invalid',
    '跨账本伪造退款目标明细时拒绝关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemIds',
                jsonb_build_array('55190400-0000-4000-8000-000000000001')
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    'P0001',
    'reimbursement_item_invalid',
    '跨账本伪造待报销明细时拒绝关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemIds',
                jsonb_build_array('55110000-0000-4000-8000-000000000001')
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    'P0001',
    'reimbursement_item_invalid',
    '已报销明细不能被重复关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemIds',
                jsonb_build_array('55110000-0000-4000-8000-000000000001'),
                'refundedItemId',
                '55110000-0000-4000-8000-000000000001'
            ),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'income_link_conflict',
    '同一收入明细不能同时设置报销和退款关联'
);

-- 退款关联专用的两条独立支出明细：001/002 在上面的流程中已经走完报销，
-- 退款机制本身（分批累计、超额、币种）改用未报销的明细验证，
-- 避免同一笔支出被同时判定为已报销又建立退款关联。
insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '55110000-0000-4000-8000-000000000003',
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
where ti.id = '55110000-0000-4000-8000-000000000001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '55110000-0000-4000-8000-000000000004',
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    ti.category_id,
    75,
    0,
    -75,
    null,
    (select coalesce(max(existing.sort_order), 0) + 100 from public.transaction_item existing where existing.transaction_record_id = ti.transaction_record_id),
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55110000-0000-4000-8000-000000000002';

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000002',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000002')
        )
    $$,
    '22023',
    'refunded_item_special_status_conflict',
    '已报销的支出明细不能再建立退款关联'
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000003'),
            '55120000-0000-4000-8000-000000000002',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000003'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000002')
        );
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000003'),
            '55120000-0000-4000-8000-000000000003',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000003'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000003')
        )
    $$,
    '同一条支出明细支持多笔分批退款'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = 'pending_reimbursement'
        where id = '55110000-0000-4000-8000-000000000003'
    $$,
    '22023',
    'special_status_refund_conflict',
    '已建立退款关联的支出明细不能再标记为待报销'
);

select is(
    (select refunded_amount::text from public.transaction_item_with_refund where id = '55110000-0000-4000-8000-000000000003'),
    '90.00',
    '退款金额通过关联表实时聚合'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000003'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000003'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refund_amount_exceeded',
    '超过剩余可退金额时拒绝退款关联'
);

update public.transaction_item
set account_id = '55110100-0000-4000-8000-000000000001'
where id = '55120000-0000-4000-8000-000000000004';

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000004'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000004'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refund_currency_mismatch',
    '退款收入与被退款支出账户币种不一致时拒绝关联'
);

select set_config(
    'request.jwt.claim.sub',
    (select created_by::text from public.transaction_item where id = '55120000-0000-4000-8000-000000000004'),
    true
);
set local role authenticated;

select throws_ok(
    $$
        update public.transaction_item
        set amount = amount + 1
        where id = '55110000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已报销明细不能直接修改金额'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = amount + 1
        where id = '55120000-0000-4000-8000-000000000005'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '结算其他明细的收入明细不能直接修改金额'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = amount + 1
        where id = '55110000-0000-4000-8000-000000000003'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已建立退款关联的支出明细不能直接修改金额'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = amount + 1
        where id = '55120000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已建立退款关联的收入明细不能直接修改金额'
);

select throws_ok(
    $$
        update public.transaction_item
        set category_id = null
        where id = '55110000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已报销的支出明细不能直接修改分类'
);

select throws_ok(
    $$
        update public.transaction_item
        set account_id = '55110100-0000-4000-8000-000000000002'
        where id = '55110000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已报销的支出明细不能直接修改账户'
);

select throws_ok(
    $$
        update public.transaction_item
        set category_id = null
        where id = '55110000-0000-4000-8000-000000000003'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已建立退款关联的支出明细不能直接修改分类'
);

select throws_ok(
    $$
        update public.transaction_item
        set account_id = '55110100-0000-4000-8000-000000000002'
        where id = '55110000-0000-4000-8000-000000000003'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已建立退款关联的支出明细不能直接修改账户'
);

select throws_ok(
    $$
        update public.transaction_item
        set category_id = null
        where id = '55120000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已作为退款收入的收入明细不能直接修改分类'
);

select throws_ok(
    $$
        update public.transaction_item
        set account_id = '55110100-0000-4000-8000-000000000002'
        where id = '55120000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '已作为退款收入的收入明细不能直接修改账户'
);

select lives_ok(
    $$
        update public.transaction_item
        set amount = amount + 1
        where id = '55120000-0000-4000-8000-000000000004'
    $$,
    '未关联的普通明细仍可直接修改金额'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

update public.app_user
set status = 'disabled'
where id = (
    select created_by
    from public.transaction_item
    where id = '55120000-0000-4000-8000-000000000002'
);

select set_config(
    'request.jwt.claim.sub',
    (select created_by::text from public.transaction_item where id = '55120000-0000-4000-8000-000000000002'),
    true
);
set local role authenticated;

select is(
    (select count(*)::integer from public.transaction_item_refund_link),
    0,
    '被停用用户即使账本成员仍为 active 也不能读取退款关联'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

-- 评审回归：作废目标、跨账户退款和功能开关。
insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, deleted_at, deleted_by, created_by, updated_by
)
select
    '55193000-0000-4000-8000-000000000001',
    tr.ledger_id,
    'normal',
    'deleted',
    tr.transaction_at,
    tr.merchant_id,
    '已作废关联目标',
    null,
    now(),
    tr.created_by,
    tr.created_by,
    tr.updated_by
from public.transaction_record tr
join public.transaction_item ti on ti.transaction_record_id = tr.id
where ti.id = '55110000-0000-4000-8000-000000000001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    '55193100-0000-4000-8000-000000000001',
    ti.ledger_id,
    '55193000-0000-4000-8000-000000000001',
    ti.account_id,
    ti.category_id,
    20,
    0,
    -20,
    null,
    0,
    'pending_reimbursement',
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55110000-0000-4000-8000-000000000001';

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55193100-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('reimbursementItemIds', jsonb_build_array('55193100-0000-4000-8000-000000000001')),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    'P0001',
    'reimbursement_item_invalid',
    '已作废支出不能再建立报销关联'
);

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55193100-0000-4000-8000-000000000001'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('refundedItemId', '55193100-0000-4000-8000-000000000001'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refunded_item_invalid',
    '已作废支出不能再建立退款关联'
);

update public.transaction_item
set account_id = '55110100-0000-4000-8000-000000000002'
where id = '55120000-0000-4000-8000-000000000004';

select throws_ok(
    $$
        select public.apply_transaction_item_links(
            (select ledger_id from public.transaction_item where id = '55110000-0000-4000-8000-000000000003'),
            '55120000-0000-4000-8000-000000000004',
            jsonb_build_object('refundedItemId', '55110000-0000-4000-8000-000000000003'),
            (select created_by from public.transaction_item where id = '55120000-0000-4000-8000-000000000004')
        )
    $$,
    '22023',
    'refund_account_mismatch',
    '同币种不同账户不能建立退款关联'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

update public.app_user
set status = 'active'
where id = (
    select created_by
    from public.transaction_item
    where id = '55120000-0000-4000-8000-000000000005'
);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    fixture.id,
    tr.ledger_id,
    'normal',
    'active',
    tr.transaction_at,
    tr.merchant_id,
    fixture.title,
    null,
    tr.created_by,
    tr.updated_by
from public.transaction_record tr
join public.transaction_item ti on ti.transaction_record_id = tr.id
cross join (values
    ('57900000-0000-4000-8000-000000000001'::uuid, '删除明细 ID 保留测试'),
    ('57900000-0000-4000-8000-000000000002'::uuid, '混合明细重排测试'),
    ('57900000-0000-4000-8000-000000000003'::uuid, '报销目标测试')
) fixture(id, title)
where ti.id = '55120000-0000-4000-8000-000000000005';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    '57910000-0000-4000-8000-000000000001',
    ti.ledger_id,
    '57900000-0000-4000-8000-000000000001',
    ti.account_id,
    ti.category_id,
    10,
    0,
    10,
    null,
    0,
    null,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55120000-0000-4000-8000-000000000005';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    '57910000-0000-4000-8000-000000000002',
    ti.ledger_id,
    '57900000-0000-4000-8000-000000000001',
    ti.account_id,
    ti.category_id,
    50,
    0,
    50,
    null,
    1,
    null,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55120000-0000-4000-8000-000000000005';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    '57920000-0000-4000-8000-000000000001',
    ti.ledger_id,
    '57900000-0000-4000-8000-000000000003',
    (select account_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
    ti.category_id,
    50,
    0,
    -50,
    null,
    0,
    'pending_reimbursement',
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55110000-0000-4000-8000-000000000001';

select public.apply_transaction_item_links(
    (select ledger_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000002'),
    '57910000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'reimbursementItemIds',
        jsonb_build_array('57920000-0000-4000-8000-000000000001')
    ),
    (select created_by from public.transaction_item where id = '57910000-0000-4000-8000-000000000002')
);

select set_config(
    'request.jwt.claim.sub',
    (select created_by::text from public.transaction_item where id = '57910000-0000-4000-8000-000000000002'),
    true
);
set local role authenticated;

select public.update_transaction(
    (select ledger_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000002'),
    '57900000-0000-4000-8000-000000000001',
    'income',
    now(),
    jsonb_build_array(jsonb_build_object(
        'amount', 50,
        'categoryId', (select category_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000002'),
        'id', '57910000-0000-4000-8000-000000000002',
        'refundedItemId', null,
        'reimbursementItemIds', jsonb_build_array('57920000-0000-4000-8000-000000000001'),
        'specialStatus', null
    )),
    (select account_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000002'),
    (select merchant_id from public.transaction_record where id = '57900000-0000-4000-8000-000000000001'),
    null
);

select is(
    (select count(*)::integer from public.transaction_item where id = '57910000-0000-4000-8000-000000000002'),
    1,
    '删除前置明细后保留关联收入明细的原 ID'
);

select is(
    (select settled_by_item_id from public.transaction_item where id = '57920000-0000-4000-8000-000000000001'),
    '57910000-0000-4000-8000-000000000002'::uuid,
    '删除前置明细后报销关联仍指向原收入明细 ID'
);

select is(
    (select count(*)::integer from public.transaction_item where id = '57910000-0000-4000-8000-000000000001'),
    0,
    '被删除的普通明细没有变成保留明细的数据载体'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    '57910000-0000-4000-8000-000000000003',
    ti.ledger_id,
    '57900000-0000-4000-8000-000000000002',
    ti.account_id,
    ti.category_id,
    60,
    0,
    60,
    null,
    0,
    null,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55120000-0000-4000-8000-000000000005';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, note, sort_order,
    special_status, created_by, updated_by
)
select
    '57910000-0000-4000-8000-000000000004',
    ti.ledger_id,
    '57900000-0000-4000-8000-000000000002',
    (select account_id from public.transaction_item where id = '55120000-0000-4000-8000-000000000005'),
    ti.category_id,
    20,
    0,
    -20,
    null,
    1,
    null,
    ti.created_by,
    ti.updated_by
from public.transaction_item ti
where ti.id = '55110000-0000-4000-8000-000000000001';

select set_config(
    'request.jwt.claim.sub',
    (select created_by::text from public.transaction_item where id = '57910000-0000-4000-8000-000000000003'),
    true
);
set local role authenticated;

select public.update_transaction(
    (select ledger_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000003'),
    '57900000-0000-4000-8000-000000000002',
    'expense',
    now(),
    jsonb_build_array(
        jsonb_build_object(
            'amount', 20,
            'categoryId', (select category_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000004'),
            'id', '57910000-0000-4000-8000-000000000004',
            'refundedItemId', null,
            'reimbursementItemIds', jsonb_build_array(),
            'specialStatus', null
        ),
        jsonb_build_object(
            'amount', 60,
            'categoryId', (select category_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000003'),
            'id', '57910000-0000-4000-8000-000000000003',
            'refundedItemId', null,
            'reimbursementItemIds', jsonb_build_array(),
            'specialStatus', null
        )
    ),
    (select account_id from public.transaction_item where id = '57910000-0000-4000-8000-000000000003'),
    (select merchant_id from public.transaction_record where id = '57900000-0000-4000-8000-000000000002'),
    null
);

select is(
    (select amount::text from public.transaction_item where id = '57910000-0000-4000-8000-000000000003'),
    '60.00',
    '混合明细按类型重排提交后收入数据仍保留在原 ID'
);

select is(
    (select amount::text from public.transaction_item where id = '57910000-0000-4000-8000-000000000004'),
    '20.00',
    '混合明细按类型重排提交后支出数据仍保留在原 ID'
);

select * from finish();

rollback;
