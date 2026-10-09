begin;

-- 事务内标记仅绑定当前 owner 的未归档创建中账本。
create or replace function public.ledger_setup_abandonment_allows_delete(p_ledger_id uuid)
returns boolean
language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select p_ledger_id::text = nullif(current_setting('app.ledger_setup_abandonment_ledger_id', true), '')
       and exists (select 1 from public.ledger l where l.id = p_ledger_id
           and l.owner_user_id = auth.uid() and l.setup_status = 'in_progress' and not l.is_archived);
$$;
revoke all on function public.ledger_setup_abandonment_allows_delete(uuid) from public, anon, authenticated, service_role;


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

-- 放弃创建与完成写入使用同一个 ledger 行锁，后到者重新检查状态。
create or replace function public.abandon_ledger_setup(p_ledger_id uuid)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_ledger public.ledger;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);
    if exists (select 1 from public.ledger_member where ledger_id = p_ledger_id and user_id <> v_ledger.owner_user_id)
       or exists (select 1 from public.ledger_placeholder_member where ledger_id = p_ledger_id)
       or exists (select 1 from public.ledger_invite where ledger_id = p_ledger_id) then
        raise exception 'ledger_setup_has_members' using errcode = '55000', detail = 'ledger_setup_has_members';
    end if;
    if exists (select 1 from public.transaction_record where ledger_id = p_ledger_id)
       or exists (select 1 from public.transaction_item where ledger_id = p_ledger_id)
       or exists (select 1 from public.transaction_item_refund_link where ledger_id = p_ledger_id)
       or exists (select 1 from public.transaction_item_reimbursement_link where ledger_id = p_ledger_id) then
        raise exception 'ledger_setup_has_transactions' using errcode = '55000', detail = 'ledger_setup_has_transactions';
    end if;
    perform set_config('app.ledger_setup_abandonment_ledger_id', p_ledger_id::text, true);
    -- 草稿随 ledger 本体删除；只清理创建阶段实际写入的成员设置与 owner 成员。
    delete from public.ledger_member_display_setting where ledger_id = p_ledger_id;
    delete from public.ledger_member where ledger_id = p_ledger_id;
    delete from public.ledger where id = p_ledger_id;
    perform set_config('app.ledger_setup_abandonment_ledger_id', '', true);
end;
$$;
revoke all on function public.abandon_ledger_setup(uuid) from public, anon, authenticated, service_role;
grant execute on function public.abandon_ledger_setup(uuid) to authenticated;

commit;
