begin;
set local search_path = public, extensions;
select plan(8);

-- 模拟规则引入前已存在的普通报销分类，不修改或迁移存量分类。
alter table public.category disable trigger category_guard_system;
insert into public.category (id, ledger_id, parent_id, type, name, sort_order) values
('00000000-0000-4000-8000-000000009441', '00000000-0000-4000-8000-000000000032', null, 'income', '💸 review 收入', 0),
('00000000-0000-4000-8000-000000009442', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000009441', 'income', '📄 报销', 0),
('00000000-0000-4000-8000-000000009443', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000009441', 'income', '💴 奖金', 1);
alter table public.category enable trigger category_guard_system;

select lives_ok($$update public.category set sort_order = sort_order + 1 where parent_id = '00000000-0000-4000-8000-000000009441'$$, '同组排序更新包含旧报销分类时仍可完成');
select lives_ok($$update public.category set icon_name = '✨', name = '✨ 报销' where id = '00000000-0000-4000-8000-000000009442'$$, '旧普通报销分类可以改图标');
select lives_ok($$update public.category set is_archived = true, archived_at = now() where id = '00000000-0000-4000-8000-000000009442'$$, '旧普通报销分类可以归档');
select throws_ok($$insert into public.category (ledger_id, type, name) values ('00000000-0000-4000-8000-000000000032', 'income', '💴 退款')$$, '22023', 'category_name_reserved', '不能新建保留名称退款');
select throws_ok($$insert into public.category (ledger_id, type, name) values ('00000000-0000-4000-8000-000000000032', 'income', '📄 报销')$$, '22023', 'category_name_reserved', '不能新建保留名称报销');
select throws_ok($$update public.category set name = '💴 退款' where id = '00000000-0000-4000-8000-000000009443'$$, '22023', 'category_name_reserved', '不能将普通分类改名为退款');
select throws_ok($$update public.category set name = '💸 特殊收入' where id = '00000000-0000-4000-8000-000000009443'$$, '22023', 'category_name_reserved', '不能将普通分类改名为特殊收入');
select throws_ok($$update public.category set icon_name = '✨' where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'refund'$$, '22023', 'category_system_locked', '系统分类本身仍禁止修改');
select * from finish();
rollback;
