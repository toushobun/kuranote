begin;

set local search_path = public, extensions;

select plan(7);

create extension if not exists dblink with schema extensions;

create temporary table issue_574_void_wait_result (
    scenario text primary key,
    value text
) on commit drop;

select dblink_connect(
    'issue574_void_gate',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue574_void_gate',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);
select dblink_connect(
    'issue574_void_request',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue574_void_request',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);
select dblink_connect(
    'issue574_void_edit',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue574_void_edit',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);

-- fixture 必须在远端自动提交事务准备，避免本 pgTAP 外层事务提前持有并发路径需要的锁。
-- 使用 seed 中稳定的账本 / 用户 / 账户 / 分类 / 商家 ID，减少测试本身的动态查询噪音。
select dblink_exec(
    'issue574_void_gate',
    $setup$
    do $remote$
    begin
        delete from public.transaction_item_reimbursement_link
        where target_expense_item_id =
              '57482000-0000-4000-8000-000000000001';
        delete from public.transaction_item
        where id in (
            '57482000-0000-4000-8000-000000000001',
            '57482000-0000-4000-8000-000000000002'
        );
        delete from public.transaction_record
        where id in (
            '57483000-0000-4000-8000-000000000001',
            '57483000-0000-4000-8000-000000000002'
        );

        update public.ledger
        set transaction_item_special_status_enabled = true
        where id = '00000000-0000-4000-8000-000000000032';

        insert into public.transaction_record (
            id, ledger_id, type, status, transaction_at, merchant_id,
            title, created_by, updated_by
        ) values
            (
                '57483000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000032',
                'normal',
                'active',
                '2099-03-06 00:00:00+00',
                '00000000-0000-4000-8000-000000001013',
                'Issue 574 PR1 void 并发目标',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            ),
            (
                '57483000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000032',
                'normal',
                'active',
                '2099-03-06 00:01:00+00',
                '00000000-0000-4000-8000-000000001013',
                'Issue 574 PR1 void 并发收入',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            );

        insert into public.transaction_item (
            id, ledger_id, transaction_record_id, account_id, category_id,
            amount, discount_amount, balance_delta, sort_order,
            special_status, created_by, updated_by, created_at, updated_at
        ) values
            (
                '57482000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000032',
                '57483000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000043',
                '00000000-0000-4000-8000-000000005021',
                100, 0, -100, 0,
                'pending_reimbursement',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031',
                '2090-01-01 00:00:00+00',
                '2090-01-01 00:00:00+00'
            ),
            (
                '57482000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000032',
                '57483000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000043',
                '00000000-0000-4000-8000-000000005002',
                40, 0, 40, 0,
                null,
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031',
                '2090-01-01 00:00:00+00',
                '2090-01-01 00:00:00+00'
            );

        perform public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57482000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57482000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    end
    $remote$;
    $setup$
);

-- void 最终应被既有业务 guard 拒绝。临时函数把预期异常转成普通返回值，
-- 以便测试关注锁顺序，而不是让远端事务因为预期业务错误进入 aborted 状态。
select dblink_exec(
    'issue574_void_request',
    $function$
    create or replace function pg_temp.issue574_try_void(
        p_ledger_id uuid,
        p_record_id uuid
    )
    returns text
    language plpgsql
    as $$
    declare
        v_detail text;
    begin
        begin
            perform public.void_transaction(p_ledger_id, p_record_id);
            return 'unexpected_success';
        exception when others then
            get stacked diagnostics v_detail = pg_exception_detail;
            return coalesce(nullif(v_detail, ''), sqlerrm);
        end;
    end;
    $$
    $function$
);

-- 第三会话先占住 account。正式 void 会先拿 transaction_record，再阻塞在 account。
select dblink_exec('issue574_void_gate', 'begin');
select dblink_exec(
    'issue574_void_gate',
    $gate$
    do $remote$
    begin
        perform 1
        from public.account account
        where account.id = '00000000-0000-4000-8000-000000000043'
          and account.ledger_id = '00000000-0000-4000-8000-000000000032'
        for update;
    end
    $remote$;
    $gate$
);

select dblink_exec('issue574_void_request', 'set role authenticated');
select dblink_exec(
    'issue574_void_request',
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
select dblink_send_query(
    'issue574_void_request',
    $void$
    select pg_temp.issue574_try_void(
        '00000000-0000-4000-8000-000000000032',
        '57483000-0000-4000-8000-000000000002'
    )
    $void$
);

do $$
declare
    v_attempt integer;
    v_wait_event_type text;
begin
    for v_attempt in 1..50 loop
        select activity.wait_event_type
        into v_wait_event_type
        from pg_catalog.pg_stat_activity activity
        where activity.application_name = 'issue574_void_request';
        exit when v_wait_event_type = 'Lock';
        perform pg_catalog.pg_sleep(0.1);
    end loop;

    insert into issue_574_void_wait_result (scenario, value)
    values ('void_wait_event', v_wait_event_type);
end;
$$;

select is(
    (
        select value
        from issue_574_void_wait_result
        where scenario = 'void_wait_event'
    ),
    'Lock'::text,
    '正式 void 在 record 锁后等待测试闸门持有的账户锁'
);

select dblink_exec('issue574_void_edit', 'set role authenticated');
select dblink_exec(
    'issue574_void_edit',
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
select dblink_send_query(
    'issue574_void_edit',
    $edit$
    with edited as materialized (
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57483000-0000-4000-8000-000000000002',
            '57482000-0000-4000-8000-000000000002',
            '2090-01-01 00:00:00+00'::timestamptz,
            40,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    )
    select 1::integer from edited
    $edit$
);

-- 修复后的关键差异：edit 会被 void 持有的 record 阻塞，尚未触碰 item/account。
-- 旧实现会越过 record 先拿 item，再与 void 的 account -> item 顺序形成实际死锁前提。
do $$
declare
    v_attempt integer;
    v_blocked_by_void boolean := false;
begin
    for v_attempt in 1..50 loop
        select exists (
            select 1
            from pg_catalog.pg_stat_activity waiter
            cross join lateral unnest(pg_catalog.pg_blocking_pids(waiter.pid)) blocker_pid
            join pg_catalog.pg_stat_activity blocker
              on blocker.pid = blocker_pid
            where waiter.application_name = 'issue574_void_edit'
              and blocker.application_name = 'issue574_void_request'
        )
        into v_blocked_by_void;
        exit when v_blocked_by_void;
        perform pg_catalog.pg_sleep(0.1);
    end loop;

    insert into issue_574_void_wait_result (scenario, value)
    values ('edit_blocked_by_void', v_blocked_by_void::text);
end;
$$;

select is(
    (
        select value
        from issue_574_void_wait_result
        where scenario = 'edit_blocked_by_void'
    ),
    'true'::text,
    '关联编辑在触碰 item/account 前先等待同一已关联交易的 record 锁'
);

-- 释放 account 后，void 应先得到业务拒绝并自动释放 record；随后 edit 才能继续。
select dblink_exec('issue574_void_gate', 'commit');

do $$
declare
    v_attempt integer;
    v_busy integer := 1;
begin
    for v_attempt in 1..100 loop
        select dblink_is_busy('issue574_void_request') into v_busy;
        exit when v_busy = 0;
        perform pg_catalog.pg_sleep(0.05);
    end loop;
    if v_busy <> 0 then
        raise exception 'void concurrency request did not finish';
    end if;
end;
$$;

select is(
    (
        select result
        from dblink_get_result('issue574_void_request') as result(result text)
    ),
    'linked_transaction_edit_forbidden'::text,
    '并发 void 返回既有业务拒绝而不是 deadlock'
);

-- libpq 异步查询的第一条 PGresult 取完后，还需再读取一次直到返回空结果，
-- 否则连接仍被视为有命令在进行中。
do $$
begin
    perform drained_result
    from dblink_get_result('issue574_void_request')
        as drained_row(drained_result text);
end;
$$;

do $$
declare
    v_attempt integer;
    v_busy integer := 1;
begin
    for v_attempt in 1..100 loop
        select dblink_is_busy('issue574_void_edit') into v_busy;
        exit when v_busy = 0;
        perform pg_catalog.pg_sleep(0.05);
    end loop;
    if v_busy <> 0 then
        raise exception 'linked edit concurrency request did not finish';
    end if;
end;
$$;

select is(
    (
        select result
        from dblink_get_result('issue574_void_edit') as result(result integer)
    ),
    1,
    'void 业务拒绝释放 record 后关联编辑成功完成'
);

do $$
begin
    perform drained_result
    from dblink_get_result('issue574_void_edit')
        as drained_row(drained_result integer);
end;
$$;

select is(
    (
        select amount
        from public.transaction_item
        where id = '57482000-0000-4000-8000-000000000002'
    ),
    40::numeric,
    '并发结束后收入明细仍保持合法金额'
);
select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57482000-0000-4000-8000-000000000002'
    ),
    40::numeric,
    '并发结束后报销关联金额与收入保持一致'
);
select is(
    (
        select status
        from public.transaction_record
        where id = '57483000-0000-4000-8000-000000000002'
    ),
    'active'::text,
    '被拒绝的 void 不改变收入交易状态'
);

select dblink_exec(
    'issue574_void_gate',
    $cleanup$
    do $remote$
    begin
        delete from public.transaction_item_reimbursement_link
        where target_expense_item_id =
              '57482000-0000-4000-8000-000000000001';
        delete from public.transaction_item
        where id in (
            '57482000-0000-4000-8000-000000000001',
            '57482000-0000-4000-8000-000000000002'
        );
        delete from public.transaction_record
        where id in (
            '57483000-0000-4000-8000-000000000001',
            '57483000-0000-4000-8000-000000000002'
        );
    end
    $remote$;
    $cleanup$
);

select dblink_disconnect('issue574_void_gate');
select dblink_disconnect('issue574_void_request');
select dblink_disconnect('issue574_void_edit');

select * from finish();
rollback;
