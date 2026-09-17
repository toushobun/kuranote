begin;
set local search_path = public, extensions;
select no_plan();

select ok((select relrowsecurity from pg_class where oid = 'public.account_name_scope'::regclass), '内部名称投影启用 RLS');
select ok(not has_table_privilege('authenticated', 'public.account_name_scope', 'insert'), '客户端不能伪造名称投影');
select ok(not has_function_privilege('authenticated', 'public.sync_account_name_scope(uuid)', 'execute'), '客户端不能调用内部同步函数');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);

-- 每次模拟一次 RPC 事务提交，在子事务内触发延迟唯一检查。
create function pg_temp.check_scope(p_sql text) returns void language plpgsql as $$
begin
    execute p_sql;
    set constraints public.account_active_name_unique immediate;
    set constraints public.account_active_name_unique deferred;
end;
$$;
create function pg_temp.create_scope(p_name text, p_type text default 'bank', p_currency text default 'JPY', p_holder uuid default '00000000-0000-4000-8000-000000000031')
returns void language plpgsql as $$
begin
    perform public.create_account_with_holders(
        '00000000-0000-4000-8000-000000000032', p_name, p_type, p_currency, 0,
        case when p_holder is null then '{}'::uuid[] else array[p_holder] end
    );
    set constraints public.account_active_name_unique immediate;
    set constraints public.account_active_name_unique deferred;
end;
$$;

select lives_ok($$select pg_temp.create_scope('issue781 debit')$$, '创建基准账户');
select throws_ok($$select pg_temp.create_scope('ISSUE781 DEBIT')$$, '23505', null, '相同类型、货币、持有人下忽略大小写拒绝同名');
select lives_ok($$select pg_temp.create_scope('issue781 debit', 'cash')$$, '仅类型不同允许同名');
select lives_ok($$select pg_temp.create_scope('issue781 debit', 'bank', 'USD')$$, '仅货币不同允许同名');
select lives_ok($$select pg_temp.create_scope('issue781 debit', 'bank', 'JPY', '00000000-0000-4000-8000-000000000034')$$, '仅持有人不同允许同名');
select lives_ok($$select pg_temp.create_scope('issue781 debit', 'bank', 'JPY', null)$$, '未指定持有人和指定持有人互不冲突');
select throws_ok($$select pg_temp.create_scope('issue781 debit', 'bank', 'JPY', null)$$, '23505', null, '两个未指定持有人的同维度账户重复');
select lives_ok($$select pg_temp.create_scope('issue781 another')$$, '同维度不同名称允许创建');
select is((select count(*) from public.account where name ilike 'issue781 debit'), 5::bigint, '失败创建不残留账户或临时投影');

select throws_ok($$select pg_temp.check_scope($q$
    update public.account set type = 'bank' where name = 'issue781 debit' and type = 'cash'
$q$)$$, '23505', null, '直接修改账户类型也不能绕过判重');
select throws_ok($$select pg_temp.check_scope($q$
    update public.account set currency = 'JPY' where name = 'issue781 debit' and currency = 'USD'
$q$)$$, '23505', null, '直接修改货币也不能绕过判重');
select throws_ok($$select pg_temp.check_scope($q$
    update public.account_holder set user_id = '00000000-0000-4000-8000-000000000031'
    where account_id in (select id from public.account where name = 'issue781 debit')
      and user_id = '00000000-0000-4000-8000-000000000034'
$q$)$$, '23505', null, '直接更换持有人不能绕过判重');
select throws_ok($$select pg_temp.check_scope($q$
    delete from public.account_holder where account_id in (
        select id from public.account where name = 'issue781 debit' and type = 'bank' and currency = 'JPY'
    ) and user_id = '00000000-0000-4000-8000-000000000034'
$q$)$$, '23505', null, '删除持有人后与未指定持有人账户判重');

select throws_ok($$select pg_temp.check_scope($q$
    select public.update_account_with_balance_adjustment(
        '00000000-0000-4000-8000-000000000032',
        (select id from public.account where name = 'issue781 another'),
        'issue781 debit', 'bank', 'JPY', array['00000000-0000-4000-8000-000000000031']::uuid[], 100, '重复应回滚'
    )
$q$)$$, '23505', null, '编辑 RPC 同名失败连同余额调整一起回滚');
select is((select current_balance from public.account where name = 'issue781 another'), 0::numeric, '失败编辑保留原余额和名称');

select lives_ok($$select pg_temp.check_scope($q$
    select public.update_account_with_holders(
        '00000000-0000-4000-8000-000000000032',
        (select id from public.account where name = 'issue781 another'),
        'issue781 debit', 'other', 'JPY', array['00000000-0000-4000-8000-000000000034']::uuid[]
    )
$q$)$$, '编辑同时更改名称、类型及持有人按最终状态判重');

select lives_ok($$select pg_temp.check_scope($q$
    update public.account set is_archived = true, archived_at = now(), archived_by = '00000000-0000-4000-8000-000000000031'
    where name = 'issue781 debit' and currency = 'USD'
$q$)$$, '归档释放名称');
select lives_ok($$select pg_temp.create_scope('issue781 debit', 'bank', 'USD')$$, '归档后允许相同维度重建');
select throws_ok($$select pg_temp.check_scope($q$
    update public.account set is_archived = false, archived_at = null, archived_by = null
    where name = 'issue781 debit' and is_archived
$q$)$$, '23505', null, '恢复归档账户仍受同维度判重保护');

-- 清空 jwt claim，让 ledger_member 的管理权限触发器按"未认证"分支放行本次 fixture 插入。
select set_config('request.jwt.claim.sub', '', true);

insert into public.ledger (id, name, base_currency, owner_user_id)
values ('78100000-0000-4000-8000-000000000001', '其他账本', 'JPY', '00000000-0000-4000-8000-000000000031');

insert into public.ledger_member (
    id, ledger_id, user_id, role, status, invited_by, invited_at, joined_at, created_by, updated_by
)
values (
    '78100000-0000-4000-8000-000000000002',
    '78100000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000031',
    'owner', 'active',
    '00000000-0000-4000-8000-000000000031', now(), now(),
    '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);

select lives_ok($$select pg_temp.check_scope($q$
    insert into public.account (ledger_id, name, type, currency)
    values ('78100000-0000-4000-8000-000000000001', 'issue781 debit', 'bank', 'JPY')
$q$)$$, '不同账本允许同维度同名');

select * from finish();
rollback;
