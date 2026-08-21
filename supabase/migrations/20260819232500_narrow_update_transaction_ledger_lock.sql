-- Issue #574 PR1 第四轮自查：统一关联锁顺序不应把所有普通交易更新都串行化。
--
-- 现有 update_transaction 只有 p_type = 'income' 时允许清理既有收入侧退款 / 报销关联；
-- 新建关联则由 payload 中的 refundedItemId / reimbursementItemId 明确表达。除此之外，
-- special_status 非 NULL 的支出在旧 special-status trigger 中也可能取得 ledger 锁，因此
-- 这三类请求都必须在进入旧实现、锁 transaction_record / transaction_item 前先锁 ledger。
-- 其余无特殊状态、无关联意图的 expense / normal 更新保持原有行级并发。
--
-- 这里不使用“先查询当前是否存在 link”作为是否加锁的依据：该查询与后续记录锁之间存在
-- TOCTOU 窗口，同一收入交易的并发关联写入可能在预检查后出现，重新形成 record -> ledger
-- 与 ledger -> record 的循环等待。p_type / payload 都是本次 RPC 的不可变输入，没有该竞态。

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

    -- malformed p_items 仍交给旧实现返回既有 items_invalid；这里只在数组输入上识别
    -- 本次是否明确进入关联 / 特殊状态路径，避免 wrapper 改变历史错误语义。
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
