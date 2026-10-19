-- #910：已有交易的账户不能修改币种；没有交易的账户照常可以修改。
begin;

set local search_path = public, extensions;

select no_plan();

create temp table currency_lock_accounts (name text primary key, id uuid not null);
grant select, insert on currency_lock_accounts to authenticated;

create function pg_temp.aid(p_name text) returns uuid
language sql stable as $$
    select id from currency_lock_accounts where name = p_name;
$$;

-- 以测试名创建账户（名称加前缀避免与种子账户冲突），并记下 ID。
create function pg_temp.create_account(p_name text, p_initial_balance numeric default 0) returns uuid
language sql as $$
    insert into currency_lock_accounts (name, id)
    values (
        p_name,
        public.create_account_with_holders(
            '00000000-0000-4000-8000-000000000032', '#910 ' || p_name, 'cash', 'JPY', p_initial_balance, '{}'
        )
    )
    returning id;
$$;

create function pg_temp.update_account_sql(p_name text, p_new_name text, p_currency text) returns text
language sql stable as $$
    select format(
        'select public.update_account_with_holders(%L, %L, %L, %L, %L, %L::uuid[])',
        '00000000-0000-4000-8000-000000000032', pg_temp.aid(p_name), '#910 ' || p_new_name, 'cash', p_currency, '{}'
    );
$$;

create function pg_temp.currency(p_name text) returns text
language sql stable as $$
    select currency from public.account where id = pg_temp.aid(p_name);
$$;

create function pg_temp.expense(p_account_name text, p_amount numeric) returns uuid
language sql as $$
    select public.create_transaction(
        '00000000-0000-4000-8000-000000000032',
        'expense',
        '2099-06-01 00:00:00+00',
        jsonb_build_array(jsonb_build_object('amount', p_amount, 'categoryId', '00000000-0000-4000-8000-000000005021')),
        jsonb_build_array(jsonb_build_object('accountId', pg_temp.aid(p_account_name))),
        '00000000-0000-4000-8000-000000001001',
        '#910 支出'
    );
$$;


select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
set local role authenticated;

-- ------------------------------------------------------------
-- 权限
-- ------------------------------------------------------------

select ok(
    not has_function_privilege('authenticated', 'public.account_has_transactions(uuid,uuid)', 'execute')
    and not has_function_privilege('authenticated', 'public.prevent_account_currency_change_with_transactions()', 'execute'),
    '判定函数与触发器函数不可由客户端直接调用'
);
select ok(
    has_function_privilege('authenticated', 'public.list_account_ids_with_transactions(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.list_account_ids_with_transactions(uuid)', 'execute'),
    '只有 authenticated 可以读取已有交易的账户列表'
);

-- ------------------------------------------------------------
-- 没有交易
-- ------------------------------------------------------------

select pg_temp.create_account('无交易');
select lives_ok(pg_temp.update_account_sql('无交易', '无交易', 'USD'), '没有任何交易的账户可以修改币种');
select is(pg_temp.currency('无交易'), 'USD', '币种已更新为 USD');

-- ------------------------------------------------------------
-- 普通记录（付款明细）
-- ------------------------------------------------------------

select pg_temp.create_account('普通记录');
select pg_temp.expense('普通记录', 100);
select throws_ok(
    pg_temp.update_account_sql('普通记录', '普通记录改名', 'USD'),
    '22023',
    'account_currency_locked',
    '有普通记录的账户修改币种被拒绝'
);
select is(
    (select name || '/' || currency from public.account where id = pg_temp.aid('普通记录')),
    '#910 普通记录/JPY',
    '被拒绝时名称与币种都不变（整体回滚）'
);
select lives_ok(pg_temp.update_account_sql('普通记录', '普通记录改名', 'JPY'), '币种不变时只改名称照常保存');
select is(
    (select name from public.account where id = pg_temp.aid('普通记录')),
    '#910 普通记录改名',
    '名称已更新'
);
select lives_ok(
    format(
        'select public.update_account_with_holders(%L, %L, %L, %L, %L, array[%L]::uuid[])',
        '00000000-0000-4000-8000-000000000032', pg_temp.aid('普通记录'), '#910 普通记录改名', 'cash', 'JPY',
        '00000000-0000-4000-8000-000000000031'
    ),
    '币种不变时只改持有人照常保存'
);

-- ------------------------------------------------------------
-- 已作废记录
-- ------------------------------------------------------------

select pg_temp.create_account('已作废');
select public.void_transaction('00000000-0000-4000-8000-000000000032', pg_temp.expense('已作废', 50));
select is(
    (select count(*) from public.transaction_account_movement m
     join public.transaction_record tr on tr.id = m.transaction_record_id
     where m.account_id = pg_temp.aid('已作废')),
    0::bigint,
    '前提：RLS 对客户端隐藏已作废记录'
);
select throws_ok(
    pg_temp.update_account_sql('已作废', '已作废', 'USD'),
    '22023',
    'account_currency_locked',
    '只有已作废记录的账户也不能修改币种'
);

-- ------------------------------------------------------------
-- 初始余额、转账、余额调整
-- ------------------------------------------------------------

select pg_temp.create_account('初始余额', 1000);
select throws_ok(
    pg_temp.update_account_sql('初始余额', '初始余额', 'USD'),
    '22023',
    'account_currency_locked',
    '只有初始余额生成的余额调整记录也不能修改币种'
);

select pg_temp.create_account('转出');
select pg_temp.create_account('转入');
select public.create_transfer_transaction(
    '00000000-0000-4000-8000-000000000032', '2099-06-02 00:00:00+00', 30,
    pg_temp.aid('转出'), pg_temp.aid('转入'), '#910 转账'
);
select throws_ok(
    pg_temp.update_account_sql('转出', '转出', 'USD'),
    '22023',
    'account_currency_locked',
    '转账的转出账户不能修改币种'
);
select throws_ok(
    pg_temp.update_account_sql('转入', '转入', 'USD'),
    '22023',
    'account_currency_locked',
    '转账的转入账户不能修改币种'
);

select pg_temp.create_account('余额调整');
select lives_ok(
    format(
        'select public.update_account_with_balance_adjustment(%L, %L, %L, %L, %L, %L::uuid[], 500)',
        '00000000-0000-4000-8000-000000000032', pg_temp.aid('余额调整'), '#910 余额调整', 'cash', 'USD', '{}'
    ),
    '没有交易时可以同时修改币种并调整余额'
);
select throws_ok(
    format(
        'select public.update_account_with_balance_adjustment(%L, %L, %L, %L, %L, %L::uuid[])',
        '00000000-0000-4000-8000-000000000032', pg_temp.aid('余额调整'), '#910 余额调整', 'cash', 'JPY', '{}'
    ),
    '22023',
    'account_currency_locked',
    '有余额调整记录后，经余额调整 RPC 修改币种也被拒绝'
);

-- ------------------------------------------------------------
-- 绕过 RPC 直接更新
-- ------------------------------------------------------------

select throws_ok(
    format('update public.account set currency = %L where id = %L', 'USD', pg_temp.aid('普通记录')),
    '22023',
    'account_currency_locked',
    '直接 UPDATE account 修改币种同样被拒绝'
);
select lives_ok(
    format('update public.account set currency = %L where id = %L', 'EUR', pg_temp.aid('无交易')),
    '直接 UPDATE 没有交易的账户币种不受影响'
);

-- ------------------------------------------------------------
-- 表单读取：已有交易的账户列表
-- ------------------------------------------------------------

select set_eq(
    $$select account_id from public.list_account_ids_with_transactions('00000000-0000-4000-8000-000000000032')
      where account_id in (select id from currency_lock_accounts)$$,
    $$select id from currency_lock_accounts where name <> '无交易'$$,
    '列表包含所有已有交易（含已作废、初始余额）的账户，不含无交易账户'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000099', true);
select is(
    (select count(*) from public.list_account_ids_with_transactions('00000000-0000-4000-8000-000000000032')),
    0::bigint,
    '非账本成员读取不到任何账户'
);

select * from finish();
rollback;
