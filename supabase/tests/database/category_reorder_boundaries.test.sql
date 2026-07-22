begin;

set local search_path = public, extensions;

select plan(2);

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            null,
            '{}'::uuid[]
        )
    $$,
    '22023',
    'category_order_invalid',
    '空分类顺序被拒绝'
);

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            null,
            array_fill(
                '46910000-0000-4000-8000-000000000001'::uuid,
                array[201]
            )
        )
    $$,
    '22023',
    'category_order_invalid',
    '超过 200 个分类的顺序被拒绝'
);

reset role;

select * from finish();

rollback;
