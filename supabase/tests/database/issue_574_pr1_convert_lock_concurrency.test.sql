begin;

set local search_path = public, extensions;

select plan(1);

create extension if not exists dblink with schema extensions;

create or replace function pg_temp.issue574_check_convert_lock_order()
returns text
language plpgsql
as $function$
declare
    v_connection_string text := format(
        'host=%s port=%s dbname=%s user=postgres password=postgres',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    );
    v_blocked_by_gate boolean := false;
    v_busy integer := 1;
    v_attempt integer;
    v_result uuid;
    v_record_type text;
begin
    -- 固定 ID 的 fixture 在开始时先清一遍，即使上一次本地测试进程被强制结束也可自愈。
    perform dblink_connect('issue574_convert_gate', v_connection_string);
    perform dblink_exec(
        'issue574_convert_gate',
        $setup$
        delete from public.transaction_item
        where id in (
            '57494000-0000-4000-8000-000000000001',
            '57494000-0000-4000-8000-000000000002'
        );
        delete from public.transaction_record
        where id = '57493000-0000-4000-8000-000000000001';

        insert into public.transaction_record (
            id, ledger_id, type, status, transaction_at, merchant_id,
            title, created_by, updated_by
        ) values (
            '57493000-0000-4000-8000-000000000001',
            '00000000-0000-4000-8000-000000000032',
            'transfer',
            'active',
            '2099-03-10 00:00:00+00',
            null,
            'Issue 574 PR1 类型转换锁顺序',
            '00000000-0000-4000-8000-000000000031',
            '00000000-0000-4000-8000-000000000031'
        );

        insert into public.transaction_item (
            id, ledger_id, transaction_record_id, account_id, category_id,
            amount, discount_amount, balance_delta, note, sort_order,
            created_by, updated_by
        ) values
            (
                '57494000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000032',
                '57493000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000043',
                null,
                10, 0, -10, null, 0,
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            ),
            (
                '57494000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000032',
                '57493000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000044',
                null,
                10, 0, 10, null, 1,
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            );
        $setup$
    );

    perform dblink_exec(
        'issue574_convert_gate',
        'set application_name = ''issue_574_convert_gate'''
    );
    perform dblink_exec('issue574_convert_gate', 'begin');
    perform dblink_exec(
        'issue574_convert_gate',
        $gate$
        do $remote$
        begin
            perform 1
            from public.ledger
            where id = '00000000-0000-4000-8000-000000000032'
            for update;
        end
        $remote$;
        $gate$
    );

    perform dblink_connect('issue574_convert_request', v_connection_string);
    perform dblink_exec(
        'issue574_convert_request',
        'set application_name = ''issue_574_convert_request'''
    );
    perform dblink_exec('issue574_convert_request', 'begin');
    perform dblink_exec('issue574_convert_request', 'set role authenticated');
    perform dblink_exec(
        'issue574_convert_request',
        $claims$
        do $remote$
        begin
            perform set_config(
                'request.jwt.claims',
                '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
                false
            );
        end
        $remote$;
        $claims$
    );

    perform dblink_send_query(
        'issue574_convert_request',
        $convert$
        select public.convert_transaction_type_with_special_status(
            '00000000-0000-4000-8000-000000000032',
            '57493000-0000-4000-8000-000000000001',
            'income',
            '2099-03-10 00:01:00+00'::timestamptz,
            'Issue 574 PR1 类型转换 ledger-first',
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000001013',
            jsonb_build_array(
                jsonb_build_object(
                    'amount', 10,
                    'categoryId',
                    '00000000-0000-4000-8000-000000005002'
                )
            ),
            null,
            null,
            null
        )
        $convert$
    );

    for v_attempt in 1..50 loop
        select exists (
            select 1
            from pg_catalog.pg_stat_activity waiter
            cross join lateral
                unnest(pg_catalog.pg_blocking_pids(waiter.pid)) blocker_pid
            join pg_catalog.pg_stat_activity blocker
              on blocker.pid = blocker_pid
            where waiter.application_name = 'issue_574_convert_request'
              and waiter.wait_event_type = 'Lock'
              and blocker.application_name = 'issue_574_convert_gate'
        )
        into v_blocked_by_gate;
        exit when v_blocked_by_gate;
        perform pg_catalog.pg_sleep(0.1);
    end loop;

    if not v_blocked_by_gate then
        raise exception 'convert request did not wait on the ledger gate first';
    end if;

    -- convert 请求等待 ledger 时，第三会话必须还能 NOWAIT 取得 record。
    -- 旧调用链先进入 convert_transaction_type，会先占 record/account 再等 ledger，
    -- 因而这里会稳定抛 lock_not_available。
    perform dblink_connect('issue574_convert_probe', v_connection_string);
    perform dblink_exec('issue574_convert_probe', 'begin');
    perform dblink_exec(
        'issue574_convert_probe',
        $probe$
        do $remote$
        begin
            perform 1
            from public.transaction_record
            where id = '57493000-0000-4000-8000-000000000001'
              and ledger_id = '00000000-0000-4000-8000-000000000032'
            for update nowait;
        end
        $remote$;
        $probe$
    );
    perform dblink_exec('issue574_convert_probe', 'rollback');
    perform dblink_disconnect('issue574_convert_probe');

    -- 释放 ledger 后让转换完成，但转换会话仍处于显式事务；读取结果后 rollback，
    -- 不把并发验证产生的交易/余额变化提交到测试数据库。
    perform dblink_exec('issue574_convert_gate', 'commit');

    for v_attempt in 1..100 loop
        select dblink_is_busy('issue574_convert_request') into v_busy;
        exit when v_busy = 0;
        perform pg_catalog.pg_sleep(0.05);
    end loop;
    if v_busy <> 0 then
        raise exception 'convert request did not finish after releasing ledger gate';
    end if;

    select result
    into v_result
    from dblink_get_result('issue574_convert_request') as result(result uuid);

    -- libpq 异步查询需要继续读取直到空 PGresult，随后连接才可执行 rollback。
    perform drained_result
    from dblink_get_result('issue574_convert_request')
        as drained_row(drained_result uuid);

    if v_result is distinct from
       '57493000-0000-4000-8000-000000000001'::uuid then
        raise exception 'convert request returned unexpected record id';
    end if;

    perform dblink_exec('issue574_convert_request', 'rollback');
    perform dblink_disconnect('issue574_convert_request');

    select type
    into v_record_type
    from public.transaction_record
    where id = '57493000-0000-4000-8000-000000000001';
    if v_record_type is distinct from 'transfer' then
        raise exception 'rolled back convert unexpectedly persisted record type';
    end if;

    perform dblink_exec(
        'issue574_convert_gate',
        $cleanup$
        delete from public.transaction_item
        where id in (
            '57494000-0000-4000-8000-000000000001',
            '57494000-0000-4000-8000-000000000002'
        );
        delete from public.transaction_record
        where id = '57493000-0000-4000-8000-000000000001';
        $cleanup$
    );
    perform dblink_disconnect('issue574_convert_gate');

    return 'ok';
exception
    when others then
        -- 任何意外失败都先终止三个远端会话释放锁，再用独立连接清掉已提交 fixture。
        perform pg_catalog.pg_terminate_backend(activity.pid)
        from pg_catalog.pg_stat_activity activity
        where activity.application_name in (
            'issue_574_convert_gate',
            'issue_574_convert_request',
            'issue_574_convert_probe'
        )
          and activity.pid <> pg_backend_pid();
        perform pg_catalog.pg_sleep(0.05);

        begin
            perform dblink_disconnect('issue574_convert_probe');
        exception when others then
            null;
        end;
        begin
            perform dblink_disconnect('issue574_convert_request');
        exception when others then
            null;
        end;
        begin
            perform dblink_disconnect('issue574_convert_gate');
        exception when others then
            null;
        end;

        begin
            perform dblink_connect('issue574_convert_cleanup', v_connection_string);
            perform dblink_exec(
                'issue574_convert_cleanup',
                $cleanup$
                delete from public.transaction_item
                where id in (
                    '57494000-0000-4000-8000-000000000001',
                    '57494000-0000-4000-8000-000000000002'
                );
                delete from public.transaction_record
                where id = '57493000-0000-4000-8000-000000000001';
                $cleanup$
            );
            perform dblink_disconnect('issue574_convert_cleanup');
        exception when others then
            null;
        end;

        raise;
end;
$function$;

select is(
    pg_temp.issue574_check_convert_lock_order(),
    'ok'::text,
    '类型转换复合 RPC 在 record/account 前先锁 ledger，且异常路径可清理远端 fixture'
);

select * from finish();
rollback;
