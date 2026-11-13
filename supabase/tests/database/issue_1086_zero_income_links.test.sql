-- Issue #1086：零金额关联待定、改选目标、补正数金额与状态/净额回归。
begin;
set local search_path = public, extensions;
select plan(21);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, created_by, updated_by
)
select
  ('10860000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
  base.ledger_id, 'normal', 'active',
  '2090-01-01 00:00:00+00'::timestamptz + seq * interval '1 minute',
  base.merchant_id, 'Issue 1086 ' || seq, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
from public.transaction_record base
cross join generate_series(1, 6) seq
where base.id = '00000000-0000-4000-8000-000000009001';

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
  select
    ('10861000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
    '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
    ('10860000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as transaction_record_id,
    '00000000-0000-4000-8000-000000000043'::uuid as account_id,
    case seq
      when 3 then (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'refund')
      when 4 then (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'reimbursement')
      else '00000000-0000-4000-8000-000000005021'::uuid
    end as category_id,
    case when seq in (3,4) then 0::numeric else 100::numeric end as amount,
    case when seq in (2,6) then 'pending_reimbursement'::public.transaction_item_special_status
      else null::public.transaction_item_special_status end as special_status,
    0 as sort_order, '00000000-0000-4000-8000-000000000031'::uuid as created_by, '00000000-0000-4000-8000-000000000031'::uuid as updated_by
  from generate_series(1,6) seq
) item;

select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032', '10861000-0000-4000-8000-000000000003',
    '{"refundedItemId":"10861000-0000-4000-8000-000000000001"}'::jsonb, '00000000-0000-4000-8000-000000000031'
  )$$,
  '零金额退款创建链接'
);
select is(
  (select refund_amount from public.transaction_item_refund_link
   where refund_income_item_id = '10861000-0000-4000-8000-000000000003'),
  0::numeric, '零金额退款关联写入 0'
);
select is(
  public.calculate_transaction_item_remaining_offset_amount('00000000-0000-4000-8000-000000000032', '10861000-0000-4000-8000-000000000001'),
  100::numeric, '零金额退款不抵消剩余'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund where id = '10861000-0000-4000-8000-000000000001'),
  100::numeric, '零金额退款不影响业务净额'
);

select lives_ok(
  $$select public.apply_transaction_item_links(
    '00000000-0000-4000-8000-000000000032', '10861000-0000-4000-8000-000000000004',
    '{"reimbursementItemId":"10861000-0000-4000-8000-000000000002"}'::jsonb, '00000000-0000-4000-8000-000000000031'
  )$$,
  '零金额报销创建链接'
);
select is(
  (select reimbursement_amount from public.transaction_item_reimbursement_link
   where reimbursement_income_item_id = '10861000-0000-4000-8000-000000000004'),
  0::numeric, '零金额报销关联写入 0'
);
select is(
  public.calculate_transaction_item_remaining_offset_amount('00000000-0000-4000-8000-000000000032', '10861000-0000-4000-8000-000000000002'),
  100::numeric, '零金额报销不抵消剩余'
);
select is(
  (select business_net_amount from public.transaction_item_with_refund where id = '10861000-0000-4000-8000-000000000002'),
  100::numeric, '零金额报销不影响业务净额'
);

select is(
  (select special_status::text from public.transaction_item where id = '10861000-0000-4000-8000-000000000001'),
  null::text, '零退款保持原支出无特殊状态'
);
select is(
  (select special_status::text from public.transaction_item where id = '10861000-0000-4000-8000-000000000002'),
  'pending_reimbursement'::text, '零报销保持待报销状态'
);
select is(
  (select sum(business_net_amount) from public.transaction_item_with_refund
   where id in ('10861000-0000-4000-8000-000000000003','10861000-0000-4000-8000-000000000004')),
  0::numeric, '零金额关联不产生业务净收入'
);
select results_eq(
  $$select id, is_refund_income, is_reimbursement_income
    from public.transaction_item_with_refund
    where id in (
      '10861000-0000-4000-8000-000000000001',
      '10861000-0000-4000-8000-000000000002',
      '10861000-0000-4000-8000-000000000003',
      '10861000-0000-4000-8000-000000000004'
    )
    order by id$$,
  $$values
    ('10861000-0000-4000-8000-000000000001'::uuid, false, false),
    ('10861000-0000-4000-8000-000000000002'::uuid, false, false),
    ('10861000-0000-4000-8000-000000000003'::uuid, true, false),
    ('10861000-0000-4000-8000-000000000004'::uuid, false, true)$$,
  '零金额退款和报销仅在收入方标记对应角色'
);
set local role authenticated;
select set_config(
 'request.jwt.claims',
 '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
 true
);

select lives_ok($$select public.update_linked_transaction_edit(
 '00000000-0000-4000-8000-000000000032', '10860000-0000-4000-8000-000000000003',
 (select transaction_at from public.transaction_record where id = '10860000-0000-4000-8000-000000000003'),
 (select merchant_id from public.transaction_record where id = '10860000-0000-4000-8000-000000000003'),
 null,
 (select jsonb_build_array(jsonb_build_object(
   'transactionItemId', id, 'expectedUpdatedAt', updated_at,
   'amount', amount, 'categoryId', category_id,
   'refundedItemId', '10861000-0000-4000-8000-000000000005'
 )) from public.transaction_item where id = '10861000-0000-4000-8000-000000000003'),
 tests.current_transaction_payments('10860000-0000-4000-8000-000000000003'),
 (select updated_at from public.transaction_record where id = '10860000-0000-4000-8000-000000000003')
)$$, '零金额退款改选目标');
select is(
 (select refunded_item_id from public.transaction_item_refund_link where refund_income_item_id = '10861000-0000-4000-8000-000000000003'),
 '10861000-0000-4000-8000-000000000005'::uuid, '零金额退款改选目标后链接保持 0');
select lives_ok($$select tests.update_linked_transaction_item(
 '00000000-0000-4000-8000-000000000032', '10860000-0000-4000-8000-000000000003', '10861000-0000-4000-8000-000000000003',
 (select updated_at from public.transaction_item where id = '10861000-0000-4000-8000-000000000003'),
 25, '00000000-0000-4000-8000-000000000043',
 (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'refund')
)$$, '零金额退款补填正数');

select lives_ok($$select public.update_linked_transaction_edit(
 '00000000-0000-4000-8000-000000000032', '10860000-0000-4000-8000-000000000004',
 (select transaction_at from public.transaction_record where id = '10860000-0000-4000-8000-000000000004'),
 (select merchant_id from public.transaction_record where id = '10860000-0000-4000-8000-000000000004'),
 null,
 (select jsonb_build_array(jsonb_build_object(
   'transactionItemId', id, 'expectedUpdatedAt', updated_at,
   'amount', amount, 'categoryId', category_id,
   'reimbursementItemId', '10861000-0000-4000-8000-000000000006'
 )) from public.transaction_item where id = '10861000-0000-4000-8000-000000000004'),
 tests.current_transaction_payments('10860000-0000-4000-8000-000000000004'),
 (select updated_at from public.transaction_record where id = '10860000-0000-4000-8000-000000000004')
)$$, '零金额报销改选目标');
select is(
 (select target_expense_item_id from public.transaction_item_reimbursement_link where reimbursement_income_item_id = '10861000-0000-4000-8000-000000000004'),
 '10861000-0000-4000-8000-000000000006'::uuid, '零金额报销改选目标后链接保持 0');
select lives_ok($$select tests.update_linked_transaction_item(
 '00000000-0000-4000-8000-000000000032', '10860000-0000-4000-8000-000000000004', '10861000-0000-4000-8000-000000000004',
 (select updated_at from public.transaction_item where id = '10861000-0000-4000-8000-000000000004'),
 30, '00000000-0000-4000-8000-000000000043',
 (select id from public.category where ledger_id = '00000000-0000-4000-8000-000000000032' and system_key = 'reimbursement')
)$$, '零金额报销补填正数');

reset role;
select is(
 public.calculate_transaction_item_remaining_offset_amount('00000000-0000-4000-8000-000000000032', '10861000-0000-4000-8000-000000000005'),
 75::numeric, '正数退款抵消备用目标 25');
select is(
 public.calculate_transaction_item_remaining_offset_amount('00000000-0000-4000-8000-000000000032', '10861000-0000-4000-8000-000000000006'),
 70::numeric, '正数报销抵消备用目标 30');
select is(
 (select coalesce(sum(business_net_amount),0) from public.transaction_item_with_refund
  where id in ('10861000-0000-4000-8000-000000000005', '10861000-0000-4000-8000-000000000006')),
 145::numeric, '正数核销反映到支出统计口径');
select set_config('request.jwt.claim.sub', '', true);
select * from finish();
rollback;
