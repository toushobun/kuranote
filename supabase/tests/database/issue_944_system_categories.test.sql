begin;

set local search_path = public, extensions;

select plan(17);

-- seed 账本使用确定的分类层级，系统分类的 UUID 由数据库生成。
select is(
  (select count(*)::integer from public.category
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key is not null),
  3,
  'seed 账本恰好有三个系统分类'
);

select is(
  (select count(*)::integer from public.category child
    join public.category root on root.id = child.parent_id
    where child.ledger_id = '00000000-0000-4000-8000-000000000032'
      and root.system_key = 'special_income'
      and child.system_key in ('refund', 'reimbursement')),
  2,
  '退款与报销属于特殊收入大分类'
);

select lives_ok(
  $$select public.initialize_ledger_system_categories(
    '00000000-0000-4000-8000-000000000032',
    '00000000-0000-4000-8000-000000000031'
  )$$,
  '重复初始化系统分类不报错'
);

select is(
  (select count(*)::integer from public.category
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key is not null),
  3,
  '重复初始化不会创建重复行'
);

select throws_ok(
  $$update public.category set name = '📄 改名'
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key = 'refund'$$,
  '22023', 'category_system_locked',
  '系统退款分类禁止改名'
);

select throws_ok(
  $$update public.category set icon_name = '✨'
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key = 'reimbursement'$$,
  '22023', 'category_system_locked',
  '系统报销分类禁止改图标'
);

select throws_ok(
  $$update public.category
       set is_archived = true, archived_at = now()
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key = 'special_income'$$,
  '22023', 'category_system_locked',
  '系统大分类禁止归档'
);

select throws_ok(
  $$delete from public.category
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key = 'refund'$$,
  '22023', 'category_system_locked',
  '系统分类禁止单独删除'
);

select throws_ok(
  $$insert into public.category (ledger_id, parent_id, type, name)
    select ledger_id, id, 'income', '📖 普通收入'
    from public.category
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key = 'special_income'$$,
  '22023', 'category_system_parent_locked',
  '系统大分类下禁止新增普通小分类'
);

select throws_ok(
  $$insert into public.category (ledger_id, parent_id, type, name)
    values (
      '00000000-0000-4000-8000-000000000032',
      null, 'income', '特殊收入'
    )$$,
  '22023', 'category_name_reserved',
  '新建大分类不允许占用系统名称'
);

select throws_ok(
  $$insert into public.category (ledger_id, parent_id, type, name)
    values (
      '00000000-0000-4000-8000-000000000032',
      null, 'income', '退款'
    )$$,
  '22023', 'category_name_reserved',
  '新建普通大分类不能叫退款'
);

select throws_ok(
  $$insert into public.category (ledger_id, parent_id, type, name)
    values (
      '00000000-0000-4000-8000-000000000032',
      null, 'expense', '报销'
    )$$,
  '22023', 'category_name_reserved',
  '支出分类也不能使用系统保留名称'
);

select throws_ok(
  $$update public.category set name = '💴 报销'
    where id = '00000000-0000-4000-8000-000000005014'$$,
  '22023', 'category_name_reserved',
  '带 emoji 的普通分类改名为保留名称也被拒'
);

select throws_ok(
  $$insert into public.category (ledger_id, parent_id, type, name, system_key)
    values (
      '00000000-0000-4000-8000-000000000032',
      null, 'income', '🥺 退款', 'refund'
    )$$,
  '22023', 'category_system_locked',
  '客户端不能伪造系统分类标识'
);

select lives_ok(
  $$update public.category
       set sort_order = sort_order + 1
     where ledger_id = '00000000-0000-4000-8000-000000000032'
       and system_key = 'refund'$$,
  '系统分类可随同级分类排序，但不可编辑身份和元数据'
);

select is(
  (select count(*)::integer
    from public.category
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and system_key in ('refund', 'reimbursement')
      and is_archived = false),
  2,
  '系统明细分类保持未归档'
);

select is(
  (select count(*)::integer
    from public.category c
    where c.ledger_id = '00000000-0000-4000-8000-000000000032'
      and c.system_key is null
      and (c.name = '📄 报销' or c.name = '📄 公司报销'
           or c.name = '🚃 通勤报销')),
  0,
  'seed 不再建立旧的报销类别'
);

select * from finish();

rollback;
