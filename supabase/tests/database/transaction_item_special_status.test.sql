begin;

set local search_path = public, extensions;

select plan(37);

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

select has_table(
    'public',
    'transaction_item_reimbursement_link',
    '报销关联表存在'
);
select has_column(
    'public',
    'transaction_item_reimbursement_link',
    'ledger_id',
    '报销关联表包含账本列'
);
select has_column(
    'public',
    'transaction_item_reimbursement_link',
    'target_expense_item_id',
    '报销关联表包含目标支出列'
);
select has_column(
    'public',
    'transaction_item_reimbursement_link',
    'reimbursement_income_item_id',
    '报销关联表包含报销收入列'
);
select has_column(
    'public',
    'transaction_item_reimbursement_link',
    'reimbursement_amount',
    '报销关联表包含报销金额列'
);
select has_column(
    'public',
    'transaction_item_reimbursement_link',
    'created_by',
    '报销关联表包含创建人列'
);
select has_column(
    'public',
    'transaction_item_reimbursement_link',
    'created_at',
    '报销关联表包含创建时间列'
);
select is(
    (
        select c.relrowsecurity
        from pg_catalog.pg_class c
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'transaction_item_reimbursement_link'
    ),
    true,
    '报销关联表启用 RLS'
);
select is(
    (
        select count(*)::integer
        from pg_catalog.pg_constraint constraint_definition
        join pg_catalog.pg_class table_definition
          on table_definition.oid = constraint_definition.conrelid
        join pg_catalog.pg_namespace namespace_definition
          on namespace_definition.oid = table_definition.relnamespace
        where namespace_definition.nspname = 'public'
          and table_definition.relname = 'transaction_item_reimbursement_link'
          and constraint_definition.contype = 'u'
          and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
              like '%(reimbursement_income_item_id)%'
    ),
    1,
    '每条报销收入只能出现在一个报销关联中'
);
select is(
    (
        select count(*)::integer
        from pg_catalog.pg_constraint constraint_definition
        join pg_catalog.pg_class table_definition
          on table_definition.oid = constraint_definition.conrelid
        join pg_catalog.pg_namespace namespace_definition
          on namespace_definition.oid = table_definition.relnamespace
        where namespace_definition.nspname = 'public'
          and table_definition.relname = 'transaction_item_reimbursement_link'
          and constraint_definition.contype = 'c'
    ),
    2,
    '报销关联表包含正金额和明细不同两项字段级 CHECK'
);
select is(
    (
        select count(*)::integer
        from pg_catalog.pg_constraint constraint_definition
        join pg_catalog.pg_class table_definition
          on table_definition.oid = constraint_definition.conrelid
        join pg_catalog.pg_namespace namespace_definition
          on namespace_definition.oid = table_definition.relnamespace
        where namespace_definition.nspname = 'public'
          and table_definition.relname = 'transaction_item_reimbursement_link'
          and constraint_definition.contype = 'f'
          and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
              like 'FOREIGN KEY (%ledger_id%)%transaction_item(id, ledger_id)%'
    ),
    2,
    '报销关联两侧通过复合外键限制为同一账本'
);
select is(
    (
        select array_agg(
            policy_definition.policyname::text
            order by policy_definition.policyname
        )
        from pg_catalog.pg_policies policy_definition
        where policy_definition.schemaname = 'public'
          and policy_definition.tablename = 'transaction_item_reimbursement_link'
    ),
    array['transaction_item_reimbursement_link_select_active_member'],
    '报销关联表只定义账本活跃成员读取策略'
);
select ok(
    has_table_privilege(
        'authenticated',
        'public.transaction_item_with_refund',
        'select'
    ),
    '重建后的交易明细视图保留登录用户读取权限'
);
select ok(
    not has_table_privilege(
        'authenticated',
        'public.transaction_item_reimbursement_link',
        'truncate'
    ),
    '客户端不能绕过受控 RPC 清空报销关联表'
);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('59830000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    source_record.transaction_at + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 598 PR1 测试交易 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 7) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, special_status
)
values
    (
        '59840000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        'pending_reimbursement'
    ),
    (
        '59840000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        100, 0, 100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        null
    ),
    (
        '59840000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        70, 0, -70, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        null
    ),
    (
        '59840000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        80, 0, -80, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        null
    ),
    (
        '59840000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        60, 0, -60, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        null
    ),
    (
        '59840000-0000-4000-8000-000000000006',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000006',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        20, 0, 20, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        null
    ),
    (
        '59840000-0000-4000-8000-000000000007',
        '00000000-0000-4000-8000-000000000032',
        '59830000-0000-4000-8000-000000000007',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        90, 0, -90, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        'pending_reimbursement'
    );

select throws_ok(
    $$
        insert into public.transaction_item_reimbursement_link (
            ledger_id, target_expense_item_id,
            reimbursement_income_item_id, reimbursement_amount, created_by
        ) values (
            '00000000-0000-4000-8000-000000000032',
            '59840000-0000-4000-8000-000000000001',
            '59840000-0000-4000-8000-000000000002',
            0,
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '23514',
    null,
    '报销金额必须大于零'
);

select throws_ok(
    $$
        insert into public.transaction_item_reimbursement_link (
            ledger_id, target_expense_item_id,
            reimbursement_income_item_id, reimbursement_amount, created_by
        ) values (
            '00000000-0000-4000-8000-000000000032',
            '59840000-0000-4000-8000-000000000001',
            '59840000-0000-4000-8000-000000000001',
            1,
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '22023',
    'reimbursement_item_invalid',
    '同一明细不能同时作为目标和报销收入'
);

insert into public.transaction_item_reimbursement_link (
    ledger_id, target_expense_item_id,
    reimbursement_income_item_id, reimbursement_amount, created_by
)
values (
    '00000000-0000-4000-8000-000000000032',
    '59840000-0000-4000-8000-000000000001',
    '59840000-0000-4000-8000-000000000002',
    100,
    '00000000-0000-4000-8000-000000000031'
);

select set_config('kuranote.reimbursement_link_flow', 'on', true);
update public.transaction_item
set special_status = 'reimbursed'
where id = '59840000-0000-4000-8000-000000000001';
select set_config('kuranote.reimbursement_link_flow', 'off', true);

select throws_ok(
    $$
        insert into public.transaction_item_reimbursement_link (
            ledger_id, target_expense_item_id,
            reimbursement_income_item_id, reimbursement_amount, created_by
        ) values (
            '00000000-0000-4000-8000-000000000032',
            '59840000-0000-4000-8000-000000000007',
            '59840000-0000-4000-8000-000000000002',
            1,
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '23505',
    null,
    '报销收入唯一约束拒绝重复关联'
);

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select is(
    (
        select count(*)::integer
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59840000-0000-4000-8000-000000000002'
    ),
    1,
    '账本活跃成员可以读取报销关联'
);

select throws_ok(
    $$
        insert into public.transaction_item_reimbursement_link (
            ledger_id, target_expense_item_id,
            reimbursement_income_item_id, reimbursement_amount, created_by
        ) values (
            '00000000-0000-4000-8000-000000000032',
            '59840000-0000-4000-8000-000000000007',
            '59840000-0000-4000-8000-000000000002',
            1,
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '42501',
    null,
    '客户端不能直接写入报销关联表'
);

reset role;
update public.app_user
set status = 'disabled'
where id = '00000000-0000-4000-8000-000000000031';

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select is(
    (select count(*)::integer from public.transaction_item_reimbursement_link),
    0,
    '账号停用后即使账本成员仍为活跃也不能读取报销关联'
);

reset role;
update public.app_user
set status = 'active'
where id = '00000000-0000-4000-8000-000000000031';

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000037',
    true
);
set local role authenticated;

select is(
    (select count(*)::integer from public.transaction_item_reimbursement_link),
    0,
    '非账本成员不能读取报销关联'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
    $$
        update public.transaction_item
        set amount = 101
        where id = '59840000-0000-4000-8000-000000000001'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '报销目标支出不能被普通编辑'
);

select throws_ok(
    $$
        delete from public.transaction_item
        where id = '59840000-0000-4000-8000-000000000001'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '报销目标支出不能被普通删除'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = 101
        where id = '59840000-0000-4000-8000-000000000002'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '报销收入不能绕过受控流程直接编辑'
);

select lives_ok(
    $$
        update public.transaction_item
        set amount = 71,
            balance_delta = -71
        where id = '59840000-0000-4000-8000-000000000003'
    $$,
    '无关联普通明细仍可直接编辑'
);

select lives_ok(
    $$
        delete from public.transaction_item
        where id = '59840000-0000-4000-8000-000000000003'
    $$,
    '无关联普通明细仍可直接删除'
);

insert into public.transaction_item_refund_link (
    ledger_id, refunded_item_id, refund_income_item_id,
    refund_amount, created_by
)
values (
    '00000000-0000-4000-8000-000000000032',
    '59840000-0000-4000-8000-000000000005',
    '59840000-0000-4000-8000-000000000006',
    20,
    '00000000-0000-4000-8000-000000000031'
);

select throws_ok(
    $$
        update public.transaction_item
        set amount = 61
        where id = '59840000-0000-4000-8000-000000000005'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '退款目标支出仍不能被普通编辑'
);

select throws_ok(
    $$
        delete from public.transaction_item
        where id = '59840000-0000-4000-8000-000000000005'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '退款目标支出仍不能被普通删除'
);

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select throws_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            '59830000-0000-4000-8000-000000000001',
            'expense',
            now(),
            jsonb_build_array(jsonb_build_object(
                'id', '59840000-0000-4000-8000-000000000001',
                'amount', 101,
                'categoryId', '00000000-0000-4000-8000-000000005021',
                'specialStatus', 'reimbursed'
            )),
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000001001',
            null
        )
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    'update_transaction 拒绝编辑报销目标支出'
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            '59830000-0000-4000-8000-000000000004',
            'expense',
            now(),
            jsonb_build_array(jsonb_build_object(
                'id', '59840000-0000-4000-8000-000000000004',
                'amount', 81,
                'categoryId', '00000000-0000-4000-8000-000000005021',
                'specialStatus', null
            )),
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000001001',
            null
        )
    $$,
    'update_transaction 仍可编辑无关联普通明细'
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            '59830000-0000-4000-8000-000000000002',
            'income',
            now(),
            jsonb_build_array(jsonb_build_object(
                'id', '59840000-0000-4000-8000-000000000002',
                'amount', 101,
                'categoryId', '00000000-0000-4000-8000-000000005002',
                'specialStatus', null
            )),
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000001001',
            null
        )
    $$,
    '收入编辑流程会先清空报销关联再编辑收入'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select is(
    (
        select count(*)::integer
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '59840000-0000-4000-8000-000000000002'
    ),
    0,
    '收入编辑后报销关联已清空'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '59840000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '收入编辑清关联后目标支出恢复为待报销'
);

select lives_ok(
    $$
        update public.transaction_item
        set amount = 102
        where id = '59840000-0000-4000-8000-000000000001'
    $$,
    '关联清空后目标支出恢复可编辑'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link
        where refund_income_item_id =
              '59840000-0000-4000-8000-000000000006'
    ),
    1,
    '报销收入编辑不会误删其他收入的退款关联'
);

select * from finish();

rollback;
