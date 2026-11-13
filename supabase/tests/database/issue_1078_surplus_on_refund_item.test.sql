-- #1078：超出原支出部分属于退款 / 报销收入明细，按收入时间与明细顺序分配。
begin;
set local search_path = public, extensions;
select plan(19);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

-- 1=原支出 A，2=退款记录 B（两行），3=退款记录 C，4=零金额关联，
-- 5=备用目标 D，6=报销记录 E。
insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, created_by, updated_by
)
select
  ('10780000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
  base.ledger_id, 'normal', 'active',
  '2090-01-01 00:00:00+00'::timestamptz + seq * interval '1 day',
  base.merchant_id, 'Issue 1078 ' || seq,
  '00000000-0000-4000-8000-000000000031',
  '00000000-0000-4000-8000-000000000031'
from public.transaction_record base
cross join generate_series(1, 6) seq
where base.id = '00000000-0000-4000-8000-000000009001';

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
  select
    ('10781000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
    '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
    ('10780000-0000-4000-8000-' || lpad(
      (case when seq = 3 then 2 when seq >= 4 then seq - 1 else seq end)::text, 12, '0'
    ))::uuid as transaction_record_id,
    '00000000-0000-4000-8000-000000000043'::uuid as account_id,
    case
      when seq in (2,3,4,5) then (
        select id from public.category
        where ledger_id = '00000000-0000-4000-8000-000000000032'
          and system_key = 'refund'
      )
      when seq = 7 then (
        select id from public.category
        where ledger_id = '00000000-0000-4000-8000-000000000032'
          and system_key = 'reimbursement'
      )
      else '00000000-0000-4000-8000-000000005021'::uuid
    end as category_id,
    case seq
      when 1 then 980::numeric
      when 2 then 980::numeric
      when 3 then 1000::numeric
      when 4 then 1000::numeric
      when 5 then 0::numeric
      when 6 then 500::numeric
      when 7 then 200::numeric
    end as amount,
    case when seq in (1,6) then 'pending_reimbursement'::public.transaction_item_special_status
         else null::public.transaction_item_special_status end as special_status,
    case when seq = 3 then 1 else 0 end as sort_order,
    '00000000-0000-4000-8000-000000000031'::uuid as created_by,
    '00000000-0000-4000-8000-000000000031'::uuid as updated_by
  from generate_series(1, 7) seq
) item;

select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000002',
    '{"refundedItemId":"10781000-0000-4000-8000-000000000001"}'::jsonb,
    '00000000-0000-4000-8000-000000000031'
  )$$, '退款 B 第一行占用全部原支出 980'
);
select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000003',
    '{"refundedItemId":"10781000-0000-4000-8000-000000000001"}'::jsonb,
    '00000000-0000-4000-8000-000000000031'
  )$$, '退款 B 第二行超额 1000'
);
select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000004',
    '{"refundedItemId":"10781000-0000-4000-8000-000000000001"}'::jsonb,
    '00000000-0000-4000-8000-000000000031'
  )$$, '退款 C 超额 1000'
);
select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000005',
    '{"refundedItemId":"10781000-0000-4000-8000-000000000001"}'::jsonb,
    '00000000-0000-4000-8000-000000000031'
  )$$, '零金额关联不抢额度'
);
select results_eq(
  $$select id, business_net_amount
    from public.transaction_item_with_refund
    where id in (
      '10781000-0000-4000-8000-000000000001',
      '10781000-0000-4000-8000-000000000002',
      '10781000-0000-4000-8000-000000000003',
      '10781000-0000-4000-8000-000000000004',
      '10781000-0000-4000-8000-000000000005'
    )
    order by id$$,
  $$values
    ('10781000-0000-4000-8000-000000000001'::uuid, 0::numeric),
    ('10781000-0000-4000-8000-000000000002'::uuid, 0::numeric),
    ('10781000-0000-4000-8000-000000000003'::uuid, 1000::numeric),
    ('10781000-0000-4000-8000-000000000004'::uuid, 1000::numeric),
    ('10781000-0000-4000-8000-000000000005'::uuid, 0::numeric)$$,
  'A=0、B两行合计倒赚1000、C倒赚1000、零金额为0'
);
select is(
  (select special_status::text from public.transaction_item
   where id = '10781000-0000-4000-8000-000000000001'),
  'reimbursed'::text, '超额时原支出不再进入 reimbursement_surplus'
);
select is(
  (select refunded_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000001'),
  2980::numeric, '原始累计关联额保留，供未保存小票实时计算'
);
-- C 时间提前，则先由 C 占用 980，B 第一行倒赚 980，B 第二行倒赚 1000。
update public.transaction_record
set transaction_at = '2089-12-31 00:00:00+00'::timestamptz
where id = '10780000-0000-4000-8000-000000000003';
select results_eq(
  $$select id, business_net_amount from public.transaction_item_with_refund
    where id in (
      '10781000-0000-4000-8000-000000000002',
      '10781000-0000-4000-8000-000000000003',
      '10781000-0000-4000-8000-000000000004'
    ) order by id$$,
  $$values
    ('10781000-0000-4000-8000-000000000002'::uuid, 980::numeric),
    ('10781000-0000-4000-8000-000000000003'::uuid, 1000::numeric),
    ('10781000-0000-4000-8000-000000000004'::uuid, 20::numeric)$$,
  '时间排序决定每条退款抵消额'
);
update public.transaction_record
set transaction_at = '2090-01-04 00:00:00+00'::timestamptz
where id = '10780000-0000-4000-8000-000000000003';

-- 删掉最早的链接后，后续同目标关联自动补占新额度。
select lives_ok(
  $$select public.clear_transaction_item_income_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000031'
  )$$, '清除较早退款关联'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000003'),
  20::numeric, '后续 B 第二行自动接收 980 抵消额'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000004'),
  1000::numeric, '剩余 C 退款不再重复抵消'
);
select lives_ok(
  $$select public.clear_transaction_item_income_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000031'
  )$$, '解除 B 第二行以更换原支出'
);
select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000003',
    '{"refundedItemId":"10781000-0000-4000-8000-000000000006"}'::jsonb,
    '00000000-0000-4000-8000-000000000031'
  )$$, 'B 第二行重绑目标 D'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000003'),
  500::numeric, '改绑后由 D 抵消 500，B 第二行剩余收入 500'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000004'),
  20::numeric, '旧目标 A 自动由 C 抵消 980'
);
select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032',
    '10781000-0000-4000-8000-000000000007',
    '{"reimbursementItemId":"10781000-0000-4000-8000-000000000001"}'::jsonb,
    '00000000-0000-4000-8000-000000000031'
  )$$, '报销与退款混合关联原支出 A'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000007'),
  200::numeric, '退款先占满后，晚到报销全部计入收入'
);
select is(
  (select refunded_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000001'),
  1000::numeric, '解除早期关联后原始累计退款额正确'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund
   where id = '10781000-0000-4000-8000-000000000001'),
  0::numeric, '混合关联后原支出仍不出现负净额'
);
select * from finish();
rollback;
