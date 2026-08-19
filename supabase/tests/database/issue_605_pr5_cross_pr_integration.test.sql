begin;

set local search_path = public, extensions;

select plan(24);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('60595000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    '2099-02-01 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 605 PR5 跨 PR 组合测试 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 4) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id,
    amount, discount_amount, balance_delta, sort_order,
    created_by, updated_by, special_status
)
select
    ('60596000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    ('60595000-0000-4000-8000-' || lpad(item.sequence_number::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000043'::uuid,
    case item.category_type
        when 'expense' then '00000000-0000-4000-8000-000000005021'::uuid
        else '00000000-0000-4000-8000-000000005002'::uuid
    end,
    item.amount,
    0,
    case item.category_type when 'expense' then -item.amount else item.amount end,
    0,
    '00000000-0000-4000-8000-000000000031'::uuid,
    '00000000-0000-4000-8000-000000000031'::uuid,
    item.special_status::public.transaction_item_special_status
from (
    values
        (1, 'expense', 100::numeric, 'pending_reimbursement'),
        (2, 'income', 40::numeric, null),
        (3, 'income', 80::numeric, null),
        (4, 'income', 30::numeric, null)
) as item(sequence_number, category_type, amount, special_status);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60596000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '60596000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '第一笔报销可以部分核销目标支出'
);

select is(
    (select special_status
     from public.transaction_item
     where id = '60596000-0000-4000-8000-000000000001'),
    'pending_reimbursement'::public.transaction_item_special_status,
    '部分报销后仍保持待报销状态'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '60596000-0000-4000-8000-000000000001'
    ),
    60::numeric,
    '部分报销后有符号剩余额度为 60'
);

select is(
    (select business_net_amount
     from public.transaction_item_with_refund
     where id = '60596000-0000-4000-8000-000000000001'),
    60::numeric,
    '部分报销后母项业务净额仍为正向支出 60'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select is(
    (
        select coalesce(sum(summary.expense), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'category',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:02:00+00'::timestamptz
        ) summary
        where summary.group_key = '00000000-0000-4000-8000-000000005021'
    ),
    60::numeric,
    '部分报销阶段分类统计仍将母项净额计入支出'
);

select is(
    (
        select coalesce(sum(summary.income), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'category',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:02:00+00'::timestamptz
        ) summary
        where summary.group_key = '00000000-0000-4000-8000-000000005021'
    ),
    0::numeric,
    '部分报销阶段母项不计入收入'
);

select is(
    (
        select count(*)::integer
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'account',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:02:00+00'::timestamptz,
            p_record_type => 'refundableExpense',
            p_special_statuses => array[
                'pending_reimbursement',
                'reimbursed',
                'reimbursement_surplus'
            ]::text[]
        )
    ),
    1,
    '部分报销阶段目标仍进入报销 Picker 候选'
);

reset role;
select set_config('request.jwt.claims', '', true);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60596000-0000-4000-8000-000000000003',
            jsonb_build_object(
                'refundedItemId',
                '60596000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '退款可以在部分报销基础上继续核销并把净额推正'
);

select is(
    (select special_status
     from public.transaction_item
     where id = '60596000-0000-4000-8000-000000000001'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '退款与报销合计超过原始金额后进入核销结余状态'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '60596000-0000-4000-8000-000000000001'
    ),
    '-20'::numeric,
    '退款推正后有符号剩余额度为负 20'
);

select is(
    (select business_net_amount
     from public.transaction_item_with_refund
     where id = '60596000-0000-4000-8000-000000000001'),
    '-20'::numeric,
    '退款推正后母项业务净额为负 20'
);

select is(
    (select has_refund_link and has_reimbursement_link
     from public.transaction_item_with_refund
     where id = '60596000-0000-4000-8000-000000000001'),
    true,
    '母项同时保留退款与报销关联标记'
);

select is(
    (
        select sum(business_net_amount)
        from public.transaction_item_with_refund
        where id in (
            '60596000-0000-4000-8000-000000000002',
            '60596000-0000-4000-8000-000000000003'
        )
    ),
    0::numeric,
    '已关联报销与退款收入自身业务净额均被核销为零'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select is(
    (
        select coalesce(sum(summary.income), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'category',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:04:00+00'::timestamptz
        ) summary
        where summary.group_key = '00000000-0000-4000-8000-000000005021'
    ),
    20::numeric,
    '退款与报销共同推正后母项按 20 计入收入'
);

select is(
    (
        select coalesce(sum(summary.expense), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'category',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:04:00+00'::timestamptz
        ) summary
        where summary.group_key = '00000000-0000-4000-8000-000000005021'
    ),
    0::numeric,
    '退款与报销共同推正后母项不再计入支出'
);

select is(
    (
        select count(*)::integer
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'account',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:02:00+00'::timestamptz,
            p_record_type => 'refundableExpense',
            p_special_statuses => array[
                'pending_reimbursement',
                'reimbursed',
                'reimbursement_surplus'
            ]::text[]
        )
    ),
    1,
    '净额转正后目标仍保留在报销 Picker 候选中'
);

reset role;
select set_config('request.jwt.claims', '', true);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '60596000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'reimbursementItemId',
                '60596000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '核销结余状态下仍允许继续追加新的报销关联'
);

select is(
    (select special_status
     from public.transaction_item
     where id = '60596000-0000-4000-8000-000000000001'),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '继续追加关联后仍保持核销结余状态'
);

select is(
    public.calculate_transaction_item_remaining_offset_amount(
        '00000000-0000-4000-8000-000000000032',
        '60596000-0000-4000-8000-000000000001'
    ),
    '-50'::numeric,
    '继续追加关联后有符号剩余额度扩展到负 50'
);

select is(
    (select business_net_amount
     from public.transaction_item_with_refund
     where id = '60596000-0000-4000-8000-000000000001'),
    '-50'::numeric,
    '继续追加关联后母项业务净额为负 50'
);

select is(
    (
        select sum(business_net_amount)
        from public.transaction_item_with_refund
        where id in (
            '60596000-0000-4000-8000-000000000002',
            '60596000-0000-4000-8000-000000000003',
            '60596000-0000-4000-8000-000000000004'
        )
    ),
    0::numeric,
    '转正后继续追加的收入自身也不会重复计入业务净额'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select is(
    (
        select coalesce(sum(summary.income), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'category',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:05:00+00'::timestamptz
        ) summary
        where summary.group_key = '00000000-0000-4000-8000-000000005021'
    ),
    50::numeric,
    '继续追加关联后统计收入随母项净额更新为 50'
);

select is(
    (
        select coalesce(sum(summary.expense), 0)
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'category',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:05:00+00'::timestamptz
        ) summary
        where summary.group_key = '00000000-0000-4000-8000-000000005021'
    ),
    0::numeric,
    '继续追加关联后统计支出仍保持为零'
);

select is(
    (
        select count(*)::integer
        from public.load_transaction_group_summaries_with_special_status(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_group_by => 'account',
            p_date_start => '2099-02-01 00:00:00+00'::timestamptz,
            p_date_end => '2099-02-01 00:02:00+00'::timestamptz,
            p_record_type => 'refundableExpense',
            p_special_statuses => array[
                'pending_reimbursement',
                'reimbursed',
                'reimbursement_surplus'
            ]::text[]
        )
    ),
    1,
    '再次追加后核销结余目标仍可继续作为报销候选'
);

select * from finish();
rollback;