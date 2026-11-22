-- #1147：统一以原支出币种核销，收入侧超额折回自身币种。
begin;
set local search_path = public, extensions;
select no_plan();

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

truncate public.exchange_rate;
insert into public.exchange_rate (rate_date, currency, rate_per_eur) values
  ('2026-11-20', 'CNY', 10000),
  ('2026-11-20', 'JPY', 238124),
  ('2026-11-25', 'CNY', 10000),
  ('2026-11-25', 'JPY', 235000);

-- 通过付款明细指定记录币种，不使用旧 transaction_item.account_id 镜像判定。
insert into public.account (
    id, ledger_id, name, type, currency, initial_balance,
    sort_order, created_by, updated_by
) values
(
    '11470000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000032',
    '测试人民币账户', 'bank', 'CNY', 0, 999,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
),
(
    '11470000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000032',
    '测试无汇率美元账户', 'bank', 'USD', 0, 998,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('11472000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    'normal', 'active',
    case when seq = 15 then '2026-11-25 09:00:00+09'::timestamptz
         when seq >= 11 then '2026-11-20 09:00:00+09'::timestamptz
         else '2026-11-19 09:00:00+09'::timestamptz end,
    '00000000-0000-4000-8000-000000001008'::uuid,
    'Issue 1147 ' || seq,
    '00000000-0000-4000-8000-000000000031'::uuid,
    '00000000-0000-4000-8000-000000000031'::uuid
from (values (1),(2),(3),(4),(5),(11),(12),(13),(14),(15),(16),(17)) s(seq);

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select
        ('11471000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
        '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
        ('11472000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as transaction_record_id,
        case when seq in (11,12,13,14,15) then '11470000-0000-4000-8000-000000000001'::uuid
             when seq = 16 then '11470000-0000-4000-8000-000000000002'::uuid
             else '00000000-0000-4000-8000-000000000043'::uuid end as account_id,
        case when seq = 11 then (
            select id from public.category
            where ledger_id = '00000000-0000-4000-8000-000000000032'
              and system_key = 'reimbursement'
        )
        when seq >= 12 then (
            select id from public.category
            where ledger_id = '00000000-0000-4000-8000-000000000032'
              and system_key = 'refund'
        )
        else '00000000-0000-4000-8000-000000005021'::uuid end as category_id,
        case when seq <= 5 then 2000::numeric
             when seq = 11 then 84::numeric
             when seq = 12 then 83.99::numeric
             when seq = 13 then 80::numeric
             when seq = 14 then 50::numeric
             when seq = 15 then 40::numeric
             when seq = 16 then 1::numeric
             else 100::numeric end as amount,
        case when seq <= 5 then 'pending_reimbursement'::public.transaction_item_special_status
             else null::public.transaction_item_special_status end as special_status,
        seq as sort_order,
        '00000000-0000-4000-8000-000000000031'::uuid as created_by,
        '00000000-0000-4000-8000-000000000031'::uuid as updated_by
    from (values (1),(2),(3),(4),(5),(11),(12),(13),(14),(15),(16),(17)) s(seq)
) item;

select lives_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000011',
        '{"reimbursementItemId":"11471000-0000-4000-8000-000000000001"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '84 CNY 报销可关联 2000 JPY 支出');
select lives_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000012',
        '{"refundedItemId":"11471000-0000-4000-8000-000000000002"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '83.99 CNY 退款可关联 JPY 支出');
select lives_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000013',
        '{"refundedItemId":"11471000-0000-4000-8000-000000000003"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '80 CNY 退款可关联 JPY 支出');
select lives_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000014',
        '{"refundedItemId":"11471000-0000-4000-8000-000000000004"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '多笔 50 CNY 第一笔可关联');
select lives_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000015',
        '{"refundedItemId":"11471000-0000-4000-8000-000000000004"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '多笔 40 CNY 第二笔可关联');

select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000011'),
    0.01::numeric, '84 CNY 多报销的收入侧倒赚 0.01 CNY'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000001'),
    0::numeric, '84 CNY 报销后原支出结清 0 JPY'
);
select is(
    (select reimbursement_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000001'),
    2000::numeric, '报销合计按原支出币种折成 2000 JPY'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000012'),
    0::numeric, '83.99 CNY 刚好结清时没有倒赚'
);
select is(
    (select refunded_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000002'),
    2000::numeric, '83.99 CNY 退款累计折成 2000 JPY'
);
select is(
    (select refunded_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000003'),
    1905::numeric, '80 CNY 少报销折成 1905 JPY'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000003'),
    95::numeric, '80 CNY 后原支出剩余 95 JPY'
);
select is(
    (select refunded_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000004'),
    2131::numeric, '不同日期 50+40 CNY 分别折为 1191 与 940 JPY'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000015'),
    5.57::numeric, '多笔按顺序分配，后来的 40 CNY 倒赚 5.57 CNY'
);
select is(
    (select rate_date from public.transaction_link_allocations(
      '00000000-0000-4000-8000-000000000032',
      '11471000-0000-4000-8000-000000000004'
    ) where income_id='11471000-0000-4000-8000-000000000015'),
    '2026-11-25'::date, '按后一笔退款记录日期取汇率'
);

select throws_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000016',
        '{"refundedItemId":"11471000-0000-4000-8000-000000000005"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '22023', 'link_exchange_rate_missing', 'USD 取不到汇率时拒绝关联');

select is(
    (select count(*)::integer from public.transaction_item_refund_link
     where refund_income_item_id='11471000-0000-4000-8000-000000000016'),
    0, '无汇率拒绝后不留下关联'
);
select lives_ok($$
    select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '11471000-0000-4000-8000-000000000017',
        '{"refundedItemId":"11471000-0000-4000-8000-000000000005"}',
        '00000000-0000-4000-8000-000000000031'
    )
$$, '同币种继续使用原有逻辑');
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000005'),
    1900::numeric, '同币种 100 JPY 退款后还剩 1900 JPY'
);
select is(
    (select rate from public.transaction_link_allocations(
      '00000000-0000-4000-8000-000000000032',
      '11471000-0000-4000-8000-000000000005'
    ) where income_id='11471000-0000-4000-8000-000000000017'),
    1::numeric, '同币种汇率恒为 1'
);

update public.transaction_record set transaction_at='2026-11-25 09:00:00+09'
where id='11472000-0000-4000-8000-000000000014';
select is(
    (select converted_amount from public.transaction_link_allocations(
      '00000000-0000-4000-8000-000000000032',
      '11471000-0000-4000-8000-000000000004'
    ) where income_id='11471000-0000-4000-8000-000000000014'),
    1175::numeric, '修改前笔退款记录日期后，50 CNY 按新日汇率换算为 1175 JPY'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000015'),
    4.89::numeric, '前笔日期改变后重新分配额度，后一笔倒赚改为 4.89 CNY'
);

-- 模拟汇率表数据后来缺失，不能把原支出错误地全额抵掉。
delete from public.exchange_rate where currency = 'CNY';
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000001'),
    2000::numeric, '汇率被删除后不能错误抵扣原支出'
);
select is(
    (select business_net_amount from public.transaction_item_with_refund
     where id='11471000-0000-4000-8000-000000000011'),
    84::numeric, '汇率被删除后收入侧恢复原币金额'
);

select is(public.transaction_currency_decimal_places('JPY'), 0, 'SQL JPY 为 0 位');
select is(public.transaction_currency_decimal_places('CNY'), 2, 'SQL CNY 为 2 位');
select is(public.transaction_currency_decimal_places('KWD'), 3, 'SQL KWD 为 3 位');
select is(public.transaction_currency_decimal_places('ZZZ'), 0, 'SQL 未知币种默认 0 位');

select * from finish();
rollback;
