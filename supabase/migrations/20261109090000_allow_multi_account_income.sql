-- #1044：纯收入与纯支出都可使用多个账户，实际收付方向必须与明细一致。

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
    v_payments_all_inflow boolean;
    v_item_delta_total numeric;
    v_items_all_expense boolean;
    v_items_all_income boolean;
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
            bool_and(p.balance_delta = -p.amount),
            bool_and(p.balance_delta = p.amount)
        into
            v_payment_count,
            v_payment_delta_total,
            v_payment_currency_count,
            v_payments_all_outflow,
            v_payments_all_inflow
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
            coalesce(bool_and(c.type is not distinct from 'expense'), false),
            coalesce(bool_and(c.type is not distinct from 'income'), false)
        into v_item_delta_total, v_items_all_expense, v_items_all_income
        from public.transaction_item ti
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.transaction_record_id = v_record.id
          and ti.ledger_id = v_record.ledger_id;

        if v_payment_count > 1 and not (
            (v_items_all_expense and v_payments_all_outflow)
            or (v_items_all_income and v_payments_all_inflow)
        ) then
            raise exception 'payment_multi_account_not_allowed'
                using errcode = '22023', detail = 'payment_multi_account_not_allowed';
        end if;

        if v_payment_delta_total <> v_item_delta_total then
            raise exception 'payment_total_mismatch'
                using errcode = '22023', detail = 'payment_total_mismatch';
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
    v_item_delta_total numeric;
    v_items_all_income boolean;
    v_new_account_ids uuid[];
    v_new_deltas numeric(14,2)[] := array[]::numeric(14,2)[];
    v_old_account_ids uuid[];
    v_old_deltas numeric(14,2)[];
    v_all_account_ids uuid[];
    v_locked_account_count integer;
    v_multi_account_payment_enabled boolean;
begin
    v_new_account_ids := public.transaction_payment_account_ids(p_ledger_id, p_payments);

    select
        coalesce(sum(case when c.type = 'income' then ti.amount else -ti.amount end), 0),
        coalesce(bool_and(c.type = 'income'), false)
    into v_item_delta_total, v_items_all_income
    from public.transaction_item ti
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

    if array_length(v_new_account_ids, 1) = 1 then
        -- 单账户不提交金额：余额变动 = 收入合计 − 支出合计。
        v_new_deltas := array[v_item_delta_total::numeric(14,2)];
    else
        -- 账本关闭多账户付款时拒绝多行（#931）。与 prevent_disable_multi_account_payment_with_records
        -- 互斥：锁住账本行，避免关闭开关与保存多账户记录并发时两边都通过检查。
        -- 与 validate_transaction_item_special_status 读取开关时的锁等级一致（FOR UPDATE），
        -- 并在下面锁账户之前取得，保持 record → ledger → account 的锁顺序。
        select l.multi_account_payment_enabled
        into v_multi_account_payment_enabled
        from public.ledger l
        where l.id = p_ledger_id
        for update;

        if v_multi_account_payment_enabled is distinct from true then
            raise exception 'payment_multi_account_disabled'
                using errcode = '22023', detail = 'payment_multi_account_disabled';
        end if;

        -- 多账户金额为非负数。纯收入记为流入，混合明细由延迟约束拒绝。
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

            v_new_deltas := array_append(
                v_new_deltas,
                (case when v_items_all_income then v_amount else -v_amount end)::numeric(14,2)
            );
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
