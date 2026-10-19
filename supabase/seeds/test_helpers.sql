-- 本地 seed 与 pgTAP 共用的测试辅助函数（只存在于本地库，不进入 migrations）。
-- 普通记录的余额来源是付款明细（#911）；直接写入普通记录明细时统一经这里补齐付款明细，
-- 不在各测试 / seed 中复制插入语句。

begin;

create schema if not exists tests;

-- 普通记录明细不保存账户（#914 结束过渡期后 account_id 为 NULL），直接写入明细的 seed / 测试
-- 在这里登记每条明细由哪个账户付款，再据此重建付款明细。
create table if not exists tests.normal_item_payment_account (
    transaction_item_id uuid primary key,
    account_id uuid not null
);

-- 按登记的付款账户为普通记录重建付款明细：每个账户一行，balance_delta = Σ收入 − Σ支出。
-- 只写数据，不更新账户余额（与直接插入明细的旧写法一致）。
create or replace function tests.sync_normal_transaction_payments(
    p_record_ids uuid[] default null
)
returns void
language sql
set search_path = pg_catalog, pg_temp
as $$
    delete from public.transaction_payment p
    using public.transaction_record tr
    where tr.id = p.transaction_record_id
      and tr.type = 'normal'
      and (p_record_ids is null or tr.id = any(p_record_ids));

    insert into public.transaction_payment (
        ledger_id, transaction_record_id, account_id, amount, balance_delta,
        sort_order, created_by, created_at
    )
    select
        ti.ledger_id,
        ti.transaction_record_id,
        payer.account_id,
        abs(sum(case when c.type = 'income' then ti.amount else -ti.amount end)),
        sum(case when c.type = 'income' then ti.amount else -ti.amount end),
        0,
        tr.created_by,
        tr.created_at
    from public.transaction_item ti
    join tests.normal_item_payment_account payer
      on payer.transaction_item_id = ti.id
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where tr.type = 'normal'
      and (p_record_ids is null or tr.id = any(p_record_ids))
    group by ti.ledger_id, ti.transaction_record_id, payer.account_id, tr.created_by, tr.created_at;
$$;

-- 直接写入普通记录明细并补齐付款明细。p_items 的键与 transaction_item 列名相同，
-- account_id 表示这条明细的付款账户（登记到 tests.normal_item_payment_account，明细本身写 NULL）；
-- 省略的 id / sort_order / discount_amount / updated_by / created_at / updated_at 取默认值，
-- balance_delta 忽略（普通记录写 NULL）。已存在的明细 id 跳过，seed 可重复执行。
create or replace function tests.insert_normal_transaction_items(p_items jsonb)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_items jsonb;
begin
    -- 先补齐 id，后面写明细与登记付款账户使用同一个 id。
    select jsonb_agg(
        case
            when item ->> 'id' is null then item || jsonb_build_object('id', gen_random_uuid())
            else item
        end
    )
    into v_items
    from jsonb_array_elements(p_items) item;

    insert into public.transaction_item (
        id, ledger_id, transaction_record_id, category_id, amount,
        discount_amount, balance_delta, note, sort_order, special_status,
        created_by, updated_by, created_at, updated_at
    )
    select
        item.id,
        item.ledger_id,
        item.transaction_record_id,
        item.category_id,
        item.amount,
        coalesce(item.discount_amount, 0),
        null,
        item.note,
        coalesce(item.sort_order, 0),
        item.special_status,
        item.created_by,
        coalesce(item.updated_by, item.created_by),
        coalesce(item.created_at, now()),
        coalesce(item.updated_at, now())
    from jsonb_populate_recordset(null::public.transaction_item, v_items) item
    on conflict (id) do nothing;

    insert into tests.normal_item_payment_account (transaction_item_id, account_id)
    select item.id, item.account_id
    from jsonb_populate_recordset(null::public.transaction_item, v_items) item
    on conflict (transaction_item_id) do update
    set account_id = excluded.account_id;

    perform tests.sync_normal_transaction_payments(array(
        select distinct item.transaction_record_id
        from jsonb_populate_recordset(null::public.transaction_item, v_items) item
    ));
end;
$$;

-- 把普通记录改成由指定账户单独付款（重建付款明细，不更新余额）。
create or replace function tests.set_normal_transaction_payment_account(
    p_transaction_record_id uuid,
    p_account_id uuid
)
returns void
language sql
set search_path = pg_catalog, pg_temp
as $$
    insert into tests.normal_item_payment_account (transaction_item_id, account_id)
    select ti.id, p_account_id
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
    on conflict (transaction_item_id) do update
    set account_id = excluded.account_id;

    select tests.sync_normal_transaction_payments(array[p_transaction_record_id]);
$$;

-- 旧的明细级已关联编辑入口（#574）在 #911 后不再处理账户与余额。测试按原参数调用这里，
-- 经记录级的 update_linked_transaction_edit 提交单条明细与单账户付款明细（交易头沿用现值）。
create or replace function tests.update_linked_transaction_item(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_item_id uuid,
    p_expected_updated_at timestamptz,
    p_amount numeric,
    p_account_id uuid,
    p_category_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_record public.transaction_record;
begin
    select * into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id;

    perform public.update_linked_transaction_edit(
        p_ledger_id,
        p_transaction_record_id,
        coalesce(v_record.transaction_at, now()),
        v_record.merchant_id,
        v_record.note,
        jsonb_build_array(jsonb_build_object(
            'transactionItemId', p_transaction_item_id,
            'expectedUpdatedAt', p_expected_updated_at,
            'amount', p_amount,
            'categoryId', p_category_id
        )),
        jsonb_build_array(jsonb_build_object('accountId', p_account_id)),
        null
    );
end;
$$;

-- 记录当前的付款明细（RPC 入参形态），用于只改交易头 / 明细、不改付款账户的调用。
create or replace function tests.current_transaction_payments(p_transaction_record_id uuid)
returns jsonb
language sql
stable
set search_path = pg_catalog, pg_temp
as $$
    select jsonb_agg(jsonb_build_object('accountId', p.account_id) order by p.sort_order)
    from public.transaction_payment p
    where p.transaction_record_id = p_transaction_record_id;
$$;

-- pgTAP 会切换到 authenticated 后调用上面的辅助函数（RPC 仍按 auth.uid() 鉴权）。
grant usage on schema tests to authenticated;
grant execute on function tests.update_linked_transaction_item(uuid, uuid, uuid, timestamptz, numeric, uuid, uuid) to authenticated;
grant execute on function tests.current_transaction_payments(uuid) to authenticated;

commit;
