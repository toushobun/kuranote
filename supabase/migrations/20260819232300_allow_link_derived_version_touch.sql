-- Issue #574 PR1 自查：关联派生状态 / 版本标记更新不应把“修改关联”误判成“手工编辑他人交易”。
--
-- member 仍然只能手工修改自己创建的交易；这里只复用既有收入关联受控通道，允许
-- transaction_item 在业务字段不变时刷新 updated_at / updated_by，并允许 special_status
-- 仅变为按当前有效核销金额重新计算出的三态结果。这样退款 / 报销关联变化都可以推进
-- 乐观锁版本和派生状态，同时不会给 update_linked_transaction_item 打开修改他人金额、
-- 账户、分类或手工切换待报销标记的权限旁路。

create or replace function public.enforce_transaction_child_permission()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_old_ledger_id uuid;
    v_old_record_id uuid;
    v_new_ledger_id uuid;
    v_new_record_id uuid;
    v_is_link_edit_flow boolean := false;
    v_is_link_derived_touch boolean := false;
    v_remaining_amount numeric;
    v_expected_special_status public.transaction_item_special_status;
    v_special_status_is_derived boolean := false;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_table_name = 'transaction_item' and tg_op = 'UPDATE' then
        v_is_link_edit_flow :=
            current_setting('kuranote.income_link_edit_flow', true)
                is not distinct from 'on'
            or current_setting('kuranote.reimbursement_link_flow', true)
                is not distinct from 'on';

        -- special_status 非 NULL 的目标已经处于报销流程。受控关联写入如果需要改变
        -- 三态，只接受与当前有效核销合计重新计算结果完全一致的值；NULL -> pending
        -- 仍然属于用户主动开启待报销标记，不在这个权限例外内。
        if v_is_link_edit_flow
           and old.special_status is not null
           and new.special_status is not null then
            v_remaining_amount :=
                public.calculate_transaction_item_remaining_offset_amount(
                    new.ledger_id,
                    new.id
                );

            if v_remaining_amount is not null then
                v_expected_special_status := case
                    when v_remaining_amount > 0
                    then 'pending_reimbursement'::public.transaction_item_special_status
                    when v_remaining_amount = 0
                    then 'reimbursed'::public.transaction_item_special_status
                    else 'reimbursement_surplus'::public.transaction_item_special_status
                end;
                v_special_status_is_derived :=
                    new.special_status is not distinct from v_expected_special_status;
            end if;
        end if;

        v_is_link_derived_touch :=
            v_is_link_edit_flow
            and old.id is not distinct from new.id
            and old.ledger_id is not distinct from new.ledger_id
            and old.transaction_record_id is not distinct from new.transaction_record_id
            and old.account_id is not distinct from new.account_id
            and old.category_id is not distinct from new.category_id
            and old.amount is not distinct from new.amount
            and old.discount_amount is not distinct from new.discount_amount
            and old.balance_delta is not distinct from new.balance_delta
            and old.note is not distinct from new.note
            and old.sort_order is not distinct from new.sort_order
            and old.created_by is not distinct from new.created_by
            and old.created_at is not distinct from new.created_at
            and (
                (
                    old.special_status is null
                    and new.special_status is null
                )
                or v_special_status_is_derived
            )
            and (
                new.updated_by is not distinct from old.updated_by
                or new.updated_by is not distinct from auth.uid()
            );

        if v_is_link_derived_touch
           and public.current_user_can_write_ledger(old.ledger_id) then
            return new;
        end if;
    end if;

    if tg_op <> 'INSERT' then
        v_old_ledger_id := old.ledger_id;
        v_old_record_id := old.transaction_record_id;

        if not public.current_user_can_mutate_transaction(
            v_old_ledger_id,
            v_old_record_id
        ) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op <> 'DELETE' then
        v_new_ledger_id := new.ledger_id;
        v_new_record_id := new.transaction_record_id;

        if not public.current_user_can_mutate_transaction(
            v_new_ledger_id,
            v_new_record_id
        ) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_transaction_child_permission()
from public, anon, authenticated;

-- 退款目标 special_status = NULL，或重算后三态恰好不变时，也需要刷新 updated_at，
-- 让关联变化对 #574 的乐观锁可见。所有这类写入，以及三态发生真实变化的重算，
-- 都先进入既有受控通道；上面的权限触发器只接受 NULL 保持 NULL，或与有效核销合计
-- 严格一致的三态结果。
create or replace function public.recalculate_transaction_item_settlement_status(
    p_ledger_id uuid,
    p_target_expense_item_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_current_status public.transaction_item_special_status;
    v_previous_income_link_edit_flow text :=
        current_setting('kuranote.income_link_edit_flow', true);
    v_previous_reimbursement_link_flow text :=
        current_setting('kuranote.reimbursement_link_flow', true);
    v_remaining_amount numeric;
    v_next_status public.transaction_item_special_status;
begin
    perform 1
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    select target_item.special_status
    into v_current_status
    from public.transaction_item target_item
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id
    for update;

    if not found then
        return;
    end if;

    if v_current_status is null then
        perform set_config('kuranote.income_link_edit_flow', 'on', true);
        perform set_config('kuranote.reimbursement_link_flow', 'on', true);

        update public.transaction_item target_item
        set updated_at = now()
        where target_item.ledger_id = p_ledger_id
          and target_item.id = p_target_expense_item_id;

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
        return;
    end if;

    v_remaining_amount := public.calculate_transaction_item_remaining_offset_amount(
        p_ledger_id,
        p_target_expense_item_id
    );
    v_next_status := case
        when v_remaining_amount > 0
        then 'pending_reimbursement'::public.transaction_item_special_status
        when v_remaining_amount = 0
        then 'reimbursed'::public.transaction_item_special_status
        else 'reimbursement_surplus'::public.transaction_item_special_status
    end;

    if v_next_status is not distinct from v_current_status then
        perform set_config('kuranote.income_link_edit_flow', 'on', true);
        perform set_config('kuranote.reimbursement_link_flow', 'on', true);

        update public.transaction_item target_item
        set updated_at = now()
        where target_item.ledger_id = p_ledger_id
          and target_item.id = p_target_expense_item_id;

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
        return;
    end if;

    perform set_config('kuranote.income_link_edit_flow', 'on', true);
    perform set_config('kuranote.reimbursement_link_flow', 'on', true);

    update public.transaction_item target_item
    set special_status = v_next_status,
        updated_at = now()
    where target_item.ledger_id = p_ledger_id
      and target_item.id = p_target_expense_item_id;

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

revoke all on function public.recalculate_transaction_item_settlement_status(
    uuid, uuid
) from public, anon, authenticated;
