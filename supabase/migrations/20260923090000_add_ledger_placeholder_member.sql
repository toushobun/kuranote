begin;

-- Issue #801：占位只记录账本内归属，不创建用户或授予成员权限。
create table public.ledger_placeholder_member (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null references public.ledger(id) on delete restrict,
    display_name text not null,
    claimed_by uuid references public.app_user(id) on delete restrict,
    claimed_at timestamptz,
    created_by uuid not null references public.app_user(id) on delete restrict,
    created_at timestamptz not null default now(),
    constraint ledger_placeholder_member_same_ledger_unique unique (id, ledger_id),
    constraint ledger_placeholder_member_name_check
        check (display_name <> '' and display_name = btrim(display_name)),
    constraint ledger_placeholder_member_claim_check
        check ((claimed_by is null) = (claimed_at is null))
);
create unique index ledger_placeholder_member_unclaimed_name_unique
    on public.ledger_placeholder_member (ledger_id, display_name collate "C")
    where claimed_by is null;
create index ledger_placeholder_member_claimed_by_idx
    on public.ledger_placeholder_member (claimed_by) where claimed_by is not null;

alter table public.ledger_placeholder_member enable row level security;
revoke all on table public.ledger_placeholder_member from public, anon, authenticated;
grant select on table public.ledger_placeholder_member to authenticated;
create policy ledger_placeholder_member_select_active_member
    on public.ledger_placeholder_member for select to authenticated
    using (public.current_user_has_ledger_role(ledger_id, array['owner', 'admin', 'member', 'viewer']::text[]));

alter table public.account_holder
    alter column user_id drop not null,
    add column placeholder_id uuid,
    add constraint account_holder_identity_check
        check ((user_id is not null) <> (placeholder_id is not null)),
    add constraint account_holder_placeholder_same_ledger_fk
        foreign key (placeholder_id, ledger_id)
        references public.ledger_placeholder_member(id, ledger_id) on delete restrict;
create index account_holder_placeholder_id_idx
    on public.account_holder (placeholder_id) where placeholder_id is not null;

alter table public.ledger_invite
    add column placeholder_id uuid,
    add constraint ledger_invite_placeholder_same_ledger_fk
        foreign key (placeholder_id, ledger_id)
        references public.ledger_placeholder_member(id, ledger_id) on delete restrict;
create unique index ledger_invite_one_pending_placeholder
    on public.ledger_invite (placeholder_id)
    where placeholder_id is not null and accepted_at is null and revoked_at is null;
create index ledger_invite_placeholder_id_idx
    on public.ledger_invite (placeholder_id) where placeholder_id is not null;

-- 保留旧用户引用；新增列默认为空，历史数据不生成占位。
alter table public.account_name_scope
    add column holder_placeholder_id uuid,
    add constraint account_name_scope_identity_check
        check (holder_user_id is null or holder_placeholder_id is null),
    drop constraint account_active_name_unique,
    add constraint account_active_name_unique unique nulls not distinct
        (ledger_id, name, type, currency, holder_user_id, holder_placeholder_id)
        deferrable initially deferred;

create or replace function public.sync_account_name_scope(p_account_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    perform 1 from public.account where id = p_account_id for update;
    delete from public.account_name_scope s
    where s.account_id = p_account_id and not exists (
        select 1 from public.account a where a.id = p_account_id and not a.is_archived
    );
    insert into public.account_name_scope (
        account_id, ledger_id, name, type, currency, holder_user_id, holder_placeholder_id
    )
    select a.id, a.ledger_id, lower(a.name), a.type, a.currency, h.user_id, h.placeholder_id
    from public.account a left join public.account_holder h on h.account_id = a.id
    where a.id = p_account_id and not a.is_archived
    on conflict (account_id) do update set
        ledger_id = excluded.ledger_id, name = excluded.name,
        type = excluded.type, currency = excluded.currency,
        holder_user_id = excluded.holder_user_id,
        holder_placeholder_id = excluded.holder_placeholder_id;
end;
$$;
select public.sync_account_name_scope(id) from public.account;

-- 内部锁定需读取不可由客户端写入的占位表，因此触发器使用固定权限。
create or replace function public.validate_account_holder_active_member()
returns trigger language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if tg_op = 'UPDATE' and (new.account_id is distinct from old.account_id
        or new.ledger_id is distinct from old.ledger_id) then
        raise exception 'account_holder_identity_immutable'
            using errcode = '23514', detail = 'account_holder_identity_immutable';
    end if;
    if (new.user_id is null) = (new.placeholder_id is null) then
        raise exception 'account_holder_identity_invalid'
            using errcode = '23514', detail = 'account_holder_identity_invalid';
    end if;
    if new.placeholder_id is not null then
        perform 1 from public.ledger_placeholder_member p
        where p.id = new.placeholder_id and p.ledger_id = new.ledger_id
          and p.claimed_by is null for update;
        if not found then
            raise exception 'placeholder_unavailable'
                using errcode = '23514', detail = 'placeholder_unavailable';
        end if;
    else
        perform 1 from public.ledger_member lm
        join public.app_user au on au.id = lm.user_id
        where lm.ledger_id = new.ledger_id and lm.user_id = new.user_id
          and lm.status = 'active' and au.status = 'active'
        for share of lm, au;
        if not found then
            raise exception 'account holder must be an active ledger member';
        end if;
    end if;
    return new;
end;
$$;
revoke all on function public.validate_account_holder_active_member() from public, anon, authenticated, service_role;
revoke all on function public.sync_account_name_scope(uuid) from public, anon, authenticated, service_role;

-- 所有占位管理和账户写入复用账本锁及权限校验，操作人只取 auth.uid()。
create function public.lock_ledger_placeholder_management(p_ledger_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'auth_required' using errcode = '42501', detail = 'auth_required';
    end if;
    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501', detail = 'permission_denied';
    end if;
    perform 1 from public.ledger where id = p_ledger_id and not is_archived for update;
    if not found or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501', detail = 'permission_denied';
    end if;
end;
$$;
revoke all on function public.lock_ledger_placeholder_management(uuid) from public, anon, authenticated, service_role;

create function public.normalize_ledger_placeholder_name(p_display_name text)
returns text language plpgsql immutable
set search_path = pg_catalog, pg_temp
as $$
declare
    v_name text := btrim(p_display_name);
begin
    if v_name is null or v_name = '' then
        raise exception 'placeholder_name_invalid'
            using errcode = '22023', detail = 'placeholder_name_invalid';
    end if;
    return v_name;
end;
$$;
revoke all on function public.normalize_ledger_placeholder_name(text) from public, anon, authenticated, service_role;

create function public.create_ledger_placeholder_member(p_ledger_id uuid, p_display_name text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_id uuid;
    v_constraint text;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    insert into public.ledger_placeholder_member(ledger_id, display_name, created_by)
    values (p_ledger_id, public.normalize_ledger_placeholder_name(p_display_name), auth.uid())
    returning id into v_id;
    return v_id;
exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'ledger_placeholder_member_unclaimed_name_unique' then
        raise exception 'placeholder_name_conflict'
            using errcode = '23505', detail = 'placeholder_name_conflict';
    end if;
    raise;
end;
$$;

create function public.rename_ledger_placeholder_member(p_ledger_id uuid, p_placeholder_id uuid, p_display_name text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_placeholder public.ledger_placeholder_member;
    v_constraint text;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    select * into v_placeholder from public.ledger_placeholder_member
    where id = p_placeholder_id and ledger_id = p_ledger_id for update;
    if not found then
        raise exception 'placeholder_not_found' using errcode = '22023', detail = 'placeholder_not_found';
    end if;
    if v_placeholder.claimed_by is not null then
        raise exception 'placeholder_already_claimed' using errcode = '23514', detail = 'placeholder_already_claimed';
    end if;
    update public.ledger_placeholder_member
    set display_name = public.normalize_ledger_placeholder_name(p_display_name)
    where id = p_placeholder_id;
    return p_placeholder_id;
exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'ledger_placeholder_member_unclaimed_name_unique' then
        raise exception 'placeholder_name_conflict'
            using errcode = '23505', detail = 'placeholder_name_conflict';
    end if;
    raise;
end;
$$;

create function public.ensure_ledger_placeholder_members(p_ledger_id uuid, p_display_names text[])
returns table(display_name text, placeholder_id uuid)
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
#variable_conflict use_column
declare
    v_names text[];
    v_name text;
    v_id uuid;
    v_constraint text;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    if p_display_names is null then
        raise exception 'placeholder_name_invalid' using errcode = '22023', detail = 'placeholder_name_invalid';
    end if;
    -- 全部输入先规范化校验，之后才统一写入；排序与唯一索引采用相同的精确比较。
    select array_agg(n.name order by n.name collate "C") into v_names
    from (select distinct public.normalize_ledger_placeholder_name(input.name) collate "C" as name
          from unnest(p_display_names) as input(name)) n;
    foreach v_name in array coalesce(v_names, '{}'::text[]) loop
        insert into public.ledger_placeholder_member(ledger_id, display_name, created_by)
        values (p_ledger_id, v_name, auth.uid())
        on conflict (ledger_id, display_name collate "C") where claimed_by is null do nothing
        returning id into v_id;
        if v_id is null then
            select p.id into v_id from public.ledger_placeholder_member p
            where p.ledger_id = p_ledger_id and p.display_name collate "C" = v_name collate "C"
              and p.claimed_by is null for update;
            if not found then
                raise exception 'placeholder_name_conflict' using errcode = '23505', detail = 'placeholder_name_conflict';
            end if;
        end if;
        display_name := v_name;
        placeholder_id := v_id;
        return next;
    end loop;
exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'ledger_placeholder_member_unclaimed_name_unique' then
        raise exception 'placeholder_name_conflict' using errcode = '23505', detail = 'placeholder_name_conflict';
    end if;
    raise;
end;
$$;

create function public.delete_ledger_placeholder_member(p_ledger_id uuid, p_placeholder_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_placeholder public.ledger_placeholder_member;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    select * into v_placeholder from public.ledger_placeholder_member
    where id = p_placeholder_id and ledger_id = p_ledger_id for update;
    if not found then
        raise exception 'placeholder_not_found' using errcode = '22023', detail = 'placeholder_not_found';
    end if;
    if v_placeholder.claimed_by is not null then
        raise exception 'placeholder_already_claimed' using errcode = '23514', detail = 'placeholder_already_claimed';
    end if;
    if exists (select 1 from public.account_holder where placeholder_id = p_placeholder_id) then
        raise exception 'placeholder_in_use' using errcode = '23503', detail = 'placeholder_in_use';
    end if;
    perform 1 from public.ledger_invite where placeholder_id = p_placeholder_id order by id for update;
    update public.ledger_invite set revoked_at = now(), revoked_by = auth.uid(), invite_token = null
    where placeholder_id = p_placeholder_id and accepted_at is null and revoked_at is null;
    update public.ledger_invite set placeholder_id = null
    where placeholder_id = p_placeholder_id and revoked_at is not null;
    -- 异常历史引用也不能被清除或吞掉，整次删除回滚为稳定业务错误。
    delete from public.ledger_placeholder_member where id = p_placeholder_id;
exception when foreign_key_violation then
    raise exception 'placeholder_in_use' using errcode = '23503', detail = 'placeholder_in_use';
end;
$$;

revoke all on function public.create_ledger_placeholder_member(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rename_ledger_placeholder_member(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.delete_ledger_placeholder_member(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.ensure_ledger_placeholder_members(uuid, text[]) from public, anon, authenticated, service_role;
grant execute on function public.create_ledger_placeholder_member(uuid, text) to authenticated;
grant execute on function public.rename_ledger_placeholder_member(uuid, uuid, text) to authenticated;
grant execute on function public.delete_ledger_placeholder_member(uuid, uuid) to authenticated;
grant execute on function public.ensure_ledger_placeholder_members(uuid, text[]) to authenticated;

-- 账户创建和编辑先取得账本锁，再按 ID 锁定旧、新占位，返回供编辑复核的旧引用。
create function public.lock_account_holder_placeholders(p_ledger_id uuid, p_account_id uuid, p_placeholder_id uuid)
returns uuid language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_old_placeholder_id uuid;
    v_placeholder public.ledger_placeholder_member;
begin
    perform public.lock_ledger_placeholder_management(p_ledger_id);
    select h.placeholder_id into v_old_placeholder_id from public.account_holder h
    where h.account_id = p_account_id and h.ledger_id = p_ledger_id;
    perform 1 from public.ledger_placeholder_member
    where ledger_id = p_ledger_id and id in (v_old_placeholder_id, p_placeholder_id)
    order by id for update;
    if p_placeholder_id is not null then
        select * into v_placeholder from public.ledger_placeholder_member
        where id = p_placeholder_id and ledger_id = p_ledger_id;
        if not found then
            raise exception 'placeholder_not_found' using errcode = '22023', detail = 'placeholder_not_found';
        end if;
        if v_placeholder.claimed_by is not null then
            raise exception 'placeholder_already_claimed' using errcode = '23514', detail = 'placeholder_already_claimed';
        end if;
    end if;
    return v_old_placeholder_id;
end;
$$;
revoke all on function public.lock_account_holder_placeholders(uuid, uuid, uuid) from public, anon, authenticated, service_role;

-- 删除旧签名，避免默认参数产生 PostgREST 歧义重载。
drop function public.update_account_with_balance_adjustment(uuid, uuid, text, text, text, uuid[], numeric, text);
drop function public.update_account_with_holders(uuid, uuid, text, text, text, uuid[]);
drop function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[]);

create function public.create_account_with_holders(
    p_ledger_id uuid,
    p_name text,
    p_type text,
    p_currency text,
    p_initial_balance numeric,
    p_holder_user_ids uuid[] default '{}'::uuid[],
    p_placeholder_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
declare
    v_user_id uuid;
    v_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    perform public.lock_account_holder_placeholders(p_ledger_id, null, p_placeholder_id);

    select coalesce(array_agg(distinct holder_user_id), '{}'::uuid[])
    into v_holder_user_ids
    from unnest(coalesce(p_holder_user_ids, '{}'::uuid[])) as holder_user_ids(holder_user_id);

    if cardinality(v_holder_user_ids) > 1 then
        raise exception 'account can have at most one holder';
    end if;

    if p_placeholder_id is not null and cardinality(v_holder_user_ids) > 0 then
        raise exception 'account_holder_identity_invalid' using errcode = '22023', detail = 'account_holder_identity_invalid';
    end if;

    if cardinality(v_holder_user_ids) > 0 then
        with locked_active_holders as (
            select lm.user_id
            from public.ledger_member lm
            join public.app_user au
              on au.id = lm.user_id
            where lm.ledger_id = p_ledger_id
              and lm.user_id = any(v_holder_user_ids)
              and lm.status = 'active'
              and au.status = 'active'
            for update of lm
        )
        select coalesce(array_agg(user_id), '{}'::uuid[])
        into v_active_holder_user_ids
        from locked_active_holders;

        if cardinality(v_active_holder_user_ids) <> cardinality(v_holder_user_ids) then
            raise exception 'account holders must be active ledger members';
        end if;
    end if;

    insert into public.account (
        ledger_id,
        name,
        type,
        currency,
        initial_balance,
        sort_order,
        created_by,
        updated_by
    )
    values (
        p_ledger_id,
        p_name,
        p_type,
        p_currency,
        p_initial_balance,
        0,
        v_user_id,
        v_user_id
    )
    returning id into v_account_id;

    if cardinality(v_holder_user_ids) > 0 then
        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            v_account_id,
            holder_user_id,
            'owner',
            v_user_id,
            v_user_id
        from unnest(v_holder_user_ids) as holder_user_ids(holder_user_id);
    end if;

    if p_placeholder_id is not null then
        insert into public.account_holder (ledger_id, account_id, placeholder_id, role, created_by, updated_by)
        values (p_ledger_id, v_account_id, p_placeholder_id, 'owner', v_user_id, v_user_id);
    end if;

    perform public.record_account_initial_balance(v_account_id);

    return v_account_id;
end;
$$;


create function public.update_account_with_holders(
    p_ledger_id uuid,
    p_account_id uuid,
    p_name text,
    p_type text,
    p_currency text,
    p_holder_user_ids uuid[] default '{}'::uuid[],
    p_placeholder_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
declare
    v_user_id uuid;
    v_old_placeholder_id uuid;
    v_current_placeholder_id uuid;
    v_updated_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    v_old_placeholder_id := public.lock_account_holder_placeholders(p_ledger_id, p_account_id, p_placeholder_id);

    select coalesce(array_agg(distinct holder_user_id), '{}'::uuid[])
    into v_holder_user_ids
    from unnest(coalesce(p_holder_user_ids, '{}'::uuid[])) as holder_user_ids(holder_user_id);

    if cardinality(v_holder_user_ids) > 1 then
        raise exception 'account can have at most one holder';
    end if;

    if p_placeholder_id is not null and cardinality(v_holder_user_ids) > 0 then
        raise exception 'account_holder_identity_invalid' using errcode = '22023', detail = 'account_holder_identity_invalid';
    end if;

    if cardinality(v_holder_user_ids) > 0 then
        with locked_active_holders as (
            select lm.user_id
            from public.ledger_member lm
            join public.app_user au
              on au.id = lm.user_id
            where lm.ledger_id = p_ledger_id
              and lm.user_id = any(v_holder_user_ids)
              and lm.status = 'active'
              and au.status = 'active'
            for update of lm
        )
        select coalesce(array_agg(user_id), '{}'::uuid[])
        into v_active_holder_user_ids
        from locked_active_holders;

        if cardinality(v_active_holder_user_ids) <> cardinality(v_holder_user_ids) then
            raise exception 'account holders must be active ledger members';
        end if;
    end if;

    perform 1 from public.account where id = p_account_id and ledger_id = p_ledger_id for update;
    select placeholder_id into v_current_placeholder_id from public.account_holder
    where account_id = p_account_id and ledger_id = p_ledger_id;
    if v_current_placeholder_id is distinct from v_old_placeholder_id then
        raise exception 'account_holder_changed' using errcode = '40001', detail = 'account_holder_changed';
    end if;

    update public.account
    set
        name = p_name,
        type = p_type,
        currency = p_currency,
        updated_by = v_user_id
    where id = p_account_id
      and ledger_id = p_ledger_id
      and is_archived = false
    returning id into v_updated_account_id;

    if v_updated_account_id is null then
        raise exception 'account not found';
    end if;

    -- 三态显式比较，空用户列不会使旧占位漏删；相同身份保留原持有行。
    delete from public.account_holder h
    where h.ledger_id = p_ledger_id and h.account_id = p_account_id
      and not (
          (p_placeholder_id is not null and h.placeholder_id is not distinct from p_placeholder_id)
          or (p_placeholder_id is null and h.user_id is not null and h.user_id = any(v_holder_user_ids))
      );

    if cardinality(v_holder_user_ids) > 0 then
        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            p_account_id,
            holder_user_id,
            'owner',
            v_user_id,
            v_user_id
        from unnest(v_holder_user_ids) as holder_user_ids(holder_user_id)
        on conflict (account_id, user_id)
        do update set
            role = excluded.role,
            updated_by = excluded.updated_by;
    end if;

    if p_placeholder_id is not null then
        insert into public.account_holder (ledger_id, account_id, placeholder_id, role, created_by, updated_by)
        values (p_ledger_id, p_account_id, p_placeholder_id, 'owner', v_user_id, v_user_id)
        on conflict (account_id) do update set role = excluded.role, updated_by = excluded.updated_by;
    end if;

    return v_updated_account_id;
end;
$$;


create function public.update_account_with_balance_adjustment(
 p_ledger_id uuid, p_account_id uuid, p_name text, p_type text,
 p_currency text, p_holder_user_ids uuid[], p_target_balance numeric default null,
 p_adjustment_note text default null, p_placeholder_id uuid default null
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog', 'pg_temp' as $$
declare
 v_balance numeric;
 v_delta numeric;
 v_record_id uuid;
 v_user_id uuid := auth.uid();
begin
 if v_user_id is null then
  raise exception 'not_authenticated' using errcode = '28000', detail = 'not_authenticated';
 end if;
 if not public.current_user_can_manage_ledger(p_ledger_id) then
  raise exception 'ledger_forbidden' using errcode = '42501', detail = 'ledger_forbidden';
 end if;
 if p_target_balance is not null and (p_target_balance::text in ('NaN','Infinity','-Infinity') or abs(p_target_balance) >= 1000000000000 or p_target_balance <> round(p_target_balance,2)) then
  raise exception 'account_balance_invalid' using errcode = '22023', detail = 'account_balance_invalid';
 end if;
 if length(p_adjustment_note) > 2000 then
  raise exception 'account_adjustment_note_invalid' using errcode = '22023', detail = 'account_adjustment_note_invalid';
 end if;
 -- 与既有账户资料 RPC 保持锁定顺序，资料更新取得账户行锁后再读取最新余额。
 perform public.update_account_with_holders(p_ledger_id,p_account_id,p_name,p_type,p_currency,p_holder_user_ids,p_placeholder_id);
 select current_balance into strict v_balance from public.account where id=p_account_id and ledger_id=p_ledger_id for update;
 v_delta := p_target_balance - v_balance;
 if v_delta is not null and v_delta <> 0 then
  if abs(v_delta) >= 1000000000000 then
   raise exception 'account_balance_invalid' using errcode = '22023', detail = 'account_balance_invalid';
  end if;
  insert into public.transaction_record(ledger_id,type,transaction_at,note,created_by,updated_by)
  values(p_ledger_id,'balance_adjustment',now(),nullif(btrim(p_adjustment_note),''),v_user_id,v_user_id)
  returning id into v_record_id;
  insert into public.transaction_item(ledger_id,transaction_record_id,account_id,amount,balance_delta,created_by,updated_by)
  values(p_ledger_id,v_record_id,p_account_id,abs(v_delta),v_delta,v_user_id,v_user_id);
  perform public.apply_account_balance_delta(p_ledger_id,p_account_id,v_delta,v_user_id);
 end if;
 return p_account_id;
end;
$$;
revoke all on function public.update_account_with_balance_adjustment(uuid,uuid,text,text,text,uuid[],numeric,text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.update_account_with_balance_adjustment(uuid,uuid,text,text,text,uuid[],numeric,text,uuid) to authenticated;


revoke all on function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[], uuid) from public, anon, authenticated, service_role;
revoke all on function public.update_account_with_holders(uuid, uuid, text, text, text, uuid[], uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[], uuid) to authenticated;
grant execute on function public.update_account_with_holders(uuid, uuid, text, text, text, uuid[], uuid) to authenticated;

commit;
