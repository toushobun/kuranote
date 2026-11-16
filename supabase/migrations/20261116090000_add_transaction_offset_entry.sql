-- 仅供受控入口内部使用；SQL 表函数可内联，让原商家条件下推到现有索引。
create or replace function public.transaction_offset_merchant_history(p_ledger_id uuid, p_kind text, p_source_merchant_id uuid default null)
returns table(source_merchant_id uuid, merchant_id uuid, transaction_at timestamptz)
language sql stable security invoker as $$
  with links as not materialized (
    select l.refunded_item_id target_id, l.refund_income_item_id income_id
      from public.transaction_item_refund_link l where p_kind = 'refund' and l.ledger_id = p_ledger_id
    union all
    select l.target_expense_item_id, l.reimbursement_income_item_id
      from public.transaction_item_reimbursement_link l where p_kind = 'reimbursement' and l.ledger_id = p_ledger_id
  ), targets as (
    -- 来源商家先走商家、明细索引；账本回退只枚举有关联的目标，不扫全账本记录。
    select e.id
      from public.transaction_record er
      join public.transaction_item e on e.transaction_record_id = er.id and e.ledger_id = p_ledger_id
      where p_source_merchant_id is not null and er.merchant_id = p_source_merchant_id
        and er.ledger_id = p_ledger_id and er.status = 'active'
    union
    select l.target_id from links l where p_source_merchant_id is null
  )
  select er.merchant_id, ir.merchant_id, ir.transaction_at
    from targets t
    join public.transaction_item e on e.id = t.id and e.ledger_id = p_ledger_id
    join public.transaction_record er on er.id = e.transaction_record_id and er.ledger_id = p_ledger_id and er.status = 'active'
    -- 保留相关子查询边界，使每个目标通过已有核销目标索引查找，避免整张关联表散列扫描。
    cross join lateral (select l.income_id from links l where l.target_id = t.id offset 0) l
    join public.transaction_item i on i.id = l.income_id and i.ledger_id = p_ledger_id
    join public.transaction_record ir on ir.id = i.transaction_record_id and ir.ledger_id = p_ledger_id and ir.status = 'active'
    join public.merchant m on m.id = ir.merchant_id and m.ledger_id = p_ledger_id and not m.is_archived;
$$;
revoke all on function public.transaction_offset_merchant_history(uuid, text, uuid) from public;

-- 入口 B 的来源、历史商家与账户在同一次数据库请求中读取。
create or replace function public.load_transaction_offset_entry(
  p_ledger_id uuid, p_record_id uuid, p_kind text
) returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  source public.transaction_record%rowtype;
  preferred_merchant uuid;
  source_account uuid;
  source_currency text;
  candidates jsonb;
begin
  if p_kind not in ('refund', 'reimbursement') or p_kind is null or not exists (
    select 1 from public.ledger_member lm join public.app_user u on u.id = lm.user_id
    join public.ledger ledger on ledger.id = lm.ledger_id and not ledger.is_archived and ledger.setup_status = 'completed'
    where lm.ledger_id = p_ledger_id and lm.user_id = auth.uid()
      and lm.status = 'active' and u.status = 'active' and lm.role in ('owner', 'admin', 'member')
  ) then return null; end if;
  select * into source from public.transaction_record
    where ledger_id = p_ledger_id and id = p_record_id and status = 'active' and type = 'normal';
  if not found then return null; end if;
  -- 与编辑页一致，普通记录按原始收支净额判断展示类型。
  if coalesce((select sum(case when c.type = 'expense' then i.amount else -i.amount end)
    from public.transaction_item i join public.category c on c.id = i.category_id and c.ledger_id = i.ledger_id
    where i.ledger_id = p_ledger_id and i.transaction_record_id = p_record_id), 0) <= 0
    then return null; end if;
  if p_kind = 'reimbursement' and not exists (
    select 1 from public.transaction_item i where i.ledger_id = p_ledger_id
      and i.transaction_record_id = p_record_id and i.special_status = 'pending_reimbursement'
  ) then return null; end if;

  select p.account_id, a.currency into source_account, source_currency
    from public.transaction_payment p join public.account a on a.id = p.account_id and a.ledger_id = p.ledger_id
    where p.ledger_id = p_ledger_id and p.transaction_record_id = p_record_id order by p.sort_order, p.id limit 1;
  if source_account is null then return null; end if;

  -- 先用原商家索引定位关联历史，首次报销才聚合账本的报销关联。
  select h.merchant_id into preferred_merchant
    from public.transaction_offset_merchant_history(p_ledger_id, p_kind, source.merchant_id) h
    group by h.merchant_id
    order by count(*) desc, max(h.transaction_at) desc, h.merchant_id limit 1;
  if preferred_merchant is null and p_kind = 'reimbursement' then
    select h.merchant_id into preferred_merchant
      from public.transaction_offset_merchant_history(p_ledger_id, p_kind) h
      group by h.merchant_id
      order by count(*) desc, max(h.transaction_at) desc, h.merchant_id limit 1;
  end if;
  if preferred_merchant is null and p_kind = 'refund' then preferred_merchant := source.merchant_id; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id, 'transactionRecordId', source.id, 'transactionAt', source.transaction_at,
    'merchantId', source.merchant_id, 'merchantName', m.name, 'merchantIconUrl', m.icon_url,
    'accountId', source_account, 'accountCurrency', source_currency, 'accountName', a.name,
    'categoryName', c.name, 'parentCategoryName', pc.name,
    'amount', trim_scale(i.amount)::text, 'refundedAmount', trim_scale(i.refunded_amount)::text,
    'reimbursementAmount', trim_scale(i.reimbursement_amount)::text,
    'remainingRefundableAmount', trim_scale(greatest(0, i.amount - i.refunded_amount - i.reimbursement_amount))::text,
    'note', coalesce(nullif(trim(i.note), ''), source.note)
  ) order by i.sort_order, i.id), '[]'::jsonb) into candidates
  from public.transaction_item_with_refund i
  join public.category c on c.id = i.category_id and c.ledger_id = i.ledger_id and c.type = 'expense'
  left join public.category pc on pc.id = c.parent_id and pc.ledger_id = i.ledger_id
  left join public.merchant m on m.id = source.merchant_id and m.ledger_id = p_ledger_id
  join public.account a on a.id = source_account and a.ledger_id = p_ledger_id
  where i.ledger_id = p_ledger_id and i.transaction_record_id = p_record_id
    and (p_kind = 'refund' or i.special_status in ('pending_reimbursement', 'reimbursed', 'reimbursement_surplus'));
  return jsonb_build_object(
    'entry', jsonb_build_object('kind', p_kind, 'merchantId', preferred_merchant,
      'accountId', source_account, 'candidates', candidates),
    'merchantHistory', public.load_merchant_entry_history(p_ledger_id, preferred_merchant, 20)
  );
end;
$$;
revoke all on function public.load_transaction_offset_entry(uuid, uuid, text) from public;
grant execute on function public.load_transaction_offset_entry(uuid, uuid, text) to authenticated;
