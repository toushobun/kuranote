begin;

set local search_path = public, extensions;

select plan(27);

select has_table('public', 'merchant_tags', '商家标签表存在');
select has_table('public', 'merchant_tag_links', '商家标签关联表存在');
select ok(
    (select relrowsecurity from pg_class where oid = 'public.merchant_tags'::regclass),
    '商家标签表启用 RLS'
);
select ok(
    (select relrowsecurity from pg_class where oid = 'public.merchant_tag_links'::regclass),
    '商家标签关联表启用 RLS'
);
select ok(
    not has_table_privilege('anon', 'public.merchant_tags', 'select')
    and not has_table_privilege('anon', 'public.merchant_tag_links', 'select'),
    '未登录角色不能读取商家标签及关联'
);
select ok(
    not has_table_privilege('authenticated', 'public.merchant_tags', 'truncate')
    and not has_table_privilege('authenticated', 'public.merchant_tag_links', 'truncate'),
    '登录角色不能绕过受控流程清空商家标签及关联'
);
select ok(
    has_column_privilege('authenticated', 'public.merchant_tags', 'name', 'update')
    and has_column_privilege('authenticated', 'public.merchant_tags', 'icon', 'update')
    and not has_column_privilege('authenticated', 'public.merchant_tags', 'ledger_id', 'update')
    and not has_column_privilege('authenticated', 'public.merchant_tags', 'sort_order', 'update')
    and not has_column_privilege('authenticated', 'public.merchant_tags', 'is_archived', 'update'),
    '登录角色只能直接更新标签名称和图标'
);
select ok(
    position(
        'perform pg_advisory_xact_lock(hashtext(p_ledger_id::text));'
        in pg_get_functiondef('public.reorder_merchant_tags(uuid,uuid[])'::regprocedure)
    ) > 0,
    '商家标签排序仅按目标账本获取事务级 advisory lock'
);
select ok(
    position(
        'lock table public.merchant_tags'
        in pg_get_functiondef('public.reorder_merchant_tags(uuid,uuid[])'::regprocedure)
    ) = 0,
    '商家标签排序不再获取全表锁'
);
select ok(
    position(
        'perform pg_advisory_xact_lock(hashtext(p_ledger_id::text));'
        in pg_get_functiondef('public.create_merchant_tag(uuid,text,text)'::regprocedure)
    ) > 0,
    '新建商家标签按目标账本获取事务级 advisory lock'
);

insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by
) values
    (
        '65100000-0000-4000-8000-000000000001',
        '商家标签测试账本',
        'JPY',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '65100000-0000-4000-8000-000000000002',
        '商家标签其他账本',
        'JPY',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.ledger_member (
    id, ledger_id, user_id, role, status, invited_by, invited_at,
    joined_at, created_by, updated_by
) values
    (
        '65101000-0000-4000-8000-000000000001',
        '65100000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000031',
        'owner', 'active',
        '00000000-0000-4000-8000-000000000031', now(), now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '65101000-0000-4000-8000-000000000002',
        '65100000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000031',
        'owner', 'active',
        '00000000-0000-4000-8000-000000000031', now(), now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '65101000-0000-4000-8000-000000000003',
        '65100000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000034',
        'member', 'active',
        '00000000-0000-4000-8000-000000000031', now(), now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

select public.initialize_ledger_default_data(
    '65100000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000031'
);

select is(
    (
        select count(*)::integer
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and is_archived = false
    ),
    8,
    '新账本初始化八个默认商家标签'
);

select is(
    (
        select array_agg(name order by sort_order)
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and is_archived = false
    ),
    array['超市', '便利店', '餐饮', '百货店', '电商', '旅行', '通讯', '生活'],
    '默认商家标签名称和顺序正确'
);

insert into public.merchant_tags (
    id, ledger_id, name, icon, sort_order, is_archived, archived_at,
    archived_by, created_by
) values (
    '65110000-0000-4000-8000-000000000001',
    '65100000-0000-4000-8000-000000000001',
    '已归档标签', '📁', 99, true, now(),
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
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
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and is_archived = false
    ),
    8,
    '普通成员可以读取当前账本商家标签'
);

select is(
    (
        select count(*)::integer
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and is_archived = true
    ),
    0,
    '普通成员不能读取已归档商家标签'
);

select throws_ok(
    $$
        insert into public.merchant_tags (
            ledger_id, name, icon, sort_order, created_by
        ) values (
            '65100000-0000-4000-8000-000000000001',
            '普通成员标签', '🏷️', 99,
            '00000000-0000-4000-8000-000000000034'
        )
    $$,
    '42501',
    'permission_denied',
    '普通成员不能直接新增商家标签'
);

select throws_ok(
    $$
        select public.create_merchant_with_tags(
            '65100000-0000-4000-8000-000000000001',
            '普通成员商家', null, null, '{}'::uuid[]
        )
    $$,
    '42501',
    'permission_denied',
    '普通成员不能通过 RPC 新增商家'
);

select throws_ok(
    $$
        select public.create_merchant_tag(
            '65100000-0000-4000-8000-000000000001',
            '普通成员标签', '🏷️'
        )
    $$,
    '42501',
    'permission_denied',
    '普通成员不能通过 RPC 新增商家标签'
);

select is_empty(
    $$
        update public.merchant_tags
           set name = '普通成员改名'
         where ledger_id = '65100000-0000-4000-8000-000000000001'
        returning id
    $$,
    '普通成员不能更新商家标签'
);

reset role;

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select is(
    public.reorder_merchant_tags(
        '65100000-0000-4000-8000-000000000001',
        array(
            select id
            from public.merchant_tags
            where ledger_id = '65100000-0000-4000-8000-000000000001'
              and is_archived = false
            order by sort_order desc
        )
    ),
    8,
    '商家标签排序返回完整写入数量'
);

select is(
    (
        select name
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and is_archived = false
        order by sort_order
        limit 1
    ),
    '生活',
    '商家标签按提交顺序保存'
);

select ok(
    public.create_merchant_tag(
        '65100000-0000-4000-8000-000000000001',
        '原子排序标签', '🏷️'
    ) is not null,
    '管理员可以通过 RPC 新增商家标签'
);

select is(
    (
        select sort_order
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and name = '原子排序标签'
    ),
    8,
    '新建商家标签在锁内使用下一个排序值'
);

reset role;

insert into public.merchant_tags (
    id, ledger_id, name, icon, sort_order, created_by
) values (
    '65110000-0000-4000-8000-000000000002',
    '65100000-0000-4000-8000-000000000002',
    '其他账本标签', '🏷️', 0,
    '00000000-0000-4000-8000-000000000031'
);

insert into public.merchant (
    id, ledger_id, name, sort_order, created_by, updated_by
) values
    (
        '65120000-0000-4000-8000-000000000001',
        '65100000-0000-4000-8000-000000000001',
        '关联测试商家', 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

select throws_ok(
    $$
        insert into public.merchant_tag_links (merchant_id, tag_id)
        values (
            '65120000-0000-4000-8000-000000000001',
            '65110000-0000-4000-8000-000000000002'
        )
    $$,
    '22023',
    'merchant_tag_link_invalid',
    '跨账本商家标签关联被拒绝'
);

insert into public.merchant_tag_links (merchant_id, tag_id)
select
    '65120000-0000-4000-8000-000000000001',
    mt.id
from public.merchant_tags mt
where mt.ledger_id = '65100000-0000-4000-8000-000000000001'
  and mt.name = '超市'
  and mt.is_archived = false;

select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000031',
    true
);
set local role authenticated;

select is(
    public.archive_merchant_tag(
        '65100000-0000-4000-8000-000000000001',
        (
            select id
            from public.merchant_tags
            where ledger_id = '65100000-0000-4000-8000-000000000001'
              and name = '超市'
              and is_archived = false
        )
    ),
    true,
    '归档商家标签成功'
);

reset role;

select is(
    (
        select count(*)::integer
        from public.merchant_tag_links
        where merchant_id = '65120000-0000-4000-8000-000000000001'
    ),
    0,
    '归档标签同时物理删除关联'
);

select is(
    (
        select count(*)::integer
        from public.merchant_tags
        where ledger_id = '65100000-0000-4000-8000-000000000001'
          and name = '超市'
          and is_archived = true
          and archived_at is not null
          and archived_by = '00000000-0000-4000-8000-000000000031'
    ),
    1,
    '标签使用审计字段软归档'
);

select is(
    (
        select count(*)::integer
        from public.merchant_tags mt
        where mt.ledger_id = '65100000-0000-4000-8000-000000000001'
          and mt.is_archived = false
    ),
    8,
    '归档后只影响目标标签'
);

select * from finish();

rollback;
