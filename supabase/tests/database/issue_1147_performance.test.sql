-- #1147 性能对照：旧视图与跨币种视图使用同一批 3000 条无关联明细。
begin;
set local search_path = public, extensions;
select no_plan();

insert into public.transaction_record (
  id, ledger_id, type, status, transaction_at, merchant_id,
  title, note, created_by, updated_by
)
select
  ('11479800-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000032'::uuid,
  'normal', 'active',
  '2026-11-01 09:00:00+09'::timestamptz + i * interval '1 minute',
  '00000000-0000-4000-8000-000000001008'::uuid,
  'Issue #1147 性能样本', 'Issue #1147 性能样本',
  '00000000-0000-4000-8000-000000000031'::uuid,
  '00000000-0000-4000-8000-000000000031'::uuid
from generate_series(1, 3000) i;

insert into public.transaction_item (
  id, ledger_id, transaction_record_id, category_id, amount,
  discount_amount, balance_delta, sort_order, created_by, updated_by
)
select
  ('11479900-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000032'::uuid,
  ('11479800-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000005021'::uuid,
  500::numeric, 0::numeric, null::numeric, 0,
  '00000000-0000-4000-8000-000000000031'::uuid,
  '00000000-0000-4000-8000-000000000031'::uuid
from generate_series(1, 3000) i;

insert into public.transaction_payment (
  ledger_id, transaction_record_id, account_id,
  amount, balance_delta, sort_order, created_by
)
select
  '00000000-0000-4000-8000-000000000032'::uuid,
  ('11479800-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000043'::uuid,
  500::numeric, -500::numeric, 0,
  '00000000-0000-4000-8000-000000000031'::uuid
from generate_series(1, 3000) i;

create temporary view issue_1147_before
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

create function pg_temp.explain_1147(p_sql text)
returns jsonb language plpgsql as $fn$
declare
  result jsonb;
begin
  execute 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || p_sql into result;
  return result->0;
end;
$fn$;

select is(
  (select count(*) from public.transaction_record
   where note = 'Issue #1147 性能样本'),
  3000::bigint,
  '性能对照基于 3000 条有效记录'
);
select is(
  (select sum(business_net_amount) from pg_temp.issue_1147_before
   where id between '11479900-0000-4000-8000-000000000001'::uuid
     and '11479900-0000-4000-8000-000000003000'::uuid),
  1500000::numeric,
  '旧视图计算 3000 条未关联交易的金额不变'
);
select is(
  (select sum(business_net_amount) from public.transaction_item_with_refund
   where id between '11479900-0000-4000-8000-000000000001'::uuid
     and '11479900-0000-4000-8000-000000003000'::uuid),
  1500000::numeric,
  '跨币种视图计算 3000 条未关联交易的金额不变'
);

-- 与 CI 机器相关的时间仅作同轮对照，不写固定性能阈值，避免抖动造成测试失败。
select diag(format('Issue #1147 统计页旧视图 3000 明细 EXPLAIN: %s',
  pg_temp.explain_1147($sql$
    select sum(business_net_amount)
    from pg_temp.issue_1147_before
    where id between '11479900-0000-4000-8000-000000000001'::uuid
      and '11479900-0000-4000-8000-000000003000'::uuid
  $sql$)::text
));
select diag(format('Issue #1147 统计页新视图 3000 明细 EXPLAIN: %s',
  pg_temp.explain_1147($sql$
    select sum(business_net_amount)
    from public.transaction_item_with_refund
    where id between '11479900-0000-4000-8000-000000000001'::uuid
      and '11479900-0000-4000-8000-000000003000'::uuid
  $sql$)::text
));
select diag(format('Issue #1147 列表首页旧视图 3000 明细 EXPLAIN: %s',
  pg_temp.explain_1147($sql$
    select sum(net) from (
      select v.business_net_amount as net
      from pg_temp.issue_1147_before v
      join public.transaction_record tr on tr.id = v.transaction_record_id
      where tr.note = 'Issue #1147 性能样本'
      order by tr.transaction_at desc
      limit 20
    ) page
  $sql$)::text
));
select diag(format('Issue #1147 列表首页新视图 3000 明细 EXPLAIN: %s',
  pg_temp.explain_1147($sql$
    select sum(net) from (
      select v.business_net_amount as net
      from public.transaction_item_with_refund v
      join public.transaction_record tr on tr.id = v.transaction_record_id
      where tr.note = 'Issue #1147 性能样本'
      order by tr.transaction_at desc
      limit 20
    ) page
  $sql$)::text
));

select * from finish();
rollback;
