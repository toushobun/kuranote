-- 与 transactionRecordAmounts.testUtils.ts 的 10 个案例一致，关联通过正式业务函数写入。
begin;
set local search_path = public, extensions;
select plan(21);
insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by,
    transaction_item_special_status_enabled, multi_account_payment_enabled
)
values (
    '91700000-0000-4000-8000-000000000001', '月度净额测试', 'JPY',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    true,
    true
);

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values (
    '91700000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031',
    'owner', 'active', now(),
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.account (id, ledger_id, name, type, currency, initial_balance, created_by, updated_by)
values
    ('91710000-0000-4000-8000-000000000001', '91700000-0000-4000-8000-000000000001', '我的账户', 'bank', 'JPY', 0,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('91710000-0000-4000-8000-000000000002', '91700000-0000-4000-8000-000000000001', '妻子账户', 'bank', 'JPY', 0,
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');


insert into public.category (id, ledger_id, type, name) values
('91720000-0000-4000-8000-000000000001', '91700000-0000-4000-8000-000000000001', 'expense', '购物'),
('91720000-0000-4000-8000-000000000002', '91700000-0000-4000-8000-000000000001', 'income', '其他收入');

insert into public.merchant (id, ledger_id, name, created_by, updated_by) values
('91730000-0000-4000-8000-000000000001', '91700000-0000-4000-8000-000000000001', '测试商家',
 '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

create temporary table monthly_cases (
  id integer, name text, expense numeric, income numeric, link text, net numeric
);
insert into monthly_cases values
(1, '收支混合', 5000, 2000, null, -3000),
(2, '旧手机抵价', 8000, 4000, null, -4000),
(3, '关联退款', 5000, 2000, 'refund', -3000),
(4, '关联报销', 5000, 2000, 'reimbursement', -3000),
(5, '倒赚', 2000, 5000, null, 3000),
(6, '超额退款', 2000, 5000, 'refund', 3000),
(7, '超额报销', 2000, 5000, 'reimbursement', 3000),
(8, '纯支出', 5000, 0, null, -5000),
(9, '纯收入', 0, 2000, null, 2000),
(10, '完全抵消', 2000, 2000, null, 0);
grant select on monthly_cases to authenticated;

-- 每个案例一个日期；已关联收入独立成笔，视图应将其业务净额置零。
insert into public.transaction_record (id, ledger_id, type, status, transaction_at, merchant_id, created_by, updated_by)
select md5('917-record-' || c.id || '-' || side)::uuid,
 '91700000-0000-4000-8000-000000000001', 'normal', 'active',
 '2099-04-01'::timestamptz + c.id * interval '1 day',
 '91730000-0000-4000-8000-000000000001',
 '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
from monthly_cases c cross join generate_series(0, 1) side
where side = 0 or c.link is not null;

select tests.insert_normal_transaction_items(jsonb_agg(jsonb_build_object(
 'id', md5('917-item-' || c.id || '-' || side)::uuid,
 'ledger_id', '91700000-0000-4000-8000-000000000001',
 'transaction_record_id', md5('917-record-' || c.id || '-' || case when side = 1 and c.link is not null then 1 else 0 end)::uuid,
 'account_id', '91710000-0000-4000-8000-000000000001',
 'category_id', case when side = 0 then '91720000-0000-4000-8000-000000000001' else '91720000-0000-4000-8000-000000000002' end,
 'amount', case when side = 0 then c.expense else c.income end,
 'special_status', case when side = 0 and c.link = 'reimbursement' then 'pending_reimbursement' else null end,
 'created_by', '00000000-0000-4000-8000-000000000031'
)))
from monthly_cases c cross join generate_series(0, 1) side
where (side = 0 and c.expense > 0) or (side = 1 and c.income > 0);

select public.apply_transaction_item_links(
 '91700000-0000-4000-8000-000000000001',
 md5('917-item-' || id || '-1')::uuid,
 jsonb_build_object(case when link = 'refund' then 'refundedItemId' else 'reimbursementItemId' end, md5('917-item-' || id || '-0')::uuid),
 '00000000-0000-4000-8000-000000000031'
) from monthly_cases where link is not null;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
set local role authenticated;

-- RPC 只承载非时间分组；商家 / 成员使用与月度 TS 相同的记录级规则。
select results_eq(
 format($q$select income, expense, balance from public.load_transaction_group_summaries_with_special_status(
 p_ledger_id => '91700000-0000-4000-8000-000000000001', p_group_by => %L,
 p_date_start => %L::timestamptz, p_date_end => %L::timestamptz)$q$,
 dimension, '2099-04-01'::timestamptz + id * interval '1 day', '2099-04-01'::timestamptz + (id + 1) * interval '1 day'),
 format('values (%s::numeric, %s::numeric, %s::numeric)', greatest(net, 0), greatest(-net, 0), net),
 name || '：' || dimension || ' 与月度净额一致'
) from monthly_cases cross join (values ('merchant'), ('member')) dimensions(dimension);

reset role;
select lives_ok('set constraints public.validate_transaction_record_payments immediate', '所有案例满足付款明细不变量');
select * from finish();
rollback;
