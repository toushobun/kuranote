begin;
set local search_path = public, extensions;
select plan(16);
insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by
) values
    (
        '73700000-0000-4000-8000-000000000001',
        '商家排序测试账本',
        'JPY',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '73700000-0000-4000-8000-000000000002',
        '商家排序其他账本',
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
        '73701000-0000-4000-8000-000000000001',
        '73700000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000031',
        'owner', 'active',
        '00000000-0000-4000-8000-000000000031', now(), now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '73701000-0000-4000-8000-000000000002',
        '73700000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000031',
        'owner', 'active',
        '00000000-0000-4000-8000-000000000031', now(), now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '73701000-0000-4000-8000-000000000003',
        '73700000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000034',
        'member', 'active',
        '00000000-0000-4000-8000-000000000031', now(), now(),
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );


insert into public.merchant (id, ledger_id, name, sort_order, created_by, updated_by) values
('73710000-0000-4000-8000-000000000001', '73700000-0000-4000-8000-000000000001', '甲', 10, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
('73710000-0000-4000-8000-000000000002', '73700000-0000-4000-8000-000000000001', '乙', 20, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
('73710000-0000-4000-8000-000000000003', '73700000-0000-4000-8000-000000000002', '其他账本', 30, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
insert into public.merchant (id, ledger_id, name, sort_order, created_by, updated_by, is_archived, archived_at, archived_by) values
('73710000-0000-4000-8000-000000000004', '73700000-0000-4000-8000-000000000001', '归档', 40, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', true, now(), '00000000-0000-4000-8000-000000000031');
select ok(not has_function_privilege('anon', 'public.reorder_merchants(uuid,uuid[])', 'execute'), '匿名角色不能执行排序');
select ok(position('pg_advisory_xact_lock(hashtext(p_ledger_id::text))' in pg_get_functiondef('public.reorder_merchants(uuid,uuid[])'::regprocedure)) > 0, '按账本获取事务级 advisory lock');
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000001']::uuid[])$$, '42501', 'auth_required', '拒绝无会话调用');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000034', true);
set local role authenticated;
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000001']::uuid[])$$, '42501', 'permission_denied', '普通成员不能排序');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', null)$$, '22023', 'merchant_order_invalid', '拒绝空数组参数');
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', '{}'::uuid[])$$, '22023', 'merchant_order_invalid', '拒绝空列表');
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array[null]::uuid[])$$, '22023', 'merchant_order_invalid', '拒绝空元素');
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000001','73710000-0000-4000-8000-000000000001']::uuid[])$$, '22023', 'merchant_order_invalid', '拒绝重复商家');
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000001']::uuid[])$$, '22023', 'merchant_set_invalid', '拒绝部分集合');
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000001','73710000-0000-4000-8000-000000000003']::uuid[])$$, '22023', 'merchant_set_invalid', '拒绝跨账本商家');
select throws_ok($$select public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000001','73710000-0000-4000-8000-000000000004']::uuid[])$$, '22023', 'merchant_set_invalid', '拒绝归档商家');

select is((select array_agg(sort_order order by id) from public.merchant where ledger_id = '73700000-0000-4000-8000-000000000001'), array[10,20,40], '失败不修改任何顺序');
select is(public.reorder_merchants('73700000-0000-4000-8000-000000000001', array['73710000-0000-4000-8000-000000000002','73710000-0000-4000-8000-000000000001']::uuid[]), 2, '完整集合成功更新两行');
select is((select array_agg(sort_order order by id) from public.merchant where ledger_id = '73700000-0000-4000-8000-000000000001'), array[1,0,40], '按提交位置从零排序且归档商家保持不变');
select is((select sort_order from public.merchant where id = '73710000-0000-4000-8000-000000000003'), 30, '其他账本顺序不变');
select is((select array_agg(name order by id) from public.merchant where ledger_id = '73700000-0000-4000-8000-000000000001'), array['甲','乙','归档'], '商家名称保持不变');
select * from finish();
rollback;
