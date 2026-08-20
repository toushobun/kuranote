-- Issue #574 PR1 第四轮自查：create_transaction 的多明细路径也必须遵守统一锁顺序。
--
-- 旧实现逐条处理 item：某个前置普通 item 可能先通过 apply_account_balance_delta 锁账户，
-- 后续关联 item 才进入 apply_transaction_item_links 锁 ledger。与此同时关联编辑 RPC 使用
-- ledger -> item/account 顺序，因此“普通 item + 关联 item”的同一新建事务存在
-- account -> ledger 与 ledger -> account 的反向等待窗口。
--
-- 保留旧实现不重写，只在公开入口预扫描整笔不可变 payload；只要任一 item 会进入退款、
-- 报销或非 NULL special_status 路径，就在创建第一条记录 / 明细和修改账户余额前先锁 ledger。
-- 无关联、无特殊状态的普通新建仍保持原有并发粒度。

alter function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) rename to create_transaction_locked_impl;

revoke all on function public.create_transaction_locked_impl(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public, anon, authenticated;

create function public.create_transaction(
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

    -- malformed p_items 继续交给旧实现返回既有 items_invalid，wrapper 只识别
    -- 会进入 ledger 锁路径的明确 payload，避免改变公开 RPC 的历史错误语义。
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
