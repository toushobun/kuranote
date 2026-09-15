-- Issue #756：产品语义收敛为仅保留系统记录的记账人（transaction_record.created_by）。
-- 历史 migration 保持不可变；通过本 migration 回收 #416 引入的消费者表、触发器、函数与 RPC 参数。

-- 先删除带消费者参数的公开 RPC，避免与恢复后的原签名因默认参数产生调用歧义。
drop function if exists public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text, uuid[]
);
drop function if exists public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text, uuid[]
);
drop function if exists public.create_transfer_transaction(
    uuid, timestamptz, numeric, uuid, uuid, text, uuid[]
);
drop function if exists public.update_transfer_transaction(
    uuid, uuid, timestamptz, numeric, uuid, uuid, text, uuid[]
);
drop function if exists public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric, uuid[]
);
drop function if exists public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb, uuid[]
);

-- 恢复普通交易新增入口：created_by 继续由既有 locked impl 基于 auth.uid() 写入，
-- transaction_record 的权限 trigger 继续禁止客户端伪造或修改记录人。
create or replace function public.create_transaction(
    p_ledger_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid default null,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
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
        p_account_id,
        p_merchant_id,
        p_note
    );
end;
$$;

revoke all on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon;
grant execute on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;

-- 恢复普通交易编辑入口，不再接受任何记账成员参数。
create or replace function public.update_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
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
        p_account_id,
        p_merchant_id,
        p_note
    );
end;
$$;

revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon;
grant execute on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;

-- 恢复类型转换入口；普通交易重建继续复用无消费者参数的 update_transaction。
create or replace function public.convert_transaction_type_with_special_status(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_target_type text,
    p_transaction_at timestamptz,
    p_note text default null,
    p_account_id uuid default null,
    p_merchant_id uuid default null,
    p_items jsonb default null,
    p_from_account_id uuid default null,
    p_to_account_id uuid default null,
    p_transfer_amount numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
begin
    v_transaction_record_id := public.convert_transaction_type(
        p_ledger_id,
        p_transaction_record_id,
        p_target_type,
        p_transaction_at,
        p_note,
        p_account_id,
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
            p_account_id,
            p_merchant_id,
            p_note
        );
    end if;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from public, anon;
grant execute on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) to authenticated;

-- 恢复已关联交易的原子编辑入口；记录人保持既有 transaction_record.created_by。
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

-- 最后回收消费者数据模型。表上的 RLS、policy、索引和表级 trigger 会随表删除。
drop trigger if exists transaction_record_set_default_consumer
on public.transaction_record;
drop function if exists public.set_default_transaction_consumer();
drop function if exists public.replace_transaction_consumers(
    uuid, uuid, uuid[], uuid
);
drop table if exists public.transaction_consumer;
drop function if exists public.validate_transaction_consumer_active_member();
