begin;

set local search_path = public, extensions;
select plan(18);

select has_function(
    'public', 'update_merchant_with_tags',
    array['uuid', 'uuid', 'text', 'text', 'text', 'text', 'uuid[]', 'text[]', 'uuid[]', 'text'],
    '商家统一保存 RPC 同时接受新增、归档别名与显示名'
);
select ok(
    not has_function('public', 'update_merchant_with_tags',
        array['uuid', 'uuid', 'text', 'text', 'text', 'text', 'uuid[]']),
    '旧的仅保存商家资料 RPC 已删除'
);

insert into public.merchant (id, ledger_id, name, sort_order, created_by, updated_by)
values
('62500000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000032',
 'LIFE超市', 0, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
('62500000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000032',
 '其他商家', 0, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

insert into public.merchant_alias (id, merchant_id, alias, is_preferred, created_by, updated_by)
values
('62500000-0000-4000-8000-000000000011', '62500000-0000-4000-8000-000000000001',
 '来福', true, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
('62500000-0000-4000-8000-000000000012', '62500000-0000-4000-8000-000000000001',
 'Life', false, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
('62500000-0000-4000-8000-000000000021', '62500000-0000-4000-8000-000000000002',
 '别家别名', false, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);

select lives_ok(
    $$
    select public.update_merchant_with_tags(
        '00000000-0000-4000-8000-000000000032',
        '62500000-0000-4000-8000-000000000001',
        'LIFE超市(新版)', null, null, '新备注', '{}'::uuid[],
        array['ライフ'], array['62500000-0000-4000-8000-000000000011']::uuid[],
        'ライフ'
    )
    $$,
    '同一事务修改资料、删除旧别名、新增别名且选择新别名'
);

select is(
    (select name from public.merchant where id = '62500000-0000-4000-8000-000000000001'),
    'LIFE超市(新版)', '资料在同一 RPC 内保存'
);
select is(
    (select note from public.merchant where id = '62500000-0000-4000-8000-000000000001'),
    '新备注', '备注与别名一并保存'
);
select is(
    (select count(*)::integer from public.merchant_alias where merchant_id = '62500000-0000-4000-8000-000000000001' and is_archived and alias = '来福'),
    1, '原别名归档'
);
select is(
    (select count(*)::integer from public.merchant_alias where merchant_id = '62500000-0000-4000-8000-000000000001' and is_preferred and alias = 'ライフ'),
    1, '新新增别名被设为唯一显示名'
);
select is(
    (select count(*)::integer from public.merchant_alias where merchant_id = '62500000-0000-4000-8000-000000000001' and is_preferred),
    1, '同一商家始终只有一个首选别名'
);

select throws_ok(
    $$
    select public.update_merchant_with_tags(
        '00000000-0000-4000-8000-000000000032',
        '62500000-0000-4000-8000-000000000001',
        '非法重复名称', null, null, null, '{}'::uuid[],
        array['重复', '重 复', '重复'], '{}'::uuid[], null
    )
    $$,
    '22023', 'merchant_alias_invalid',
    '同次新增重复别名会拒绝整个保存'
);
select is(
    (select name from public.merchant where id = '62500000-0000-4000-8000-000000000001'),
    'LIFE超市(新版)', '非法重复别名时商家名称不改变'
);

select throws_ok(
    $$
    select public.update_merchant_with_tags(
        '00000000-0000-4000-8000-000000000032',
        '62500000-0000-4000-8000-000000000001',
        '越权修改', null, null, null, '{}'::uuid[],
        '{}'::text[], array['62500000-0000-4000-8000-000000000021']::uuid[],
        null
    )
    $$,
    '22023', 'merchant_alias_invalid',
    '不能归档其他商家的别名'
);
select is(
    (select name from public.merchant where id = '62500000-0000-4000-8000-000000000001'),
    'LIFE超市(新版)', '归档对象越权时资料没有更改'
);
select is(
    (select is_archived from public.merchant_alias where id = '62500000-0000-4000-8000-000000000021'),
    false, '其他商家的别名没有被归档'
);

select throws_ok(
    $$
    select public.update_merchant_with_tags(
        '00000000-0000-4000-8000-000000000032',
        '62500000-0000-4000-8000-000000000001',
        '非法首选', null, null, null, '{}'::uuid[],
        '{}'::text[], '{}'::uuid[], '不存在的别名'
    )
    $$,
    '22023', 'merchant_preferred_invalid',
    '不能选择保存后不属于该商家的显示名'
);
select is(
    (select name from public.merchant where id = '62500000-0000-4000-8000-000000000001'),
    'LIFE超市(新版)', '首选名错误时商家资料不改变'
);
select is(
    (select count(*)::integer from public.merchant_alias where merchant_id = '62500000-0000-4000-8000-000000000001' and not is_archived and alias = 'ライフ'),
    1, '首选名错误时别名集合不改变'
);

select throws_ok(
    $$
    select public.update_merchant_with_tags(
        '00000000-0000-4000-8000-000000000032',
        '62500000-0000-4000-8000-000000000001',
        '非法重复现有', null, null, null, '{}'::uuid[],
        array['LIFE'], '{}'::uuid[], null
    )
    $$,
    '22023', 'merchant_alias_duplicate',
    '新增别名与已有有效别名只差大小写时拒绝'
);

select lives_ok(
    $$
    select public.update_merchant_with_tags(
        '00000000-0000-4000-8000-000000000032',
        '62500000-0000-4000-8000-000000000001',
        'LIFE超市(新版)', null, null, '新备注', '{}'::uuid[],
        '{}'::text[], '{}'::uuid[], null
    )
    $$,
    '选择正式名时可以清除首选别名'
);
select is(
    (select count(*)::integer from public.merchant_alias where merchant_id = '62500000-0000-4000-8000-000000000001' and is_preferred),
    0, '选中正式名不会留下首选别名'
);

reset role;
select * from finish();
rollback;
