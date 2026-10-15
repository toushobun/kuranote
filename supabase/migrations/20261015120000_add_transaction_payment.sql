-- #911（#834 子 Issue 1）：新增付款明细表，普通记录的余额只由付款明细决定。
-- 设计依据：docs/design/issue-834-split-payment.md 第 3 节。
-- 过渡期：普通记录付款明细恰好 1 行；明细 account_id 是唯一付款账户的只读镜像，
-- 明细 balance_delta 写 NULL。

-- ============================================================
-- 1. transaction_item.balance_delta 改为可空（普通记录写 NULL）
-- ============================================================

alter table public.transaction_item
    alter column balance_delta drop not null,
    alter column balance_delta drop default;

-- ============================================================
-- 2. 付款明细表
-- ============================================================

create table public.transaction_payment (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null,
    transaction_record_id uuid not null,
    account_id uuid not null,
    amount numeric(14,2) not null,
    balance_delta numeric(14,2) not null,
    sort_order integer not null default 0,
    created_by uuid references public.app_user(id),
    created_at timestamptz not null default now(),
    constraint transaction_payment_amount_check check (amount >= 0),
    constraint transaction_payment_delta_matches_amount_check
        check (abs(balance_delta) = amount),
    constraint transaction_payment_sort_order_check check (sort_order >= 0),
    constraint transaction_payment_record_account_unique
        unique (transaction_record_id, account_id),
    constraint transaction_payment_record_same_ledger_fk
        foreign key (transaction_record_id, ledger_id)
        references public.transaction_record(id, ledger_id) on delete restrict,
    constraint transaction_payment_account_same_ledger_fk
        foreign key (account_id, ledger_id)
        references public.account(id, ledger_id) on delete restrict
);

create index transaction_payment_record_idx
    on public.transaction_payment (transaction_record_id, sort_order, id);
create index transaction_payment_account_idx
    on public.transaction_payment (ledger_id, account_id, transaction_record_id);

alter table public.transaction_payment enable row level security;

create policy transaction_payment_select_active_record
    on public.transaction_payment
    for select
    to authenticated
    using (
        public.current_user_is_active_ledger_member(ledger_id)
        and exists (
            select 1
            from public.transaction_record tr
            where tr.id = transaction_payment.transaction_record_id
              and tr.ledger_id = transaction_payment.ledger_id
              and tr.status = 'active'
        )
    );

-- 付款明细直接决定余额，只开放读取；写入只经 SECURITY DEFINER RPC。
revoke all on table public.transaction_payment from public, anon, authenticated, service_role;
grant select on table public.transaction_payment to authenticated;

-- ============================================================
-- 3. 账户维度的统一读取入口
-- ============================================================

create view public.transaction_account_movement
with (security_invoker = true) as
select
    p.ledger_id,
    p.transaction_record_id,
    p.account_id,
    p.amount,
    p.balance_delta,
    p.sort_order
from public.transaction_payment p
join public.transaction_record tr
  on tr.id = p.transaction_record_id
 and tr.ledger_id = p.ledger_id
where tr.type = 'normal'
union all
select
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    ti.amount,
    ti.balance_delta,
    ti.sort_order
from public.transaction_item ti
join public.transaction_record tr
  on tr.id = ti.transaction_record_id
 and tr.ledger_id = ti.ledger_id
where tr.type in ('transfer', 'balance_adjustment');

revoke all on table public.transaction_account_movement from public, anon, authenticated, service_role;
grant select on table public.transaction_account_movement to authenticated;

-- ============================================================
-- 4. 记录币种
-- ============================================================

create or replace function public.transaction_record_currency(
    p_ledger_id uuid,
    p_transaction_record_id uuid
)
returns text
language sql
stable
set search_path = pg_catalog, pg_temp
as $$
    -- 普通记录取付款账户（不变量保证同币种），转账 / 余额调整取明细账户。
    select a.currency
    from public.transaction_account_movement m
    join public.account a
      on a.id = m.account_id
     and a.ledger_id = m.ledger_id
    where m.ledger_id = p_ledger_id
      and m.transaction_record_id = p_transaction_record_id
    order by m.sort_order, m.account_id
    limit 1;
$$;

revoke all on function public.transaction_record_currency(uuid, uuid) from public, anon, authenticated, service_role;

-- ============================================================
-- 5. 记录级不变量（延迟约束触发器）
-- ============================================================

create or replace function public.validate_transaction_record_payments()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_record_ids uuid[];
    v_record_id uuid;
    v_record public.transaction_record;
    v_currency text;
    v_payment_count integer;
    v_payment_delta_total numeric;
    v_payment_currency_count integer;
    v_payments_all_outflow boolean;
    v_payment_account_id uuid;
    v_item_delta_total numeric;
    v_has_non_expense_item boolean;
begin
    if tg_table_name = 'transaction_record' then
        v_record_ids := array[new.id];
    elsif tg_op = 'DELETE' then
        v_record_ids := array[old.transaction_record_id];
    elsif tg_op = 'UPDATE' then
        v_record_ids := array[old.transaction_record_id, new.transaction_record_id];
    else
        v_record_ids := array[new.transaction_record_id];
    end if;

    for v_record_id in select distinct unnest(v_record_ids)
    loop
        select * into v_record
        from public.transaction_record tr
        where tr.id = v_record_id;

        -- 记录已被删除（例如删除账本）时无需检查。
        continue when not found;

        select
            count(*)::integer,
            coalesce(sum(p.balance_delta), 0),
            count(distinct a.currency)::integer,
            coalesce(bool_and(p.balance_delta = -p.amount), true),
            min(p.account_id::text)::uuid
        into
            v_payment_count,
            v_payment_delta_total,
            v_payment_currency_count,
            v_payments_all_outflow,
            v_payment_account_id
        from public.transaction_payment p
        join public.account a
          on a.id = p.account_id
         and a.ledger_id = p.ledger_id
        where p.transaction_record_id = v_record.id
          and p.ledger_id = v_record.ledger_id;

        if v_record.type <> 'normal' then
            if v_payment_count > 0 then
                raise exception 'payment_record_type_invalid'
                    using errcode = '22023', detail = 'payment_record_type_invalid';
            end if;
            continue;
        end if;

        if v_payment_count = 0 then
            if v_record.status = 'active' then
                raise exception 'payment_required'
                    using errcode = '22023', detail = 'payment_required';
            end if;
            continue;
        end if;

        select
            coalesce(sum(case when c.type = 'income' then ti.amount else -ti.amount end), 0),
            coalesce(bool_or(c.type is distinct from 'expense'), false)
        into v_item_delta_total, v_has_non_expense_item
        from public.transaction_item ti
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.transaction_record_id = v_record.id
          and ti.ledger_id = v_record.ledger_id;

        if v_payment_delta_total <> v_item_delta_total then
            raise exception 'payment_total_mismatch'
                using errcode = '22023', detail = 'payment_total_mismatch';
        end if;

        if v_payment_count > 1
           and (v_has_non_expense_item or not v_payments_all_outflow) then
            raise exception 'payment_multi_account_not_allowed'
                using errcode = '22023', detail = 'payment_multi_account_not_allowed';
        end if;

        if v_payment_currency_count > 1 then
            raise exception 'payment_currency_mismatch'
                using errcode = '22023', detail = 'payment_currency_mismatch';
        end if;

        v_currency := public.transaction_record_currency(v_record.ledger_id, v_record.id);

        if exists (
            select 1
            from public.transaction_item ti
            join public.transaction_item_refund_link link
              on link.ledger_id = ti.ledger_id
             and (link.refund_income_item_id = ti.id or link.refunded_item_id = ti.id)
            join public.transaction_item counterpart
              on counterpart.ledger_id = link.ledger_id
             and counterpart.id = case
                 when link.refund_income_item_id = ti.id then link.refunded_item_id
                 else link.refund_income_item_id
             end
            where ti.transaction_record_id = v_record.id
              and ti.ledger_id = v_record.ledger_id
              and public.transaction_record_currency(
                  counterpart.ledger_id,
                  counterpart.transaction_record_id
              ) is distinct from v_currency
        ) then
            raise exception 'refund_currency_mismatch'
                using errcode = '22023', detail = 'refund_currency_mismatch';
        end if;

        if exists (
            select 1
            from public.transaction_item ti
            join public.transaction_item_reimbursement_link link
              on link.ledger_id = ti.ledger_id
             and (
                 link.reimbursement_income_item_id = ti.id
                 or link.target_expense_item_id = ti.id
             )
            join public.transaction_item counterpart
              on counterpart.ledger_id = link.ledger_id
             and counterpart.id = case
                 when link.reimbursement_income_item_id = ti.id
                 then link.target_expense_item_id
                 else link.reimbursement_income_item_id
             end
            where ti.transaction_record_id = v_record.id
              and ti.ledger_id = v_record.ledger_id
              and public.transaction_record_currency(
                  counterpart.ledger_id,
                  counterpart.transaction_record_id
              ) is distinct from v_currency
        ) then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        -- 过渡期（#834 子 Issue 4 解除）：付款明细恰好 1 行，明细 account_id 是它的镜像。
        -- 明细 balance_delta 为 NULL 由 validate_transaction_item_category_shape 立即校验。
        if v_payment_count <> 1 or exists (
            select 1
            from public.transaction_item ti
            where ti.transaction_record_id = v_record.id
              and ti.ledger_id = v_record.ledger_id
              and ti.account_id is distinct from v_payment_account_id
        ) then
            raise exception 'payment_transition_invalid'
                using errcode = '22023', detail = 'payment_transition_invalid';
        end if;
    end loop;

    return null;
end;
$$;

revoke all on function public.validate_transaction_record_payments() from public, anon, authenticated, service_role;

-- 三个触发器同名，RPC 用一条 set constraints 即可同时切换。
create constraint trigger validate_transaction_record_payments
    after insert or update or delete on public.transaction_payment
    deferrable initially deferred
    for each row execute function public.validate_transaction_record_payments();

create constraint trigger validate_transaction_record_payments
    after insert or delete or update of amount, category_id, transaction_record_id, account_id
    on public.transaction_item
    deferrable initially deferred
    for each row execute function public.validate_transaction_record_payments();

create constraint trigger validate_transaction_record_payments
    after update of type, status on public.transaction_record
    deferrable initially deferred
    for each row execute function public.validate_transaction_record_payments();

-- ============================================================
-- 6. 明细形态：balance_delta 按记录类型校验
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."validate_transaction_item_category_shape"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_record_type text;
begin
    select tr.type
    into v_record_type
    from public.transaction_record tr
    where tr.id = new.transaction_record_id
      and tr.ledger_id = new.ledger_id;

    if v_record_type is null then
        raise exception 'transaction_record_invalid' using errcode = '23503';
    end if;

    if v_record_type in ('transfer', 'balance_adjustment') and new.category_id is not null then
        raise exception 'transaction_item_category_invalid' using errcode = '23514';
    end if;

    if v_record_type = 'normal' and new.category_id is null then
        raise exception 'transaction_item_category_required' using errcode = '23514';
    end if;

    -- 普通记录的余额来自付款明细，明细不再保存 balance_delta。
    if (v_record_type = 'normal') = (new.balance_delta is not null) then
        raise exception 'transaction_item_balance_delta_invalid' using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger transaction_item_validate_category_shape on public.transaction_item;
create trigger transaction_item_validate_category_shape
    before insert or update of ledger_id, transaction_record_id, category_id, balance_delta
    on public.transaction_item
    for each row execute function public.validate_transaction_item_category_shape();

-- ============================================================
-- 7. 本地库回填（生产环境没有数据，为空操作；可重复执行）
-- ============================================================

insert into public.transaction_payment (
    ledger_id, transaction_record_id, account_id, amount, balance_delta,
    sort_order, created_by, created_at
)
select
    ti.ledger_id,
    ti.transaction_record_id,
    ti.account_id,
    abs(sum(ti.balance_delta)),
    sum(ti.balance_delta),
    0,
    tr.created_by,
    tr.created_at
from public.transaction_item ti
join public.transaction_record tr
  on tr.id = ti.transaction_record_id
 and tr.ledger_id = ti.ledger_id
where tr.type = 'normal'
  and ti.balance_delta is not null
  and not exists (
      select 1
      from public.transaction_payment p
      where p.transaction_record_id = tr.id
  )
group by ti.ledger_id, ti.transaction_record_id, ti.account_id, tr.created_by, tr.created_at;

update public.transaction_item ti
set balance_delta = null
from public.transaction_record tr
where tr.id = ti.transaction_record_id
  and tr.ledger_id = ti.ledger_id
  and tr.type = 'normal'
  and ti.balance_delta is not null;


-- ============================================================
-- 8. 付款明细：入参解析与整组替换（创建 / 编辑 / 已关联编辑 / 类型转换共用）
-- ============================================================

-- 按录入顺序返回 p_payments 的账户；账户必须属于本账本且未归档（未加锁，
-- replace_transaction_payments 加锁后会再校验）。
create or replace function public.transaction_payment_account_ids(
    p_ledger_id uuid,
    p_payments jsonb
)
returns uuid[]
language plpgsql
stable
set search_path = pg_catalog, pg_temp
as $$
declare
    v_payment jsonb;
    v_account_id uuid;
    v_account_ids uuid[] := array[]::uuid[];
begin
    if jsonb_typeof(p_payments) is distinct from 'array'
       or jsonb_array_length(p_payments) = 0 then
        raise exception 'payment_required'
            using errcode = '22023', detail = 'payment_required';
    end if;

    for v_payment in select value from jsonb_array_elements(p_payments)
    loop
        begin
            v_account_id := nullif(v_payment ->> 'accountId', '')::uuid;
        exception when invalid_text_representation then
            v_account_id := null;
        end;

        if v_account_id is null or not exists (
            select 1
            from public.account a
            where a.id = v_account_id
              and a.ledger_id = p_ledger_id
              and a.is_archived = false
        ) then
            raise exception 'account_invalid'
                using errcode = '22023', detail = 'account_invalid';
        end if;

        if v_account_id = any(v_account_ids) then
            raise exception 'payment_account_duplicate'
                using errcode = '22023', detail = 'payment_account_duplicate';
        end if;

        v_account_ids := array_append(v_account_ids, v_account_id);
    end loop;

    return v_account_ids;
end;
$$;

revoke all on function public.transaction_payment_account_ids(uuid, jsonb) from public, anon, authenticated, service_role;

create or replace function public.replace_transaction_payments(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_payments jsonb,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_payment_index integer;
    v_account_id uuid;
    v_amount numeric;
    v_delta numeric(14,2);
    v_new_account_ids uuid[];
    v_new_deltas numeric(14,2)[] := array[]::numeric(14,2)[];
    v_old_account_ids uuid[];
    v_old_deltas numeric(14,2)[];
    v_all_account_ids uuid[];
    v_locked_account_count integer;
begin
    v_new_account_ids := public.transaction_payment_account_ids(p_ledger_id, p_payments);

    if array_length(v_new_account_ids, 1) = 1 then
        -- 单账户不提交金额：余额变动 = Σ收入明细 − Σ支出明细，与逐条明细 ±金额 的合计一致。
        select coalesce(sum(case when c.type = 'income' then ti.amount else -ti.amount end), 0)
        into v_delta
        from public.transaction_item ti
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id;

        v_new_deltas := array[v_delta];
    else
        -- 多账户：每行必须提交金额，全部记为支出。
        for v_payment_index in 0..array_length(v_new_account_ids, 1) - 1
        loop
            begin
                v_amount := nullif(p_payments -> v_payment_index ->> 'amount', '')::numeric;
            exception when invalid_text_representation then
                raise exception 'amount_invalid'
                    using errcode = '22023', detail = 'amount_invalid';
            end;

            if v_amount is null then
                raise exception 'payment_amount_required'
                    using errcode = '22023', detail = 'payment_amount_required';
            end if;

            if v_amount < 0 or v_amount <> round(v_amount, 2) or v_amount >= 1e12 then
                raise exception 'amount_invalid'
                    using errcode = '22023', detail = 'amount_invalid';
            end if;

            v_new_deltas := array_append(v_new_deltas, (-v_amount)::numeric(14,2));
        end loop;
    end if;

    select
        coalesce(array_agg(p.account_id order by p.account_id), array[]::uuid[]),
        coalesce(array_agg(p.balance_delta order by p.account_id), array[]::numeric(14,2)[])
    into v_old_account_ids, v_old_deltas
    from public.transaction_payment p
    where p.transaction_record_id = p_transaction_record_id
      and p.ledger_id = p_ledger_id;

    -- 锁顺序：调用方已锁 ledger（需要时）→ record → item / 关联目标；这里按 UUID 一次性锁「旧 ∪ 新」账户。
    -- 使用 FOR NO KEY UPDATE：与余额 UPDATE 本身的锁等级一致，不与明细 / 付款明细外键检查的
    -- KEY SHARE 冲突，避免「先写明细、后锁账户」的两个事务交叉等待。
    v_all_account_ids := array(
        select distinct account_id
        from unnest(v_old_account_ids || v_new_account_ids) as account_id
        order by account_id
    );

    perform 1
    from public.account a
    where a.ledger_id = p_ledger_id
      and a.id = any(v_all_account_ids)
    order by a.id
    for no key update;
    get diagnostics v_locked_account_count = row_count;

    -- 新账户必须属于本账本且未归档；旧账户已归档时与现状一致，整笔不可编辑。
    if v_locked_account_count <> coalesce(array_length(v_all_account_ids, 1), 0)
       or exists (
           select 1
           from public.account a
           where a.ledger_id = p_ledger_id
             and a.id = any(v_all_account_ids)
             and a.is_archived
       ) then
        raise exception 'account_invalid'
            using errcode = '22023', detail = 'account_invalid';
    end if;

    delete from public.transaction_payment p
    where p.transaction_record_id = p_transaction_record_id
      and p.ledger_id = p_ledger_id;

    insert into public.transaction_payment (
        ledger_id, transaction_record_id, account_id, amount, balance_delta,
        sort_order, created_by
    )
    select
        p_ledger_id,
        p_transaction_record_id,
        new_payment.account_id,
        abs(new_payment.balance_delta),
        new_payment.balance_delta,
        (new_payment.ordinality - 1)::integer,
        p_user_id
    from unnest(v_new_account_ids, v_new_deltas)
        with ordinality as new_payment(account_id, balance_delta, ordinality);

    -- 过渡期：明细 account_id 是首个付款账户的只读镜像。
    update public.transaction_item ti
    set account_id = v_new_account_ids[1]
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and ti.account_id is distinct from v_new_account_ids[1];

    for v_account_id, v_delta in
        select movement.account_id, sum(movement.balance_delta)
        from (
            select account_id, balance_delta
            from unnest(v_new_account_ids, v_new_deltas) as n(account_id, balance_delta)
            union all
            select account_id, -balance_delta
            from unnest(v_old_account_ids, v_old_deltas) as o(account_id, balance_delta)
        ) movement
        group by movement.account_id
        having sum(movement.balance_delta) <> 0
        order by movement.account_id
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_account_id,
            v_delta,
            p_user_id
        );
    end loop;
end;
$$;

revoke all on function public.replace_transaction_payments(uuid, uuid, jsonb, uuid) from public, anon, authenticated, service_role;

-- ============================================================
-- 9. 创建：p_account_id → p_payments
-- ============================================================

drop function public.create_transaction(uuid, text, timestamptz, jsonb, uuid, uuid, text);
drop function public.create_transaction_locked_impl(uuid, text, timestamptz, jsonb, uuid, uuid, text);

CREATE OR REPLACE FUNCTION "public"."create_transaction"("p_ledger_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_payments" "jsonb", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_requires_link_lock boolean := false;
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    if jsonb_typeof(p_items) = 'array' then
        select exists (
            select 1
            from jsonb_array_elements(p_items) item
            where nullif(item ->> 'reimbursementItemId', '') is not null
               or nullif(item ->> 'refundedItemId', '') is not null
               or nullif(item ->> 'specialStatus', '') is not null
        )
        into v_requires_link_lock;
    end if;

    if v_requires_link_lock then
        perform 1
        from public.ledger l
        where l.id = p_ledger_id
        for update;
    end if;

    return public.create_transaction_locked_impl(
        p_ledger_id,
        p_type,
        p_transaction_at,
        p_items,
        p_payments,
        p_merchant_id,
        p_note
    );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."create_transaction_locked_impl"("p_ledger_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_payments" "jsonb", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_transaction_record_id uuid;
    v_transaction_item_id uuid;
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_sort_order integer := 0;
    v_mirror_account_id uuid;
    v_transaction_item_ids uuid[] := array[]::uuid[];
    v_item_payloads jsonb[] := array[]::jsonb[];
    v_item_index integer;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    v_mirror_account_id := (public.transaction_payment_account_ids(p_ledger_id, p_payments))[1];

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id
          and m.ledger_id = p_ledger_id
          and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    insert into public.transaction_record (
        ledger_id, type, status, transaction_at, merchant_id, title, note,
        created_by, updated_by
    ) values (
        p_ledger_id, 'normal', 'active', p_transaction_at, p_merchant_id, null,
        p_note, v_user_id, v_user_id
    ) returning id into v_transaction_record_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        begin
            v_item_amount := (v_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_item ->> 'categoryId')::uuid;
            v_item_special_status := nullif(v_item ->> 'specialStatus', '')::public.transaction_item_special_status;
        exception when invalid_text_representation then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end;

        if v_item_amount is null or v_item_amount < 0
           or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        if v_item_special_status = 'reimbursed'
           or (v_item_special_status = 'pending_reimbursement'
               and v_item_category_type <> 'expense') then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        insert into public.transaction_item (
            ledger_id, transaction_record_id, account_id, category_id, amount,
            discount_amount, balance_delta, note, sort_order, special_status,
            created_by, updated_by
        ) values (
            p_ledger_id, v_transaction_record_id, v_mirror_account_id,
            v_item_category_id, v_item_amount, 0, null, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        ) returning id into v_transaction_item_id;

        v_transaction_item_ids := array_append(v_transaction_item_ids, v_transaction_item_id);
        v_item_payloads := array_append(v_item_payloads, v_item);
        v_sort_order := v_sort_order + 1;
    end loop;

    -- 关联的币种校验读取付款账户，所以先写付款明细（并更新余额），再建立关联。
    perform public.replace_transaction_payments(
        p_ledger_id,
        v_transaction_record_id,
        p_payments,
        v_user_id
    );

    for v_item_index in 1..coalesce(array_length(v_transaction_item_ids, 1), 0)
    loop
        perform public.apply_transaction_item_links(
            p_ledger_id,
            v_transaction_item_ids[v_item_index],
            v_item_payloads[v_item_index],
            v_user_id
        );
    end loop;

    set constraints public.validate_transaction_record_payments immediate;
    set constraints public.validate_transaction_record_payments deferred;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.create_transaction(uuid, text, timestamptz, jsonb, jsonb, uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.create_transaction(uuid, text, timestamptz, jsonb, jsonb, uuid, text) to authenticated;
revoke all on function public.create_transaction_locked_impl(uuid, text, timestamptz, jsonb, jsonb, uuid, text) from public, anon, authenticated, service_role;

-- ============================================================
-- 10. 编辑：p_account_id → p_payments，余额按账户差额更新
-- ============================================================

drop function public.update_transaction(uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text);
drop function public.update_transaction_locked_impl(uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text);

CREATE OR REPLACE FUNCTION "public"."update_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_payments" "jsonb", "p_merchant_id" "uuid", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_requires_link_lock boolean := p_type = 'income';
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    if not v_requires_link_lock and jsonb_typeof(p_items) = 'array' then
        select exists (
            select 1
            from jsonb_array_elements(p_items) item
            where nullif(item ->> 'reimbursementItemId', '') is not null
               or nullif(item ->> 'refundedItemId', '') is not null
               or nullif(item ->> 'specialStatus', '') is not null
        )
        into v_requires_link_lock;
    end if;

    if v_requires_link_lock then
        perform 1
        from public.ledger l
        where l.id = p_ledger_id
        for update;
    end if;

    return public.update_transaction_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_type,
        p_transaction_at,
        p_items,
        p_payments,
        p_merchant_id,
        p_note
    );
end;
$$;


CREATE OR REPLACE FUNCTION "public"."update_transaction_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_payments" "jsonb", "p_merchant_id" "uuid", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_existing_item public.transaction_item;
    v_existing_item_ids uuid[] := array[]::uuid[];
    v_used_item_ids uuid[] := array[]::uuid[];
    v_transaction_item_ids uuid[] := array[]::uuid[];
    v_item_payloads jsonb[] := array[]::jsonb[];
    v_item jsonb;
    v_item_index integer;
    v_item_count integer;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_item_special_status public.transaction_item_special_status;
    v_transaction_item_id uuid;
    v_mirror_account_id uuid;
    v_sort_order integer := 0;
    v_is_income_link_edit_request boolean;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    v_is_income_link_edit_request := p_type = 'income';

    v_mirror_account_id := (public.transaction_payment_account_ids(p_ledger_id, p_payments))[1];

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id
          and m.ledger_id = p_ledger_id
          and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    select * into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    -- 目标支出始终冻结；收入侧只有受控编辑流程可以先清空关联再编辑。
    if exists (
        select 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
          and (
              ti.special_status = 'reimbursed'
              or exists (
                  select 1
                  from public.transaction_item_reimbursement_link link
                  where link.ledger_id = ti.ledger_id
                    and link.target_expense_item_id = ti.id
              )
              or exists (
                  select 1
                  from public.transaction_item_refund_link link
                  where link.ledger_id = ti.ledger_id
                    and link.refunded_item_id = ti.id
              )
              or (
                  not v_is_income_link_edit_request
                  and (
                      exists (
                          select 1
                          from public.transaction_item_reimbursement_link link
                          where link.ledger_id = ti.ledger_id
                            and link.reimbursement_income_item_id = ti.id
                      )
                      or exists (
                          select 1
                          from public.transaction_item_refund_link link
                          where link.ledger_id = ti.ledger_id
                            and link.refund_income_item_id = ti.id
                      )
                  )
              )
          )
    ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    for v_existing_item in
        select * from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        v_existing_item_ids := array_append(
            v_existing_item_ids,
            v_existing_item.id
        );

        if exists (
            select 1
            from public.transaction_item_reimbursement_link reimbursement_link
            where reimbursement_link.ledger_id = p_ledger_id
              and reimbursement_link.reimbursement_income_item_id =
                  v_existing_item.id
        ) or exists (
            select 1
            from public.transaction_item_refund_link refund_link
            where refund_link.ledger_id = p_ledger_id
              and refund_link.refund_income_item_id = v_existing_item.id
        ) then
            perform public.clear_transaction_item_income_links(
                p_ledger_id,
                v_existing_item.id,
                v_user_id
            );
        end if;
    end loop;

    update public.transaction_record tr
    set type = 'normal',
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        begin
            v_transaction_item_id := nullif(v_item ->> 'id', '')::uuid;
        exception when invalid_text_representation then
            raise exception 'items_invalid'
                using errcode = '22023', detail = 'items_invalid';
        end;

        begin
            v_item_amount := (v_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_item ->> 'categoryId')::uuid;
            v_item_special_status := nullif(
                v_item ->> 'specialStatus',
                ''
            )::public.transaction_item_special_status;
        exception when invalid_text_representation then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end;

        if v_item_amount is null or v_item_amount < 0
           or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        if v_item_special_status = 'reimbursed'
           or (v_item_special_status = 'pending_reimbursement'
               and v_item_category_type <> 'expense') then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        if nullif(v_item ->> 'refundedItemId', '') is not null
           and v_item_category_type <> 'income' then
            raise exception 'income_link_category_invalid'
                using errcode = '22023', detail = 'income_link_category_invalid';
        end if;

        if v_transaction_item_id is not null and (
            not (v_transaction_item_id = any(v_existing_item_ids))
            or v_transaction_item_id = any(v_used_item_ids)
        ) then
            raise exception 'items_invalid'
                using errcode = '22023', detail = 'items_invalid';
        end if;

        if v_transaction_item_id is null then
            insert into public.transaction_item (
                ledger_id,
                transaction_record_id,
                account_id,
                category_id,
                amount,
                discount_amount,
                balance_delta,
                note,
                sort_order,
                special_status,
                created_by,
                updated_by
            ) values (
                p_ledger_id,
                p_transaction_record_id,
                v_mirror_account_id,
                v_item_category_id,
                v_item_amount,
                0,
                null,
                null,
                v_sort_order,
                v_item_special_status,
                v_user_id,
                v_user_id
            ) returning id into v_transaction_item_id;
        else
            update public.transaction_item ti
            set account_id = v_mirror_account_id,
                category_id = v_item_category_id,
                amount = v_item_amount,
                discount_amount = 0,
                balance_delta = null,
                note = null,
                sort_order = v_sort_order,
                special_status = v_item_special_status,
                updated_by = v_user_id,
                updated_at = now()
            where ti.id = v_transaction_item_id
              and ti.ledger_id = p_ledger_id
              and ti.transaction_record_id = p_transaction_record_id;
        end if;

        v_used_item_ids := array_append(v_used_item_ids, v_transaction_item_id);
        v_transaction_item_ids := array_append(
            v_transaction_item_ids,
            v_transaction_item_id
        );
        v_item_payloads := array_append(v_item_payloads, v_item);

        v_sort_order := v_sort_order + 1;
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and not (ti.id = any(v_used_item_ids));

    -- 余额只由付款明细决定：按账户差额更新；关联的币种校验读取付款账户，所以先于关联执行。
    perform public.replace_transaction_payments(
        p_ledger_id,
        p_transaction_record_id,
        p_payments,
        v_user_id
    );

    v_item_count := coalesce(array_length(v_transaction_item_ids, 1), 0);
    if v_item_count > 0 then
        for v_item_index in 1..v_item_count
        loop
            perform public.apply_transaction_item_links(
                p_ledger_id,
                v_transaction_item_ids[v_item_index],
                v_item_payloads[v_item_index],
                v_user_id
            );
        end loop;
    end if;

    set constraints public.validate_transaction_record_payments immediate;
    set constraints public.validate_transaction_record_payments deferred;

    return p_transaction_record_id;
end;
$$;


revoke all on function public.update_transaction(uuid, uuid, text, timestamptz, jsonb, jsonb, uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.update_transaction(uuid, uuid, text, timestamptz, jsonb, jsonb, uuid, text) to authenticated;
revoke all on function public.update_transaction_locked_impl(uuid, uuid, text, timestamptz, jsonb, jsonb, uuid, text) from public, anon, authenticated, service_role;

-- ============================================================
-- 11. 类型转换：p_account_id → p_payments；账户锁集合改为付款明细 / 转账明细
-- ============================================================

drop function public.convert_transaction_type_with_special_status(uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric);
drop function public.convert_transaction_type(uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric);
drop function public.convert_transaction_type_locked_impl(uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION "public"."convert_transaction_type_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_target_type" "text", "p_transaction_at" timestamp with time zone, "p_note" "text" DEFAULT NULL::"text", "p_payments" "jsonb" DEFAULT NULL::"jsonb", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_items" "jsonb" DEFAULT NULL::"jsonb", "p_from_account_id" "uuid" DEFAULT NULL::"uuid", "p_to_account_id" "uuid" DEFAULT NULL::"uuid", "p_transfer_amount" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_account_id uuid;
    v_account_delta numeric(14,2);
    v_new_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_sort_order integer := 0;
    v_target_record_type text;
    v_old_account_ids uuid[];
    v_new_account_ids uuid[];
    v_all_account_ids uuid[];
    v_locked_account_count integer := 0;
    v_from_account public.account;
    v_to_account public.account;
    v_locked_account public.account;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_target_type not in ('expense', 'income', 'normal', 'transfer') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    v_target_record_type := case
        when p_target_type = 'transfer' then 'transfer'
        else 'normal'
    end;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type in ('normal', 'transfer')
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    if v_record.type = v_target_record_type then
        raise exception 'transaction_type_not_changed' using errcode = '22023';
    end if;

    -- 普通记录的账户来自付款明细，转账来自明细。
    select array_agg(distinct m.account_id order by m.account_id)
    into v_old_account_ids
    from public.transaction_account_movement m
    where m.transaction_record_id = p_transaction_record_id
      and m.ledger_id = p_ledger_id;

    if coalesce(array_length(v_old_account_ids, 1), 0) = 0 then
        raise exception 'transaction_items_invalid' using errcode = '22023';
    end if;

    if v_target_record_type = 'transfer' then
        if p_from_account_id is null or p_to_account_id is null then
            raise exception 'transfer_account_invalid' using errcode = '22023';
        end if;

        if p_from_account_id = p_to_account_id then
            raise exception 'transfer_account_invalid' using errcode = '22023';
        end if;

        if p_transfer_amount is null or p_transfer_amount <= 0 or p_transfer_amount <> round(p_transfer_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        v_new_account_ids := array[p_from_account_id, p_to_account_id];
    else
        v_new_account_ids := public.transaction_payment_account_ids(p_ledger_id, p_payments);

        if p_merchant_id is null or not exists (
            select 1 from public.merchant m
            where m.id = p_merchant_id
              and m.ledger_id = p_ledger_id
              and m.is_archived = false
        ) then
            raise exception 'merchant_invalid' using errcode = '22023';
        end if;

        if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
            raise exception 'items_invalid' using errcode = '22023';
        end if;

        for v_new_item in select * from jsonb_array_elements(p_items)
        loop
            v_item_amount := (v_new_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_new_item ->> 'categoryId')::uuid;

            if v_item_amount is null or v_item_amount < 0 or v_item_amount <> round(v_item_amount, 2) then
                raise exception 'amount_invalid' using errcode = '22023';
            end if;

            if not exists (
                select 1 from public.category c
                where c.id = v_item_category_id
                  and c.ledger_id = p_ledger_id
                  and c.is_archived = false
                  and c.parent_id is not null
                  and c.type in ('expense', 'income')
            ) then
                raise exception 'category_invalid' using errcode = '22023';
            end if;
        end loop;
    end if;

    v_all_account_ids := array(
        select distinct account_id
        from unnest(v_old_account_ids || v_new_account_ids) as account_id
        where account_id is not null
        order by account_id
    );

    for v_locked_account in
        select *
        from public.account a
        where a.id = any(v_all_account_ids)
          and a.ledger_id = p_ledger_id
        order by a.id
        for no key update
    loop
        v_locked_account_count := v_locked_account_count + 1;

        if v_locked_account.id = p_from_account_id then
            v_from_account := v_locked_account;
        end if;
        if v_locked_account.id = p_to_account_id then
            v_to_account := v_locked_account;
        end if;
    end loop;

    if v_locked_account_count <> coalesce(array_length(v_all_account_ids, 1), 0) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if v_target_record_type = 'transfer' then
        if v_from_account.id is null or v_from_account.is_archived then
            raise exception 'from_account_invalid' using errcode = '22023';
        end if;

        if v_to_account.id is null or v_to_account.is_archived then
            raise exception 'to_account_invalid' using errcode = '22023';
        end if;

        if v_from_account.currency <> v_to_account.currency then
            raise exception 'transfer_currency_invalid' using errcode = '22023';
        end if;
    end if;

    -- 记录类型改变之前按账户回滚旧余额（普通记录取付款明细，转账取明细）。
    for v_account_id, v_account_delta in
        select m.account_id, sum(m.balance_delta)
        from public.transaction_account_movement m
        where m.transaction_record_id = p_transaction_record_id
          and m.ledger_id = p_ledger_id
        group by m.account_id
        order by m.account_id
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_account_id,
            -v_account_delta,
            v_user_id
        );
    end loop;

    delete from public.transaction_payment p
    where p.transaction_record_id = p_transaction_record_id
      and p.ledger_id = p_ledger_id;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;


    if v_target_record_type = 'transfer' then
        update public.transaction_record tr
        set
            type = 'transfer',
            merchant_id = null,
            transaction_at = p_transaction_at,
            note = p_note,
            updated_by = v_user_id,
            updated_at = now()
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id;

        insert into public.transaction_item (
            ledger_id,
            transaction_record_id,
            account_id,
            category_id,
            amount,
            discount_amount,
            balance_delta,
            note,
            sort_order,
            created_by,
            updated_by
        ) values
        (
            p_ledger_id,
            p_transaction_record_id,
            p_from_account_id,
            null,
            p_transfer_amount,
            0,
            -p_transfer_amount,
            null,
            0,
            v_user_id,
            v_user_id
        ),
        (
            p_ledger_id,
            p_transaction_record_id,
            p_to_account_id,
            null,
            p_transfer_amount,
            0,
            p_transfer_amount,
            null,
            1,
            v_user_id,
            v_user_id
        );

        perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -p_transfer_amount, v_user_id);
        perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, p_transfer_amount, v_user_id);
    else
        update public.transaction_record tr
        set
            type = 'normal',
            merchant_id = p_merchant_id,
            transaction_at = p_transaction_at,
            note = p_note,
            updated_by = v_user_id,
            updated_at = now()
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id;

        v_sort_order := 0;
        for v_new_item in select * from jsonb_array_elements(p_items)
        loop
            v_item_amount := (v_new_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_new_item ->> 'categoryId')::uuid;

            select c.type
            into v_item_category_type
            from public.category c
            where c.id = v_item_category_id
              and c.ledger_id = p_ledger_id
              and c.is_archived = false
              and c.parent_id is not null
              and c.type in ('expense', 'income');

            if v_item_category_type is null then
                raise exception 'category_invalid' using errcode = '22023';
            end if;

            insert into public.transaction_item (
                ledger_id,
                transaction_record_id,
                account_id,
                category_id,
                amount,
                discount_amount,
                balance_delta,
                note,
                sort_order,
                created_by,
                updated_by
            ) values (
                p_ledger_id,
                p_transaction_record_id,
                v_new_account_ids[1],
                v_item_category_id,
                v_item_amount,
                0,
                null,
                null,
                v_sort_order,
                v_user_id,
                v_user_id
            );

            v_sort_order := v_sort_order + 1;
        end loop;

        perform public.replace_transaction_payments(
            p_ledger_id,
            p_transaction_record_id,
            p_payments,
            v_user_id
        );
    end if;

    set constraints public.validate_transaction_record_payments immediate;
    set constraints public.validate_transaction_record_payments deferred;

    return p_transaction_record_id;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."convert_transaction_type"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_target_type" "text", "p_transaction_at" timestamp with time zone, "p_note" "text" DEFAULT NULL::"text", "p_payments" "jsonb" DEFAULT NULL::"jsonb", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_items" "jsonb" DEFAULT NULL::"jsonb", "p_from_account_id" "uuid" DEFAULT NULL::"uuid", "p_to_account_id" "uuid" DEFAULT NULL::"uuid", "p_transfer_amount" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    if auth.uid() is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    return public.convert_transaction_type_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_target_type,
        p_transaction_at,
        p_note,
        p_payments,
        p_merchant_id,
        p_items,
        p_from_account_id,
        p_to_account_id,
        p_transfer_amount
    );
end;
$$;


CREATE OR REPLACE FUNCTION "public"."convert_transaction_type_with_special_status"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_target_type" "text", "p_transaction_at" timestamp with time zone, "p_note" "text" DEFAULT NULL::"text", "p_payments" "jsonb" DEFAULT NULL::"jsonb", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_items" "jsonb" DEFAULT NULL::"jsonb", "p_from_account_id" "uuid" DEFAULT NULL::"uuid", "p_to_account_id" "uuid" DEFAULT NULL::"uuid", "p_transfer_amount" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_transaction_record_id uuid;
begin
    v_transaction_record_id := public.convert_transaction_type(
        p_ledger_id,
        p_transaction_record_id,
        p_target_type,
        p_transaction_at,
        p_note,
        p_payments,
        p_merchant_id,
        p_items,
        p_from_account_id,
        p_to_account_id,
        p_transfer_amount
    );

    if p_target_type <> 'transfer' then
        perform public.update_transaction(
            p_ledger_id,
            p_transaction_record_id,
            p_target_type,
            p_transaction_at,
            p_items,
            p_payments,
            p_merchant_id,
            p_note
        );
    end if;

    return v_transaction_record_id;
end;
$$;


revoke all on function public.convert_transaction_type(uuid, uuid, text, timestamptz, text, jsonb, uuid, jsonb, uuid, uuid, numeric) from public, anon, authenticated, service_role;
grant execute on function public.convert_transaction_type(uuid, uuid, text, timestamptz, text, jsonb, uuid, jsonb, uuid, uuid, numeric) to authenticated;
revoke all on function public.convert_transaction_type_locked_impl(uuid, uuid, text, timestamptz, text, jsonb, uuid, jsonb, uuid, uuid, numeric) from public, anon, authenticated, service_role;
revoke all on function public.convert_transaction_type_with_special_status(uuid, uuid, text, timestamptz, text, jsonb, uuid, jsonb, uuid, uuid, numeric) from public, anon, authenticated, service_role;
grant execute on function public.convert_transaction_type_with_special_status(uuid, uuid, text, timestamptz, text, jsonb, uuid, jsonb, uuid, uuid, numeric) to authenticated;

-- ============================================================
-- 12. 删除：普通记录按付款明细回滚余额
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."void_transaction_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_item public.transaction_item;
    v_item_count integer := 0;
    v_category_null_item_count integer := 0;
    v_positive_item_count integer := 0;
    v_negative_item_count integer := 0;
    v_positive_amount_count integer := 0;
    v_amount_delta_match_count integer := 0;
    v_distinct_amount_count integer := 0;
    v_balance_delta_total numeric(14,2) := 0;
    v_account_id uuid;
    v_account_delta numeric(14,2);
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type in ('normal', 'transfer', 'balance_adjustment')
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    perform 1
    from public.account a
    where a.ledger_id = p_ledger_id
      and a.id in (
          -- 普通记录的账户来自付款明细，转账 / 余额调整来自明细。
          select m.account_id
          from public.transaction_account_movement m
          where m.transaction_record_id = p_transaction_record_id
            and m.ledger_id = p_ledger_id
      )
    order by a.id
    for no key update;

    if v_record.type = 'balance_adjustment' and exists (
        select 1 from public.transaction_item ti join public.account a on a.id=ti.account_id and a.ledger_id=ti.ledger_id
        where ti.ledger_id=p_ledger_id and ti.transaction_record_id=p_transaction_record_id and a.is_archived
    ) then
        raise exception 'balance_adjustment_account_archived' using errcode='22023', detail='balance_adjustment_account_archived';
    end if;

    if v_record.type = 'transfer' then
        perform 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.account_id, ti.id
        for update;

        select
            count(*)::integer,
            count(*) filter (where ti.category_id is null)::integer,
            count(*) filter (where ti.balance_delta > 0)::integer,
            count(*) filter (where ti.balance_delta < 0)::integer,
            count(*) filter (where ti.amount > 0)::integer,
            count(*) filter (where ti.amount = abs(ti.balance_delta))::integer,
            count(distinct ti.amount)::integer,
            coalesce(sum(ti.balance_delta), 0)
        into
            v_item_count,
            v_category_null_item_count,
            v_positive_item_count,
            v_negative_item_count,
            v_positive_amount_count,
            v_amount_delta_match_count,
            v_distinct_amount_count,
            v_balance_delta_total
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id;

        if v_item_count <> 2
            or v_category_null_item_count <> 2
            or v_positive_item_count <> 1
            or v_negative_item_count <> 1
            or v_positive_amount_count <> 2
            or v_amount_delta_match_count <> 2
            or v_distinct_amount_count <> 1
            or v_balance_delta_total <> 0 then
            raise exception 'transfer_items_invalid' using errcode = '22023';
        end if;
    end if;

    v_item_count := 0;

    for v_item in
        select *
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        v_item_count := v_item_count + 1;
    end loop;

    if v_item_count = 0 then
        raise exception 'transaction_item_invalid' using errcode = '22023';
    end if;

    -- 按账户回滚余额；普通记录的付款明细与明细一样保留供追溯。
    -- 余额为 0 的账户也调用一次，保持「含已归档账户的记录不可删除」。
    for v_account_id, v_account_delta in
        select m.account_id, sum(m.balance_delta)
        from public.transaction_account_movement m
        where m.transaction_record_id = p_transaction_record_id
          and m.ledger_id = p_ledger_id
        group by m.account_id
        order by m.account_id
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_account_id,
            -v_account_delta,
            v_user_id
        );
    end loop;

    update public.transaction_record tr
    set
        status = 'deleted',
        deleted_by = v_user_id,
        deleted_at = now(),
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    return p_transaction_record_id;
end;
$$;


-- ============================================================
-- 13. 已关联编辑：明细不再提交账户，付款明细整组替换，增加记录版本校验
-- ============================================================

drop function public.update_linked_transaction_edit(uuid, uuid, timestamptz, uuid, text, jsonb);
drop function public.update_linked_transaction_item(uuid, uuid, uuid, timestamptz, numeric, uuid, uuid);
drop function public.update_linked_transaction_item_locked_impl(uuid, uuid, uuid, timestamptz, numeric, uuid, uuid);

CREATE OR REPLACE FUNCTION "public"."update_linked_transaction_item_locked_impl"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_item_id" "uuid", "p_expected_updated_at" timestamp with time zone, "p_amount" numeric, "p_category_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_item public.transaction_item;
    v_category_type text;
    v_reimbursement_target_id uuid;
    v_refund_target_id uuid;
    v_is_reimbursement_target boolean;
    v_is_refund_target boolean;
    v_is_reimbursement_income boolean;
    v_is_refund_income boolean;
    v_related_item_ids uuid[] := array[]::uuid[];
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
    v_previous_reimbursement_link_flow text :=
        current_setting('kuranote.reimbursement_link_flow', true);
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    if p_expected_updated_at is null then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    if p_amount is null or p_amount < 0 or p_amount <> round(p_amount, 2) then
        raise exception 'amount_invalid'
            using errcode = '22023', detail = 'amount_invalid';
    end if;

    perform 1
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    select link.target_expense_item_id
    into v_reimbursement_target_id
    from public.transaction_item_reimbursement_link link
    where link.ledger_id = p_ledger_id
      and link.reimbursement_income_item_id = p_transaction_item_id;
    v_is_reimbursement_income := found;

    select link.refunded_item_id
    into v_refund_target_id
    from public.transaction_item_refund_link link
    where link.ledger_id = p_ledger_id
      and link.refund_income_item_id = p_transaction_item_id;
    v_is_refund_income := found;

    select exists (
        select 1
        from public.transaction_item_reimbursement_link link
        where link.ledger_id = p_ledger_id
          and link.target_expense_item_id = p_transaction_item_id
    ) into v_is_reimbursement_target;

    select exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = p_ledger_id
          and link.refunded_item_id = p_transaction_item_id
    ) into v_is_refund_target;

    v_related_item_ids := array[p_transaction_item_id]::uuid[];
    if v_reimbursement_target_id is not null then
        v_related_item_ids := array_append(v_related_item_ids, v_reimbursement_target_id);
    end if;
    if v_refund_target_id is not null then
        v_related_item_ids := array_append(v_related_item_ids, v_refund_target_id);
    end if;

    perform 1
    from public.transaction_item item
    where item.ledger_id = p_ledger_id
      and item.id = any(v_related_item_ids)
    order by item.id
    for update;

    select item.*
    into v_item
    from public.transaction_item item
    join public.transaction_record record
      on record.id = item.transaction_record_id
     and record.ledger_id = item.ledger_id
     and record.status = 'active'
    where item.ledger_id = p_ledger_id
      and item.id = p_transaction_item_id
      and item.transaction_record_id = p_transaction_record_id;

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    if v_item.updated_at is distinct from p_expected_updated_at then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    if not (
        v_item.special_status is not null
        or v_is_reimbursement_target
        or v_is_refund_target
        or v_is_reimbursement_income
        or v_is_refund_income
    ) then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    select c.type
    into v_category_type
    from public.category c
    where c.id = p_category_id
      and c.ledger_id = p_ledger_id
      and c.is_archived = false
      and c.parent_id is not null;

    if v_category_type is null then
        raise exception 'category_invalid'
            using errcode = '22023', detail = 'category_invalid';
    end if;

    if (v_item.special_status is not null
        or v_is_reimbursement_target
        or v_is_refund_target)
       and v_category_type is distinct from 'expense' then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    if (v_is_reimbursement_income or v_is_refund_income)
       and v_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    -- 退款 / 报销都只要求同币种（#899），由付款明细的记录级延迟校验保证。
    if (v_is_reimbursement_income or v_is_refund_income) and p_amount <= 0 then
        raise exception 'amount_invalid'
            using errcode = '22023', detail = 'amount_invalid';
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);
    perform set_config('kuranote.reimbursement_link_flow', 'on', true);

    update public.transaction_item item
    set category_id = p_category_id,
        amount = p_amount,
        updated_by = v_user_id,
        updated_at = now()
    where item.ledger_id = p_ledger_id
      and item.id = p_transaction_item_id;

    if v_is_reimbursement_income then
        update public.transaction_item_reimbursement_link link
        set reimbursement_amount = p_amount
        where link.ledger_id = p_ledger_id
          and link.reimbursement_income_item_id = p_transaction_item_id;
    elsif v_is_refund_income then
        update public.transaction_item_refund_link link
        set refund_amount = p_amount
        where link.ledger_id = p_ledger_id
          and link.refund_income_item_id = p_transaction_item_id;
    else
        -- 母项只改 base amount；关联行完全不动，只重算派生状态。
        perform public.recalculate_transaction_item_settlement_status(
            p_ledger_id,
            p_transaction_item_id
        );
    end if;

    perform set_config(
        'kuranote.reimbursement_link_flow',
        coalesce(v_previous_reimbursement_link_flow, 'off'),
        true
    );
    perform set_config(
        'kuranote.income_link_edit_flow',
        coalesce(v_previous_income_link_edit_flow, 'off'),
        true
    );
end;
$$;


CREATE OR REPLACE FUNCTION "public"."update_linked_transaction_item"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_item_id" "uuid", "p_expected_updated_at" timestamp with time zone, "p_amount" numeric, "p_category_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    if auth.uid() is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_mutate_transaction(
        p_ledger_id,
        p_transaction_record_id
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    perform 1
    from public.transaction_record record_row
    where record_row.ledger_id = p_ledger_id
      and record_row.id in (
          select p_transaction_record_id
          union
          select target_item.transaction_record_id
          from public.transaction_item_reimbursement_link reimbursement_link
          join public.transaction_item target_item
            on target_item.id = reimbursement_link.target_expense_item_id
           and target_item.ledger_id = reimbursement_link.ledger_id
          where reimbursement_link.ledger_id = p_ledger_id
            and reimbursement_link.reimbursement_income_item_id =
                p_transaction_item_id
          union
          select reimbursement_income.transaction_record_id
          from public.transaction_item_reimbursement_link reimbursement_link
          join public.transaction_item reimbursement_income
            on reimbursement_income.id =
               reimbursement_link.reimbursement_income_item_id
           and reimbursement_income.ledger_id = reimbursement_link.ledger_id
          where reimbursement_link.ledger_id = p_ledger_id
            and reimbursement_link.target_expense_item_id =
                p_transaction_item_id
          union
          select refunded_item.transaction_record_id
          from public.transaction_item_refund_link refund_link
          join public.transaction_item refunded_item
            on refunded_item.id = refund_link.refunded_item_id
           and refunded_item.ledger_id = refund_link.ledger_id
          where refund_link.ledger_id = p_ledger_id
            and refund_link.refund_income_item_id = p_transaction_item_id
          union
          select refund_income.transaction_record_id
          from public.transaction_item_refund_link refund_link
          join public.transaction_item refund_income
            on refund_income.id = refund_link.refund_income_item_id
           and refund_income.ledger_id = refund_link.ledger_id
          where refund_link.ledger_id = p_ledger_id
            and refund_link.refunded_item_id = p_transaction_item_id
      )
    order by record_row.id
    for update;

    -- 余额与账户锁由记录级的付款明细替换处理（update_linked_transaction_edit）。
    perform public.update_linked_transaction_item_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_transaction_item_id,
        p_expected_updated_at,
        p_amount,
        p_category_id
    );
end;
$$;


CREATE OR REPLACE FUNCTION "public"."update_linked_transaction_edit"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_at" timestamp with time zone, "p_merchant_id" "uuid", "p_note" "text", "p_item_updates" "jsonb", "p_payments" "jsonb", "p_expected_record_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_transaction_item_id uuid;
    v_expected_updated_at timestamptz;
    v_amount numeric;
    v_record_updated_at timestamptz;
    v_category_id uuid;
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_mutate_transaction(
        p_ledger_id,
        p_transaction_record_id
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid'
            using errcode = '22023', detail = 'transaction_at_invalid';
    end if;

    if p_note is not null and char_length(p_note) > 2000 then
        raise exception 'note_too_long'
            using errcode = '22023', detail = 'note_too_long';
    end if;

    if jsonb_typeof(p_item_updates) is distinct from 'array' then
        raise exception 'linked_edit_items_invalid'
            using errcode = '22023', detail = 'linked_edit_items_invalid';
    end if;

    if p_merchant_id is null or (
        not exists (
            select 1
            from public.merchant m
            where m.id = p_merchant_id
              and m.ledger_id = p_ledger_id
              and m.is_archived = false
        )
        and not exists (
            select 1
            from public.transaction_record tr
            where tr.id = p_transaction_record_id
              and tr.ledger_id = p_ledger_id
              and tr.status = 'active'
              and tr.type = 'normal'
              and tr.merchant_id = p_merchant_id
        )
    ) then
        raise exception 'merchant_invalid'
            using errcode = '22023', detail = 'merchant_invalid';
    end if;

    -- 锁顺序：ledger → record（并校验记录版本）→ 明细 / 关联目标 → 账户（付款替换内）。
    perform 1
    from public.ledger ledger_row
    where ledger_row.id = p_ledger_id
    for update;

    select tr.updated_at
    into v_record_updated_at
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    -- 未提交记录版本时（直接调用 RPC）只做明细级版本校验。
    if p_expected_record_updated_at is not null
       and v_record_updated_at is distinct from p_expected_record_updated_at then
        raise exception 'transaction_item_version_conflict'
            using errcode = 'P0001', detail = 'transaction_item_version_conflict';
    end if;

    for v_item in
        select value
        from pg_catalog.jsonb_array_elements(p_item_updates)
        order by value ->> 'transactionItemId'
    loop
        if jsonb_typeof(v_item) is distinct from 'object' then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        begin
            v_transaction_item_id :=
                nullif(v_item ->> 'transactionItemId', '')::uuid;
            v_expected_updated_at :=
                nullif(v_item ->> 'expectedUpdatedAt', '')::timestamptz;
            v_amount := nullif(v_item ->> 'amount', '')::numeric;
            v_category_id := nullif(v_item ->> 'categoryId', '')::uuid;
        exception
            when invalid_text_representation
                or invalid_datetime_format
                or datetime_field_overflow
                or numeric_value_out_of_range
            then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
        end;

        if v_transaction_item_id is null
           or v_expected_updated_at is null
           or v_amount is null
           or v_category_id is null then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        perform public.update_linked_transaction_item(
            p_ledger_id,
            p_transaction_record_id,
            v_transaction_item_id,
            v_expected_updated_at,
            v_amount,
            v_category_id
        );
    end loop;

    -- 明细金额变化会改变 Σ明细，付款明细必须在同一事务内整组替换。
    perform public.replace_transaction_payments(
        p_ledger_id,
        p_transaction_record_id,
        p_payments,
        v_user_id
    );

    update public.transaction_record tr
    set
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal';

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    set constraints public.validate_transaction_record_payments immediate;
    set constraints public.validate_transaction_record_payments deferred;
end;
$$;


revoke all on function public.update_linked_transaction_edit(uuid, uuid, timestamptz, uuid, text, jsonb, jsonb, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.update_linked_transaction_edit(uuid, uuid, timestamptz, uuid, text, jsonb, jsonb, timestamptz) to authenticated;
revoke all on function public.update_linked_transaction_item(uuid, uuid, uuid, timestamptz, numeric, uuid) from public, anon, authenticated, service_role;
grant execute on function public.update_linked_transaction_item(uuid, uuid, uuid, timestamptz, numeric, uuid) to authenticated;
revoke all on function public.update_linked_transaction_item_locked_impl(uuid, uuid, uuid, timestamptz, numeric, uuid) from public, anon, authenticated, service_role;

-- ============================================================
-- 14. 退款 / 报销币种改为看记录币种（付款账户）
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."apply_transaction_item_links"("p_ledger_id" "uuid", "p_income_item_id" "uuid", "p_item" "jsonb", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_income_amount numeric(14,2);
    v_income_category_type text;
    v_income_currency text;
    v_reimbursement_target_id uuid;
    v_reimbursement_target_type text;
    v_reimbursement_target_currency text;
    v_reimbursement_target_status public.transaction_item_special_status;
    v_reimbursement_amount numeric(14,2);
    v_refund_target_id uuid;
    v_refund_target_type text;
    v_refund_target_currency text;
    v_refund_amount numeric(14,2);
    v_special_status_enabled boolean;
begin
    begin
        v_refund_target_id := nullif(p_item ->> 'refundedItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
    end;

    begin
        v_reimbursement_target_id :=
            nullif(p_item ->> 'reimbursementItemId', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'reimbursement_item_invalid'
                using errcode = '22023', detail = 'reimbursement_item_invalid';
    end;

    if v_reimbursement_target_id is null and v_refund_target_id is null then
        return;
    end if;

    select l.transaction_item_special_status_enabled
    into v_special_status_enabled
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    if v_special_status_enabled is distinct from true then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    select ti.amount, c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
    into v_income_amount, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_reimbursement_target_id is not null and v_refund_target_id is not null then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_reimbursement_target_id is not null then
        select ti.special_status, c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
        into
            v_reimbursement_target_status,
            v_reimbursement_target_type,
            v_reimbursement_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.ledger_id = p_ledger_id
          and ti.id = v_reimbursement_target_id
        for update of ti, tr;

        if not found
           or v_reimbursement_target_type is distinct from 'expense'
           or v_reimbursement_target_status is null
           or v_reimbursement_target_status not in (
               'pending_reimbursement',
               'reimbursed',
               'reimbursement_surplus'
           ) then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if v_reimbursement_target_currency is distinct from v_income_currency then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        if exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = p_ledger_id
              and link.refund_income_item_id = p_income_item_id
        ) then
            raise exception 'income_link_conflict'
                using errcode = '22023', detail = 'income_link_conflict';
        end if;

        v_reimbursement_amount := v_income_amount;

        if v_reimbursement_amount > 0 then
            insert into public.transaction_item_reimbursement_link (
                ledger_id,
                target_expense_item_id,
                reimbursement_income_item_id,
                reimbursement_amount,
                created_by
            ) values (
                p_ledger_id,
                v_reimbursement_target_id,
                p_income_item_id,
                v_reimbursement_amount,
                p_user_id
            );

            perform set_config('kuranote.reimbursement_link_flow', 'on', true);

            update public.transaction_item target_item
            set special_status = case
                    when public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        v_reimbursement_target_id
                    ) > 0
                    then 'pending_reimbursement'::public.transaction_item_special_status
                    when public.calculate_transaction_item_remaining_offset_amount(
                        p_ledger_id,
                        v_reimbursement_target_id
                    ) = 0
                    then 'reimbursed'::public.transaction_item_special_status
                    else 'reimbursement_surplus'::public.transaction_item_special_status
                end,
                updated_by = p_user_id,
                updated_at = now()
            where target_item.ledger_id = p_ledger_id
              and target_item.id = v_reimbursement_target_id;

            perform set_config('kuranote.reimbursement_link_flow', 'off', true);
        end if;
    end if;

    if v_refund_target_id is not null then
        if v_income_amount <= 0 then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id)
        into v_refund_target_type, v_refund_target_currency
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.ledger_id = p_ledger_id
          and ti.id = v_refund_target_id
        for update of ti, tr;

        if not found or v_refund_target_type is distinct from 'expense' then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if v_refund_target_currency is distinct from v_income_currency then
            raise exception 'refund_currency_mismatch'
                using errcode = '22023', detail = 'refund_currency_mismatch';
        end if;

        if exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = p_ledger_id
              and link.reimbursement_income_item_id = p_income_item_id
        ) then
            raise exception 'income_link_conflict'
                using errcode = '22023', detail = 'income_link_conflict';
        end if;

        v_refund_amount := v_income_amount;

        insert into public.transaction_item_refund_link (
            ledger_id,
            refunded_item_id,
            refund_income_item_id,
            refund_amount,
            created_by
        ) values (
            p_ledger_id,
            v_refund_target_id,
            p_income_item_id,
            v_refund_amount,
            p_user_id
        );
    end if;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."validate_transaction_item_reimbursement_link"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_target_category_type text;
    v_target_currency text;
    v_target_record_status text;
    v_target_special_status public.transaction_item_special_status;
    v_income_category_type text;
    v_income_currency text;
    v_income_record_status text;
begin
    select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id), tr.status, ti.special_status
    into
        v_target_category_type,
        v_target_currency,
        v_target_record_status,
        v_target_special_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = new.target_expense_item_id
      and ti.ledger_id = new.ledger_id;

    select c.type, public.transaction_record_currency(ti.ledger_id, ti.transaction_record_id), tr.status
    into v_income_category_type, v_income_currency, v_income_record_status
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.id = new.reimbursement_income_item_id
      and ti.ledger_id = new.ledger_id;

    if v_target_category_type is distinct from 'expense'
       or v_income_category_type is distinct from 'income'
       or v_target_record_status is distinct from 'active'
       or v_income_record_status is distinct from 'active'
       or v_target_special_status is null
       or v_target_special_status not in (
           'pending_reimbursement',
           'reimbursed',
           'reimbursement_surplus'
       ) then
        raise exception 'reimbursement_item_invalid'
            using errcode = '22023', detail = 'reimbursement_item_invalid';
    end if;

    if v_target_currency is distinct from v_income_currency then
        raise exception 'reimbursement_currency_mismatch'
            using errcode = '22023', detail = 'reimbursement_currency_mismatch';
    end if;

    if exists (
        select 1
        from public.transaction_item_refund_link link
        where link.ledger_id = new.ledger_id
          and link.refund_income_item_id = new.reimbursement_income_item_id
    ) then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    return new;
end;
$$;


-- 普通记录明细不再有独立账户：去掉账户分支，币种一致性由付款明细的延迟校验负责。
CREATE OR REPLACE FUNCTION "public"."validate_linked_transaction_item_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_is_reimbursement_target boolean;
    v_is_reimbursement_income boolean;
    v_is_refund_target boolean;
    v_is_refund_income boolean;
    v_new_category_type text;
    v_controlled_link_edit boolean :=
        coalesce(current_setting('kuranote.income_link_edit_flow', true) = 'on', false)
        or coalesce(
            current_setting('kuranote.reimbursement_link_flow', true) = 'on',
            false
        );
begin
    select
        exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = old.ledger_id
              and link.target_expense_item_id = old.id
        ),
        exists (
            select 1
            from public.transaction_item_reimbursement_link link
            where link.ledger_id = old.ledger_id
              and link.reimbursement_income_item_id = old.id
        ),
        exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = old.ledger_id
              and link.refunded_item_id = old.id
        ),
        exists (
            select 1
            from public.transaction_item_refund_link link
            where link.ledger_id = old.ledger_id
              and link.refund_income_item_id = old.id
        )
    into
        v_is_reimbursement_target,
        v_is_reimbursement_income,
        v_is_refund_target,
        v_is_refund_income;

    if tg_op = 'DELETE' then
        if v_is_reimbursement_target
           or v_is_reimbursement_income
           or v_is_refund_target
           or v_is_refund_income then
            raise exception 'linked_transaction_edit_forbidden'
                using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
        end if;
        return old;
    end if;

    if new.amount is not distinct from old.amount
       and new.category_id is not distinct from old.category_id then
        return new;
    end if;

    if not (
        old.special_status is not null
        or v_is_reimbursement_target
        or v_is_reimbursement_income
        or v_is_refund_target
        or v_is_refund_income
    ) then
        return new;
    end if;

    -- 只有仍存在关联的明细需要受控解锁；仅保留待报销标记但已无关联的母项
    -- 继续允许普通金额编辑，special_status 本身仍由专用状态触发器保护。
    if (v_is_reimbursement_target
        or v_is_reimbursement_income
        or v_is_refund_target
        or v_is_refund_income)
       and not v_controlled_link_edit then
        raise exception 'linked_transaction_edit_forbidden'
            using errcode = 'P0001', detail = 'linked_transaction_edit_forbidden';
    end if;

    if new.category_id is distinct from old.category_id then
        select c.type
        into v_new_category_type
        from public.category c
        where c.id = new.category_id
          and c.ledger_id = new.ledger_id
          and c.is_archived = false
          and c.parent_id is not null;

        if v_new_category_type is null then
            raise exception 'category_invalid'
                using errcode = '22023', detail = 'category_invalid';
        end if;

        if (old.special_status is not null
            or v_is_reimbursement_target
            or v_is_refund_target)
           and v_new_category_type is distinct from 'expense' then
            raise exception 'special_status_invalid'
                using errcode = '22023', detail = 'special_status_invalid';
        end if;

        if (v_is_reimbursement_income or v_is_refund_income)
           and v_new_category_type is distinct from 'income' then
            raise exception 'income_link_category_invalid'
                using errcode = '22023', detail = 'income_link_category_invalid';
        end if;
    end if;

    return new;
end;
$$;


drop trigger transaction_item_freeze_linked_mutation on public.transaction_item;
create trigger transaction_item_freeze_linked_mutation
    before update of amount, category_id on public.transaction_item
    for each row execute function public.validate_linked_transaction_item_mutation();

-- ============================================================
-- 15. 删除账本：先删付款明细
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."delete_ledger"("p_ledger_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '42501', detail = 'auth_required';
    end if;
    select * into v_ledger from public.ledger where id = p_ledger_id for update;
    -- 非 active 成员与不存在同样处理，不暴露账本是否存在。
    if not found
       or not public.current_user_has_ledger_role(p_ledger_id, array['owner', 'admin', 'member', 'viewer']::text[]) then
        raise exception 'ledger_invalid' using errcode = 'P0002', detail = 'ledger_invalid';
    end if;
    if v_ledger.owner_user_id <> v_user_id
       or not public.current_user_has_ledger_role(p_ledger_id, array['owner']::text[]) then
        raise exception 'ledger_delete_forbidden' using errcode = '42501', detail = 'ledger_delete_forbidden';
    end if;
    if v_ledger.setup_status <> 'completed' then
        raise exception 'ledger_delete_not_completed' using errcode = '55000', detail = 'ledger_delete_not_completed';
    end if;

    insert into public.ledger_deletion_context values (pg_current_xact_id(), p_ledger_id, v_user_id);
    update public.app_user u set current_ledger_id = (
        select lm.ledger_id from public.ledger_member lm
        join public.ledger l on l.id = lm.ledger_id
        where lm.user_id = u.id and lm.status = 'active'
          and l.id <> p_ledger_id and not l.is_archived and l.setup_status = 'completed'
        order by lm.joined_at desc nulls last, lm.created_at desc, lm.ledger_id asc
        limit 1
    ) where u.current_ledger_id = p_ledger_id;

    -- 先删除关联，避免冻结校验；关联状态重算在本次 DELETE 内精确跳过。
    delete from public.transaction_item_refund_link where ledger_id = p_ledger_id;
    delete from public.transaction_item_reimbursement_link where ledger_id = p_ledger_id;
    delete from public.transaction_payment where ledger_id = p_ledger_id;
    delete from public.transaction_item where ledger_id = p_ledger_id;
    delete from public.transaction_record where ledger_id = p_ledger_id;
    delete from public.budget where ledger_id = p_ledger_id;
    delete from public.account_holder where ledger_id = p_ledger_id;
    delete from public.account_name_scope where account_id in (select id from public.account where ledger_id = p_ledger_id);
    delete from public.account where ledger_id = p_ledger_id;
    delete from public.merchant_alias where merchant_id in (select id from public.merchant where ledger_id = p_ledger_id);
    delete from public.merchant_tag_links where merchant_id in (select id from public.merchant where ledger_id = p_ledger_id)
       or tag_id in (select id from public.merchant_tags where ledger_id = p_ledger_id);
    delete from public.merchant where ledger_id = p_ledger_id;
    delete from public.merchant_tags where ledger_id = p_ledger_id;
    delete from public.category where ledger_id = p_ledger_id and parent_id is not null;
    delete from public.category where ledger_id = p_ledger_id;
    delete from public.ledger_invite where ledger_id = p_ledger_id;
    delete from public.ledger_placeholder_member where ledger_id = p_ledger_id;
    delete from public.ledger_member_display_setting where ledger_id = p_ledger_id;
    delete from public.ledger_member where ledger_id = p_ledger_id;
    delete from public.ledger where id = p_ledger_id;
    delete from public.ledger_deletion_context where transaction_id = pg_current_xact_id();
end;
$$;

