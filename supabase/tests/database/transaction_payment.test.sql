-- #911：付款明细表、记录级不变量、按付款明细更新余额。
begin;

set local search_path = public, extensions;

select no_plan();

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

create temp table payment_test_balance_before as
select id as account_id, current_balance as balance
from public.account
where ledger_id = '00000000-0000-4000-8000-000000000032';

create temp table payment_test_ids (name text primary key, id uuid not null);

grant select on payment_test_balance_before to authenticated;
grant select, insert on payment_test_ids to authenticated;

-- 账户余额相对测试开始时的变化量。
create function pg_temp.delta(p_account_id uuid) returns numeric
language sql stable as $$
    select a.current_balance - b.balance
    from public.account a
    join payment_test_balance_before b on b.account_id = a.id
    where a.id = p_account_id;
$$;

create function pg_temp.rid(p_name text) returns uuid
language sql stable as $$
    select id from payment_test_ids where name = p_name;
$$;

-- 直接写入后立即执行延迟校验；在 throws_ok 的子事务内执行，失败时连同写入一起回滚。
create function pg_temp.check_after(p_sql text) returns void
language plpgsql as $$
begin
    execute p_sql;
    set constraints public.validate_transaction_record_payments immediate;
end;
$$;

create function pg_temp.items(p_amount numeric, p_category_id uuid default '00000000-0000-4000-8000-000000005021')
returns jsonb language sql immutable as $$
    select jsonb_build_array(jsonb_build_object('amount', p_amount, 'categoryId', p_category_id));
$$;

create function pg_temp.pay(p_account_id uuid) returns jsonb
language sql immutable as $$
    select jsonb_build_array(jsonb_build_object('accountId', p_account_id));
$$;

-- ------------------------------------------------------------
-- 权限
-- ------------------------------------------------------------

select ok(
    (select relrowsecurity from pg_catalog.pg_class where oid = 'public.transaction_payment'::regclass),
    'transaction_payment 启用 RLS'
);
select ok(has_table_privilege('authenticated', 'public.transaction_payment', 'select'), 'authenticated 可读付款明细');
select ok(
    not has_table_privilege('authenticated', 'public.transaction_payment', 'insert')
    and not has_table_privilege('authenticated', 'public.transaction_payment', 'update')
    and not has_table_privilege('authenticated', 'public.transaction_payment', 'delete'),
    'authenticated 不能直接写付款明细'
);
select ok(not has_table_privilege('anon', 'public.transaction_payment', 'select'), 'anon 不能读付款明细');
select ok(
    not has_function_privilege('authenticated', 'public.replace_transaction_payments(uuid,uuid,jsonb,uuid)', 'execute')
    and not has_function_privilege('authenticated', 'public.transaction_payment_account_ids(uuid,jsonb)', 'execute')
    and not has_function_privilege('authenticated', 'public.transaction_record_currency(uuid,uuid)', 'execute')
    and not has_function_privilege('authenticated', 'public.validate_transaction_record_payments()', 'execute'),
    '付款明细内部函数不可由客户端直接调用'
);
select ok(
    not has_function_privilege('authenticated', 'public.update_linked_transaction_item(uuid,uuid,uuid,timestamptz,numeric,uuid)', 'execute')
    and has_function_privilege('authenticated', 'public.update_linked_transaction_edit(uuid,uuid,timestamptz,uuid,text,jsonb,jsonb,timestamptz)', 'execute'),
    '旧的已关联明细入口不再开放给客户端，只能经记录级 update_linked_transaction_edit 调用'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

-- ------------------------------------------------------------
-- 单账户：创建 / 编辑 / 删除，余额只来自付款明细
-- ------------------------------------------------------------

insert into payment_test_ids
select 'normal', public.create_transaction(
    '00000000-0000-4000-8000-000000000032',
    'expense',
    '2099-04-01 00:00:00+00',
    pg_temp.items(100),
    pg_temp.pay('00000000-0000-4000-8000-000000000043'),
    '00000000-0000-4000-8000-000000001001',
    '#911 单账户'
);

select results_eq(
    $$
        select account_id, amount, balance_delta, sort_order
        from public.transaction_payment
        where transaction_record_id = pg_temp.rid('normal')
    $$,
    $$ values ('00000000-0000-4000-8000-000000000043'::uuid, 100.00::numeric, -100.00::numeric, 0) $$,
    '创建时写入一行付款明细，余额变动由明细推导'
);
select results_eq(
    $$
        select account_id, balance_delta
        from public.transaction_item
        where transaction_record_id = pg_temp.rid('normal')
    $$,
    $$ values (null::uuid, null::numeric) $$,
    '普通记录明细不保存 account_id 与 balance_delta'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000043'), -100.00, '创建后付款账户余额减少');

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('normal'),
            'expense',
            '2099-04-01 00:00:00+00',
            pg_temp.items(150),
            pg_temp.pay('00000000-0000-4000-8000-000000000044'),
            '00000000-0000-4000-8000-000000001001',
            '#911 单账户'
        )
    $$,
    '编辑可以切换付款账户与金额'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000043'), 0.00, '切换账户后旧账户余额全部回滚');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000044'), -150.00, '切换账户后新账户按新金额扣减');

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('normal'),
            'income',
            '2099-04-01 00:00:00+00',
            pg_temp.items(50, '00000000-0000-4000-8000-000000005002'),
            pg_temp.pay('00000000-0000-4000-8000-000000000044'),
            '00000000-0000-4000-8000-000000001001',
            '#911 单账户'
        )
    $$,
    '编辑可以把支出改为收入'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000044'), 50.00, '同账户编辑只应用差额');
select is(
    (select balance_delta from public.transaction_payment where transaction_record_id = pg_temp.rid('normal')),
    50.00,
    '收入记录的付款明细为正向余额变动'
);

select lives_ok(
    $$ select public.void_transaction('00000000-0000-4000-8000-000000000032', pg_temp.rid('normal')) $$,
    '删除单账户记录'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000044'), 0.00, '删除后按付款明细回滚余额');
reset role;
select is(
    (select count(*) from public.transaction_payment where transaction_record_id = pg_temp.rid('normal')),
    1::bigint,
    '删除记录时付款明细保留供追溯'
);
set local role authenticated;

-- ------------------------------------------------------------
-- 类型转换
-- ------------------------------------------------------------

insert into payment_test_ids
select 'convert', public.create_transaction(
    '00000000-0000-4000-8000-000000000032',
    'expense',
    '2099-04-02 00:00:00+00',
    pg_temp.items(80),
    pg_temp.pay('00000000-0000-4000-8000-000000000043'),
    '00000000-0000-4000-8000-000000001001',
    '#911 类型转换'
);

select lives_ok(
    $$
        select public.convert_transaction_type_with_special_status(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('convert'),
            'transfer',
            '2099-04-02 00:00:00+00',
            '#911 类型转换',
            null,
            null,
            null,
            '00000000-0000-4000-8000-000000000045',
            '00000000-0000-4000-8000-000000000046',
            30
        )
    $$,
    '普通记录可以转换为转账'
);
select is(
    (select count(*) from public.transaction_payment where transaction_record_id = pg_temp.rid('convert')),
    0::bigint,
    '转为转账后删除付款明细'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000043'), 0.00, '转为转账时回滚付款账户余额');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000045'), -30.00, '转账转出账户扣减');

select lives_ok(
    $$
        select public.convert_transaction_type_with_special_status(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('convert'),
            'income',
            '2099-04-02 00:00:00+00',
            '#911 类型转换',
            pg_temp.pay('00000000-0000-4000-8000-000000000041'),
            '00000000-0000-4000-8000-000000001001',
            pg_temp.items(20, '00000000-0000-4000-8000-000000005002'),
            null,
            null,
            null
        )
    $$,
    '转账可以转换回普通记录'
);
select results_eq(
    $$
        select account_id, balance_delta
        from public.transaction_payment
        where transaction_record_id = pg_temp.rid('convert')
    $$,
    $$ values ('00000000-0000-4000-8000-000000000041'::uuid, 20.00::numeric) $$,
    '转回普通记录时按 p_payments 写付款明细'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000045'), 0.00, '转回普通记录时回滚转账余额');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000041'), 20.00, '转回普通记录时付款账户入账');

-- ------------------------------------------------------------
-- 入参校验（失败时整体回滚）
-- ------------------------------------------------------------

create function pg_temp.create_sql(p_payments jsonb, p_items jsonb default pg_temp.items(100))
returns text language sql immutable as $$
    select format(
        'select public.create_transaction(%L, %L, %L, %L::jsonb, %L::jsonb, %L, %L)',
        '00000000-0000-4000-8000-000000000032',
        'expense',
        '2099-04-03 00:00:00+00',
        p_items,
        p_payments,
        '00000000-0000-4000-8000-000000001001',
        '#911 失败用例'
    );
$$;

select throws_ok(pg_temp.create_sql('[]'), '22023', 'payment_required', '付款明细不能为空');
select throws_ok(
    pg_temp.create_sql(pg_temp.pay('00000000-0000-4000-8000-0000000099ff')),
    '22023', 'account_invalid', '付款账户必须属于本账本'
);
select throws_ok(
    pg_temp.create_sql('[{"accountId":"00000000-0000-4000-8000-000000000043","amount":"50"},{"accountId":"00000000-0000-4000-8000-000000000043","amount":"50"}]'),
    '22023', 'payment_account_duplicate', '同一账户不能出现两次'
);
select throws_ok(
    pg_temp.create_sql('[{"accountId":"00000000-0000-4000-8000-000000000043"},{"accountId":"00000000-0000-4000-8000-000000000044"}]'),
    '22023', 'payment_amount_required', '多账户必须提交付款金额'
);
select throws_ok(
    pg_temp.create_sql('[{"accountId":"00000000-0000-4000-8000-000000000043","amount":"-1"},{"accountId":"00000000-0000-4000-8000-000000000044","amount":"101"}]'),
    '22023', 'amount_invalid', '付款金额不能为负数'
);
select throws_ok(
    pg_temp.create_sql('[{"accountId":"00000000-0000-4000-8000-000000000043","amount":"60"},{"accountId":"00000000-0000-4000-8000-000000000044","amount":"30"}]'),
    '22023', 'payment_total_mismatch', '付款合计必须等于支出明细合计'
);
select throws_ok(
    pg_temp.create_sql(
        '[{"accountId":"00000000-0000-4000-8000-000000000043","amount":"60"},{"accountId":"00000000-0000-4000-8000-000000000044","amount":"40"}]',
        '[{"amount":"100","categoryId":"00000000-0000-4000-8000-000000005021"},{"amount":"0","categoryId":"00000000-0000-4000-8000-000000005002"}]'
    ),
    '22023', 'payment_multi_account_not_allowed', '含收入明细的记录不能多账户付款'
);
select throws_ok(
    pg_temp.create_sql('[{"accountId":"00000000-0000-4000-8000-000000000043","amount":"60"},{"accountId":"00000000-0000-4000-8000-000000000042","amount":"40"}]'),
    '22023', 'payment_currency_mismatch', '付款账户必须同币种'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000043'), 0.00, '失败后付款账户余额不变');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000044'), 0.00, '失败后其他账户余额不变');
select is(
    (select count(*) from public.transaction_record where note = '#911 失败用例'),
    0::bigint,
    '失败时记录、明细与付款明细整体回滚'
);

-- ------------------------------------------------------------
-- 退款 / 报销：币种看付款账户；已关联编辑整组替换付款明细
-- ------------------------------------------------------------

insert into payment_test_ids
select 'target', public.create_transaction(
    '00000000-0000-4000-8000-000000000032',
    'expense',
    '2099-04-04 00:00:00+00',
    pg_temp.items(200),
    pg_temp.pay('00000000-0000-4000-8000-000000000043'),
    '00000000-0000-4000-8000-000000001001',
    '#911 退款目标'
);

create function pg_temp.refund_items(p_amount numeric) returns jsonb
language sql stable as $$
    select jsonb_build_array(jsonb_build_object(
        'amount', p_amount,
        'categoryId', '00000000-0000-4000-8000-000000005002',
        'refundedItemId', (select id from public.transaction_item where transaction_record_id = pg_temp.rid('target'))
    ));
$$;

select throws_ok(
    format(
        'select public.create_transaction(%L, %L, %L, %L::jsonb, %L::jsonb, %L, %L)',
        '00000000-0000-4000-8000-000000000032', 'income', '2099-04-04 01:00:00+00',
        pg_temp.refund_items(50), pg_temp.pay('00000000-0000-4000-8000-000000000042'),
        '00000000-0000-4000-8000-000000001001', '#911 退款'
    ),
    '22023', 'refund_currency_mismatch', '退款币种按付款账户判断'
);

insert into payment_test_ids
select 'refund', public.create_transaction(
    '00000000-0000-4000-8000-000000000032',
    'income',
    '2099-04-04 01:00:00+00',
    pg_temp.refund_items(50),
    pg_temp.pay('00000000-0000-4000-8000-000000000044'),
    '00000000-0000-4000-8000-000000001001',
    '#911 退款'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000044'), 50.00, '退款可以进入同币种的其他账户');

create function pg_temp.linked_edit_sql(
    p_amount numeric,
    p_account_id uuid,
    p_expected_record_updated_at timestamptz
) returns text language sql stable as $$
    select format(
        'select public.update_linked_transaction_edit(%L, %L, %L, %L, %L, %L::jsonb, %L::jsonb, %L)',
        '00000000-0000-4000-8000-000000000032',
        pg_temp.rid('refund'),
        '2099-04-04 01:00:00+00',
        '00000000-0000-4000-8000-000000001001',
        '#911 退款',
        (
            select jsonb_build_array(jsonb_build_object(
                'transactionItemId', ti.id,
                'expectedUpdatedAt', ti.updated_at,
                'amount', p_amount,
                'categoryId', ti.category_id
            ))
            from public.transaction_item ti
            where ti.transaction_record_id = pg_temp.rid('refund')
        ),
        pg_temp.pay(p_account_id),
        p_expected_record_updated_at
    );
$$;

select throws_ok(
    pg_temp.linked_edit_sql(60, '00000000-0000-4000-8000-000000000044', '2000-01-01 00:00:00+00'),
    'P0001', 'transaction_item_version_conflict', '已关联编辑校验记录版本'
);
select throws_ok(
    pg_temp.linked_edit_sql(
        60,
        '00000000-0000-4000-8000-000000000042',
        (select updated_at from public.transaction_record where id = pg_temp.rid('refund'))
    ),
    '22023', 'refund_currency_mismatch', '已关联编辑切换到异币种付款账户被拒绝'
);
select lives_ok(
    pg_temp.linked_edit_sql(
        60,
        '00000000-0000-4000-8000-000000000045',
        (select updated_at from public.transaction_record where id = pg_temp.rid('refund'))
    ),
    '已关联编辑可以同时修改金额与同币种付款账户'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000044'), 0.00, '已关联编辑回滚旧付款账户');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000045'), 60.00, '已关联编辑按新金额入账新付款账户');
select is(
    (select refund_amount from public.transaction_item_refund_link
     where refund_income_item_id = (select id from public.transaction_item where transaction_record_id = pg_temp.rid('refund'))),
    60.00,
    '已关联编辑同步退款关联金额'
);
select is(
    (select account_id from public.transaction_item where transaction_record_id = pg_temp.rid('refund')),
    null::uuid,
    '已关联编辑不写明细账户'
);

-- ------------------------------------------------------------
-- 多账户：经正式 RPC 创建 / 编辑 / 转换 / 删除（#914 结束过渡期）
-- ------------------------------------------------------------

create function pg_temp.multi_items(p_amounts numeric[]) returns jsonb
language sql immutable as $$
    select jsonb_agg(
        jsonb_build_object('amount', amount, 'categoryId', '00000000-0000-4000-8000-000000005086')
        order by ordinality
    )
    from unnest(p_amounts) with ordinality as amount;
$$;

-- 账户变动视图中某条记录的 (账户, 余额变动)，按账户排序。
create function pg_temp.movements(p_name text) returns table (account_id uuid, balance_delta numeric)
language sql stable as $$
    select m.account_id, m.balance_delta
    from public.transaction_account_movement m
    where m.transaction_record_id = pg_temp.rid(p_name)
    order by m.account_id;
$$;

-- 与 #921 多账户导入提交给 create_transaction 的 p_payments 同形态：按列顺序的 accountId + 字符串金额。
insert into payment_test_ids
select 'multi', public.create_transaction(
    '00000000-0000-4000-8000-000000000032',
    'expense',
    '2099-04-05 00:00:00+00',
    pg_temp.multi_items(array[3500]),
    '[{"accountId":"00000000-0000-4000-8000-000000000052","amount":"2000"},{"accountId":"00000000-0000-4000-8000-000000000047","amount":"1500"}]',
    '00000000-0000-4000-8000-000000001008',
    '#914 礼品卡 + 信用卡'
);

select results_eq(
    $$
        select account_id, amount, balance_delta, sort_order
        from public.transaction_payment
        where transaction_record_id = pg_temp.rid('multi')
        order by sort_order
    $$,
    $$ values
        ('00000000-0000-4000-8000-000000000052'::uuid, 2000.00::numeric, -2000.00::numeric, 0),
        ('00000000-0000-4000-8000-000000000047'::uuid, 1500.00::numeric, -1500.00::numeric, 1)
    $$,
    '多账户导入形态的付款明细按提交顺序写入'
);
select is(
    (select count(*) from public.transaction_item where transaction_record_id = pg_temp.rid('multi') and account_id is not null),
    0::bigint,
    '多账户记录的明细不保存账户'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000052'), -2000.00, '礼品卡按付款金额扣减');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000047'), -1500.00, '信用卡按付款金额扣减');
select results_eq(
    $$ select * from pg_temp.movements('multi') $$,
    $$ values ('00000000-0000-4000-8000-000000000047'::uuid, -1500.00::numeric), ('00000000-0000-4000-8000-000000000052'::uuid, -2000.00::numeric) $$,
    '账户变动视图按付款明细展开多账户'
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('multi'),
            'expense',
            '2099-04-05 00:00:00+00',
            pg_temp.multi_items(array[40000, 80000]),
            '[{"accountId":"00000000-0000-4000-8000-000000000048","amount":"50000"},{"accountId":"00000000-0000-4000-8000-000000000049","amount":"70000"},{"accountId":"00000000-0000-4000-8000-000000000047","amount":"0"}]',
            '00000000-0000-4000-8000-000000001008',
            '#914 我的账户 + 妻子账户'
        )
    $$,
    '编辑可以增加付款账户、替换账户并调整金额'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000052'), 0.00, '移除的付款账户余额全部回滚');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000047'), 0.00, '保留但金额为 0 的付款账户不再扣减');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000048'), -50000.00, '新增付款账户按金额扣减');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000049'), -70000.00, '第二个新增付款账户按金额扣减');
select is(
    (select count(*) from public.transaction_payment where transaction_record_id = pg_temp.rid('multi')),
    3::bigint,
    '付款明细不再限制为一行'
);

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('multi'),
            'expense',
            '2099-04-05 00:00:00+00',
            pg_temp.multi_items(array[1000]),
            pg_temp.pay('00000000-0000-4000-8000-000000000048'),
            '00000000-0000-4000-8000-000000001008',
            '#914 改回单账户'
        )
    $$,
    '多账户记录可以改回单账户'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000048'), -1000.00, '改回单账户后按新金额扣减');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000049'), 0.00, '改回单账户后移除账户的余额回滚');

select lives_ok(
    $$
        select public.update_transaction(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('multi'),
            'expense',
            '2099-04-05 00:00:00+00',
            pg_temp.multi_items(array[3000]),
            '[{"accountId":"00000000-0000-4000-8000-000000000048","amount":"1000"},{"accountId":"00000000-0000-4000-8000-000000000049","amount":"2000"}]',
            '00000000-0000-4000-8000-000000001008',
            '#914 删除前'
        )
    $$,
    '单账户记录可以改为多账户'
);
select lives_ok(
    $$ select public.void_transaction('00000000-0000-4000-8000-000000000032', pg_temp.rid('multi')) $$,
    '删除多账户记录'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000048'), 0.00, '删除后回滚第一个付款账户');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000049'), 0.00, '删除后回滚第二个付款账户');

insert into payment_test_ids
select 'multi_convert', public.create_transaction(
    '00000000-0000-4000-8000-000000000032',
    'expense',
    '2099-04-06 00:00:00+00',
    pg_temp.multi_items(array[600, 400]),
    '[{"accountId":"00000000-0000-4000-8000-000000000048","amount":"300"},{"accountId":"00000000-0000-4000-8000-000000000049","amount":"700"}]',
    '00000000-0000-4000-8000-000000001008',
    '#914 多账户转换'
);
select lives_ok(
    $$
        select public.convert_transaction_type_with_special_status(
            '00000000-0000-4000-8000-000000000032',
            pg_temp.rid('multi_convert'),
            'transfer',
            '2099-04-06 00:00:00+00',
            '#914 多账户转换',
            null,
            null,
            null,
            '00000000-0000-4000-8000-000000000048',
            '00000000-0000-4000-8000-000000000049',
            100
        )
    $$,
    '多账户记录可以转换为转账'
);
select is(
    (select count(*) from public.transaction_payment where transaction_record_id = pg_temp.rid('multi_convert')),
    0::bigint,
    '转为转账后删除全部付款明细'
);
select results_eq(
    $$ select * from pg_temp.movements('multi_convert') $$,
    $$ values ('00000000-0000-4000-8000-000000000048'::uuid, -100.00::numeric), ('00000000-0000-4000-8000-000000000049'::uuid, 100.00::numeric) $$,
    '转账的账户变动仍来自明细账户'
);
select is(pg_temp.delta('00000000-0000-4000-8000-000000000048'), -100.00, '转为转账后回滚付款并按转出扣减');
select is(pg_temp.delta('00000000-0000-4000-8000-000000000049'), 100.00, '转为转账后回滚付款并按转入入账');

select lives_ok(
    'set constraints public.validate_transaction_record_payments immediate',
    '经 RPC 写入的多账户记录满足付款明细不变量'
);

-- ------------------------------------------------------------
-- 绕过 RPC 的直接写入：延迟约束兜底
-- ------------------------------------------------------------

reset role;

select throws_ok(
    format(
        $f$select pg_temp.check_after(%L)$f$,
        format('delete from public.transaction_payment where transaction_record_id = %L', pg_temp.rid('target'))
    ),
    '22023', 'payment_required', '有效普通记录至少一行付款明细'
);
select throws_ok(
    format(
        $f$select pg_temp.check_after(%L)$f$,
        format(
            'insert into public.transaction_payment (ledger_id, transaction_record_id, account_id, amount, balance_delta) '
            'select ledger_id, id, %L, 0, 0 from public.transaction_record where ledger_id = %L and type = %L limit 1',
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000000032',
            'balance_adjustment'
        )
    ),
    '22023', 'payment_record_type_invalid', '转账 / 余额调整记录不能有付款明细'
);
select throws_ok(
    format(
        $f$select pg_temp.check_after(%L)$f$,
        format('update public.transaction_item set amount = 19 where transaction_record_id = %L', pg_temp.rid('convert'))
    ),
    '22023', 'payment_total_mismatch', '直接修改明细金额而不同步付款明细时被拒绝'
);
select throws_ok(
    format(
        $f$select pg_temp.check_after(%L)$f$,
        format(
            'update public.transaction_item set account_id = %L where transaction_record_id = %L',
            '00000000-0000-4000-8000-000000000044',
            pg_temp.rid('target')
        )
    ),
    '23514', 'transaction_item_account_invalid', '普通记录明细不能写 account_id'
);
select throws_ok(
    format(
        $f$select pg_temp.check_after(%L)$f$,
        format(
            'update public.transaction_payment set account_id = %L where transaction_record_id = %L',
            '00000000-0000-4000-8000-000000000042', pg_temp.rid('target')
        )
    ),
    '22023', 'refund_currency_mismatch', '关联对方的付款账户币种变化时被拒绝'
);
select throws_ok(
    format(
        'insert into public.transaction_payment (ledger_id, transaction_record_id, account_id, amount, balance_delta) values (%L, %L, %L, 0, 0)',
        '00000000-0000-4000-8000-000000000032',
        pg_temp.rid('target'),
        '00000000-0000-4000-8000-000000000043'
    ),
    '23505', null, '同一记录同一账户的付款明细由唯一约束兜底'
);
select throws_ok(
    format(
        'update public.transaction_item set balance_delta = -200 where transaction_record_id = %L',
        pg_temp.rid('target')
    ),
    '23514', 'transaction_item_balance_delta_invalid', '普通记录明细不能写 balance_delta'
);

select lives_ok(
    'set constraints public.validate_transaction_record_payments immediate',
    '本用例写入的全部数据满足付款明细不变量'
);

select * from finish();
rollback;
