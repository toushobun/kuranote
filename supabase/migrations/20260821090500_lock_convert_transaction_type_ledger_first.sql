-- Issue #574 PR1 review：类型转换复合 RPC 会先调用 convert_transaction_type，
-- 再在转换为普通交易时调用 update_transaction。后者在关联/特殊状态场景会先锁 ledger，
-- 因此旧调用链可能形成 transaction_record/account -> ledger 的反向锁顺序。
--
-- 将既有转换实现收敛为内部函数，公开入口统一先锁 ledger，再进入 record/account 更新。
-- convert_transaction_type_with_special_status 继续调用公开入口，因此应用调用链与直接 RPC
-- 都遵守同一 ledger -> transaction_record -> account 顺序。

alter function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) rename to convert_transaction_type_locked_impl;

revoke all on function public.convert_transaction_type_locked_impl(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from public, anon, authenticated;

create or replace function public.convert_transaction_type(
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
        p_account_id,
        p_merchant_id,
        p_items,
        p_from_account_id,
        p_to_account_id,
        p_transfer_amount
    );
end;
$$;

revoke all on function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from public, anon;
grant execute on function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) to authenticated;
