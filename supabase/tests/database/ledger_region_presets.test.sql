begin;
set local search_path = public, extensions;
select no_plan();

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

create temporary table region_setup (id uuid primary key);
insert into region_setup values ('99700000-0000-4000-8000-000000000101');

-- first save：CNY 默认币种和日本生活地区可独立选择。
select lives_ok($$select public.commit_ledger_setup(
  (select id from region_setup), null, '地区商家测试', 'CNY',
  '测试成员', 'amber', 'jp', 3,
  '{"schemaVersion":2,"templateRegion":"jp","templateVersion":5,
    "accounts":{"items":[],"skipped":false},
    "merchants":{"selectedKeys":["apple"],"skipped":false},
    "features":{"specialStatusEnabled":false,"multiAccountPaymentEnabled":false}}'::jsonb,
  false, null
)$$, '首次保存创建中账本');
select is(
  (select living_region from public.ledger where id=(select id from region_setup)),
  'jp', '人民币账本可选择日本生活地区'
);

create temporary table original_region_draft as
  select setup_draft as draft
  from public.ledger where id=(select id from region_setup);

select lives_ok($$select public.commit_ledger_setup(
  (select id from region_setup),
  (select updated_at from public.ledger where id=(select id from region_setup)),
  '地区商家测试', 'USD', '测试成员', 'amber', 'jp', 3,
  (select draft from original_region_draft), false, null
)$$, '币种改变时后端接受同一地区草稿');
select is(
  (select setup_draft from public.ledger where id=(select id from region_setup)),
  (select draft from original_region_draft),
  '换币种不丢失草稿'
);
select is(
  (select base_currency from public.ledger where id=(select id from region_setup)),
  'USD', '默认币种保留用户新选择'
);

-- 变更生活地区必须随同提交对应地区的草稿。
select lives_ok($$select public.commit_ledger_setup(
  (select id from region_setup),
  (select updated_at from public.ledger where id=(select id from region_setup)),
  '地区商家测试', 'USD', '测试成员', 'amber', 'cn', 3,
  '{"schemaVersion":2,"templateRegion":"cn","templateVersion":5,
    "accounts":{"items":[],"skipped":false},
    "merchants":{"selectedKeys":["apple"],"additionalRegions":["jp"],"skipped":false},
    "features":{"specialStatusEnabled":false,"multiAccountPaymentEnabled":false}}'::jsonb,
  false, null
)$$, '新地区与草稿一致时保存成功');

select is(
  (select setup_draft #>> '{merchants,additionalRegions,0}'
     from public.ledger where id=(select id from region_setup)),
  'jp', '跨地区保存时保留用户明确选择的追加地区'
);
select throws_ok($$select public.commit_ledger_setup(
  (select id from region_setup),
  (select updated_at from public.ledger where id=(select id from region_setup)),
  '地区商家测试', 'USD', '测试成员', 'amber', 'cn', 3,
  (select draft from original_region_draft), false, null
)$$, '22023', 'ledger_setup_region_mismatch',
  '旧地区草稿不能覆盖最新地区状态'
);

select throws_ok($$select public.commit_ledger_setup(
  (select id from region_setup),
  (select updated_at from public.ledger where id=(select id from region_setup)),
  '地区商家测试', 'USD', '测试成员', 'amber', 'cn', 5,
  (select setup_draft from public.ledger where id=(select id from region_setup)),
  true, pg_temp.region_payload(2)
)$$, '22023', 'ledger_setup_region_mismatch',
  '最终完成不允许旧地区 payload'
);

select lives_ok($$select public.commit_ledger_setup(
  (select id from region_setup),
  (select updated_at from public.ledger where id=(select id from region_setup)),
  '地区商家测试', 'USD', '测试成员', 'amber', 'cn', 5,
  (select setup_draft from public.ledger where id=(select id from region_setup)),
  true, pg_temp.region_payload(2) || '{"templateRegion":"cn"}'
)$$, '统一提交在一个事务中完成账本');

select is(
  (select count(*) from public.merchant
    where ledger_id=(select id from region_setup)),
  2::bigint, '完成后商家各写入一次'
);
select is(
  (select a.locale from public.merchant_alias a
    join public.merchant m on m.id=a.merchant_id
    where m.ledger_id=(select id from region_setup) and a.alias='Apple'),
  'en', '商家别名与 locale 正确'
);
select is(
  (select currency from public.account
    where ledger_id=(select id from region_setup) and name='人民币现金'),
  'CNY', '账户使用服务端 payload 指定的合法币种'
);
select is(
  (select currency from public.account
    where ledger_id=(select id from region_setup) and name='楽天銀行'),
  'JPY', '多种币种账户可共存'
);
select is(
  (select living_region from public.ledger
    where id=(select id from region_setup)),
  'cn', '完成后仍保存生活地区'
);

reset role;
select * from finish();
rollback;
