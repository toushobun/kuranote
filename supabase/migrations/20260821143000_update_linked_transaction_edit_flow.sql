-- #574 PR2：把同一笔已关联交易的明细原子编辑与交易头字段更新收敛到一个事务。
-- 明细修改继续复用 PR1 的 update_linked_transaction_item，不在这里复制锁顺序、余额与状态重算逻辑。

create or replace function public.update_linked_transaction_edit(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_at timestamptz,
    p_merchant_id uuid,
    p_note text,
    p_item_updates jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_transaction_item_id uuid;
    v_expected_updated_at timestamptz;
    v_amount numeric;
    v_account_id uuid;
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

    -- 已归档但仍是当前交易原商家的记录允许保留；主动切换时仍只允许账本内有效商家。
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

    -- 固定顺序调用 PR1 原子操作；任一项冲突或校验失败都会回滚本 RPC 内此前的修改。
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
            v_account_id := nullif(v_item ->> 'accountId', '')::uuid;
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
           or v_account_id is null
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
            v_account_id,
            v_category_id
        );
    end loop;

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
end;
$$;

revoke all on function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb
) from public, anon;

grant execute on function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb
) to authenticated;
