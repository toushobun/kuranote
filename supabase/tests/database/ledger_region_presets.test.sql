begin;
set local search_path = public, extensions;
select plan(17);

create function pg_temp.region_payload(n integer) returns jsonb language sql as $$
  select jsonb_build_object(
    'templateRegion', 'jp',
    'accounts', jsonb_build_array(
      jsonb_build_object('name','人民币现金','type','cash','currency','CNY'),
      jsonb_build_object('name','楽天銀行','type','bank','currency','JPY')
    ),
    'specialStatusEnabled', false, 'multiAccountPaymentEnabled', false,
    'merchantTags', jsonb_build_array(
      jsonb_build_object('key','shopping','name','购物','icon','🛍️'),
      jsonb_build_object('key','online_subscription','name','网购·订阅','icon','🌐')
    ),
    'merchants', (select jsonb_agg(jsonb_build_object(
      'name', case i when 1 then '苹果' else '测试商家' || i end,
      'websiteUrl', null, 'iconUrl', null,
      'aliases', jsonb_build_array(jsonb_build_object('alias', case i when 1 then 'Apple' else 'Alias' || i end, 'locale','en')),
      'tagKeys', jsonb_build_array('shopping','online_subscription')
    )) from generate_series(1,n) i)
  );
$$;

select lives_ok($$select public.validate_ledger_setup_completion_payload(pg_temp.region_payload(300))$$, '300家处于完成写入上限内');
select throws_ok($$select public.validate_ledger_setup_completion_payload(pg_temp.region_payload(301))$$, '22023', 'ledger_setup_payload_invalid', '301家超限拒绝');
select throws_ok($$select public.validate_ledger_setup_completion_payload(jsonb_set(pg_temp.region_payload(1), '{accounts,0,currency}', '"cny"'))$$, '22023', 'ledger_setup_payload_invalid', '账户货币不是合法货币代码时拒绝');
select throws_ok($$select public.validate_ledger_setup_completion_payload(pg_temp.region_payload(1) #- '{accounts,1,currency}')$$, '22023', 'ledger_setup_payload_invalid', '账户缺少货币时拒绝');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
set local role authenticated;
create temporary table region_setup as
select public.create_ledger_setup('地区商家测试','CNY','测试成员','amber','jp') as id;
select is((select living_region from public.ledger where id=(select id from region_setup)), 'jp', '人民币账本可选择日本生活地区');
select public.save_ledger_setup_draft((select id from region_setup), 3,
  '{"schemaVersion":2,"templateRegion":"jp","templateVersion":2,"accounts":{"items":[{"name":"现金","type":"cash"}],"skipped":false},"merchants":{"selectedKeys":["apple"],"skipped":false},"features":{"specialStatusEnabled":false,"multiAccountPaymentEnabled":false}}');
create temporary table original_region_draft as select setup_draft as draft from public.ledger where id=(select id from region_setup);
select public.update_ledger_setup_basic_info((select id from region_setup),'地区商家测试','USD','测试成员','amber','jp');
select is((select setup_draft from public.ledger where id=(select id from region_setup)), (select draft from original_region_draft), '换币种不清空账户与商家');
select public.update_ledger_setup_basic_info((select id from region_setup),'地区商家测试','USD','测试成员','amber','cn');
select is((select setup_draft #>> '{merchants,selectedKeys,0}' from public.ledger where id=(select id from region_setup)), 'apple', '换地区保留商家勾选');
select is((select setup_draft #>> '{merchants,additionalRegions,0}' from public.ledger where id=(select id from region_setup)), 'jp', '换地区将原地区转为追加组');
select throws_ok($$select public.save_ledger_setup_draft((select id from region_setup), 3, (select draft from original_region_draft))$$, '22023', 'ledger_setup_region_mismatch', '旧地区页面不能覆盖最新地区草稿');
select throws_ok($$select public.complete_ledger_setup((select id from region_setup), pg_temp.region_payload(2))$$, '22023', 'ledger_setup_region_mismatch', '完成时在行锁内拒绝过期地区');
select public.complete_ledger_setup((select id from region_setup), pg_temp.region_payload(2) || '{"templateRegion":"cn"}');
select is((select count(*) from public.merchant where ledger_id=(select id from region_setup)), 2::bigint, '完成后商家各写入一次');
select is((select name from public.merchant where ledger_id=(select id from region_setup) and name='苹果'), '苹果', '中文显示名实际写入商家表');
select is((select a.locale from public.merchant_alias a join public.merchant m on m.id=a.merchant_id where m.ledger_id=(select id from region_setup) and a.alias='Apple'), 'en', '原名别名及locale实际写入');
select is((select count(*) from public.merchant_tag_links l join public.merchant m on m.id=l.merchant_id where m.ledger_id=(select id from region_setup)), 4::bigint, '每家商家的全部标签关联写入');
select is((select currency from public.account where ledger_id=(select id from region_setup) and name='人民币现金'), 'CNY', '账户按候选所属地区的货币创建，与账本币种无关');
select is((select currency from public.account where ledger_id=(select id from region_setup) and name='楽天銀行'), 'JPY', '同一账本内账户可按各自货币创建');
select is((select living_region from public.ledger where id=(select id from region_setup)), 'cn', '完成清除草稿后仍保留账本生活地区');
reset role;
select * from finish();
rollback;
