-- #247：跨币种转账新增、编辑、作废后的余额与查找校验。
begin;
set local search_path = public, extensions;
select no_plan();

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
set local role authenticated;

create temp table cross_currency_accounts (
    name text primary key, id uuid not null
);
grant select, insert on cross_currency_accounts to authenticated;

insert into cross_currency_accounts (name,id) values
 ('jpy_from', public.create_account_with_holders(
    '00000000-0000-4000-8000-000000000032',
    '#247 JPY 转出', 'cash', 'JPY', 0, '{}')),
 ('jpy_to', public.create_account_with_holders(
    '00000000-0000-4000-8000-000000000032',
    '#247 JPY 到账', 'cash', 'JPY', 0, '{}')),
 ('cny_to', public.create_account_with_holders(
    '00000000-0000-4000-8000-000000000032',
    '#247 CNY 到账', 'bank', 'CNY', 0, '{}'));

create function pg_temp.aid(p_name text) returns uuid
language sql stable as $$
    select id from cross_currency_accounts where name = p_name;
$$;

create function pg_temp.balance(p_name text) returns numeric
language sql stable as $$
    select a.current_balance
    from public.account a
    where a.id = pg_temp.aid(p_name);
$$;

select ok(
    to_regprocedure('public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text)') is null
    and to_regprocedure('public.update_transfer_transaction(uuid,uuid,timestamptz,numeric,uuid,uuid,text)') is null,
    '旧签名已移除'
);
select ok(
    has_function_privilege(
        'authenticated',
        'public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text,numeric)',
        'execute'
    ) and not has_function_privilege(
        'anon',
        'public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text,numeric)',
        'execute'
    ),
    '新转账写入权限仅向 authenticated 开放'
);

create temp table cross_currency_created (id uuid not null);
grant select, insert on cross_currency_created to authenticated;
insert into cross_currency_created (id)
select public.create_transfer_transaction(
    '00000000-0000-4000-8000-000000000032',
    '2099-11-01 10:00:00+00',
    1000,
    pg_temp.aid('jpy_from'), pg_temp.aid('cny_to'),
    '#247 换汇', 50
);

select is(pg_temp.balance('jpy_from'), -1000::numeric, '转出账户扣除 1000 JPY');
select is(pg_temp.balance('cny_to'), 50::numeric, '到账账户增加 50 CNY');
select is(
    (select string_agg(ti.amount::text || '/' || ti.balance_delta::text, ',' order by ti.sort_order)
     from public.transaction_item ti
     where ti.transaction_record_id = (select id from cross_currency_created)),
    '1000.00/-1000.00,50.00/50.00',
    '跨币种明细独立记录正负与金额'
);

select throws_ok(
    format(
        'select public.create_transfer_transaction(%L::uuid, %L::timestamptz, 100, %L::uuid, %L::uuid, %L)',
        '00000000-0000-4000-8000-000000000032',
        '2099-11-01 10:00:00+00',
        pg_temp.aid('jpy_from'), pg_temp.aid('cny_to'), '未填到账金额'
    ),
    '22023', 'amount_invalid', '跨币种未填到账金额拒绝'
);
select throws_ok(
    format(
        'select public.create_transfer_transaction(%L::uuid, %L::timestamptz, 100, %L::uuid, %L::uuid, %L, 101)',
        '00000000-0000-4000-8000-000000000032',
        '2099-11-01 10:00:00+00',
        pg_temp.aid('jpy_from'), pg_temp.aid('jpy_to'), '同币种金额不等'
    ),
    '22023', 'amount_invalid', '同币种两边金额不等拒绝'
);
select throws_ok(
    format(
        'select public.create_transfer_transaction(%L::uuid, %L::timestamptz, 100, %L::uuid, %L::uuid, %L, 5.001)',
        '00000000-0000-4000-8000-000000000032',
        '2099-11-01 10:00:00+00',
        pg_temp.aid('jpy_from'), pg_temp.aid('cny_to'), '超小数位'
    ),
    '22023', 'amount_invalid', '到账金额超过两位小数拒绝'
);
select throws_ok(
    format(
        'select public.create_transfer_transaction(%L::uuid, %L::timestamptz, 100.001, %L::uuid, %L::uuid, %L, 5)',
        '00000000-0000-4000-8000-000000000032',
        '2099-11-01 10:00:00+00',
        pg_temp.aid('jpy_from'), pg_temp.aid('cny_to'), '超过两位小数'
    ),
    '22023', 'amount_invalid', '转出金额超过两位小数拒绝'
);

select lives_ok(
    format(
        'select public.update_transfer_transaction(%L::uuid, %L::uuid, %L::timestamptz, 600, %L::uuid, %L::uuid, %L)',
        '00000000-0000-4000-8000-000000000032',
        (select id from cross_currency_created),
        '2099-11-01 11:00:00+00',
        pg_temp.aid('jpy_from'), pg_temp.aid('jpy_to'), '改为同币种'
    ),
    '跨币种编辑回同币种，null 到账金额自动等于转出金额'
);
select is(pg_temp.balance('jpy_from'), -600::numeric, '编辑后转出账户恢复旧 1000 再扣 600');
select is(pg_temp.balance('cny_to'), 0::numeric, '编辑后旧 CNY 到账回滚独立的 50');
select is(pg_temp.balance('jpy_to'), 600::numeric, '编辑后 JPY 到账为 600');

select lives_ok(
    format(
        'select public.update_transfer_transaction(%L::uuid, %L::uuid, %L::timestamptz, 2000, %L::uuid, %L::uuid, %L, 90)',
        '00000000-0000-4000-8000-000000000032',
        (select id from cross_currency_created),
        '2099-11-02 11:00:00+00',
        pg_temp.aid('jpy_from'), pg_temp.aid('cny_to'), '改回跨币种'
    ),
    '同币种可以编辑回跨币种'
);
select is(pg_temp.balance('jpy_from'), -2000::numeric, '再次编辑后 JPY 余额正确');
select is(pg_temp.balance('jpy_to'), 0::numeric, '再次编辑后前一目标 JPY 余额恢复');
select is(pg_temp.balance('cny_to'), 90::numeric, '再次编辑后新 CNY 到账为 90');

select ok(
    exists (
      select 1
      from jsonb_array_elements(
          public.load_filtered_transaction_page(
              '00000000-0000-4000-8000-000000000032', 'records', '90'
          )->'entries'
      ) entry
      where entry->>'recordId' = (select id::text from cross_currency_created)
    ),
    '按到账金额 90 可以找到跨币种转账'
);
select ok(
    exists (
      select 1
      from jsonb_array_elements(
          public.load_filtered_transaction_page(
              '00000000-0000-4000-8000-000000000032', 'records', '2000'
          )->'entries'
      ) entry
      where entry->>'recordId' = (select id::text from cross_currency_created)
    ),
    '按转出金额 2000 也可以找到同一笔转账'
);

select lives_ok(
    format(
        'select public.void_transaction(%L::uuid, %L::uuid)',
        '00000000-0000-4000-8000-000000000032',
        (select id from cross_currency_created)
    ),
    '跨币种可以正常作废'
);
select is(pg_temp.balance('jpy_from'), 0::numeric, '删除后转出余额回到 0');
select is(pg_temp.balance('cny_to'), 0::numeric, '删除后到账余额回到 0');
-- 已删除记录对 authenticated 不可见，切回管理员验证落库状态。
set local role postgres;
select is(
    (select status from public.transaction_record
      where id = (select id from cross_currency_created)),
    'deleted', '删除后主记录为 deleted'
);
set local role authenticated;

select * from finish();
rollback;
