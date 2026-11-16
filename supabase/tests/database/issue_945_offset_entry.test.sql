-- 入口 B 的预填、回退、历史统计与权限；全部测试数据在事务结束时回滚。
begin;
set local search_path = public, extensions;
select no_plan();
-- 清除本账本 seed 关联以隔离无历史场景，事务结束统一回滚。
delete from public.transaction_item_refund_link where ledger_id = '00000000-0000-4000-8000-000000000032';
delete from public.transaction_item_reimbursement_link where ledger_id = '00000000-0000-4000-8000-000000000032';

create function pg_temp.u(n integer) returns uuid language sql immutable as $$
  select ('945b0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;
create function pg_temp.s(n integer) returns uuid language sql immutable as $$
  select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;
create function pg_temp.actor(n integer default 31) returns text language sql as $$
  select set_config('request.jwt.claims', case when n is null then '{}' else
    jsonb_build_object('sub', pg_temp.s(n), 'role', 'authenticated')::text end, true)
$$;
update public.ledger set transaction_item_special_status_enabled = true where id = pg_temp.s(32);
insert into public.merchant(id, ledger_id, name, created_by, updated_by)
select pg_temp.u(n), pg_temp.s(32), '入口 B 商家 ' || n, pg_temp.s(31), pg_temp.s(31) from generate_series(1, 5) n;

create function pg_temp.add_record(n integer, merchant integer, income boolean default false, account integer default 43)
returns void language plpgsql as $$
begin
  insert into public.transaction_record(id, ledger_id, type, transaction_at, merchant_id, created_by, updated_by)
  values(pg_temp.u(n), pg_temp.s(32), 'normal', '2099-11-16'::timestamptz + n * interval '1 minute', pg_temp.u(merchant), pg_temp.s(31), pg_temp.s(31));
  perform tests.insert_normal_transaction_items(jsonb_build_array(jsonb_build_object(
    'id', pg_temp.u(n + 100), 'ledger_id', pg_temp.s(32), 'transaction_record_id', pg_temp.u(n),
    'account_id', pg_temp.s(account), 'category_id', pg_temp.s(case when income then 5002 else 5021 end),
    'amount', case when income then 10 else 100 end, 'sort_order', 0,
    'special_status', case when not income then 'pending_reimbursement' end,
    'created_by', pg_temp.s(31), 'updated_by', pg_temp.s(31)
  )));
end;
$$;
create function pg_temp.link(income integer, expense integer, kind text) returns void language plpgsql as $$
begin
  perform public.apply_transaction_item_links(pg_temp.s(32), pg_temp.u(income + 100),
    jsonb_build_object(case when kind = 'refund' then 'refundedItemId' else 'reimbursementItemId' end, pg_temp.u(expense + 100)), pg_temp.s(31));
end;
$$;
create function pg_temp.entry(n integer, kind text default 'refund') returns jsonb language sql stable as $$
  select public.load_transaction_offset_entry(pg_temp.s(32), pg_temp.u(n), kind)->'entry'
$$;
select pg_temp.add_record(10, 1);
select pg_temp.add_record(11, 4);
select pg_temp.add_record(12, 5);
select pg_temp.add_record(13, 5);
update public.transaction_record set status = 'deleted', deleted_at = now(), deleted_by = pg_temp.s(31) where id = pg_temp.u(13);
-- 同一用户加入另一个账本；其更多、更近的报销历史不能影响当前账本。
insert into public.ledger(id, name, base_currency, owner_user_id, created_by, updated_by)
values(pg_temp.u(90), '入口 B 其他账本', 'JPY', pg_temp.s(31), pg_temp.s(31), pg_temp.s(31));
insert into public.ledger_member(ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values(pg_temp.u(90), pg_temp.s(31), 'owner', 'active', now(), pg_temp.s(31), pg_temp.s(31));
update public.ledger set transaction_item_special_status_enabled = true where id = pg_temp.u(90);
insert into public.merchant(id, ledger_id, name, created_by, updated_by)
values(pg_temp.u(6), pg_temp.u(90), '另一账本报销商家', pg_temp.s(31), pg_temp.s(31));
insert into public.account(id, ledger_id, name, type, currency, created_by, updated_by)
values(pg_temp.u(91), pg_temp.u(90), '其他账本账户', 'cash', 'JPY', pg_temp.s(31), pg_temp.s(31));
insert into public.category(id, ledger_id, parent_id, type, name, created_by, updated_by)
values(pg_temp.u(92), pg_temp.u(90), null, 'expense', '支出', pg_temp.s(31), pg_temp.s(31)),
(pg_temp.u(93), pg_temp.u(90), pg_temp.u(92), 'expense', '支出明细', pg_temp.s(31), pg_temp.s(31)),
(pg_temp.u(94), pg_temp.u(90), null, 'income', '收入', pg_temp.s(31), pg_temp.s(31)),
(pg_temp.u(95), pg_temp.u(90), pg_temp.u(94), 'income', '收入明细', pg_temp.s(31), pg_temp.s(31));
insert into public.transaction_record(id, ledger_id, type, transaction_at, merchant_id, created_by, updated_by)
select pg_temp.u(n), pg_temp.u(90), 'normal', '2199-11-16'::timestamptz + n * interval '1 minute', pg_temp.u(6), pg_temp.s(31), pg_temp.s(31) from generate_series(30,35) n;
select tests.insert_normal_transaction_items(jsonb_agg(jsonb_build_object(
  'id', pg_temp.u(n + 100), 'ledger_id', pg_temp.u(90), 'transaction_record_id', pg_temp.u(n),
  'account_id', pg_temp.u(91), 'category_id', pg_temp.u(case when n = 30 then 93 else 95 end),
  'amount', case when n = 30 then 100 else 10 end, 'sort_order', 0,
  'special_status', case when n = 30 then 'pending_reimbursement' end,
  'created_by', pg_temp.s(31), 'updated_by', pg_temp.s(31)
))) from generate_series(30,35) n;
select public.apply_transaction_item_links(pg_temp.u(90), pg_temp.u(n + 100), jsonb_build_object('reimbursementItemId', pg_temp.u(130)), pg_temp.s(31)) from generate_series(31,35) n;
select pg_temp.actor();
set local role authenticated;
select is(pg_temp.entry(10)->>'merchantId', pg_temp.u(1)::text, '退款无历史回退原商家');
select is(pg_temp.entry(10)->>'accountId', pg_temp.s(43)::text, '没有推荐账户回退原支出账户');
select is(pg_temp.entry(10, 'reimbursement')->'merchantId', 'null'::jsonb, '报销原商家和账本都无历史时不预填商家');
select is(pg_temp.entry(10)->'candidates'->0->>'remainingRefundableAmount', '100', '单明细剩余金额不带无效的小数尾零');
select is(pg_temp.entry(999), null::jsonb, '不存在的来源当普通新增');
select is(public.load_transaction_offset_entry(pg_temp.s(32), pg_temp.u(10), 'other'), null::jsonb, '拒绝非法核销类型');
reset role;
select pg_temp.add_record(20, 2, true, 41);
select pg_temp.link(20, 10, 'refund');
set local role authenticated;
select is(pg_temp.entry(10)->>'merchantId', pg_temp.u(2)::text, '退款按原商家的核销关联历史推荐商家');
select is(jsonb_array_length(public.load_transaction_offset_entry(pg_temp.s(32), pg_temp.u(10), 'refund')->'merchantHistory'), 1, '随来源读取推荐商家的有限历史样本供共用账户推荐逻辑使用');
select is(pg_temp.entry(10)->'candidates'->0->>'remainingRefundableAmount', '90', '剩余金额扣除已有退款');
select is(pg_temp.entry(20), null::jsonb, '收入记录不能作为来源');
reset role;
select pg_temp.add_record(21, 3, true);
select pg_temp.link(21, 10, 'refund');
set local role authenticated;
select is(pg_temp.entry(10)->>'merchantId', pg_temp.u(3)::text, '退款次数相同时采用最近一次核销的商家');
reset role;
select pg_temp.add_record(22, 2, true);
select pg_temp.link(22, 10, 'refund');
select pg_temp.add_record(23, 3, true);
select pg_temp.link(23, 11, 'reimbursement');
set local role authenticated;
select is(pg_temp.entry(10)->>'merchantId', pg_temp.u(2)::text, '退款次数优先于最近时间');
select is(pg_temp.entry(10, 'reimbursement')->>'merchantId', pg_temp.u(3)::text, '原商家无报销历史时回退账本报销历史');
reset role;
select pg_temp.add_record(24, 2, true);
select pg_temp.link(24, 10, 'reimbursement');
set local role authenticated;
select is(pg_temp.entry(10, 'reimbursement')->>'merchantId', pg_temp.u(2)::text, '原商家的报销历史优先于账本历史');
select is(pg_temp.entry(10)->'candidates'->0->>'remainingRefundableAmount', '60', '剩余额度同时扣除退款和报销');
select is(public.load_transaction_offset_entry(pg_temp.u(999), pg_temp.u(10), 'refund'), null::jsonb, '其他账本读不到来源及历史');
reset role;
select pg_temp.add_record(25, 3, true);
select pg_temp.link(25, 10, 'reimbursement');
set local role authenticated;
select is(pg_temp.entry(10, 'reimbursement')->>'merchantId', pg_temp.u(3)::text, '报销次数相同时采用最近一次核销的商家');
reset role;
select pg_temp.add_record(26, 2, true);
select pg_temp.link(26, 10, 'reimbursement');
set local role authenticated;
select is(pg_temp.entry(10, 'reimbursement')->>'merchantId', pg_temp.u(2)::text, '报销次数优先于最近时间');
reset role;
set local role authenticated;
select is(pg_temp.entry(12, 'reimbursement')->>'merchantId', pg_temp.u(2)::text, '另一个账本的更多更新报销历史不影响账本回退');
select is(public.load_transaction_offset_entry(pg_temp.s(32), pg_temp.u(30), 'refund'), null::jsonb, '不能把其他账本的记录作为来源');
select is(pg_temp.entry(13), null::jsonb, '已删除来源记录按普通新增处理');
reset role;
update public.ledger set is_archived = true, archived_at = now(), archived_by = pg_temp.s(31) where id = pg_temp.s(32);
set local role authenticated;
select is(pg_temp.entry(10), null::jsonb, '已归档账本不能发起核销');
reset role;
select pg_temp.actor(null);
update public.ledger set is_archived = false, archived_at = null, archived_by = null where id = pg_temp.s(32);
select pg_temp.actor();
update public.transaction_item set special_status = null where id = pg_temp.u(112);
set local role authenticated;
select is(pg_temp.entry(12, 'reimbursement'), null::jsonb, '没有待报销明细时不接受报销入口');
reset role;
-- 只读详情页可能来自已归档商家/账户；新记账不能预填失效对象。
update public.merchant set is_archived = true where id = pg_temp.u(5);
set local role authenticated;
select is(pg_temp.entry(12)->'merchantId', 'null'::jsonb, '退款来源商家已归档且无有效历史时需手选商家');
reset role;
update public.account set is_archived = true where id = pg_temp.s(43);
set local role authenticated;
select is(pg_temp.entry(12)->>'accountId', '', '原支出账户归档且无有效推荐时收款账户留空');
select ok(pg_temp.entry(12)->'candidates'->0->>'accountCurrency' is not null, '账户归档时仍保留来源币种供候选匹配');
reset role;
select public.update_ledger_member_settings(pg_temp.s(32), pg_temp.s(34), '945只读成员', 'sakura', 'viewer');
select pg_temp.actor(34);
set local role authenticated;
select is(pg_temp.entry(10), null::jsonb, '只有读取权限时不能发起核销');
select pg_temp.actor(999);
select is(pg_temp.entry(10), null::jsonb, '非成员读不到来源或历史商家');
select * from finish();
rollback;
