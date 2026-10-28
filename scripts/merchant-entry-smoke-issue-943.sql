-- #943：只读 RPC 的数据筛选、排序、上限和 RLS 验证；无需 seed，最终回滚。
-- 用法：docker exec -i supabase_db_kuranote psql -U postgres -v ON_ERROR_STOP=1 < scripts/merchant-entry-smoke-issue-943.sql
begin;

-- 仅绕过测试夹具写入触发器，查询前恢复；查询以 authenticated 身份执行真实 RLS。
set local session_replication_role = replica;
insert into public.app_user (id, display_name) values
('94300000-0000-4000-8000-000000000001', '测试用户'),
('94300000-0000-4000-8000-000000000099', '受邀用户');
insert into public.ledger (id, name, owner_user_id) values
('94300000-0000-4000-8000-000000000010', '测试账本', '94300000-0000-4000-8000-000000000001'),
('94300000-0000-4000-8000-000000000011', '其他账本', '94300000-0000-4000-8000-000000000001');
insert into public.ledger_member (ledger_id, user_id, role, status, joined_at) values
('94300000-0000-4000-8000-000000000010', '94300000-0000-4000-8000-000000000001', 'owner', 'active', now()),
('94300000-0000-4000-8000-000000000010', '94300000-0000-4000-8000-000000000099', 'member', 'invited', null);
insert into public.merchant (id, ledger_id, name) values
('94300000-0000-4000-8000-000000000020', '94300000-0000-4000-8000-000000000010', '常用商家'),
('94300000-0000-4000-8000-000000000021', '94300000-0000-4000-8000-000000000011', '其他商家');
insert into public.account (id, ledger_id, name, type, currency, is_archived, archived_at) values
('94300000-0000-4000-8000-000000000030', '94300000-0000-4000-8000-000000000010', '有效账户', 'cash', 'JPY', false, null),
('94300000-0000-4000-8000-000000000031', '94300000-0000-4000-8000-000000000010', '归档账户', 'cash', 'JPY', true, now());
insert into public.category (id, ledger_id, name, type, parent_id) values
('94300000-0000-4000-8000-000000000040', '94300000-0000-4000-8000-000000000010', '大分类', 'expense', null),
('94300000-0000-4000-8000-000000000041', '94300000-0000-4000-8000-000000000010', '小分类', 'expense', '94300000-0000-4000-8000-000000000040');
insert into public.transaction_record (id, ledger_id, merchant_id, type, transaction_at, status, deleted_at)
select md5('943-record-' || n)::uuid, '94300000-0000-4000-8000-000000000010', '94300000-0000-4000-8000-000000000020',
case when n = 24 then 'transfer' else 'normal' end,
'2026-10-01'::timestamptz + n * interval '1 day',
case when n = 25 then 'deleted' else 'active' end,
case when n = 25 then now() else null end
from generate_series(1, 25) n;
insert into public.transaction_record (ledger_id, merchant_id, type, transaction_at)
values ('94300000-0000-4000-8000-000000000011', '94300000-0000-4000-8000-000000000021', 'normal', now());
insert into public.transaction_payment (ledger_id, transaction_record_id, account_id, amount, balance_delta, sort_order)
select '94300000-0000-4000-8000-000000000010', md5('943-record-' || n)::uuid, a.id, 100, -100, a.sort_order
from generate_series(1, 25) n cross join public.account a
where a.ledger_id = '94300000-0000-4000-8000-000000000010';
insert into public.transaction_item (ledger_id, transaction_record_id, category_id, amount, sort_order)
select '94300000-0000-4000-8000-000000000010', md5('943-record-' || n)::uuid, '94300000-0000-4000-8000-000000000041', n, i
from generate_series(1, 25) n cross join generate_series(0, 1) i;
set local session_replication_role = origin;
select set_config('request.jwt.claim.sub', '94300000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $$
declare
  history jsonb;
  counts bigint;
begin
  select record_count into counts from public.load_frequent_transaction_merchants('94300000-0000-4000-8000-000000000010', 8);
  if counts is distinct from 24::bigint then raise exception '有效记录计数错误：%', counts; end if;
  history := public.load_merchant_entry_history('94300000-0000-4000-8000-000000000010', '94300000-0000-4000-8000-000000000020', 20);
  if jsonb_array_length(history) <> 20 or history->0->>'id' <> md5('943-record-24')::uuid::text then
    raise exception '最近样本上限或排序错误';
  end if;
  if jsonb_array_length(history->0->'items') <> 2 or jsonb_array_length(history->0->'payments') <> 2 then
    raise exception '丢失重复明细或多账户付款';
  end if;
  if not (history->0->'payments' @> '[{"isArchived": true, "currency": "JPY"}]'::jsonb) then
    raise exception '丢失归档状态或付款币种';
  end if;
  if public.load_merchant_entry_history('94300000-0000-4000-8000-000000000010', '94300000-0000-4000-8000-000000000021', 20) <> '[]'::jsonb then
    raise exception '跨账本商家泄露数据';
  end if;
  if exists(select 1 from public.load_frequent_transaction_merchants('94300000-0000-4000-8000-000000000011', 8)) then
    raise exception '无成员身份可读取其他账本';
  end if;
end;
$$;
select set_config('request.jwt.claim.sub', '94300000-0000-4000-8000-000000000099', true);
do $$
begin
  if public.load_merchant_entry_history('94300000-0000-4000-8000-000000000010', '94300000-0000-4000-8000-000000000020', 20) <> '[]'::jsonb then
    raise exception '未激活成员身份可读取历史';
  end if;
  if exists(select 1 from public.load_frequent_transaction_merchants('94300000-0000-4000-8000-000000000010', 8)) then
    raise exception '未激活成员身份可读取常用商家';
  end if;
end;
$$;
do $$
begin
  if has_function_privilege('anon', 'public.load_frequent_transaction_merchants(uuid,integer)', 'execute')
     or has_function_privilege('anon', 'public.load_merchant_entry_history(uuid,uuid,integer)', 'execute') then
    raise exception '匿名角色可执行 RPC';
  end if;
end;
$$;
reset role;

-- 可选性能样本：加 -v benchmark=1，在本事务生成 100 个商家、10 万笔交易后测量真实 RLS 路径。
\if :{?benchmark}
set local session_replication_role = replica;
insert into public.merchant (id, ledger_id, name)
select md5('943-bench-merchant-' || n)::uuid, '94300000-0000-4000-8000-000000000010', '性能商家' || n
from generate_series(1, 100) n;
insert into public.transaction_record (id, ledger_id, merchant_id, type, transaction_at)
select md5('943-bench-record-' || n)::uuid, '94300000-0000-4000-8000-000000000010', md5('943-bench-merchant-' || (n % 100 + 1))::uuid,
'normal', '2026-10-01'::timestamptz + n * interval '1 minute'
from generate_series(1, 100000) n;
insert into public.transaction_payment (ledger_id, transaction_record_id, account_id, amount, balance_delta)
select '94300000-0000-4000-8000-000000000010', md5('943-bench-record-' || n)::uuid,
'94300000-0000-4000-8000-000000000030', 100, -100
from generate_series(100, 100000, 100) n;
insert into public.transaction_item (ledger_id, transaction_record_id, category_id, amount)
select '94300000-0000-4000-8000-000000000010', md5('943-bench-record-' || n)::uuid,
'94300000-0000-4000-8000-000000000041', 100
from generate_series(100, 100000, 100) n;
set local session_replication_role = origin;
analyze public.transaction_record;
analyze public.merchant;
analyze public.transaction_payment;
analyze public.transaction_item;
select set_config('request.jwt.claim.sub', '94300000-0000-4000-8000-000000000001', true);
set local role authenticated;
explain (analyze, buffers)
select r.merchant_id, count(*) as record_count
from public.transaction_record r
join public.merchant m on m.id = r.merchant_id and m.ledger_id = r.ledger_id
where r.ledger_id = '94300000-0000-4000-8000-000000000010' and r.status = 'active'
and not m.is_archived and public.current_user_is_active_ledger_member('94300000-0000-4000-8000-000000000010')
group by r.merchant_id order by record_count desc, r.merchant_id limit 8;
explain (analyze, buffers) select * from public.load_frequent_transaction_merchants('94300000-0000-4000-8000-000000000010', 8);
explain (analyze, buffers) select public.load_merchant_entry_history('94300000-0000-4000-8000-000000000010', md5('943-bench-merchant-1')::uuid, 20);
explain (analyze, buffers)
select id from public.transaction_record
where ledger_id = '94300000-0000-4000-8000-000000000010' and merchant_id = md5('943-bench-merchant-1')::uuid
and status = 'active'
order by transaction_at desc, created_at desc, id desc limit 20;
reset role;
\endif
rollback;
