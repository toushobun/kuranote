begin;

set local search_path = public, extensions;

select plan(6);

select has_column(
    'public',
    'merchant_alias',
    'is_preferred',
    '商家别名具有展示名标记'
);

select col_not_null(
    'public',
    'merchant_alias',
    'is_preferred',
    '展示名标记不能为空'
);

select has_index(
    'public',
    'merchant_alias',
    'merchant_alias_single_preferred_idx',
    '同一商家最多一个首选别名由唯一索引保证'
);

select has_function(
    'public',
    'set_merchant_preferred_alias',
    array['uuid', 'uuid', 'uuid'],
    '展示名通过事务函数原子切换'
);

insert into public.merchant (
    id, ledger_id, name, sort_order, created_by, updated_by
)
values (
    '64400000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000032',
    '首选别名测试商家',
    0,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.merchant_alias (
    id, merchant_id, alias, is_preferred, sort_order, created_by, updated_by
)
values (
    '64400000-0000-4000-8000-000000000002',
    '64400000-0000-4000-8000-000000000001',
    '首选展示名',
    true,
    0,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);

select lives_ok(
    $$
        select public.set_merchant_preferred_alias(
            '00000000-0000-4000-8000-000000000032',
            '64400000-0000-4000-8000-000000000001',
            null
        )
    $$,
    '选择正式名时可以安全清除首选别名'
);

select is(
    (
        select is_preferred
        from public.merchant_alias
        where id = '64400000-0000-4000-8000-000000000002'
    ),
    false,
    '选择正式名后会清除别名的首选标记'
);

reset role;

select * from finish();

rollback;
