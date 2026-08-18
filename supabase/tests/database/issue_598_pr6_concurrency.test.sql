begin;

set local search_path = public, extensions;

select plan(6);

-- 通过 dblink 打开两个真实会话。第一事务只锁定目标支出行并写入退款关联，
-- 不持有 ledger 行锁；第二事务调用正式 RPC，因此若发生阻塞只能来自目标支出行。
-- 锁释放后 RPC 必须看到已提交的退款 60，并把报销 60 截断为剩余额度 40。
create temporary table issue_598_pr6_concurrency_context on commit drop as
select
    l.id as ledger_id,
    lm.user_id,
    a.id as account_id,
    merchant.id as merchant_id,
    expense_category.id as expense_category_id,
    income_category.id as income_category_id,
    l.transaction_item_special_status_enabled as old_special_status_enabled
from public.ledger l
join public.ledger_member lm
  on lm.ledger_id = l.id
 and lm.status = 'active'
join lateral (
    select account.id
    from public.account account
    where account.ledger_id = l.id
      and account.is_archived = false
    order by account.created_at
    limit 1
) a on true
join lateral (
    select merchant.id
    from public.merchant merchant
    where merchant.ledger_id = l.id
      and merchant.is_archived = false
    order by merchant.created_at
    limit 1
) merchant on true
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = l.id
      and category.type = 'expense'
      and category.is_archived = false
    order by category.created_at
    limit 1
) expense_category on true
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = l.id
      and category.type = 'income'
      and category.is_archived = false
    order by category.created_at
    limit 1
) income_category on true
where l.id = '00000000-0000-4000-8000-000000000032'
limit 1;

create extension if not exists dblink with schema extensions;

select dblink_connect(
    'issue598_refund',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue598_pr6_refund',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);
select dblink_connect(
    'issue598_reimbursement',
    format(
        'host=%s port=%s dbname=%s user=postgres password=postgres application_name=issue598_pr6_reimbursement',
        host(inet_server_addr()),
        inet_server_port(),
        current_database()
    )
);

-- 先在独立自动提交事务中准备 fixture，避免本测试外层事务持有 ledger 行锁。
select dblink_exec(
    'issue598_refund',
    format(
        $setup$
        do $remote$
        declare
            v_ledger_id uuid := %L::uuid;
            v_user_id uuid := %L::uuid;
            v_account_id uuid := %L::uuid;
            v_merchant_id uuid := %L::uuid;
            v_expense_category_id uuid := %L::uuid;
            v_income_category_id uuid := %L::uuid;
        begin
            delete from public.transaction_item_reimbursement_link
            where target_expense_item_id = '59892000-0000-4000-8000-000000000001';
            delete from public.transaction_item_refund_link
            where refunded_item_id = '59892000-0000-4000-8000-000000000001';
            delete from public.transaction_item
            where id in (
                '59892000-0000-4000-8000-000000000001',
                '59892000-0000-4000-8000-000000000002',
                '59892000-0000-4000-8000-000000000003'
            );
            delete from public.transaction_record
            where id in (
                '59893000-0000-4000-8000-000000000001',
                '59893000-0000-4000-8000-000000000002',
                '59893000-0000-4000-8000-000000000003'
            );

            update public.ledger
            set transaction_item_special_status_enabled = true
            where id = v_ledger_id;

            insert into public.transaction_record (
                id, ledger_id, type, status, transaction_at, merchant_id,
                title, created_by, updated_by
            ) values
                ('59893000-0000-4000-8000-000000000001', v_ledger_id, 'normal', 'active', '2026-08-18 04:00:00+00', v_merchant_id, 'PR6 并发目标', v_user_id, v_user_id),
                ('59893000-0000-4000-8000-000000000002', v_ledger_id, 'normal', 'active', '2026-08-18 05:00:00+00', v_merchant_id, 'PR6 并发退款', v_user_id, v_user_id),
                ('59893000-0000-4000-8000-000000000003', v_ledger_id, 'normal', 'active', '2026-08-18 06:00:00+00', v_merchant_id, 'PR6 并发报销', v_user_id, v_user_id);

            insert into public.transaction_item (
                id, ledger_id, transaction_record_id, account_id, category_id,
                amount, discount_amount, balance_delta, sort_order,
                special_status, created_by, updated_by
            ) values
                ('59892000-0000-4000-8000-000000000001', v_ledger_id, '59893000-0000-4000-8000-000000000001', v_account_id, v_expense_category_id, 100, 0, -100, 0, 'pending_reimbursement', v_user_id, v_user_id),
                ('59892000-0000-4000-8000-000000000002', v_ledger_id, '59893000-0000-4000-8000-000000000002', v_account_id, v_income_category_id, 60, 0, 60, 0, null, v_user_id, v_user_id),
                ('59892000-0000-4000-8000-000000000003', v_ledger_id, '59893000-0000-4000-8000-000000000003', v_account_id, v_income_category_id, 60, 0, 60, 0, null, v_user_id, v_user_id);
        end
        $remote$;
        $setup$,
        context.ledger_id,
        context.user_id,
        context.account_id,
        context.merchant_id,
        context.expense_category_id,
        context.income_category_id
    )
)
from issue_598_pr6_concurrency_context context;

select dblink_exec('issue598_refund', 'begin');
select dblink_exec(
    'issue598_refund',
    format(
        $refund$
        do $remote$
        begin
            perform 1
            from public.transaction_item target_item
            where target_item.ledger_id = %L::uuid
              and target_item.id = '59892000-0000-4000-8000-000000000001'
            for update;

            insert into public.transaction_item_refund_link (
                ledger_id,
                refunded_item_id,
                refund_income_item_id,
                refund_amount,
                created_by
            ) values (
                %L::uuid,
                '59892000-0000-4000-8000-000000000001',
                '59892000-0000-4000-8000-000000000002',
                60,
                %L::uuid
            );
        end
        $remote$;
        $refund$,
        context.ledger_id,
        context.ledger_id,
        context.user_id
    )
)
from issue_598_pr6_concurrency_context context;

select dblink_exec('issue598_reimbursement', 'begin');
select dblink_send_query(
    'issue598_reimbursement',
    format(
        $reimbursement$
        with applied as materialized (
            select public.apply_transaction_item_links(
                %L::uuid,
                '59892000-0000-4000-8000-000000000003',
                jsonb_build_object(
                    'reimbursementItemId',
                    '59892000-0000-4000-8000-000000000001'
                ),
                %L::uuid
            )
        )
        select 1::integer from applied
        $reimbursement$,
        context.ledger_id,
        context.user_id
    )
)
from issue_598_pr6_concurrency_context context;

select pg_sleep(0.2);

select is(
    (
        select wait_event_type
        from pg_catalog.pg_stat_activity
        where application_name = 'issue598_pr6_reimbursement'
    ),
    'Lock'::text,
    '并发报销在退款事务持有目标支出行锁时发生阻塞'
);

select dblink_exec('issue598_refund', 'commit');

select is(
    (
        select result
        from dblink_get_result('issue598_reimbursement') as result(result integer)
    ),
    1,
    '目标支出行锁释放后并发报销请求成功完成'
);
select dblink_exec('issue598_reimbursement', 'commit');

select is(
    (
        select refund_amount
        from public.transaction_item_refund_link
        where refunded_item_id = '59892000-0000-4000-8000-000000000001'
    ),
    60::numeric,
    '先提交的退款保留六十核销金额'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where target_expense_item_id = '59892000-0000-4000-8000-000000000001'
    ),
    40::numeric,
    '并发报销在锁内读取最新剩余额度并截断为四十'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        (select ledger_id from issue_598_pr6_concurrency_context),
        '59892000-0000-4000-8000-000000000001'
    ),
    0::numeric,
    '并发退款与报销不会重复分配同一剩余额度'
);

select is(
    (select special_status from public.transaction_item where id = '59892000-0000-4000-8000-000000000001'),
    'reimbursed'::public.transaction_item_special_status,
    '并发组合核销达到原始金额后目标状态重算为已报销'
);

select dblink_exec(
    'issue598_refund',
    format(
        $cleanup$
        do $remote$
        begin
            delete from public.transaction_item_reimbursement_link
            where target_expense_item_id = '59892000-0000-4000-8000-000000000001';
            delete from public.transaction_item_refund_link
            where refunded_item_id = '59892000-0000-4000-8000-000000000001';
            delete from public.transaction_item
            where id in (
                '59892000-0000-4000-8000-000000000001',
                '59892000-0000-4000-8000-000000000002',
                '59892000-0000-4000-8000-000000000003'
            );
            delete from public.transaction_record
            where id in (
                '59893000-0000-4000-8000-000000000001',
                '59893000-0000-4000-8000-000000000002',
                '59893000-0000-4000-8000-000000000003'
            );
            update public.ledger
            set transaction_item_special_status_enabled = %L::boolean
            where id = %L::uuid;
        end
        $remote$;
        $cleanup$,
        context.old_special_status_enabled,
        context.ledger_id
    )
)
from issue_598_pr6_concurrency_context context;

select dblink_disconnect('issue598_refund');
select dblink_disconnect('issue598_reimbursement');

select * from finish();
rollback;
