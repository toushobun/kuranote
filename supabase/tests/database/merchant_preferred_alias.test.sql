begin;

set local search_path = public, extensions;

select plan(4);

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

select * from finish();

rollback;
