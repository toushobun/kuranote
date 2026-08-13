-- 待报销支出不计入业务支出统计，但仍保留真实账户现金流。

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(expense_refunds.refunded_amount, 0::numeric)::numeric(14,2) as refunded_amount,
    coalesce(income_refunds.refunded_amount, 0::numeric) > 0 as is_refund_income,
    coalesce(income_reimbursements.reimbursed_amount, 0::numeric) > 0 as is_reimbursement_income,
    exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and (
              link.refunded_item_id = ti.id
              or link.refund_income_item_id = ti.id
          )
    ) as has_refund_link,
    case
        when ti.special_status = 'pending_reimbursement' then 0::numeric
        else greatest(
            ti.amount - coalesce(business_offsets.offset_amount, 0::numeric),
            0::numeric
        )
    end::numeric(14,2) as business_net_amount
from public.transaction_item ti
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item refund_income
      on refund_income.id = link.refund_income_item_id
     and refund_income.ledger_id = link.ledger_id
    join public.transaction_record refund_record
      on refund_record.id = refund_income.transaction_record_id
     and refund_record.ledger_id = refund_income.ledger_id
    where link.refunded_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and refund_record.status = 'active'
) expense_refunds on true
left join lateral (
    select sum(link.refund_amount) as refunded_amount
    from public.transaction_item_refund_link link
    join public.transaction_item refunded_item
      on refunded_item.id = link.refunded_item_id
     and refunded_item.ledger_id = link.ledger_id
    join public.transaction_record refunded_record
      on refunded_record.id = refunded_item.transaction_record_id
     and refunded_record.ledger_id = refunded_item.ledger_id
    where link.refund_income_item_id = ti.id
      and link.ledger_id = ti.ledger_id
      and refunded_record.status = 'active'
) income_refunds on true
left join lateral (
    select sum(settled_item.amount) as reimbursed_amount
    from public.transaction_item settled_item
    join public.transaction_record settled_record
      on settled_record.id = settled_item.transaction_record_id
     and settled_record.ledger_id = settled_item.ledger_id
    where settled_item.settled_by_item_id = ti.id
      and settled_item.ledger_id = ti.ledger_id
      and settled_record.status = 'active'
) income_reimbursements on true
left join lateral (
    select sum(offsets.amount) as offset_amount
    from (
        select coalesce(expense_refunds.refunded_amount, 0::numeric) as amount
        union all
        select coalesce(income_refunds.refunded_amount, 0::numeric)
        union all
        select coalesce(income_reimbursements.reimbursed_amount, 0::numeric)
        union all
        select case
            when exists (
                select 1
                from public.transaction_item settling_income
                join public.transaction_record settling_record
                  on settling_record.id = settling_income.transaction_record_id
                 and settling_record.ledger_id = settling_income.ledger_id
                where settling_income.id = ti.settled_by_item_id
                  and settling_income.ledger_id = ti.ledger_id
                  and settling_record.status = 'active'
            ) then ti.amount
            else 0::numeric
        end
    ) offsets
) business_offsets on true;
