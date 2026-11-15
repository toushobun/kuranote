-- Issue #1078：退款与报销按发生顺序共用原支出的待核销额度。
begin;
set local search_path = public, extensions;
select plan(16);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, created_by, updated_by
)
select
  ('10780000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
  base.ledger_id, 'normal', 'active',
  '2090-01-01 00:00:00+00'::timestamptz + least(seq, 5) * interval '1 minute',
  base.merchant_id, 'Issue 1078 ' || seq, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
from public.transaction_record base
cross join generate_series(1, 6) seq
where base.id = '00000000-0000-4000-8000-000000009001';

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
  select
    ('10781000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
    '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
    ('10780000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as transaction_record_id,
    '00000000-0000-4000-8000-000000000043'::uuid as account_id,
    case seq
      when 3 then (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'refund')
      when 5 then (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'refund')
      when 6 then (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'refund')
      when 4 then (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'reimbursement')
      else '00000000-0000-4000-8000-000000005021'::uuid
    end as category_id,
    case seq when 1 then 980 when 2 then 800 when 3 then 0 when 4 then 980 else 1000 end::numeric as amount,
    case when seq in (1,2) then 'pending_reimbursement'::public.transaction_item_special_status
      else null::public.transaction_item_special_status end as special_status,
    seq as sort_order, '00000000-0000-4000-8000-000000000031'::uuid as created_by, '00000000-0000-4000-8000-000000000031'::uuid as updated_by
  from generate_series(1,6) seq
) item;


select public.apply_transaction_item_links(
  '00000000-0000-4000-8000-000000000032',
  ('10781000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
  jsonb_build_object(
    case when seq = 4 then 'reimbursementItemId' else 'refundedItemId' end,
    '10781000-0000-4000-8000-000000000001'
  ),
  '00000000-0000-4000-8000-000000000031'
)
from generate_series(3, 6) seq;
-- 以下各列的期望值来自优化前视图对同一组明细的查询结果。
prepare linked_income_columns as
  select right(id::text, 1)::integer, refunded_amount, reimbursement_amount, business_net_amount,
         is_refund_income, is_reimbursement_income, has_refund_link, has_reimbursement_link
  from public.transaction_item_with_refund
  where ledger_id = '00000000-0000-4000-8000-000000000032'
    and transaction_record_id in (
      select ('10780000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid
      from generate_series(1, 6) seq
    )
  order by id;

select results_eq(
  'execute linked_income_columns',
  $$values (1, 2000::numeric, 980::numeric, 0::numeric, false, false, true, true),
           (2, 0, 0, 800, false, false, false, false),
           (3, 0, 0, 0, true, false, true, false),
           (4, 0, 0, 0, false, true, false, true),
           (5, 0, 0, 1000, true, false, true, false),
           (6, 0, 0, 1000, true, false, true, false)$$,
  '逐列保留原视图的零金额关联、混合核销、倒赚和无关联结果'
);

select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in ('10781000-0000-4000-8000-000000000001', '10781000-0000-4000-8000-000000000003', '10781000-0000-4000-8000-000000000004', '10781000-0000-4000-8000-000000000005', '10781000-0000-4000-8000-000000000006')),
  array[0, 0, 0, 1000, 1000]::numeric[],
  '原支出抵到零，零金额关联保留，之后两笔退款各计入一千收入'
);
select is(
  (select special_status::text from public.transaction_item where id = '10781000-0000-4000-8000-000000000001'),
  'reimbursed', '混合核销超额时仍然处于结清状态'
);
select is(
  (select is_refund_income from public.transaction_item_with_refund where id = '10781000-0000-4000-8000-000000000003'),
  true, '零金额退款仍有收入角色'
);
select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in ('10781000-0000-4000-8000-000000000005', '10781000-0000-4000-8000-000000000006')),
  array[1000, 1000]::numeric[],
  '同一发生时间的两条退款都保留各自超出额'
);

set local session_replication_role = replica;
update public.transaction_record
set status = 'deleted', deleted_at = now()
where id = '10780000-0000-4000-8000-000000000004';
set local session_replication_role = origin;
select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in ('10781000-0000-4000-8000-000000000001', '10781000-0000-4000-8000-000000000005', '10781000-0000-4000-8000-000000000006')),
  array[0, 20, 1000]::numeric[],
  '较早的报销作废后，先发生的退款重新分配抵消额度'
);

set local session_replication_role = replica;
update public.transaction_record
set created_at = created_at - interval '1 minute'
where id = '10780000-0000-4000-8000-000000000006';
set local session_replication_role = origin;
select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in ('10781000-0000-4000-8000-000000000005', '10781000-0000-4000-8000-000000000006')),
  array[1000, 20]::numeric[],
  '交易时间相同时先按记录创建时间分配'
);


set local session_replication_role = replica;
update public.transaction_record
set created_at = (
  select created_at from public.transaction_record
  where id = '10780000-0000-4000-8000-000000000005'
)
where id = '10780000-0000-4000-8000-000000000006';
update public.transaction_item set sort_order = 1
where id = '10781000-0000-4000-8000-000000000006';
set local session_replication_role = origin;

select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in (
     '10781000-0000-4000-8000-000000000005',
     '10781000-0000-4000-8000-000000000006'
   )),
  array[1000, 20]::numeric[],
  '发生时间和创建时间相同时按明细排序分配'
);

set local session_replication_role = replica;
update public.transaction_item set sort_order = 5
where id = '10781000-0000-4000-8000-000000000006';
set local session_replication_role = origin;

select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in (
     '10781000-0000-4000-8000-000000000005',
     '10781000-0000-4000-8000-000000000006'
   )),
  array[20, 1000]::numeric[],
  '发生时间、创建时间及明细排序相同时按明细 ID 分配'
);

set local session_replication_role = replica;
update public.transaction_item set amount = 600
where id = '10781000-0000-4000-8000-000000000005';
update public.transaction_item_refund_link set refund_amount = 600
where refund_income_item_id = '10781000-0000-4000-8000-000000000005';
set local session_replication_role = origin;

select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in (
     '10781000-0000-4000-8000-000000000005',
     '10781000-0000-4000-8000-000000000006'
   )),
  array[0, 620]::numeric[],
  '修改较早的退款金额后，后续退款重新分配'
);

set local session_replication_role = replica;
update public.transaction_item_refund_link
set refunded_item_id = '10781000-0000-4000-8000-000000000002'
where refund_income_item_id = '10781000-0000-4000-8000-000000000006';
set local session_replication_role = origin;
select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in ('10781000-0000-4000-8000-000000000001', '10781000-0000-4000-8000-000000000002', '10781000-0000-4000-8000-000000000005', '10781000-0000-4000-8000-000000000006')),
  array[380, 0, 0, 200]::numeric[],
  '换目标后同时重新分配旧支出和新支出'
);

set local session_replication_role = replica;
delete from public.transaction_item_refund_link
where refund_income_item_id = '10781000-0000-4000-8000-000000000005';
set local session_replication_role = origin;
select is(
  (select array_agg(business_net_amount order by id)
   from public.transaction_item_with_refund where id in ('10781000-0000-4000-8000-000000000001', '10781000-0000-4000-8000-000000000002', '10781000-0000-4000-8000-000000000005', '10781000-0000-4000-8000-000000000006')),
  array[980, 0, 600, 200]::numeric[],
  '删除较早的退款关联后恢复原支出，另一原支出的分配独立'
);

-- 恢复已解除的退款关联，重建前一组数据的关联状态后作废原支出。
set local session_replication_role = replica;
insert into public.transaction_item_refund_link (
  ledger_id, refunded_item_id, refund_income_item_id, refund_amount
) values (
  '00000000-0000-4000-8000-000000000032',
  '10781000-0000-4000-8000-000000000001',
  '10781000-0000-4000-8000-000000000005', 1000
);
update public.transaction_item_refund_link
set refunded_item_id = '10781000-0000-4000-8000-000000000001'
where refund_income_item_id = '10781000-0000-4000-8000-000000000006';
update public.transaction_item set amount = 1000
where id = '10781000-0000-4000-8000-000000000005';
update public.transaction_record set status = 'deleted', deleted_at = now()
where id = '10780000-0000-4000-8000-000000000001';
set local session_replication_role = origin;

select results_eq(
  'execute linked_income_columns',
  $$values (1, 2000::numeric, 0::numeric, 980::numeric, false, false, true, true),
           (2, 0, 0, 800, false, false, false, false),
           (3, 0, 0, 0, false, false, true, false),
           (4, 0, 0, 980, false, false, false, true),
           (5, 0, 0, 1000, false, false, true, false),
           (6, 0, 0, 1000, false, false, true, false)$$,
  '逐列保留原视图对已作废支出和收入的关联金额、净额及标记'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
  true
);
select results_eq(
  'execute linked_income_columns',
  $$values (2, 0::numeric, 0::numeric, 800::numeric, false, false, false, false),
           (3, 0, 0, 0, false, false, true, false),
           (5, 0, 0, 1000, false, false, true, false),
           (6, 0, 0, 1000, false, false, true, false)$$,
  '有效成员的逐列结果保持一致，并由行级权限隐藏作废明细'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"11010000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select is_empty('execute linked_income_columns', '非账本成员看不到明细或关联结果');

select set_config('request.jwt.claims', '{}', true);
select is_empty('execute linked_income_columns', '没有登录用户的请求看不到明细或关联结果');

deallocate linked_income_columns;

select * from finish();
rollback;
