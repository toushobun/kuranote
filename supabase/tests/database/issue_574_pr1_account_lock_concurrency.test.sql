begin;

set local search_path = public, extensions;

select plan(5);

create extension if not exists dblink with schema extensions;

create temporary table issue_574_account_lock_result (
    scenario text primary key,
    value text
) on commit drop;

select dblink_connect(
    'issue574_account_gate',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue574_account_gate',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);
select dblink_connect(
    'issue574_account_edit',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue574_account_edit',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);
select dblink_connect(
    'issue574_account_probe',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue574_account_probe',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);

-- 远端 fixture 会真实提交，因此先在同一 gate 会话保存两个账户的原始余额供清理恢复。
select dblink_exec(
    'issue574_account_gate',
    $snapshot$
    create temporary table issue574_account_balance_snapshot
    on commit preserve rows
    as
    select id as account_id, current_balance
    from public.account
    where ledger_id = '00000000-0000-4000-8000-000000000032'
      and id in (
          '00000000-0000-4000-8000-000000000043',
          '00000000-0000-4000-8000-000000000044'
      )
    $snapshot$
);

select dblink_exec(
    'issue574_account_gate',
    $setup$
    do $remote$
    begin
        delete from public.transaction_item_reimbursement_link
        where target_expense_item_id =
              '57485000-0000-4000-8000-000000000001';
        delete from public.transaction_item
        where id in (
            '57485000-0000-4000-8000-000000000001',
            '57485000-0000-4000-8000-000000000002'
        );
        delete from public.transaction_record
        where id in (
            '57484000-0000-4000-8000-000000000001',
            '57484000-0000-4000-8000-000000000002'
        );

        update public.ledger
        set transaction_item_special_status_enabled = true
        where id = '00000000-0000-4000-8000-000000000032';

        insert into public.transaction_record (
            id, ledger_id, type, status, transaction_at, merchant_id,
            title, created_by, updated_by
        ) values
            (
                '57484000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000032',
                'normal',
                'active',
                '2099-03-07 00:00:00+00',
                '00000000-0000-4000-8000-000000001013',
                'Issue 574 PR1 账户锁目标',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            ),
            (
                '57484000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000032',
                'normal',
                'active',
                '2099-03-07 00:01:00+00',
                '00000000-0000-4000-8000-000000001013',
                'Issue 574 PR1 账户锁收入',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            );

        insert into public.transaction_item (
            id, ledger_id, transaction_record_id, account_id, category_id,
            amount, discount_amount, balance_delta, sort_order,
            special_status, created_by, updated_by, created_at, updated_at
        ) values
            (
                '57485000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000032',
                '57484000-0000-4000-8000-000000000001',
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
                '57485000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000032',
                '57484000-0000-4000-8000-000000000002',
                '00000000-0000-4000-8000-000000000044',
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
            '57485000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57485000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        );
    end
    $remote$;
    $setup$
);

-- 新账户 43 小于旧账户 44。gate 先占住 43，关联编辑应停在排序后的第一把账户锁。
select dblink_exec('issue574_account_gate', 'begin');
select dblink_exec(
    'issue574_account_gate',
    $gate$
    do $remote$
    begin
        perform 1
        from public.account account
        where account.ledger_id = '00000000-0000-4000-8000-000000000032'
          and account.id = '00000000-0000-4000-8000-000000000043'
        for update;
    end
    $remote$;
    $gate$
);

select dblink_exec('issue574_account_edit', 'set role authenticated');
select dblink_exec(
    'issue574_account_edit',
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
    'issue574_account_edit',
    $edit$
    with edited as materialized (
        select public.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57484000-0000-4000-8000-000000000002',
            '57485000-0000-4000-8000-000000000002',
            '2090-01-01 00:00:00+00'::timestamptz,
            40,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    )
    select 1::integer from edited
    $edit$
);

do $$
declare
    v_attempt integer;
    v_blocked_by_gate boolean := false;
begin
    for v_attempt in 1..50 loop
        select exists (
            select 1
            from pg_catalog.pg_stat_activity waiter
            cross join lateral unnest(pg_catalog.pg_blocking_pids(waiter.pid)) blocker_pid
            join pg_catalog.pg_stat_activity blocker
              on blocker.pid = blocker_pid
            where waiter.application_name = 'issue574_account_edit'
              and blocker.application_name = 'issue574_account_gate'
        )
        into v_blocked_by_gate;
        exit when v_blocked_by_gate;
        perform pg_catalog.pg_sleep(0.1);
    end loop;

    insert into issue_574_account_lock_result (scenario, value)
    values ('edit_blocked_by_gate', v_blocked_by_gate::text);
end;
$$;

select is(
    (
        select value
        from issue_574_account_lock_result
        where scenario = 'edit_blocked_by_gate'
    ),
    'true'::text,
    '关联编辑在较小的新账户锁处等待 gate'
);

-- 修复前会先取得旧账户 44 再等待 43；此时第三会话 NOWAIT 锁 44 会失败。
select lives_ok(
    $$
    select dblink_exec(
        'issue574_account_probe',
        $probe$
        do $remote$
        begin
            perform 1
            from public.account account
            where account.ledger_id = '00000000-0000-4000-8000-000000000032'
              and account.id = '00000000-0000-4000-8000-000000000044'
            for update nowait;
        end
        $remote$;
        $probe$
    )
    $$,
    '等待较小账户时不会提前占住较大的旧账户锁'
);

select dblink_exec('issue574_account_gate', 'commit');

do $$
declare
    v_attempt integer;
    v_busy integer := 1;
begin
    for v_attempt in 1..100 loop
        select dblink_is_busy('issue574_account_edit') into v_busy;
        exit when v_busy = 0;
        perform pg_catalog.pg_sleep(0.05);
    end loop;
    if v_busy <> 0 then
        raise exception 'linked account edit concurrency request did not finish';
    end if;
end;
$$;

select is(
    (
        select result
        from dblink_get_result('issue574_account_edit') as result(result integer)
    ),
    1,
    '释放较小账户后关联编辑正常完成而不是 deadlock'
);

do $$
begin
    perform drained_result
    from dblink_get_result('issue574_account_edit')
        as drained_row(drained_result integer);
end;
$$;

select is(
    (
        select account_id
        from public.transaction_item
        where id = '57485000-0000-4000-8000-000000000002'
    ),
    '00000000-0000-4000-8000-000000000043'::uuid,
    '关联收入最终切换到新账户'
);
select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57485000-0000-4000-8000-000000000002'
    ),
    40::numeric,
    '换账户不会改变既有报销关联金额'
);

select dblink_exec(
    'issue574_account_gate',
    $cleanup$
    do $remote$
    begin
        delete from public.transaction_item_reimbursement_link
        where target_expense_item_id =
              '57485000-0000-4000-8000-000000000001';
        delete from public.transaction_item
        where id in (
            '57485000-0000-4000-8000-000000000001',
            '57485000-0000-4000-8000-000000000002'
        );
        delete from public.transaction_record
        where id in (
            '57484000-0000-4000-8000-000000000001',
            '57484000-0000-4000-8000-000000000002'
        );

        perform set_config('app.allow_account_balance_update', 'true', true);
        update public.account account
        set current_balance = snapshot.current_balance
        from issue574_account_balance_snapshot snapshot
        where account.ledger_id = '00000000-0000-4000-8000-000000000032'
          and account.id = snapshot.account_id;
    end
    $remote$;
    $cleanup$
);

select dblink_disconnect('issue574_account_gate');
select dblink_disconnect('issue574_account_edit');
select dblink_disconnect('issue574_account_probe');

select * from finish();
rollback;
