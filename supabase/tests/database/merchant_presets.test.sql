begin;
set local search_path = public, extensions;
select plan(26);

insert into public.ledger (id, name, base_currency, owner_user_id, created_by, updated_by)
values ('87800000-0000-4000-8000-000000000001', '预设添加测试', 'JPY', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values
('87800000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'owner', 'active', now(), '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
('87800000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000034', 'member', 'active', now(), '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
insert into public.merchant (id, ledger_id, name, created_by, updated_by)
values ('87810000-0000-4000-8000-000000000001', '87800000-0000-4000-8000-000000000001', 'Existing', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
insert into public.merchant_alias (merchant_id, alias, is_preferred, created_by, updated_by)
values ('87810000-0000-4000-8000-000000000001', 'Known_alias', true, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
insert into public.merchant_tags (id, ledger_id, name, icon, created_by)
values ('87820000-0000-4000-8000-000000000001', '87800000-0000-4000-8000-000000000001', 'tAg', '🎯', '00000000-0000-4000-8000-000000000031');

create function pg_temp.payload(names text[], tag_name text default 'Tag') returns jsonb language sql as $$
  select jsonb_build_object(
    'accounts', '[]'::jsonb, 'specialStatusEnabled', false,
    'merchantTags', jsonb_build_array(jsonb_build_object('key', 'tag', 'name', tag_name, 'icon', '🛒')),
    'merchants', coalesce((select jsonb_agg(jsonb_build_object(
      'name', n, 'websiteUrl', 'https://example.com/',
      'iconUrl', 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com&sz=128',
      'aliases', jsonb_build_array(jsonb_build_object('alias', n || '_alias', 'locale', 'en')),
      'tagKeys', jsonb_build_array('tag')
    )) from unnest(names) n), '[]'::jsonb)
  );
$$;
create function pg_temp.add(names text[], tag_name text default 'Tag') returns integer language sql as $$
  select public.add_merchant_presets('87800000-0000-4000-8000-000000000001', 'JPY', pg_temp.payload(names, tag_name));
$$;

select ok(not has_function_privilege('anon', 'public.add_merchant_presets(uuid,text,jsonb)', 'execute'), '匿名角色无 RPC 执行权限');
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select pg_temp.add(array['New'])$$, '42501', 'auth_required', '拒绝没有登录身份的调用');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000034', true);
set local role authenticated;
select throws_ok($$select pg_temp.add(array['New'])$$, '42501', 'permission_denied', '普通成员无管理商家权限');
reset role;
select set_config('request.jwt.claim.sub', '', true);
insert into public.ledger_member(ledger_id, user_id, role, status, joined_at, removed_at, created_by, updated_by)
values('87800000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000034', 'admin', 'removed', now(), now(), '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000034', true);
set local role authenticated;
select throws_ok($$select pg_temp.add(array['New'])$$, '42501', 'permission_denied', '已移除的管理员身份不能授予管理权限');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
select throws_ok($$select public.add_merchant_presets('87800000-0000-4000-8000-000000000001', 'USD', pg_temp.payload(array['New']))$$, '22023', 'merchant_preset_invalid', '事务内按账本当前币种校验');
select is(pg_temp.add(array['eXISTING']), 0, '正式名称忽略大小写命中时跳过');
select is(pg_temp.add(array['Known']), 0, '预设别名与已有展示别名匹配时跳过');
select is(pg_temp.add(array['KNOWN_ALIAS']), 0, '预设正式名称与已有别名忽略大小写匹配时跳过');
select is((select count(*) from public.merchant_alias where merchant_id = '87810000-0000-4000-8000-000000000001'), 1::bigint, '已存在商家不补别名');
select is((select website_url from public.merchant where id = '87810000-0000-4000-8000-000000000001'), null::text, '已存在商家不补官网');
select is((select count(*) from public.merchant_tag_links where merchant_id = '87810000-0000-4000-8000-000000000001'), 0::bigint, '已存在商家不补标签');
select is(pg_temp.add(array['New']), 1, '原子写入新商家');
select is((select count(*) from public.merchant_tags where ledger_id = '87800000-0000-4000-8000-000000000001'), 1::bigint, '忽略大小写沿用未归档标签');
select is((select icon from public.merchant_tags where id = '87820000-0000-4000-8000-000000000001'), '🎯', '沿用标签不修改已有图标');
select is((select count(*) from public.merchant_tag_links l join public.merchant m on m.id = l.merchant_id where m.name = 'New' and m.ledger_id = '87800000-0000-4000-8000-000000000001'), 1::bigint, '写入商家标签关联');
select is((select website_url from public.merchant where ledger_id = '87800000-0000-4000-8000-000000000001' and name = 'New'), 'https://example.com/', '写入模板官网');
select is((select icon_url from public.merchant where ledger_id = '87800000-0000-4000-8000-000000000001' and name = 'New'), 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com&sz=128', '头像与向导 favicon 规则一致');
select is((select a.locale from public.merchant_alias a join public.merchant m on m.id = a.merchant_id where m.ledger_id = '87800000-0000-4000-8000-000000000001' and m.name = 'New'), 'en', '写入模板别名与语言');
select is(pg_temp.add(array['NEW']), 0, '重复提交在事务内再次判重');
select is(pg_temp.add(array['Another'], 'Other'), 1, '缺少标签时与商家一并创建');
select is((select icon from public.merchant_tags where ledger_id = '87800000-0000-4000-8000-000000000001' and name = 'Other'), '🛒', '新标签使用模板 emoji');

reset role;
update public.merchant_tags set is_archived = true, archived_at = now(), archived_by = '00000000-0000-4000-8000-000000000031' where ledger_id = '87800000-0000-4000-8000-000000000001' and name = 'Other';
set local role authenticated;
select is(pg_temp.add(array['Third'], 'OTHER'), 1, '已归档同名标签视为不存在');
select is((select count(*) from public.merchant_tags where ledger_id = '87800000-0000-4000-8000-000000000001' and lower(name) = 'other' and is_archived = false), 1::bigint, '归档标签不恢复，只创建新的有效标签');

reset role;
create function pg_temp.reject_alias() returns trigger language plpgsql as $$ begin if new.alias = 'Fail_alias' then raise exception 'test_atomic_failure'; end if; return new; end; $$;
create trigger test_preset_atomic_failure before insert on public.merchant_alias for each row execute function pg_temp.reject_alias();
set local role authenticated;
select throws_ok($$select pg_temp.add(array['AtomicFirst','Fail'], 'AtomicTag')$$, 'P0001', 'test_atomic_failure', '第二个商家别名写入失败时整个批次失败');
select is((select count(*) from public.merchant where ledger_id = '87800000-0000-4000-8000-000000000001' and name in ('AtomicFirst','Fail')), 0::bigint, '失败回滚批次全部商家');
select is((select count(*) from public.merchant_tags where ledger_id = '87800000-0000-4000-8000-000000000001' and name = 'AtomicTag'), 0::bigint, '失败回滚新标签及关联');

select * from finish();
rollback;
