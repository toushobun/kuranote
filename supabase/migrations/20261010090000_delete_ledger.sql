begin;

-- GUC 仅用于标记目标；授权凭据由 RPC 写入无客户端权限的事务上下文，防止伪造标记。
create table public.ledger_deletion_context (
    transaction_id xid8 primary key,
    ledger_id uuid not null,
    user_id uuid not null
);
alter table public.ledger_deletion_context enable row level security;
revoke all on table public.ledger_deletion_context from public, anon, authenticated, service_role;

create function public.ledger_deletion_allows_delete(p_ledger_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
    select p_ledger_id::text = nullif(current_setting('app.deleting_ledger_id', true), '')
       and exists (
           select 1 from public.ledger_deletion_context c
           join public.ledger l on l.id = c.ledger_id
           where c.transaction_id = pg_current_xact_id()
             and c.ledger_id = p_ledger_id and c.user_id = auth.uid()
             and l.owner_user_id = auth.uid() and l.setup_status = 'completed'
       );
$$;
revoke all on function public.ledger_deletion_allows_delete(uuid) from public, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION "public"."enforce_ledger_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_row jsonb;
    v_ledger_id uuid;
    v_ledger_field text := coalesce(nullif(tg_argv[0], ''), 'ledger_id');
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_table_name = 'account'
       and tg_op = 'UPDATE'
       and current_setting('app.allow_account_balance_update', true) = 'true' then
        return new;
    end if;

    if tg_table_name = 'ledger'
       and tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_setup_update', true) = 'true' then
        return new;
    end if;

    -- 认领迁移：旧占位引用改为当前用户，且除身份列与更新审计列外不变；
    -- 必须已有该用户接受的同账本绑定邀请、占位尚未标记认领、用户为 active 成员。
    -- 外层单独判断表名，避免其他表的 NEW/OLD 解析 account_holder 专有列。
    if tg_table_name = 'account_holder' and tg_op = 'UPDATE' then
        if old.placeholder_id is not null
           and new.placeholder_id is null
           and new.user_id = auth.uid()
           and new.updated_by = auth.uid()
           and (to_jsonb(new) - array['user_id', 'placeholder_id', 'updated_by', 'updated_at'])
               = (to_jsonb(old) - array['user_id', 'placeholder_id', 'updated_by', 'updated_at'])
           and exists (
               select 1
               from public.ledger_invite li
               where li.ledger_id = old.ledger_id
                 and li.placeholder_id = old.placeholder_id
                 and li.accepted_by = auth.uid()
                 and li.accepted_at is not null
           )
           and exists (
               select 1
               from public.ledger_placeholder_member p
               where p.id = old.placeholder_id
                 and p.ledger_id = old.ledger_id
                 and p.claimed_by is null
           )
           and exists (
               select 1
               from public.ledger_member lm
               join public.app_user au on au.id = lm.user_id
               where lm.ledger_id = old.ledger_id
                 and lm.user_id = auth.uid()
                 and lm.status = 'active'
                 and au.status = 'active'
           ) then
            return new;
        end if;
    end if;

    v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
    v_ledger_id := nullif(v_row ->> v_ledger_field, '')::uuid;

    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(v_ledger_id) then
        return old;
    end if;

    if tg_op = 'INSERT'
       and tg_table_name in ('account', 'account_holder', 'category', 'merchant', 'merchant_tags')
       and public.ledger_setup_completion_allows_insert(v_ledger_id) then
        return new;
    end if;

    -- 仅放弃创建 RPC 在锁定与校验后打开；不改变 RLS 或一般管理权限。
    if tg_table_name = 'ledger' and tg_op = 'DELETE'
       and public.ledger_setup_abandonment_allows_delete(v_ledger_id) then
        return old;
    end if;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."enforce_ledger_member_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    v_ledger_id := case when tg_op = 'INSERT' then new.ledger_id else old.ledger_id end;

    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(v_ledger_id) then
        return old;
    end if;

    if tg_op = 'INSERT'
       and current_setting('app.allow_ledger_owner_bootstrap', true) = 'true'
       and new.user_id = auth.uid()
       and new.role = 'owner'
       and new.status = 'active'
       and new.invited_by = auth.uid()
       and new.invited_at is not null
       and new.joined_at is not null
       and new.removed_by is null
       and new.removed_at is null
       and new.created_by = auth.uid()
       and new.updated_by = auth.uid()
       and exists (
           select 1
           from public.ledger l
           where l.id = new.ledger_id
             and l.owner_user_id = auth.uid()
             and not exists (
                 select 1
                 from public.ledger_member existing_member
                 where existing_member.ledger_id = l.id
             )
       ) then
        return new;
    end if;

    if tg_op = 'INSERT'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and new.user_id = auth.uid()
       and new.status = 'active'
       and new.role in ('admin', 'member', 'viewer')
       and new.invited_by is not null then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and new.status = 'active'
       and new.role in ('admin', 'member', 'viewer')
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null
       and new.created_by = old.created_by
       and new.created_at = old.created_at
       and new.invited_by is not distinct from old.invited_by
       and new.updated_by = auth.uid() then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and old.status = 'invited'
       and new.status = 'active'
       and new.role = old.role
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null then
        return new;
    end if;

    -- 仅放弃创建 RPC 在锁定与校验后打开；不改变 RLS 或一般管理权限。
    if tg_op = 'DELETE' and public.ledger_setup_abandonment_allows_delete(v_ledger_id) then
        return old;
    end if;

    if not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."enforce_merchant_alias_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_merchant_id uuid;
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    v_merchant_id := case when tg_op = 'DELETE' then old.merchant_id else new.merchant_id end;

    select m.ledger_id
      into v_ledger_id
      from public.merchant m
     where m.id = v_merchant_id;

    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(v_ledger_id) then
        return old;
    end if;

    if tg_op = 'INSERT' and public.ledger_setup_completion_allows_insert(v_ledger_id) then
        return new;
    end if;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."enforce_merchant_tag_link_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_merchant_id uuid;
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        return case when tg_op = 'DELETE' then old else new end;
    end if;

    v_merchant_id := case
        when tg_op = 'DELETE' then old.merchant_id
        else new.merchant_id
    end;

    select m.ledger_id into v_ledger_id
    from public.merchant m
    where m.id = v_merchant_id;

    if tg_op = 'DELETE' and public.ledger_deletion_allows_delete(v_ledger_id) then
        return old;
    end if;

    if tg_op = 'INSERT' and public.ledger_setup_completion_allows_insert(v_ledger_id) then
        return new;
    end if;

    if v_ledger_id is null
       or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."enforce_transaction_child_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
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
    -- 仅 delete_ledger（定义者 postgres）内放行；嵌套 if 保证普通客户端不调用无权限的放行函数。
    if tg_op = 'DELETE' then
        if current_user = 'postgres' then
            if public.ledger_deletion_allows_delete(old.ledger_id) then
                return old;
            end if;
        end if;
    end if;
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

CREATE OR REPLACE FUNCTION "public"."enforce_transaction_record_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    -- 仅 delete_ledger（定义者 postgres）内放行；嵌套 if 保证普通客户端不调用无权限的放行函数。
    if tg_op = 'DELETE' then
        if current_user = 'postgres' then
            if public.ledger_deletion_allows_delete(old.ledger_id) then
                return old;
            end if;
        end if;
    end if;
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_op = 'INSERT' then
        if not public.current_user_can_write_ledger(new.ledger_id)
           or new.created_by is distinct from auth.uid() then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
        return new;
    end if;

    if not public.current_user_can_mutate_transaction(old.ledger_id, old.id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' and old.created_by is distinct from new.created_by then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."guard_balance_adjustment_item"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare v_type text;
begin
    -- 仅 delete_ledger（定义者 postgres）内放行；嵌套 if 保证普通客户端不调用无权限的放行函数。
    if tg_op = 'DELETE' then
        if current_user = 'postgres' then
            if public.ledger_deletion_allows_delete(old.ledger_id) then
                return old;
            end if;
        end if;
    end if;
 select type into v_type from public.transaction_record where id=coalesce(new.transaction_record_id,old.transaction_record_id);
 if v_type='balance_adjustment' then
  if tg_op <> 'INSERT' or current_user <> 'postgres' then
   raise exception 'transaction_type_invalid' using errcode='22023',detail='transaction_type_invalid';
  end if;
  if new.category_id is not null or new.special_status is not null or new.balance_delta=0 or new.amount<>abs(new.balance_delta)
     or exists(select 1 from public.transaction_item where transaction_record_id=new.transaction_record_id) then
   raise exception 'items_invalid' using errcode='22023',detail='items_invalid';
  end if;
 end if;
 return coalesce(new,old);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."recalculate_refund_link_target_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    -- 仅 delete_ledger（定义者 postgres）内放行；嵌套 if 保证普通客户端不调用无权限的放行函数。
    if tg_op = 'DELETE' then
        if current_user = 'postgres' then
            if public.ledger_deletion_allows_delete(old.ledger_id) then
                return old;
            end if;
        end if;
    end if;
    if tg_op in ('DELETE', 'UPDATE') then
        perform public.recalculate_transaction_item_settlement_status(
            old.ledger_id,
            old.refunded_item_id
        );
    end if;

    if tg_op in ('INSERT', 'UPDATE')
       and (
           tg_op = 'INSERT'
           or new.ledger_id is distinct from old.ledger_id
           or new.refunded_item_id is distinct from old.refunded_item_id
           or new.refund_amount is distinct from old.refund_amount
           or new.refund_income_item_id is distinct from old.refund_income_item_id
       ) then
        perform public.recalculate_transaction_item_settlement_status(
            new.ledger_id,
            new.refunded_item_id
        );
    end if;

    return coalesce(new, old);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."recalculate_reimbursement_link_target_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    -- 仅 delete_ledger（定义者 postgres）内放行；嵌套 if 保证普通客户端不调用无权限的放行函数。
    if tg_op = 'DELETE' then
        if current_user = 'postgres' then
            if public.ledger_deletion_allows_delete(old.ledger_id) then
                return old;
            end if;
        end if;
    end if;
    if tg_op in ('DELETE', 'UPDATE') then
        perform public.recalculate_transaction_item_settlement_status(
            old.ledger_id,
            old.target_expense_item_id
        );
    end if;

    if tg_op in ('INSERT', 'UPDATE')
       and (
           tg_op = 'INSERT'
           or new.ledger_id is distinct from old.ledger_id
           or new.target_expense_item_id is distinct from old.target_expense_item_id
           or new.reimbursement_amount is distinct from old.reimbursement_amount
           or new.reimbursement_income_item_id is distinct from
              old.reimbursement_income_item_id
       ) then
        perform public.recalculate_transaction_item_settlement_status(
            new.ledger_id,
            new.target_expense_item_id
        );
    end if;

    return coalesce(new, old);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."refresh_account_name_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    -- 仅 delete_ledger（定义者 postgres）内放行；嵌套 if 保证普通客户端不调用无权限的放行函数。
    if tg_op = 'DELETE' then
        if current_user = 'postgres' then
            if public.ledger_deletion_allows_delete(old.ledger_id) then
                return old;
            end if;
        end if;
    end if;
    if tg_table_name = 'account' then
        perform public.sync_account_name_scope(new.id);
    else
        if tg_op <> 'INSERT' then
            perform public.sync_account_name_scope(old.account_id);
        end if;
        if tg_op <> 'DELETE' then
            perform public.sync_account_name_scope(new.account_id);
        end if;
    end if;
    return null;
end;
$$;

-- 先锁账本，再切换所有受影响用户的指针，最后按外键依赖由子到父物理删除。
create function public.delete_ledger(p_ledger_id uuid)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '42501', detail = 'auth_required';
    end if;
    select * into v_ledger from public.ledger where id = p_ledger_id for update;
    if not found then
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
    perform set_config('app.deleting_ledger_id', p_ledger_id::text, true);
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
    perform set_config('app.deleting_ledger_id', '', true);
end;
$$;
revoke all on function public.delete_ledger(uuid) from public, anon, authenticated, service_role;
grant execute on function public.delete_ledger(uuid) to authenticated;

commit;
