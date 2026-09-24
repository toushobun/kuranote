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


select diag('ledger_placeholder_member：管理 RPC、姓名与权限');
create function pg_temp.placeholder_id(p_name text, p_ledger_id uuid default '00000000-0000-4000-8000-000000000032')
returns uuid language sql as $$
    select id from public.ledger_placeholder_member
    where ledger_id = p_ledger_id and display_name collate "C" = p_name collate "C" and claimed_by is null;
$$;
create function pg_temp.create_placeholder_account(p_name text, p_holder text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
    v_id := public.create_account_with_holders('00000000-0000-4000-8000-000000000032',
        p_name, 'bank', 'JPY', 0, '{}', pg_temp.placeholder_id(p_holder));
    set constraints public.account_active_name_unique immediate;
    set constraints public.account_active_name_unique deferred;
    return v_id;
end;
$$;
-- 稳定错误只从 detail 精确断言，不能依赖数据库英文 message。
create function pg_temp.error_detail(p_sql text) returns text language plpgsql as $$
declare v_detail text;
begin
    execute p_sql;
    return '未抛出异常';
exception when others then
    get stacked diagnostics v_detail = pg_exception_detail;
    return v_detail;
end;
$$;

set local role authenticated;
select lives_ok($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032', '  Issue801 Alice  ')$$, '管理员创建时规范化首尾空格');
select is((select created_by from public.ledger_placeholder_member where id = pg_temp.placeholder_id('Issue801 Alice')), auth.uid(), '创建人由当前登录用户填写');
select is(pg_temp.error_detail($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032', ' Issue801 Alice ')$$), 'placeholder_name_conflict', '规范化后重名返回稳定冲突');
select lives_ok($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032', 'Issue801 alice')$$, '姓名精确区分大小写');
select lives_ok($$select public.create_ledger_placeholder_member('78100000-0000-4000-8000-000000000001', 'Issue801 Alice')$$, '不同账本允许同名占位');
select is(pg_temp.error_detail($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032', '   ')$$), 'placeholder_name_invalid', '空姓名不可创建');
select lives_ok($$select public.rename_ledger_placeholder_member('00000000-0000-4000-8000-000000000032', pg_temp.placeholder_id('Issue801 Alice'), ' Issue801 Alice ')$$, '改为规范化后的自身姓名幂等成功');
select is(pg_temp.error_detail($$select public.rename_ledger_placeholder_member('00000000-0000-4000-8000-000000000032', pg_temp.placeholder_id('Issue801 alice'), 'Issue801 Alice')$$), 'placeholder_name_conflict', '改名不能占用其他未认领姓名');
select lives_ok($$select public.ensure_ledger_placeholder_members('00000000-0000-4000-8000-000000000032', array['Issue801 Alice', ' Issue801 Bob ', 'Issue801 Bob'])$$, '批量创建规范化去重并复用同名占位');
select is((select count(*) from public.ledger_placeholder_member where display_name = 'Issue801 Bob'), 1::bigint, '重复输入只创建一个占位');
select results_eq($$select * from public.ensure_ledger_placeholder_members('00000000-0000-4000-8000-000000000032', array[' Issue801 Bob ','Issue801 Alice']) order by display_name collate "C"$$,
    $$select display_name,id from public.ledger_placeholder_member where ledger_id='00000000-0000-4000-8000-000000000032' and display_name in ('Issue801 Bob','Issue801 Alice') order by display_name collate "C"$$,
    '批量返回规范化姓名和稳定 ID');
select is(pg_temp.error_detail($$select public.ensure_ledger_placeholder_members('00000000-0000-4000-8000-000000000032', array['Issue801 rollback',' '])$$), 'placeholder_name_invalid', '批量先校验所有姓名');
select ok(pg_temp.placeholder_id('Issue801 rollback') is null, '批量非法输入不残留先前占位');
select throws_ok($$insert into public.ledger_placeholder_member(ledger_id,display_name,created_by) values('00000000-0000-4000-8000-000000000032','直写',auth.uid())$$, '42501', null, '即使管理员也不能直连创建占位');
select throws_ok($$update public.ledger_placeholder_member set display_name='直改' where id=pg_temp.placeholder_id('Issue801 Alice')$$, '42501', null, '管理员不能直连修改占位');
select throws_ok($$delete from public.ledger_placeholder_member where id=pg_temp.placeholder_id('Issue801 Alice')$$, '42501', null, '管理员不能直连删除占位');

select diag('account_name_scope：双身份约束与占位命名空间');
select lives_ok($$select pg_temp.create_placeholder_account('issue801 shared', 'Issue801 Alice')$$, '第一个占位持有同名账户');
select lives_ok($$select pg_temp.create_placeholder_account('issue801 shared', 'Issue801 Bob')$$, '第二个占位持有同名同类型同币种账户');
select throws_ok($$select pg_temp.create_placeholder_account('ISSUE801 SHARED', 'Issue801 Alice')$$, '23505', null, '同一占位仍拒绝同命名空间重复账户');
reset role;
select is((select count(*) from public.account_name_scope where name='issue801 shared' and holder_user_id is null and holder_placeholder_id is not null), 2::bigint, '两个占位投影的用户列均为空且占位列分别保留 ID');
select is((select count(distinct holder_placeholder_id) from public.account_name_scope where name='issue801 shared'), 2::bigint, '不同占位不会误并入同一命名空间');
select is((select count(*) from public.account_holder h join public.account_name_scope s on s.account_id=h.account_id where h.user_id is not null and (s.holder_user_id is distinct from h.user_id or s.holder_placeholder_id is not null)), 0::bigint, '历史用户投影不生成占位');
set local role authenticated;
select lives_ok($$select pg_temp.create_scope('issue801 empty', 'bank', 'JPY', null)$$, '准备无持有人账户');
reset role;
select throws_ok($$insert into public.account_holder(ledger_id,account_id) select ledger_id,id from public.account where name='issue801 empty'$$, '23514', 'account_holder_identity_invalid', '双空身份被拒绝');
select throws_ok($$insert into public.account_holder(ledger_id,account_id,user_id,placeholder_id) select ledger_id,id,auth.uid(),pg_temp.placeholder_id('Issue801 Alice') from public.account where name='issue801 empty'$$, '23514', 'account_holder_identity_invalid', '双有身份被拒绝');
select throws_ok($$insert into public.account_holder(ledger_id,account_id,placeholder_id) select ledger_id,id,pg_temp.placeholder_id('Issue801 Alice','78100000-0000-4000-8000-000000000001') from public.account where name='issue801 empty'$$, '23514', 'placeholder_unavailable', '占位不能跨账本引用');
select throws_ok($$insert into public.account_holder(ledger_id,account_id,user_id) select ledger_id,id,auth.uid() from public.account where name='issue801 shared' limit 1$$, '23505', null, '单账户仍然最多一个持有人行');
select throws_ok($$update public.account_holder set account_id=(select id from public.account where name='issue801 empty') where placeholder_id=pg_temp.placeholder_id('Issue801 Alice')$$, '23514', 'account_holder_identity_immutable', '持有行不能换账户');
select throws_ok($$update public.account_holder set ledger_id='78100000-0000-4000-8000-000000000001' where placeholder_id=pg_temp.placeholder_id('Issue801 Alice')$$, '23514', 'account_holder_identity_immutable', '持有行不能跨账本移动');
set local role authenticated;
select is(pg_temp.error_detail($$select public.create_account_with_holders('00000000-0000-4000-8000-000000000032','issue801 invalid','bank','JPY',0,array[auth.uid()],pg_temp.placeholder_id('Issue801 Alice'))$$), 'account_holder_identity_invalid', '创建 RPC 拒绝同时指定用户与占位');
select is(pg_temp.error_detail($$select public.delete_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',pg_temp.placeholder_id('Issue801 Alice'))$$), 'placeholder_in_use', '存在账户引用禁止删除占位');

-- 创建独立三态编辑账户，避免与上面的同名账户产生预期之外的冲突。
select pg_temp.create_placeholder_account('issue801 edit', 'Issue801 Alice');
select lives_ok($$select public.update_account_with_holders('00000000-0000-4000-8000-000000000032',(select id from public.account where name='issue801 edit'),'issue801 edit','bank','JPY','{}',pg_temp.placeholder_id('Issue801 Bob'))$$, '编辑可从旧占位切换到新占位');
select is((select placeholder_id from public.account_holder where account_id=(select id from public.account where name='issue801 edit')),pg_temp.placeholder_id('Issue801 Bob'),'旧占位引用被替换');
select lives_ok($$select public.update_account_with_holders('00000000-0000-4000-8000-000000000032',(select id from public.account where name='issue801 edit'),'issue801 edit','bank','JPY',array[auth.uid()])$$, '编辑可从占位切换到真实用户');
select is((select user_id from public.account_holder where account_id=(select id from public.account where name='issue801 edit')),auth.uid(),'切换后保存真实用户 ID');
select lives_ok($$select public.update_account_with_balance_adjustment('00000000-0000-4000-8000-000000000032',(select id from public.account where name='issue801 edit'),'issue801 edit','bank','JPY','{}',12,'占位余额调整',pg_temp.placeholder_id('Issue801 Bob'))$$, '实际编辑 RPC 可切回占位并原子调整余额');
select is((select current_balance from public.account where name='issue801 edit'),12::numeric,'占位编辑保留余额调整行为');
select lives_ok($$select public.update_account_with_holders('00000000-0000-4000-8000-000000000032',(select id from public.account where name='issue801 edit'),'issue801 edit','bank','JPY','{}')$$, '编辑可移除占位恢复无持有人');
select is((select count(*) from public.account_holder where account_id=(select id from public.account where name='issue801 edit')),0::bigint,'空用户比较不会遗漏占位引用');

select diag('ledger_placeholder_member：已认领历史、引用和邀请字段');
-- 本 Issue 不实现认领 RPC，以数据库维护角色构造已认领状态，测试后整体回滚。
reset role;
create temporary table issue801_claimed as select pg_temp.placeholder_id('Issue801 alice') as id;
grant select on issue801_claimed to authenticated;
update public.ledger_placeholder_member set claimed_by='00000000-0000-4000-8000-000000000034',claimed_at=now() where id=(select id from issue801_claimed);
select throws_ok($$insert into public.ledger_placeholder_member(ledger_id,display_name,created_by) values('00000000-0000-4000-8000-000000000032',' 未规范化 ',auth.uid())$$,'23514',null,'数据库拒绝未规范化姓名');
select throws_ok($$update public.ledger_placeholder_member set claimed_at=null where id=(select id from issue801_claimed)$$,'23514',null,'认领用户与时间必须同时非空');
set local role authenticated;
select lives_ok($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','Issue801 alice')$$,'已认领历史名字可由新占位复用');
select is(pg_temp.error_detail($$select public.rename_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',(select id from issue801_claimed),'新名字')$$),'placeholder_already_claimed','已认领占位不能改名');
select is(pg_temp.error_detail($$select public.delete_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',(select id from issue801_claimed))$$),'placeholder_already_claimed','已认领占位不能从管理入口删除');
reset role;
select throws_ok($$insert into public.account_holder(ledger_id,account_id,placeholder_id) select ledger_id,id,(select id from issue801_claimed) from public.account where name='issue801 empty'$$,'23514','placeholder_unavailable','已认领占位不能新增引用');
set local role authenticated;
select is(pg_temp.error_detail($$select public.create_account_with_holders('00000000-0000-4000-8000-000000000032','已认领账户','bank','JPY',0,'{}',(select id from issue801_claimed))$$),'placeholder_already_claimed','账户 RPC 同样拒绝已认领占位');
select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','Issue801 archived');
select pg_temp.create_placeholder_account('issue801 archived account','Issue801 archived');
update public.account set is_archived=true,archived_at=now(),archived_by=auth.uid() where name='issue801 archived account';
select is(pg_temp.error_detail($$select public.delete_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',pg_temp.placeholder_id('Issue801 archived'))$$),'placeholder_in_use','归档账户引用也禁止删除');
select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','Issue801 invitation');
select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','Issue801 invitation second');
-- #809 起邀请必须绑定占位：先各自生成绑定邀请，再由数据库维护角色改写关联以验证约束。
create temporary table issue801_invites as select invite_id, token from public.create_ledger_invite_v2('00000000-0000-4000-8000-000000000032','member',pg_temp.placeholder_id('Issue801 invitation'));
insert into issue801_invites select invite_id,token from public.create_ledger_invite_v2('00000000-0000-4000-8000-000000000032','viewer',pg_temp.placeholder_id('Issue801 invitation second'));
reset role;
select throws_ok($$update public.ledger_invite set placeholder_id=pg_temp.placeholder_id('Issue801 Alice','78100000-0000-4000-8000-000000000001') where id=(select invite_id from issue801_invites limit 1)$$,'23503',null,'邀请复合外键拒绝跨账本占位');
select throws_ok($$update public.ledger_invite set placeholder_id=pg_temp.placeholder_id('Issue801 invitation') where placeholder_id=pg_temp.placeholder_id('Issue801 invitation second')$$,'23505',null,'同一占位最多一条未接受未撤销邀请');
update public.ledger_invite set revoked_at=now(),revoked_by=auth.uid(),invite_token=null,placeholder_id=pg_temp.placeholder_id('Issue801 invitation') where placeholder_id=pg_temp.placeholder_id('Issue801 invitation second');
set local role authenticated;
select lives_ok($$select public.delete_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',pg_temp.placeholder_id('Issue801 invitation'))$$,'无账户引用时删除占位并使关联邀请失效');
reset role;
select is((select count(*) from public.ledger_invite where id in(select invite_id from issue801_invites) and placeholder_id is null and revoked_at is not null and invite_token is null),2::bigint,'邀请记录保留、关联置空且明文 token 清除');

select diag('ledger_invite：占位字段、复合外键与有效邀请唯一索引');
-- 只验证字段与约束本身，绑定/接受邀请的业务 RPC 属于 #802。
set local role authenticated;
select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','Issue801 invite constraint');
reset role;
create function pg_temp.insert_placeholder_invite(p_placeholder uuid, p_accepted boolean default false)
returns void language sql as $$
    insert into public.ledger_invite(ledger_id,inviter_user_id,created_by,role,token_hash,invite_token,placeholder_id,accepted_at,accepted_by)
    values('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000031','member',
        md5(random()::text), case when p_accepted then null else md5(random()::text)||md5(random()::text) end,
        p_placeholder, case when p_accepted then now() end, case when p_accepted then '00000000-0000-4000-8000-000000000034'::uuid end);
$$;
select lives_ok($$select pg_temp.insert_placeholder_invite(pg_temp.placeholder_id('Issue801 invite constraint'))$$,'占位可以绑定一条有效邀请');
select throws_ok($$select pg_temp.insert_placeholder_invite(pg_temp.placeholder_id('Issue801 invite constraint'))$$,'23505',null,'第二条指向同一占位的未接受未撤销邀请被唯一索引拒绝');
select lives_ok($$select pg_temp.insert_placeholder_invite(pg_temp.placeholder_id('Issue801 invite constraint'),true)$$,'已接受邀请不占用有效邀请名额');
select throws_ok($$select pg_temp.insert_placeholder_invite(null)$$,'23514',null,'#809：未绑定占位的待接受邀请被 CHECK 拒绝');
select lives_ok($$select pg_temp.insert_placeholder_invite(null,true); select pg_temp.insert_placeholder_invite(null,true)$$,'已接受的历史匿名邀请不受占位唯一索引限制');
select throws_ok($$select pg_temp.insert_placeholder_invite(gen_random_uuid())$$,'23503',null,'邀请不能引用不存在的占位');
select throws_ok($$delete from public.ledger_placeholder_member where id=pg_temp.placeholder_id('Issue801 invite constraint')$$,'23503',null,'被邀请引用的占位禁止直接删除');

select diag('ledger_placeholder_member：真实数据库角色下的 RLS');
set local role authenticated;
select ok((select count(*)>0 from public.ledger_placeholder_member where ledger_id='00000000-0000-4000-8000-000000000032'),'同账本 active owner 可以读取占位');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000034',true);
select ok((select count(*)>0 from public.ledger_placeholder_member where ledger_id='00000000-0000-4000-8000-000000000032'),'同账本 active 普通成员可以读取占位');
select is((select count(*) from public.ledger_placeholder_member where ledger_id='78100000-0000-4000-8000-000000000001'),0::bigint,'RLS 隐藏其他账本占位');
select is(pg_temp.error_detail($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','越权创建')$$),'permission_denied','普通成员直接调用创建 RPC 被拒');
select is(pg_temp.error_detail($$select public.rename_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',pg_temp.placeholder_id('Issue801 Alice'),'越权改名')$$),'permission_denied','普通成员直接调用改名 RPC 被拒');
select is(pg_temp.error_detail($$select public.delete_ledger_placeholder_member('00000000-0000-4000-8000-000000000032',pg_temp.placeholder_id('Issue801 Alice'))$$),'permission_denied','普通成员直接调用删除 RPC 被拒');
select is(pg_temp.error_detail($$select public.ensure_ledger_placeholder_members('00000000-0000-4000-8000-000000000032',array['越权批量'])$$),'permission_denied','普通成员直接调用批量 RPC 被拒');
select throws_ok($$insert into public.ledger_placeholder_member(ledger_id,display_name,created_by) values('00000000-0000-4000-8000-000000000032','越权直写',auth.uid())$$,'42501',null,'普通成员直连 DML 被拒');
select throws_ok($$insert into public.account_holder(ledger_id,account_id,placeholder_id) select ledger_id,id,pg_temp.placeholder_id('Issue801 Bob') from public.account where name='issue801 empty'$$,'42501',null,'普通成员不能直连新增账户占位引用');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000037',true);
select is((select count(*) from public.ledger_placeholder_member),0::bigint,'未加入账本的用户看不到占位');
select set_config('request.jwt.claim.sub','',true);
select is((select count(*) from public.ledger_placeholder_member),0::bigint,'未登录的 authenticated 会话看不到占位');
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
select public.update_ledger_member_settings('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000034','测试成员','sakura','viewer');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000034',true);
select ok((select count(*)>0 from public.ledger_placeholder_member),'viewer 可读取同账本占位');
select is(pg_temp.error_detail($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','只读越权')$$),'permission_denied','viewer 不获得占位管理权限');
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000031',true);
select public.update_ledger_member_settings('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000034','测试成员','sakura','admin');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000034',true);
select ok((select count(*)>0 from public.ledger_placeholder_member where ledger_id='00000000-0000-4000-8000-000000000032'),'active admin 可以读取同账本占位');
select lives_ok($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','管理员占位')$$,'active admin 可以管理占位');
reset role;
select set_config('request.jwt.claim.sub','',true);
update public.ledger_member set status='removed',removed_at=now(),removed_by='00000000-0000-4000-8000-000000000031' where user_id='00000000-0000-4000-8000-000000000034' and ledger_id='00000000-0000-4000-8000-000000000032';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000034',true);
select is((select count(*) from public.ledger_placeholder_member),0::bigint,'已移除管理员不再具有读取权限');
select is(pg_temp.error_detail($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','已移除越权')$$),'permission_denied','已移除管理员不能调用管理 RPC');
reset role;
set local role anon;
select throws_ok($$select public.create_ledger_placeholder_member('00000000-0000-4000-8000-000000000032','匿名')$$,'42501',null,'匿名角色没有 RPC 执行权限');
select throws_ok($$select * from public.ledger_placeholder_member$$,'42501',null,'匿名角色没有表读取权限');
reset role;
select ok(not has_function_privilege('authenticated','public.lock_ledger_placeholder_management(uuid)','execute'),'客户端不能调用内部锁函数');
select ok(not has_function_privilege('authenticated','public.validate_account_holder_active_member()','execute'),'客户端不能直接执行内部校验函数');
select ok(not has_table_privilege('service_role','public.account_name_scope','select'),'名称投影仍禁止 service_role 直接读取');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_account_with_holders','update_account_with_holders','update_account_with_balance_adjustment')),3::bigint,'三个账户 RPC 均只有一个签名而无歧义重载');


select diag('ledger_placeholder_member：真实双会话并发与旧引用复核');
create extension if not exists dblink with schema extensions;
create function pg_temp.wait_placeholder_lock(p_pid integer, p_blocker integer)
returns boolean language plpgsql as $$
begin
    for attempt in 1..200 loop
        if p_blocker = any(pg_blocking_pids(p_pid)) then return true; end if;
        perform pg_sleep(0.025);
    end loop;
    return false;
end;
$$;
create function pg_temp.placeholder_concurrency()
returns setof text language plpgsql as $fn$
declare
    v_connection text := format('host=%s port=%s dbname=%s user=postgres password=postgres',host(inet_server_addr()),inet_server_port(),current_database());
    v_ledger uuid := gen_random_uuid();
    v_placeholder uuid;
    v_new_placeholder uuid;
    v_account uuid;
    v_a_pid integer;
    v_b_pid integer;
    v_result text;
    v_count bigint;
    v_cleanup text;
    v_call text;
begin
    perform dblink_connect('placeholder_a',v_connection);
    perform dblink_connect('placeholder_b',v_connection);
    select pid into v_a_pid from dblink('placeholder_a','select pg_backend_pid()') as t(pid integer);
    select pid into v_b_pid from dblink('placeholder_b','select pg_backend_pid()') as t(pid integer);
    v_cleanup := format($q$
        delete from public.account_holder where ledger_id=%1$L;
        delete from public.account where ledger_id=%1$L;
        delete from public.ledger_placeholder_member where ledger_id=%1$L;
        delete from public.ledger_member_display_setting where ledger_id=%1$L;
        delete from public.ledger_member where ledger_id=%1$L;
        delete from public.ledger where id=%1$L;
    $q$,v_ledger);
    perform dblink_exec('placeholder_a',format($q$
        insert into public.ledger(id,name,base_currency,owner_user_id) values(%1$L,'占位并发测试','JPY','00000000-0000-4000-8000-000000000031');
        insert into public.ledger_member(ledger_id,user_id,role,status,joined_at)
        values(%1$L,'00000000-0000-4000-8000-000000000031','owner','active',now());
    $q$,v_ledger));
    -- 在远端子事务收集 SQLSTATE/detail，失败写入自动回滚，避免解析英文错误。
    perform dblink_exec('placeholder_b',$q$
        create function pg_temp.run_placeholder_sql(p_sql text) returns text language plpgsql as $remote$
        declare v_detail text;
        begin
            execute p_sql;
            return 'ok';
        exception when others then
            get stacked diagnostics v_detail = pg_exception_detail;
            return sqlstate || ':' || coalesce(v_detail,'');
        end;
        $remote$;
        set role authenticated;
        set request.jwt.claim.sub='00000000-0000-4000-8000-000000000031';
        set statement_timeout='10s';
    $q$);
    perform dblink_exec('placeholder_a',$q$set request.jwt.claim.sub='00000000-0000-4000-8000-000000000031'$q$);
    -- 确认第二会话确实以客户端角色和 owner 身份执行，而不是沿用维护连接的超级用户权限。
    select r into v_result from dblink('placeholder_b','select current_user || '':'' || auth.uid()') as t(r text);
    return next is(v_result,'authenticated:00000000-0000-4000-8000-000000000031','第二会话以 authenticated 角色和 owner 身份调用 RPC');

    perform dblink_exec('placeholder_a','begin; set local role authenticated');
    select id into v_placeholder from dblink('placeholder_a',format('select public.create_ledger_placeholder_member(%L,''同名竞争'')',v_ledger)) as t(id uuid);
    v_call := format('select pg_temp.run_placeholder_sql(%L)',format('select public.create_ledger_placeholder_member(%L,'' 同名竞争 '')',v_ledger));
    perform dblink_send_query('placeholder_b',v_call);
    return next ok(pg_temp.wait_placeholder_lock(v_b_pid,v_a_pid),'并发创建同名占位等待账本锁');
    perform dblink_exec('placeholder_a','commit');
    select result into v_result from dblink_get_result('placeholder_b') as t(result text);
    perform * from dblink_get_result('placeholder_b') as t(result text);
    return next is(v_result,'23505:placeholder_name_conflict','后提交的同名创建返回稳定冲突');

    perform dblink_exec('placeholder_a','begin; set local role authenticated');
    perform * from dblink('placeholder_a',format('select * from public.ensure_ledger_placeholder_members(%L,array[''批量竞争''])',v_ledger)) as t(display_name text,placeholder_id uuid);
    perform dblink_send_query('placeholder_b',format('select pg_temp.run_placeholder_sql(%L)',format('select public.ensure_ledger_placeholder_members(%L,array['' 批量竞争 ''])',v_ledger)));
    return next ok(pg_temp.wait_placeholder_lock(v_b_pid,v_a_pid),'并发批量 ensure 等待相同账本锁');
    perform dblink_exec('placeholder_a','commit');
    select result into v_result from dblink_get_result('placeholder_b') as t(result text);
    perform * from dblink_get_result('placeholder_b') as t(result text);
    return next is(v_result,'ok','并发批量请求在锁后复用成功');
    select count into v_count from dblink('placeholder_a',format('select count(*) from public.ledger_placeholder_member where ledger_id=%L and display_name=''批量竞争''',v_ledger)) as t(count bigint);
    return next is(v_count,1::bigint,'并发 ensure 不创建重复占位');

    -- 模拟 #802 将使用的账本→占位锁及已认领状态，不引入接受邀请逻辑。
    perform dblink_exec('placeholder_a','begin');
    perform * from dblink('placeholder_a',format('select id from public.ledger where id=%L for update',v_ledger)) as t(id uuid);
    perform dblink_exec('placeholder_a',format('update public.ledger_placeholder_member set claimed_by=''00000000-0000-4000-8000-000000000031'',claimed_at=now() where id=%L',v_placeholder));
    perform dblink_send_query('placeholder_b',format('select pg_temp.run_placeholder_sql(%L)',format('select public.rename_ledger_placeholder_member(%L,%L,''不应改名'')',v_ledger,v_placeholder)));
    return next ok(pg_temp.wait_placeholder_lock(v_b_pid,v_a_pid),'改名等待模拟认领事务持有的账本锁');
    perform dblink_exec('placeholder_a','commit');
    select result into v_result from dblink_get_result('placeholder_b') as t(result text);
    perform * from dblink_get_result('placeholder_b') as t(result text);
    return next is(v_result,'23514:placeholder_already_claimed','认领先提交后改名重新读取状态并拒绝');

    select id into v_placeholder from dblink('placeholder_a',format('select public.create_ledger_placeholder_member(%L,''直接引用竞争'')',v_ledger)) as t(id uuid);
    select id into v_account from dblink('placeholder_a',format('select public.create_account_with_holders(%L,''并发账户'',''bank'',''JPY'',0,''{}'')',v_ledger)) as t(id uuid);
    perform dblink_exec('placeholder_a','begin');
    perform dblink_exec('placeholder_a',format('update public.ledger_placeholder_member set claimed_by=''00000000-0000-4000-8000-000000000031'',claimed_at=now() where id=%L',v_placeholder));
    -- 客户端无直接写表权限；维护角色 DML 仍须通过引用触发器及权限校验。
    perform dblink_exec('placeholder_b','reset role');
    perform dblink_send_query('placeholder_b',format('select pg_temp.run_placeholder_sql(%L)',format('insert into public.account_holder(ledger_id,account_id,placeholder_id) values(%L,%L,%L)',v_ledger,v_account,v_placeholder)));
    return next ok(pg_temp.wait_placeholder_lock(v_b_pid,v_a_pid),'直接 DML 引用也等待占位锁');
    perform dblink_exec('placeholder_a','commit');
    select result into v_result from dblink_get_result('placeholder_b') as t(result text);
    perform * from dblink_get_result('placeholder_b') as t(result text);
    return next is(v_result,'23514:placeholder_unavailable','认领先提交后直接 DML 不会新增过期占位引用');

    select id into v_placeholder from dblink('placeholder_a',format('select public.create_ledger_placeholder_member(%L,''旧引用'')',v_ledger)) as t(id uuid);
    select id into v_new_placeholder from dblink('placeholder_a',format('select public.create_ledger_placeholder_member(%L,''新引用'')',v_ledger)) as t(id uuid);
    perform dblink_exec('placeholder_a',format('insert into public.account_holder(ledger_id,account_id,placeholder_id) values(%L,%L,%L)',v_ledger,v_account,v_placeholder));
    perform dblink_exec('placeholder_a','begin');
    perform * from dblink('placeholder_a',format('select id from public.ledger_placeholder_member where id=%L for update',v_placeholder)) as t(id uuid);
    perform dblink_exec('placeholder_b','set role authenticated');
    perform dblink_send_query('placeholder_b',format('select pg_temp.run_placeholder_sql(%L)',format('select public.update_account_with_holders(%L,%L,''过期编辑'',''bank'',''JPY'',''{}'')',v_ledger,v_account)));
    return next ok(pg_temp.wait_placeholder_lock(v_b_pid,v_a_pid),'账户编辑先锁旧占位再取得账户锁');
    -- 持有旧占位锁的维护会话直接换到新占位，制造 RPC 读过的旧引用失效。
    perform dblink_exec('placeholder_a',format('update public.account_holder set placeholder_id=%L where account_id=%L',v_new_placeholder,v_account));
    perform dblink_exec('placeholder_a','commit');
    select result into v_result from dblink_get_result('placeholder_b') as t(result text);
    perform * from dblink_get_result('placeholder_b') as t(result text);
    return next is(v_result,'40001:account_holder_changed','旧引用在锁前变化时编辑回滚并要求重试');
    select name into v_result from dblink('placeholder_a',format('select name from public.account where id=%L',v_account)) as t(name text);
    return next is(v_result,'并发账户','过期编辑没有写入账户资料');

    perform dblink_exec('placeholder_a',$q$set request.jwt.claim.sub=''$q$);
    perform dblink_exec('placeholder_a',v_cleanup);
    perform dblink_disconnect('placeholder_a');
    perform dblink_disconnect('placeholder_b');
exception when others then
    perform dblink_cancel_query('placeholder_b');
    perform dblink_disconnect('placeholder_b');
    perform dblink_exec('placeholder_a','rollback');
    perform dblink_exec('placeholder_a',$q$reset role; set request.jwt.claim.sub=''$q$);
    perform dblink_exec('placeholder_a',v_cleanup);
    perform dblink_disconnect('placeholder_a');
    raise;
end;
$fn$;
select * from pg_temp.placeholder_concurrency();

select * from finish();
rollback;
