begin;
set local search_path = public, extensions;
select plan(9);
create extension if not exists dblink with schema extensions;

-- 两个真实会话操作独立 fixture，不触碰 seed 商家或用户当前账本。
do $$
declare v_name text;
begin
  foreach v_name in array array['preset878_a', 'preset878_b'] loop
    perform extensions.dblink_connect(v_name, format('host=%s port=%s dbname=%s user=postgres password=postgres application_name=%s', host(inet_server_addr()), inet_server_port(), current_database(), v_name));
  end loop;
end;
$$;
select dblink_exec('preset878_a', $setup$
  do $remote$
  begin
    if exists(select 1 from public.ledger where id = '87800000-0000-4000-8000-000000000002') then
      perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', false);
      perform public.delete_ledger('87800000-0000-4000-8000-000000000002');
      perform set_config('request.jwt.claim.sub', '', false);
    end if;
    insert into public.ledger(id, name, base_currency, owner_user_id, created_by, updated_by)
    values('87800000-0000-4000-8000-000000000002', '预设并发测试', 'JPY', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
    insert into public.ledger_member(ledger_id, user_id, role, status, joined_at, created_by, updated_by)
    values('87800000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000031', 'owner', 'active', now(), '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('87800000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000034', 'admin', 'active', now(), '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');
  end;
  $remote$;
$setup$);

create temporary table preset878_query as
select format('select public.add_merchant_presets(%L, %L, %L::jsonb)',
  '87800000-0000-4000-8000-000000000002', 'JPY',
  jsonb_build_object('accounts', '[]'::jsonb, 'multiAccountPaymentEnabled', false, 'specialStatusEnabled', false,
    'merchantTags', jsonb_build_array(jsonb_build_object('key','tag','name','并发标签','icon','🛒')),
    'merchants', jsonb_build_array(jsonb_build_object('name','并发商家','websiteUrl',null,'iconUrl',null,
      'aliases',jsonb_build_array(jsonb_build_object('alias','并发别名','locale','zh')),'tagKeys',jsonb_build_array('tag')))
  )::text) as query;

do $$
declare v_name text;
begin
  foreach v_name in array array['preset878_a', 'preset878_b'] loop
    perform extensions.dblink_exec(v_name, 'set role authenticated');
    perform extensions.dblink_exec(v_name, $claims$do $remote$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', false); end; $remote$;$claims$);
  end loop;
end;
$$;
select dblink_exec('preset878_a', 'begin');
select is((select count from dblink('preset878_a', (select query from preset878_query)) as result(count integer)), 1, '第一个事务添加一个商家并持有账本锁');
select dblink_send_query('preset878_b', (select query from preset878_query));

create function pg_temp.wait_for_preset_block() returns boolean language plpgsql as $$
declare v_waiting boolean := false;
begin
  for attempt in 1..50 loop
    select exists(select 1 from pg_stat_activity a where a.application_name = 'preset878_b' and cardinality(pg_blocking_pids(a.pid)) > 0) into v_waiting;
    exit when v_waiting;
    perform pg_sleep(0.1);
  end loop;
  return v_waiting;
end;
$$;
select ok(pg_temp.wait_for_preset_block(), '第二个并发事务等待同一账本锁');
select dblink_exec('preset878_a', 'commit');
select is((select count from dblink_get_result('preset878_b') as result(count integer)), 0, '取得锁后重新判重，第二个批次跳过');
select is((select count(*) from public.merchant where ledger_id = '87800000-0000-4000-8000-000000000002'), 1::bigint, '并发完成后只存在一个商家');
select is((select count(*) from public.merchant_tags where ledger_id = '87800000-0000-4000-8000-000000000002'), 1::bigint, '并发完成后只存在一个标签');

-- 同一真实等待场景下撤销管理员成员身份，RPC 必须在取得锁后再次拒绝。
select * from dblink_get_result('preset878_b') as result(count integer);
select dblink_exec('preset878_b', $claims$do $remote$ begin perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000034', false); end; $remote$;$claims$);
select dblink_exec('preset878_a', 'begin');
select dblink_exec('preset878_a', $lock$do $remote$ begin perform pg_advisory_xact_lock(hashtext('87800000-0000-4000-8000-000000000002')); end; $remote$;$lock$);
select dblink_send_query('preset878_b', (select replace(replace(query, '并发商家', '权限商家'), '并发别名', '权限别名') from preset878_query));
select ok(pg_temp.wait_for_preset_block(), '权限检查通过的管理员等待账本锁');
select dblink_exec('preset878_a', 'reset role');
select is(dblink_exec('preset878_a', $revoke$update public.ledger_member set status='removed', removed_at=now(), removed_by='00000000-0000-4000-8000-000000000031' where ledger_id='87800000-0000-4000-8000-000000000002' and user_id='00000000-0000-4000-8000-000000000034'$revoke$), 'UPDATE 1', '真实撤销等待会话的管理员成员身份');
select dblink_exec('preset878_a', 'commit');
select throws_ok($$select * from dblink_get_result('preset878_b') as result(count integer)$$, '42501', 'permission_denied', '锁后再次检查 active 身份，拒绝权限已失效的批次');
select is((select count(*) from public.merchant where ledger_id='87800000-0000-4000-8000-000000000002'), 1::bigint, '失效批次没有写入任何商家');

-- 显式清理远端提交的数据，外层 rollback 只清理当前会话的测试辅助对象。
select dblink_exec('preset878_a', $cleanup$do $remote$ begin perform public.delete_ledger('87800000-0000-4000-8000-000000000002'); end; $remote$;$cleanup$);
select dblink_disconnect('preset878_a');
select dblink_disconnect('preset878_b');
select * from finish();
rollback;
