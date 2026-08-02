begin;

set local search_path = public, extensions;

select plan(10);

select has_type(
    'public',
    'transaction_item_special_status',
    '存在交易明细特殊状态枚举'
);

select ok(
    (
        select array_agg(e.enumlabel::text order by e.enumsortorder) = array[
            'pending_reimbursement',
            'pending_refund',
            'reimbursed',
            'refunded',
            'excluded'
        ]
        from pg_catalog.pg_enum e
        join pg_catalog.pg_type t on t.oid = e.enumtypid
        join pg_catalog.pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public'
          and t.typname = 'transaction_item_special_status'
    ),
    '特殊状态枚举值及顺序正确'
);

select ok(
    exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'transaction_item'
          and column_name = 'special_status'
    ),
    '交易明细存在特殊状态字段'
);

select ok(
    (
        select is_nullable = 'YES'
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'transaction_item'
          and column_name = 'special_status'
    ),
    '特殊状态字段允许为空'
);

select ok(
    exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ledger'
          and column_name = 'transaction_item_special_status_enabled'
    ),
    '账本存在特殊状态开关'
);

select ok(
    (
        select is_nullable = 'NO'
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ledger'
          and column_name = 'transaction_item_special_status_enabled'
    ),
    '账本特殊状态开关不允许为空'
);

select ok(
    (
        select column_default = 'false'
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ledger'
          and column_name = 'transaction_item_special_status_enabled'
    ),
    '账本特殊状态开关默认关闭'
);

select ok(
    has_function_privilege(
        'authenticated',
        'public.convert_transaction_type_with_special_status(uuid, uuid, text, timestamp with time zone, text, uuid, uuid, jsonb, uuid, uuid, numeric)',
        'EXECUTE'
    ),
    '认证用户可调用支持特殊状态的交易类型转换 RPC'
);

select ok(
    exists (
        select 1
        from public.transaction_item ti
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where c.type = 'income'
          and ti.special_status is null
    ),
    'seed 中存在无特殊状态的收入明细'
);

select lives_ok(
    $$
        update public.transaction_item ti
        set special_status = null
        from public.category c
        where c.id = ti.category_id
          and c.ledger_id = ti.ledger_id
          and c.type = 'income'
          and ti.special_status is null
    $$,
    '无特殊状态的收入明细不会触发 excluded 分类校验'
);

select * from finish();

rollback;
