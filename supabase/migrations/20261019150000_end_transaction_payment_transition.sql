-- #914（#834 子 Issue 4 PR 2）：结束付款明细过渡期，在数据库层开放多账户记录。
-- 设计依据：docs/design/issue-834-split-payment.md 3.3。
-- 普通记录的账户只来自 transaction_payment：明细 account_id 置 NULL 并按记录类型约束，
-- 删除镜像校验与单行限制，transaction_item 的 RLS policy 不再要求普通记录明细指向账户。

-- ============================================================
-- 1. transaction_item.account_id 改为可空（普通记录写 NULL）
-- ============================================================

alter table public.transaction_item
    alter column account_id drop not null;

-- ============================================================
-- 2. 记录级不变量：删除镜像校验与单行限制
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."validate_transaction_record_payments"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_record_ids uuid[];
    v_record_id uuid;
    v_record public.transaction_record;
    v_currency text;
    v_payment_count integer;
    v_payment_delta_total numeric;
    v_payment_currency_count integer;
    v_payments_all_outflow boolean;
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
            coalesce(bool_and(p.balance_delta = -p.amount), true)
        into
            v_payment_count,
            v_payment_delta_total,
            v_payment_currency_count,
            v_payments_all_outflow
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
    end loop;

    return null;
end;
$$;

-- 明细 account_id 不再参与记录级不变量。
drop trigger validate_transaction_record_payments on public.transaction_item;
create constraint trigger validate_transaction_record_payments
    after insert or delete or update of amount, category_id, transaction_record_id
    on public.transaction_item
    deferrable initially deferred
    for each row execute function public.validate_transaction_record_payments();

-- ============================================================
-- 3. 本地库回填（生产环境没有数据，为空操作；可重复执行）
-- ============================================================

update public.transaction_item ti
set account_id = null
from public.transaction_record tr
where tr.id = ti.transaction_record_id
  and tr.ledger_id = ti.ledger_id
  and tr.type = 'normal'
  and ti.account_id is not null;

-- ============================================================
-- 4. 明细形态：account_id 按记录类型校验
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

    -- 普通记录的账户来自付款明细，明细不再保存 account_id；转账 / 余额调整的账户仍在明细上。
    if (v_record_type = 'normal') = (new.account_id is not null) then
        raise exception 'transaction_item_account_invalid' using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger transaction_item_validate_category_shape on public.transaction_item;
create trigger transaction_item_validate_category_shape
    before insert or update of ledger_id, transaction_record_id, account_id, category_id, balance_delta
    on public.transaction_item
    for each row execute function public.validate_transaction_item_category_shape();

-- ============================================================
-- 5. 付款明细整组替换：不再同步明细账户镜像
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."replace_transaction_payments"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_payments" "jsonb", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
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

-- ============================================================
-- 6. 创建 / 编辑 / 类型转换：普通记录明细不再写 account_id
-- ============================================================

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

    -- 写明细前先校验付款账户（属于本账本且未归档），保持原有的报错顺序。
    perform public.transaction_payment_account_ids(p_ledger_id, p_payments);

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
            ledger_id, transaction_record_id, category_id, amount,
            discount_amount, balance_delta, note, sort_order, special_status,
            created_by, updated_by
        ) values (
            p_ledger_id, v_transaction_record_id, v_item_category_id, v_item_amount, 0, null, null,
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

    -- 写明细前先校验付款账户（属于本账本且未归档），保持原有的报错顺序。
    perform public.transaction_payment_account_ids(p_ledger_id, p_payments);

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
            set category_id = v_item_category_id,
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

-- ============================================================
-- 7. RLS：普通记录明细没有账户，账户校验只适用于转账 / 余额调整明细
-- ============================================================

drop policy transaction_item_insert_authorized on public.transaction_item;
create policy transaction_item_insert_authorized
on public.transaction_item
for insert
to authenticated
with check (
    public.current_user_can_mutate_transaction(
        transaction_item.ledger_id,
        transaction_item.transaction_record_id
    )
    and (
        transaction_item.account_id is null
        or exists (
            select 1
            from public.account a
            where a.id = transaction_item.account_id
              and a.ledger_id = transaction_item.ledger_id
              and a.is_archived = false
        )
    )
    and (
        transaction_item.category_id is null
        or exists (
            select 1
            from public.category c
            where c.id = transaction_item.category_id
              and c.ledger_id = transaction_item.ledger_id
              and c.is_archived = false
        )
    )
);

drop policy transaction_item_update_authorized on public.transaction_item;
create policy transaction_item_update_authorized
on public.transaction_item
for update
to authenticated
using (
    public.current_user_can_mutate_transaction(
        transaction_item.ledger_id,
        transaction_item.transaction_record_id
    )
)
with check (
    public.current_user_can_mutate_transaction(
        transaction_item.ledger_id,
        transaction_item.transaction_record_id
    )
    and (
        transaction_item.account_id is null
        or exists (
            select 1
            from public.account a
            where a.id = transaction_item.account_id
              and a.ledger_id = transaction_item.ledger_id
              and a.is_archived = false
        )
    )
    and (
        transaction_item.category_id is null
        or exists (
            select 1
            from public.category c
            where c.id = transaction_item.category_id
              and c.ledger_id = transaction_item.ledger_id
              and c.is_archived = false
        )
    )
);
