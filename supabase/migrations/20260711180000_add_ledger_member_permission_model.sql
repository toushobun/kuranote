-- Issue #387：账本成员权限模型基础。
-- 既存 owner 继续作为账本唯一所有者，并在权限判断中视为 admin 的超集。
-- admin 可以维护账本、成员、基础数据与全部记账；member 只能新增记账并维护自己创建的记账；viewer 只读。

create or replace function public.current_user_has_ledger_role(
    p_ledger_id uuid,
    p_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = auth.uid()
          and lm.status = 'active'
          and lm.role = any(p_roles)
          and au.status = 'active'
    );
$$;

create or replace function public.current_user_can_write_ledger(
    p_ledger_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select public.current_user_has_ledger_role(
        p_ledger_id,
        array['owner', 'admin', 'member']::text[]
    );
$$;

create or replace function public.current_user_can_manage_ledger(
    p_ledger_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select public.current_user_has_ledger_role(
        p_ledger_id,
        array['owner', 'admin']::text[]
    );
$$;

create or replace function public.current_user_can_mutate_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        join public.transaction_record tr
          on tr.ledger_id = lm.ledger_id
         and tr.id = p_transaction_record_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = auth.uid()
          and lm.status = 'active'
          and au.status = 'active'
          and tr.status = 'active'
          and (
              lm.role in ('owner', 'admin')
              or (lm.role = 'member' and tr.created_by = auth.uid())
          )
    );
$$;

revoke all on function public.current_user_has_ledger_role(uuid, text[]) from public;
revoke all on function public.current_user_can_write_ledger(uuid) from public;
revoke all on function public.current_user_can_manage_ledger(uuid) from public;
revoke all on function public.current_user_can_mutate_transaction(uuid, uuid) from public;

grant execute on function public.current_user_has_ledger_role(uuid, text[]) to authenticated;
grant execute on function public.current_user_can_write_ledger(uuid) to authenticated;
grant execute on function public.current_user_can_manage_ledger(uuid) to authenticated;
grant execute on function public.current_user_can_mutate_transaction(uuid, uuid) to authenticated;

-- 基础数据写操作统一要求 owner/admin。
-- account.current_balance 的受控更新由 apply_account_balance_delta 临时打开 setting，继续允许 member 记账时同步余额。
create or replace function public.enforce_ledger_management_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

    v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
    v_ledger_id := nullif(v_row ->> v_ledger_field, '')::uuid;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_ledger_management_permission() from public;
revoke all on function public.enforce_ledger_management_permission() from anon;
revoke all on function public.enforce_ledger_management_permission() from authenticated;

create or replace function public.enforce_merchant_alias_management_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_merchant_alias_management_permission() from public;
revoke all on function public.enforce_merchant_alias_management_permission() from anon;
revoke all on function public.enforce_merchant_alias_management_permission() from authenticated;

create or replace function public.enforce_ledger_member_management_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

    if not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_ledger_member_management_permission() from public;
revoke all on function public.enforce_ledger_member_management_permission() from anon;
revoke all on function public.enforce_ledger_member_management_permission() from authenticated;

create or replace function public.enforce_transaction_record_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

revoke all on function public.enforce_transaction_record_permission() from public;
revoke all on function public.enforce_transaction_record_permission() from anon;
revoke all on function public.enforce_transaction_record_permission() from authenticated;

create or replace function public.enforce_transaction_child_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_old_ledger_id uuid;
    v_old_record_id uuid;
    v_new_ledger_id uuid;
    v_new_record_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_op <> 'INSERT' then
        v_old_ledger_id := old.ledger_id;
        v_old_record_id := old.transaction_record_id;

        if not public.current_user_can_mutate_transaction(v_old_ledger_id, v_old_record_id) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op <> 'DELETE' then
        v_new_ledger_id := new.ledger_id;
        v_new_record_id := new.transaction_record_id;

        if not public.current_user_can_mutate_transaction(v_new_ledger_id, v_new_record_id) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_transaction_child_permission() from public;
revoke all on function public.enforce_transaction_child_permission() from anon;
revoke all on function public.enforce_transaction_child_permission() from authenticated;

-- SECURITY DEFINER RPC 也会触发下列 trigger，避免绕过 RLS。
drop trigger if exists ledger_require_management_permission on public.ledger;
create trigger ledger_require_management_permission
before update or delete on public.ledger
for each row execute function public.enforce_ledger_management_permission('id');

drop trigger if exists account_require_management_permission on public.account;
create trigger account_require_management_permission
before insert or update or delete on public.account
for each row execute function public.enforce_ledger_management_permission('ledger_id');

drop trigger if exists account_holder_require_management_permission on public.account_holder;
create trigger account_holder_require_management_permission
before insert or update or delete on public.account_holder
for each row execute function public.enforce_ledger_management_permission('ledger_id');

drop trigger if exists category_require_management_permission on public.category;
create trigger category_require_management_permission
before insert or update or delete on public.category
for each row execute function public.enforce_ledger_management_permission('ledger_id');

drop trigger if exists merchant_require_management_permission on public.merchant;
create trigger merchant_require_management_permission
before insert or update or delete on public.merchant
for each row execute function public.enforce_ledger_management_permission('ledger_id');

drop trigger if exists merchant_alias_require_management_permission on public.merchant_alias;
create trigger merchant_alias_require_management_permission
before insert or update or delete on public.merchant_alias
for each row execute function public.enforce_merchant_alias_management_permission();

drop trigger if exists budget_require_management_permission on public.budget;
create trigger budget_require_management_permission
before insert or update or delete on public.budget
for each row execute function public.enforce_ledger_management_permission('ledger_id');

drop trigger if exists transaction_tag_require_management_permission on public.transaction_tag;
create trigger transaction_tag_require_management_permission
before insert or update or delete on public.transaction_tag
for each row execute function public.enforce_ledger_management_permission('ledger_id');

drop trigger if exists ledger_member_require_management_permission on public.ledger_member;
create trigger ledger_member_require_management_permission
before insert or update or delete on public.ledger_member
for each row execute function public.enforce_ledger_member_management_permission();

drop trigger if exists transaction_record_require_write_permission on public.transaction_record;
create trigger transaction_record_require_write_permission
before insert or update or delete on public.transaction_record
for each row execute function public.enforce_transaction_record_permission();

drop trigger if exists transaction_item_require_write_permission on public.transaction_item;
create trigger transaction_item_require_write_permission
before insert or update or delete on public.transaction_item
for each row execute function public.enforce_transaction_child_permission();

drop trigger if exists transaction_record_tag_require_write_permission on public.transaction_record_tag;
create trigger transaction_record_tag_require_write_permission
before insert or update or delete on public.transaction_record_tag
for each row execute function public.enforce_transaction_child_permission();

-- 账本、成员与基础数据写策略。
drop policy if exists ledger_update_active_member on public.ledger;
create policy ledger_update_admin
on public.ledger
for update
to authenticated
using (public.current_user_can_manage_ledger(id))
with check (public.current_user_can_manage_ledger(id));

drop policy if exists ledger_member_insert_invited_member on public.ledger_member;
create policy ledger_member_insert_admin
on public.ledger_member
for insert
to authenticated
with check (
    public.current_user_can_manage_ledger(ledger_id)
    and role in ('admin', 'member', 'viewer')
    and status = 'invited'
    and invited_by = auth.uid()
);

drop policy if exists account_insert_active_member on public.account;
drop policy if exists account_update_active_member on public.account;
create policy account_insert_admin
on public.account
for insert
to authenticated
with check (public.current_user_can_manage_ledger(ledger_id));
create policy account_update_admin
on public.account
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));

drop policy if exists account_holder_insert_active_ledger_member on public.account_holder;
drop policy if exists account_holder_update_active_ledger_member on public.account_holder;
drop policy if exists account_holder_delete_active_ledger_member on public.account_holder;
create policy account_holder_insert_admin
on public.account_holder
for insert
to authenticated
with check (public.current_user_can_manage_ledger(ledger_id));
create policy account_holder_update_admin
on public.account_holder
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));
create policy account_holder_delete_admin
on public.account_holder
for delete
to authenticated
using (public.current_user_can_manage_ledger(ledger_id));

drop policy if exists category_insert_active_member on public.category;
drop policy if exists category_update_active_member on public.category;
create policy category_insert_admin
on public.category
for insert
to authenticated
with check (public.current_user_can_manage_ledger(ledger_id));
create policy category_update_admin
on public.category
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));

drop policy if exists merchant_insert_active_member on public.merchant;
drop policy if exists merchant_update_active_member on public.merchant;
create policy merchant_insert_admin
on public.merchant
for insert
to authenticated
with check (public.current_user_can_manage_ledger(ledger_id));
create policy merchant_update_admin
on public.merchant
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));

drop policy if exists merchant_alias_insert_active_member on public.merchant_alias;
drop policy if exists merchant_alias_update_active_member on public.merchant_alias;
create policy merchant_alias_insert_admin
on public.merchant_alias
for insert
to authenticated
with check (
    exists (
        select 1
        from public.merchant m
        where m.id = merchant_alias.merchant_id
          and m.is_archived = false
          and public.current_user_can_manage_ledger(m.ledger_id)
    )
);
create policy merchant_alias_update_admin
on public.merchant_alias
for update
to authenticated
using (
    exists (
        select 1
        from public.merchant m
        where m.id = merchant_alias.merchant_id
          and public.current_user_can_manage_ledger(m.ledger_id)
    )
)
with check (
    exists (
        select 1
        from public.merchant m
        where m.id = merchant_alias.merchant_id
          and m.is_archived = false
          and public.current_user_can_manage_ledger(m.ledger_id)
    )
);

drop policy if exists budget_insert_active_member on public.budget;
drop policy if exists budget_update_active_member on public.budget;
create policy budget_insert_admin
on public.budget
for insert
to authenticated
with check (public.current_user_can_manage_ledger(ledger_id));
create policy budget_update_admin
on public.budget
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));

drop policy if exists transaction_tag_insert_active_member on public.transaction_tag;
drop policy if exists transaction_tag_update_active_member on public.transaction_tag;
create policy transaction_tag_insert_admin
on public.transaction_tag
for insert
to authenticated
with check (
    public.current_user_can_manage_ledger(ledger_id)
    and is_archived = false
    and archived_at is null
    and archived_by is null
);
create policy transaction_tag_update_admin
on public.transaction_tag
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));

-- 记账写策略：owner/admin 可维护全部，member 仅可维护本人创建的记录，viewer 不可写。
drop policy if exists transaction_record_insert_active_member on public.transaction_record;
drop policy if exists transaction_record_update_active_member on public.transaction_record;
create policy transaction_record_insert_writer
on public.transaction_record
for insert
to authenticated
with check (
    public.current_user_can_write_ledger(transaction_record.ledger_id)
    and transaction_record.status = 'active'
    and transaction_record.created_by = auth.uid()
    and (
        transaction_record.merchant_id is null
        or exists (
            select 1
            from public.merchant m
            where m.id = transaction_record.merchant_id
              and m.ledger_id = transaction_record.ledger_id
              and m.is_archived = false
        )
    )
);
create policy transaction_record_update_authorized
on public.transaction_record
for update
to authenticated
using (
    public.current_user_can_mutate_transaction(
        transaction_record.ledger_id,
        transaction_record.id
    )
)
with check (
    public.current_user_can_mutate_transaction(
        transaction_record.ledger_id,
        transaction_record.id
    )
    and transaction_record.created_by is not distinct from auth.uid()
       or public.current_user_can_manage_ledger(transaction_record.ledger_id)
);

drop policy if exists transaction_item_insert_active_member on public.transaction_item;
drop policy if exists transaction_item_update_active_member on public.transaction_item;
create policy transaction_item_insert_authorized
on public.transaction_item
for insert
to authenticated
with check (
    public.current_user_can_mutate_transaction(
        transaction_item.ledger_id,
        transaction_item.transaction_record_id
    )
    and exists (
        select 1
        from public.account a
        where a.id = transaction_item.account_id
          and a.ledger_id = transaction_item.ledger_id
          and a.is_archived = false
    )
    and (
        transaction_item.category_id is null
        or exists (
            select 1
            from public.category c
            where c.id = transaction_item.category_id
              and c.ledger_id = transaction_item.ledger_id
              and c.is_archived = false
        )
    )
);
create policy transaction_item_update_authorized
on public.transaction_item
for update
to authenticated
using (
    public.current_user_can_mutate_transaction(
        transaction_item.ledger_id,
        transaction_item.transaction_record_id
    )
)
with check (
    public.current_user_can_mutate_transaction(
        transaction_item.ledger_id,
        transaction_item.transaction_record_id
    )
    and exists (
        select 1
        from public.account a
        where a.id = transaction_item.account_id
          and a.ledger_id = transaction_item.ledger_id
          and a.is_archived = false
    )
    and (
        transaction_item.category_id is null
        or exists (
            select 1
            from public.category c
            where c.id = transaction_item.category_id
              and c.ledger_id = transaction_item.ledger_id
              and c.is_archived = false
        )
    )
);

drop policy if exists transaction_record_tag_insert_active_member on public.transaction_record_tag;
drop policy if exists transaction_record_tag_delete_active_member on public.transaction_record_tag;
create policy transaction_record_tag_insert_authorized
on public.transaction_record_tag
for insert
to authenticated
with check (
    public.current_user_can_mutate_transaction(
        ledger_id,
        transaction_record_id
    )
    and exists (
        select 1
        from public.transaction_tag tt
        where tt.id = transaction_record_tag.tag_id
          and tt.ledger_id = transaction_record_tag.ledger_id
          and tt.is_archived = false
    )
);
create policy transaction_record_tag_delete_authorized
on public.transaction_record_tag
for delete
to authenticated
using (
    public.current_user_can_mutate_transaction(
        ledger_id,
        transaction_record_id
    )
);
