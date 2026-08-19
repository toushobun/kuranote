-- Issue #605 PR2：统计口径使用有符号业务净额。
-- 支出目标被超额退款/报销时允许 business_net_amount 变为负值；收入来源仍按完整核销后归零。

drop view public.transaction_item_with_refund;

create view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(expense_refunds.refunded_amount, 0::numeric)
        as refunded_amount,
    coalesce(income_refunds.refunded_amount, 0::numeric) > 0
        as is_refund_income,
    coalesce(income_reimbursements.reimbursed_amount, 0::numeric) > 0
        as is_reimbursement_income,
    exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.refunded_item_id = ti.id
              or link.refund_income_item_id = ti.id
          )
    ) as has_refund_link,
    exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.target_expense_item_id = ti.id
              or link.reimbursement_income_item_id = ti.id
          )
    ) as has_reimbursement_link,
    (
        ti.amount - coalesce(business_offsets.offset_amount, 0::numeric)
    ) as business_net_amount,
    coalesce(
        expense_reimbursements.reimbursed_amount,
        0::numeric
    ) as reimbursement_amount
from public.transaction_item ti
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item income_item
      on income_item.id = link.refund_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
    where link.refunded_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and income_record.status = 'active'
) expense_refunds on true
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item target_item
      on target_item.id = link.refunded_item_id
     and target_item.ledger_id = link.ledger_id
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
    where link.refund_income_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and target_record.status = 'active'
) income_refunds on true
left join lateral (
    select sum(link.reimbursement_amount) as reimbursed_amount
    from public.transaction_item_reimbursement_link link
    join public.transaction_item income_item
      on income_item.id = link.reimbursement_income_item_id
     and income_item.ledger_id = link.ledger_id
    join public.transaction_record income_record
      on income_record.id = income_item.transaction_record_id
     and income_record.ledger_id = income_item.ledger_id
    where link.target_expense_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and income_record.status = 'active'
) expense_reimbursements on true
left join lateral (
    select sum(link.reimbursement_amount) as reimbursed_amount
    from public.transaction_item_reimbursement_link link
    join public.transaction_item target_item
      on target_item.id = link.target_expense_item_id
     and target_item.ledger_id = link.ledger_id
    join public.transaction_record target_record
      on target_record.id = target_item.transaction_record_id
     and target_record.ledger_id = target_item.ledger_id
    where link.reimbursement_income_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and target_record.status = 'active'
) income_reimbursements on true
left join lateral (
    select sum(offsets.amount) as offset_amount
    from (
        select coalesce(expense_refunds.refunded_amount, 0::numeric) as amount
        union all
        select coalesce(income_refunds.refunded_amount, 0::numeric)
        union all
        select coalesce(expense_reimbursements.reimbursed_amount, 0::numeric)
        union all
        select coalesce(income_reimbursements.reimbursed_amount, 0::numeric)
    ) offsets
) business_offsets on true;


grant select on table public.transaction_item_with_refund to authenticated;
