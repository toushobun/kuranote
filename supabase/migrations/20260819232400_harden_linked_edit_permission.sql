-- Issue #574 PR1 自查：关联副作用允许跨成员更新派生字段，但用户主动调用
-- update_linked_transaction_item 仍必须遵守“member 只能修改自己交易”的权限模型。
-- 把已有原子实现藏到内部函数后，通过公开包装器在进入任何受控 GUC 前重复校验
-- transaction_record 的修改权限，避免用原值调用 RPC 仅刷新他人 updated_at。

alter function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) rename to update_linked_transaction_item_locked_impl;

revoke all on function public.update_linked_transaction_item_locked_impl(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) from public, anon, authenticated;

create function public.update_linked_transaction_item(
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
security definer
set search_path = pg_catalog, pg_temp
as $$
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

    perform public.update_linked_transaction_item_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_transaction_item_id,
        p_expected_updated_at,
        p_amount,
        p_account_id,
        p_category_id
    );
end;
$$;

revoke all on function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) from public, anon;
grant execute on function public.update_linked_transaction_item(
    uuid, uuid, uuid, timestamptz, numeric, uuid, uuid
) to authenticated;
