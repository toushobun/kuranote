begin;

set local search_path = public, extensions;

select plan(12);

-- transaction_item_with_refund 在同一支出同时存在退款与报销时，
-- 必须只按实际有效核销金额扣减，且收入侧只扣除自己发起的关联金额。
create temporary table issue_598_pr6_context on commit drop as
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

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from issue_598_pr6_context);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    fixture.id,
    context.ledger_id,
    'normal',
    'active',
    fixture.transaction_at,
    context.merchant_id,
    fixture.title,
    context.user_id,
    context.user_id
from issue_598_pr6_context context
cross join (values
    ('59890000-0000-4000-8000-000000000001'::uuid, '2026-08-18 01:00:00+00'::timestamptz, 'PR6 组合核销支出'),
    ('59890000-0000-4000-8000-000000000002'::uuid, '2026-08-18 02:00:00+00'::timestamptz, 'PR6 退款收入'),
    ('59890000-0000-4000-8000-000000000003'::uuid, '2026-08-18 03:00:00+00'::timestamptz, 'PR6 报销收入')
) fixture(id, transaction_at, title);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order, special_status,
    created_by, updated_by
)
select
    fixture.id,
    context.ledger_id,
    fixture.record_id,
    context.account_id,
    case fixture.category_type
        when 'expense' then context.expense_category_id
        else context.income_category_id
    end,
    fixture.amount,
    0,
    case fixture.category_type when 'expense' then -fixture.amount else fixture.amount end,
    0,
    fixture.special_status::public.transaction_item_special_status,
    context.user_id,
    context.user_id
from issue_598_pr6_context context
cross join (values
    ('59891000-0000-4000-8000-000000000001'::uuid, '59890000-0000-4000-8000-000000000001'::uuid, 'expense', 100::numeric, 'pending_reimbursement'),
    ('59891000-0000-4000-8000-000000000002'::uuid, '59890000-0000-4000-8000-000000000002'::uuid, 'income', 30::numeric, null),
    ('59891000-0000-4000-8000-000000000003'::uuid, '59890000-0000-4000-8000-000000000003'::uuid, 'income', 50::numeric, null)
) fixture(id, record_id, category_type, amount, special_status);

select public.apply_transaction_item_links(
    (select ledger_id from issue_598_pr6_context),
    '59891000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'refundAllocations',
        jsonb_build_array(jsonb_build_object(
            'refundedItemId', '59891000-0000-4000-8000-000000000001',
            'refundAmount', 30
        ))
    ),
    (select user_id from issue_598_pr6_context)
);

select public.apply_transaction_item_links(
    (select ledger_id from issue_598_pr6_context),
    '59891000-0000-4000-8000-000000000003',
    jsonb_build_object(
        'reimbursementItemId', '59891000-0000-4000-8000-000000000001'
    ),
    (select user_id from issue_598_pr6_context)
);

select is(
    (select refunded_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000001'),
    30::numeric,
    '组合场景记录实际退款核销金额'
);

select is(
    (select reimbursement_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000001'),
    50::numeric,
    '组合场景记录实际报销核销金额'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000001'),
    20::numeric,
    '退款加报销部分核销后支出业务净额为剩余二十'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000002'),
    0::numeric,
    '完全分配的退款收入业务净额为零'
);

select is(
    (select business_net_amount from public.transaction_item_with_refund where id = '59891000-0000-4000-8000-000000000003'),
    0::numeric,
    '完全分配的报销收入业务净额为零'
);

select is(
    (select special_status from public.transaction_item where id = '59891000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '组合部分核销未归零时保持待报销'
);

-- 使用 dblink 打开两个真实数据库会话。第一笔退款持有目标支出行锁，
-- 第二笔报销必须等待该锁释放，并在释放后基于最新剩余额度只核销四十。
create extension if not exists dblink with schema extensions;

select dblink_connect(
    'issue598_refund',
    'dbname=postgres user=postgres application_name=issue598_pr6_refund'
);
select dblink_connect(
    'issue598_reimbursement',
    'dbname=postgres user=postgres application_name=issue598_pr6_reimbursement'
);

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
from issue_598_pr6_context context;

select dblink_exec('issue598_refund', 'begin');
select dblink_exec(
    'issue598_refund',
    format(
        $refund$
        do $remote$
        begin
            perform public.apply_transaction_item_links(
                %L::uuid,
                '59892000-0000-4000-8000-000000000002',
                jsonb_build_object(
                    'refundAllocations',
                    jsonb_build_array(jsonb_build_object(
                        'refundedItemId', '59892000-0000-4000-8000-000000000001',
                        'refundAmount', 60
                    ))
                ),
                %L::uuid
            );
        end
        $remote$;
        $refund$,
        context.ledger_id,
        context.user_id
    )
)
from issue_598_pr6_context context;

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
from issue_598_pr6_context context;

select pg_sleep(0.2);

select is(
    (
        select wait_event_type
        from pg_catalog.pg_stat_activity
        where application_name = 'issue598_pr6_reimbursement'
    ),
    'Lock'::text,
    '并发报销在退款事务持锁期间等待目标支出行锁'
);

select dblink_exec('issue598_refund', 'commit');

select is(
    (
        select result
        from dblink_get_result('issue598_reimbursement') as result(result integer)
    ),
    1,
    '目标行锁释放后并发报销请求成功完成'
);
select dblink_exec('issue598_reimbursement', 'commit');

select is(
    (
        select refund_amount
        from public.transaction_item_refund_link
        where refunded_item_id = '59892000-0000-4000-8000-000000000001'
    ),
    60::numeric,
    '并发退款保留先获得锁的六十核销金额'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where target_expense_item_id = '59892000-0000-4000-8000-000000000001'
    ),
    40::numeric,
    '并发报销基于锁释放后的最新剩余额度截断为四十'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        (select ledger_id from issue_598_pr6_context),
        '59892000-0000-4000-8000-000000000001'
    ),
    0::numeric,
    '并发退款与报销不会重复分配同一剩余额度'
);

select is(
    (select special_status from public.transaction_item where id = '59892000-0000-4000-8000-000000000001'),
    'reimbursed'::public.transaction_item_special_status,
    '并发组合核销达到原始金额后目标状态为已报销'
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
from issue_598_pr6_context context;

select dblink_disconnect('issue598_refund');
select dblink_disconnect('issue598_reimbursement');

select * from finish();
rollback;
