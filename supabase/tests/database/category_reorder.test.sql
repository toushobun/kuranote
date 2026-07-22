begin;

set local search_path = public, extensions;

select plan(16);

insert into public.ledger (
    id,
    name,
    base_currency,
    owner_user_id,
    created_by,
    updated_by
)
values
    (
        '46900000-0000-4000-8000-000000000001',
        '分类排序测试账本',
        'JPY',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46900000-0000-4000-8000-000000000002',
        '分类排序其他账本',
        'JPY',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.ledger_member (
    id,
    ledger_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at,
    created_by,
    updated_by
)
values
    (
        '46901000-0000-4000-8000-000000000001',
        '46900000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000031',
        'owner',
        'active',
        '00000000-0000-4000-8000-000000000031',
        now(),
        now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46901000-0000-4000-8000-000000000002',
        '46900000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000034',
        'member',
        'active',
        '00000000-0000-4000-8000-000000000031',
        now(),
        now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46901000-0000-4000-8000-000000000003',
        '46900000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000031',
        'owner',
        'active',
        '00000000-0000-4000-8000-000000000031',
        now(),
        now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.category (
    id,
    ledger_id,
    parent_id,
    type,
    name,
    sort_order,
    created_by,
    updated_by
)
values
    (
        '46910000-0000-4000-8000-000000000001',
        '46900000-0000-4000-8000-000000000001',
        null,
        'expense',
        '排序支出一',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46910000-0000-4000-8000-000000000002',
        '46900000-0000-4000-8000-000000000001',
        null,
        'expense',
        '排序支出二',
        20,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46920000-0000-4000-8000-000000000001',
        '46900000-0000-4000-8000-000000000001',
        '46910000-0000-4000-8000-000000000001',
        'expense',
        '排序小类一',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46920000-0000-4000-8000-000000000002',
        '46900000-0000-4000-8000-000000000001',
        '46910000-0000-4000-8000-000000000001',
        'expense',
        '排序小类二',
        20,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46930000-0000-4000-8000-000000000001',
        '46900000-0000-4000-8000-000000000001',
        null,
        'income',
        '排序收入一',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46930000-0000-4000-8000-000000000002',
        '46900000-0000-4000-8000-000000000001',
        null,
        'income',
        '排序收入二',
        20,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '46940000-0000-4000-8000-000000000001',
        '46900000-0000-4000-8000-000000000002',
        null,
        'expense',
        '其他账本分类',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select is(
    public.reorder_categories(
        '46900000-0000-4000-8000-000000000001',
        'expense',
        null,
        array[
            '46910000-0000-4000-8000-000000000002'::uuid,
            '46910000-0000-4000-8000-000000000001'::uuid
        ]
    ),
    2,
    '大分类排序返回完整写入数量'
);

select is(
    (
        select array_agg(id order by sort_order)
        from public.category
        where ledger_id = '46900000-0000-4000-8000-000000000001'
          and type = 'expense'
          and parent_id is null
          and is_archived = false
    ),
    array[
        '46910000-0000-4000-8000-000000000002'::uuid,
        '46910000-0000-4000-8000-000000000001'::uuid
    ],
    '大分类按提交顺序保存'
);

select is(
    public.reorder_categories(
        '46900000-0000-4000-8000-000000000001',
        'expense',
        '46910000-0000-4000-8000-000000000001',
        array[
            '46920000-0000-4000-8000-000000000002'::uuid,
            '46920000-0000-4000-8000-000000000001'::uuid
        ]
    ),
    2,
    '小分类排序返回完整写入数量'
);

select is(
    (
        select array_agg(id order by sort_order)
        from public.category
        where ledger_id = '46900000-0000-4000-8000-000000000001'
          and type = 'expense'
          and parent_id = '46910000-0000-4000-8000-000000000001'
          and is_archived = false
    ),
    array[
        '46920000-0000-4000-8000-000000000002'::uuid,
        '46920000-0000-4000-8000-000000000001'::uuid
    ],
    '小分类按提交顺序保存'
);

select is(
    public.reorder_categories(
        '46900000-0000-4000-8000-000000000001',
        'income',
        null,
        array[
            '46930000-0000-4000-8000-000000000002'::uuid,
            '46930000-0000-4000-8000-000000000001'::uuid
        ]
    ),
    2,
    '收入分类可正常排序'
);

select is(
    (
        select array_agg(id order by sort_order)
        from public.category
        where ledger_id = '46900000-0000-4000-8000-000000000001'
          and type = 'income'
          and parent_id is null
          and is_archived = false
    ),
    array[
        '46930000-0000-4000-8000-000000000002'::uuid,
        '46930000-0000-4000-8000-000000000001'::uuid
    ],
    '收入分类按提交顺序保存'
);

reset role;
select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000034',
    true
);
set local role authenticated;

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            null,
            array[
                '46910000-0000-4000-8000-000000000002'::uuid,
                '46910000-0000-4000-8000-000000000001'::uuid
            ]
        )
    $$,
    '42501',
    'permission_denied',
    '普通成员不能保存分类排序'
);

reset role;
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
            array[
                '46910000-0000-4000-8000-000000000001'::uuid,
                '46910000-0000-4000-8000-000000000001'::uuid
            ]
        )
    $$,
    '22023',
    'category_order_invalid',
    '重复分类 ID 被拒绝'
);

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            null,
            array['46910000-0000-4000-8000-000000000001'::uuid]
        )
    $$,
    '22023',
    'category_set_invalid',
    '缺失分类 ID 被拒绝'
);

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            null,
            array[
                '46910000-0000-4000-8000-000000000001'::uuid,
                '46910000-0000-4000-8000-000000000002'::uuid,
                '46940000-0000-4000-8000-000000000001'::uuid
            ]
        )
    $$,
    '22023',
    'category_set_invalid',
    '其他账本的额外分类 ID 被拒绝'
);

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            null,
            array[
                '46910000-0000-4000-8000-000000000001'::uuid,
                '46910000-0000-4000-8000-000000000002'::uuid,
                '46920000-0000-4000-8000-000000000001'::uuid
            ]
        )
    $$,
    '22023',
    'category_set_invalid',
    '非同级分类 ID 被拒绝'
);

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'income',
            null,
            array[
                '46910000-0000-4000-8000-000000000001'::uuid,
                '46910000-0000-4000-8000-000000000002'::uuid
            ]
        )
    $$,
    '22023',
    'category_set_invalid',
    '错误收支类型的分类集合被拒绝'
);

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000001',
            'expense',
            '46940000-0000-4000-8000-000000000001',
            array[
                '46920000-0000-4000-8000-000000000001'::uuid,
                '46920000-0000-4000-8000-000000000002'::uuid
            ]
        )
    $$,
    '22023',
    'category_parent_invalid',
    '其他账本的上级分类被拒绝'
);

reset role;

-- 清空 jwt claim，让 ledger_member 的管理权限触发器按“未认证”分支放行本
-- 次 fixture 插入，行为与文件顶部初始 fixture 插入时一致。
select set_config('request.jwt.claim.sub', '', true);

insert into public.ledger (
    id,
    name,
    base_currency,
    owner_user_id,
    is_archived,
    archived_by,
    archived_at,
    created_by,
    updated_by
)
values
    (
        '46900000-0000-4000-8000-000000000003',
        '分类排序已归档账本',
        'JPY',
        '00000000-0000-4000-8000-000000000031',
        true,
        '00000000-0000-4000-8000-000000000031',
        now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.ledger_member (
    id,
    ledger_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at,
    created_by,
    updated_by
)
values
    (
        '46901000-0000-4000-8000-000000000004',
        '46900000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000031',
        'owner',
        'active',
        '00000000-0000-4000-8000-000000000031',
        now(),
        now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select throws_ok(
    $$
        select public.reorder_categories(
            '46900000-0000-4000-8000-000000000003',
            'expense',
            null,
            array['46910000-0000-4000-8000-000000000001'::uuid]
        )
    $$,
    'P0002',
    'ledger_not_found',
    '已归档账本的排序请求被拒绝'
);

reset role;

create function public.test_category_reorder_write_failure()
returns trigger
language plpgsql
as $$
begin
    if new.id = '46910000-0000-4000-8000-000000000001'::uuid
       and new.sort_order is distinct from old.sort_order then
        raise exception 'test_category_write_failure' using errcode = 'P0001';
    end if;

    return new;
end;
$$;

create trigger category_reorder_test_write_failure
before update of sort_order on public.category
for each row execute function public.test_category_reorder_write_failure();

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
            array[
                '46910000-0000-4000-8000-000000000001'::uuid,
                '46910000-0000-4000-8000-000000000002'::uuid
            ]
        )
    $$,
    'P0001',
    'test_category_write_failure',
    '批量写入中任一行失败时 RPC 整体失败'
);

reset role;

drop trigger category_reorder_test_write_failure on public.category;
drop function public.test_category_reorder_write_failure();

select is(
    (
        select array_agg(id order by sort_order)
        from public.category
        where ledger_id = '46900000-0000-4000-8000-000000000001'
          and type = 'expense'
          and parent_id is null
          and is_archived = false
    ),
    array[
        '46910000-0000-4000-8000-000000000002'::uuid,
        '46910000-0000-4000-8000-000000000001'::uuid
    ],
    '批量写入失败后原排序保持不变'
);

select * from finish();

rollback;
