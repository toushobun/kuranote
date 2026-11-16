-- 入口 B 必须与账本的退款 / 报销特殊状态开关同步；复用原 RPC 签名和权限。
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
  source_account_archived boolean;
  candidates jsonb;
begin
  if p_kind not in ('refund', 'reimbursement') or p_kind is null or not exists (
    select 1 from public.ledger_member lm join public.app_user u on u.id = lm.user_id
    join public.ledger ledger on ledger.id = lm.ledger_id and not ledger.is_archived and ledger.setup_status = 'completed' and ledger.transaction_item_special_status_enabled
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

  select p.account_id, a.currency, a.is_archived into source_account, source_currency, source_account_archived
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
  if preferred_merchant is null and p_kind = 'refund' then
    -- 原商家已归档时不能作为新记账商家；交由用户手动选择。
    select m.id into preferred_merchant from public.merchant m
      where m.id = source.merchant_id and m.ledger_id = p_ledger_id and not m.is_archived;
  end if;

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
      'accountId', case when source_account_archived then '' else source_account::text end, 'candidates', candidates),
    'merchantHistory', public.load_merchant_entry_history(p_ledger_id, preferred_merchant, 20)
  );
end;
$$;
