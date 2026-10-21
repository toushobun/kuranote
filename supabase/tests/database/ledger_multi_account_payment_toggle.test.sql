-- #931：账本多账户付款开关。
-- 默认关闭；关闭时 replace_transaction_payments 拒绝多个付款账户（新建 / 编辑都经过它）；
-- 账本仍有有效的多账户记录时禁止关闭，作废后可以关闭。
begin;

set local search_path = public, extensions;

select plan(16);

insert into public.ledger (id, name, base_currency, owner_user_id, created_by, updated_by)
values (
    '93100000-0000-4000-8000-000000000001', '多账户付款开关测试', 'JPY',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values (
    '93100000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031',
    'owner', 'active', now(),
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.account (id, ledger_id, name, type, currency, initial_balance, created_by, updated_by)
values
    ('93110000-0000-4000-8000-000000000001', '93100000-0000-4000-8000-000000000001', '我的账户', 'bank', 'JPY', 0,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('93110000-0000-4000-8000-000000000002', '93100000-0000-4000-8000-000000000001', '妻子账户', 'bank', 'JPY', 0,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

insert into public.category (id, ledger_id, parent_id, type, name)
values ('93120000-0000-4000-8000-000000000002', '93100000-0000-4000-8000-000000000001', null, 'expense', '医疗');
insert into public.category (id, ledger_id, parent_id, type, name)
values (
    '93120000-0000-4000-8000-000000000001', '93100000-0000-4000-8000-000000000001',
    '93120000-0000-4000-8000-000000000002', 'expense', '治疗费'
);

insert into public.merchant (id, ledger_id, name, created_by, updated_by)
values (
    '93130000-0000-4000-8000-000000000001', '93100000-0000-4000-8000-000000000001', '医院',
    '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
);

create temp table toggle_test_ids (name text primary key, id uuid not null);
grant select, insert on toggle_test_ids to authenticated;

create function pg_temp.rid(p_name text) returns uuid
language sql stable as $$
    select id from toggle_test_ids where name = p_name;
$$;

create function pg_temp.single_payment() returns jsonb
language sql immutable as $$
    select '[{"accountId":"93110000-0000-4000-8000-000000000001"}]'::jsonb;
$$;

create function pg_temp.split_payments() returns jsonb
language sql immutable as $$
    select '[{"accountId":"93110000-0000-4000-8000-000000000001","amount":"400"},{"accountId":"93110000-0000-4000-8000-000000000002","amount":"600"}]'::jsonb;
$$;

create function pg_temp.create_sql(p_payments jsonb) returns text
language sql immutable as $$
    select format(
        'select public.create_transaction(%L, %L, %L, %L::jsonb, %L::jsonb, %L, %L)',
        '93100000-0000-4000-8000-000000000001',
        'expense',
        '2099-06-01 00:00:00+00',
        '[{"amount":"1000","categoryId":"93120000-0000-4000-8000-000000000001"}]',
        p_payments,
        '93130000-0000-4000-8000-000000000001',
        '#931'
    );
$$;

create function pg_temp.update_sql(p_record_id uuid, p_payments jsonb) returns text
language sql immutable as $$
    select format(
        'select public.update_transaction(%L, %L, %L, %L, %L::jsonb, %L::jsonb, %L, %L)',
        '93100000-0000-4000-8000-000000000001',
        p_record_id,
        'expense',
        '2099-06-01 00:00:00+00',
        '[{"amount":"1000","categoryId":"93120000-0000-4000-8000-000000000001"}]',
        p_payments,
        '93130000-0000-4000-8000-000000000001',
        '#931'
    );
$$;

create function pg_temp.toggle_sql(p_enabled boolean) returns text
language sql immutable as $$
    select format(
        'update public.ledger set multi_account_payment_enabled = %L where id = %L',
        p_enabled,
        '93100000-0000-4000-8000-000000000001'
    );
$$;

-- ------------------------------------------------------------
-- 结构
-- ------------------------------------------------------------

select col_not_null('public', 'ledger', 'multi_account_payment_enabled', '开关不允许为空');
select col_default_is('public', 'ledger', 'multi_account_payment_enabled', 'false', '开关默认关闭');
select ok(
    not exists (
        select 1
        from public.ledger l
        where not l.multi_account_payment_enabled
          and exists (
              select 1
              from public.transaction_payment p
              join public.transaction_record tr
                on tr.id = p.transaction_record_id
               and tr.ledger_id = p.ledger_id
              where p.ledger_id = l.id
                and tr.status = 'active'
              group by p.transaction_record_id
              having count(*) >= 2
          )
    ),
    '已有多账户记录的账本都已开启开关'
);
select ok(
    not has_function_privilege(
        'authenticated',
        'public.prevent_disable_multi_account_payment_with_records()',
        'execute'
    ),
    '禁止关闭的触发器函数不开放给客户端'
);

-- ------------------------------------------------------------
-- 开关关闭：只允许单个付款账户
-- ------------------------------------------------------------

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select throws_ok(
    pg_temp.create_sql(pg_temp.split_payments()),
    '22023', 'payment_multi_account_disabled', '开关关闭时新建记录不能选择多个付款账户'
);

insert into toggle_test_ids
select 'single', public.create_transaction(
    '93100000-0000-4000-8000-000000000001',
    'expense',
    '2099-06-01 00:00:00+00',
    '[{"amount":"1000","categoryId":"93120000-0000-4000-8000-000000000001"}]'::jsonb,
    pg_temp.single_payment(),
    '93130000-0000-4000-8000-000000000001',
    '#931 单账户'
);
select ok(pg_temp.rid('single') is not null, '开关关闭时单个付款账户照常保存');

select throws_ok(
    pg_temp.update_sql(pg_temp.rid('single'), pg_temp.split_payments()),
    '22023', 'payment_multi_account_disabled', '开关关闭时编辑记录不能改为多个付款账户'
);
select is(
    (select count(*)::integer from public.transaction_payment where transaction_record_id = pg_temp.rid('single')),
    1,
    '被拒绝的编辑不改变付款明细'
);

-- ------------------------------------------------------------
-- 开关开启：可以保存多账户记录，且不能再关闭
-- ------------------------------------------------------------

reset role;
select lives_ok(pg_temp.toggle_sql(true), '没有多账户记录时可以开启');

set local role authenticated;
select lives_ok(
    pg_temp.update_sql(pg_temp.rid('single'), pg_temp.split_payments()),
    '开关开启后可以把记录改为多个付款账户'
);
select is(
    (select count(*)::integer from public.transaction_payment where transaction_record_id = pg_temp.rid('single')),
    2,
    '编辑后写入两行付款明细'
);

reset role;
select throws_ok(
    pg_temp.toggle_sql(false),
    '55006', 'multi_account_payment_has_records', '有有效的多账户记录时不能关闭'
);
select lives_ok(
    $$update public.ledger set name = '多账户付款开关测试（改名）' where id = '93100000-0000-4000-8000-000000000001'$$,
    '有多账户记录时修改其他设置不受影响'
);
select lives_ok(pg_temp.toggle_sql(true), '保持开启（不变更）不受影响');

-- ------------------------------------------------------------
-- 多账户记录改回单账户或作废后可以关闭
-- ------------------------------------------------------------

set local role authenticated;
select public.void_transaction('93100000-0000-4000-8000-000000000001', pg_temp.rid('single'));

reset role;
select lives_ok(pg_temp.toggle_sql(false), '多账户记录作废后可以关闭');
select is(
    (select multi_account_payment_enabled from public.ledger where id = '93100000-0000-4000-8000-000000000001'),
    false,
    '关闭后开关为 false'
);

select * from finish();
rollback;
