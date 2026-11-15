-- 将当前用户的有效账本集合计算一次，供交易读取策略共享。
create function public.current_user_active_ledger_ids()
returns setof uuid
language sql stable security definer
set search_path to 'pg_catalog', 'pg_temp'
as $$
    select lm.ledger_id
    from public.ledger_member lm
    join public.app_user au on au.id = lm.user_id
    where lm.user_id = (select auth.uid())
      and lm.status = 'active'
      and au.status = 'active';
$$;

revoke all on function public.current_user_active_ledger_ids() from public, anon, authenticated, service_role;
grant execute on function public.current_user_active_ledger_ids() to authenticated;

alter policy transaction_item_refund_link_select_active_member
on public.transaction_item_refund_link
using (ledger_id in (select public.current_user_active_ledger_ids()));

alter policy transaction_item_reimbursement_link_select_active_member
on public.transaction_item_reimbursement_link
using (ledger_id in (select public.current_user_active_ledger_ids()));

alter policy transaction_record_select_active_member
on public.transaction_record
using (status = 'active' and ledger_id in (select public.current_user_active_ledger_ids()));

alter policy transaction_item_select_active_record
on public.transaction_item
using (
    ledger_id in (select public.current_user_active_ledger_ids())
    and exists (
        select 1
        from public.transaction_record tr
        where tr.id = transaction_item.transaction_record_id
          and tr.ledger_id = transaction_item.ledger_id
          and tr.status = 'active'
    )
);

create or replace view public.transaction_item_with_refund
with (security_invoker = true)
as
select
    ti.*,
    coalesce(offsets.refunded_amount, 0::numeric) as refunded_amount,
    exists (
        select 1
        from public.transaction_item_refund_link link
        join public.transaction_item target_item
          on target_item.id = link.refunded_item_id
         and target_item.ledger_id = link.ledger_id
        join public.transaction_record target_record
          on target_record.id = target_item.transaction_record_id
         and target_record.ledger_id = target_item.ledger_id
        where link.ledger_id = ti.ledger_id
          and link.refund_income_item_id = ti.id
          and target_record.status = 'active'
    ) as is_refund_income,
    exists (
        select 1
        from public.transaction_item_reimbursement_link link
        join public.transaction_item target_item
          on target_item.id = link.target_expense_item_id
         and target_item.ledger_id = link.ledger_id
        join public.transaction_record target_record
          on target_record.id = target_item.transaction_record_id
         and target_record.ledger_id = target_item.ledger_id
        where link.ledger_id = ti.ledger_id
          and link.reimbursement_income_item_id = ti.id
          and target_record.status = 'active'
    ) as is_reimbursement_income,
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
    greatest(
        ti.amount
        - coalesce(offsets.applied_amount, 0::numeric),
        0::numeric
    ) as business_net_amount,
    coalesce(offsets.reimbursed_amount, 0::numeric)
        as reimbursement_amount
from public.transaction_item ti
left join lateral (
    -- 目标端直接取当前明细；收入端先通过唯一索引找原支出。
    with targets as (
        select ti.id as id
        union
        select link.refunded_item_id
        from public.transaction_item_refund_link link
        where link.ledger_id = ti.ledger_id
          and link.refund_income_item_id = ti.id
          and link.refund_amount > 0
        union
        select link.target_expense_item_id
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = ti.ledger_id
          and link.reimbursement_income_item_id = ti.id
          and link.reimbursement_amount > 0
    ), events as (
        select
            target.id as target_id,
            target.amount as target_amount,
            target_record.id is not null as target_is_active,
            links.amount,
            links.is_refund,
            income.id as income_id,
            income_record.transaction_at,
            income_record.created_at as record_created_at,
            income.sort_order
        from targets
        cross join lateral (
            select link.refund_income_item_id as income_id, link.refund_amount as amount, true as is_refund
            from public.transaction_item_refund_link link
            where link.ledger_id = ti.ledger_id and link.refunded_item_id = targets.id
            union all
            select link.reimbursement_income_item_id, link.reimbursement_amount, false
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = ti.ledger_id and link.target_expense_item_id = targets.id
        ) links
        join public.transaction_item target
          on target.ledger_id = ti.ledger_id and target.id = targets.id
        left join public.transaction_record target_record
          on target_record.ledger_id = target.ledger_id
         and target_record.id = target.transaction_record_id
         and target_record.status = 'active'
        join public.transaction_item income
          on income.ledger_id = ti.ledger_id and income.id = links.income_id
        join public.transaction_record income_record
          on income_record.ledger_id = income.ledger_id
         and income_record.id = income.transaction_record_id
         and income_record.status = 'active'
    ), ordered as (
        select events.*,
            coalesce(sum(amount) over (
                partition by target_id
                order by transaction_at, record_created_at, sort_order, income_id
                rows between unbounded preceding and 1 preceding
            ), 0::numeric) as prior_amount
        from events
    )
    select
        sum(amount) filter (where target_id = ti.id and is_refund) as refunded_amount,
        sum(amount) filter (where target_id = ti.id and not is_refund) as reimbursed_amount,
        -- 零金额不占额度；原支出作废时仍保留有效收入的关联金额。
        sum(least(amount, greatest(target_amount - prior_amount, 0::numeric))) filter (
            where target_is_active and (target_id = ti.id or income_id = ti.id)
        ) as applied_amount
    from ordered
) offsets on true;
