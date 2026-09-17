begin;

-- Issue #781：将未归档账户名称限定在账本、类型、货币和单一持有人内唯一。
-- 原索引更严格，因此正常历史数据不会产生新的同名冲突。
-- 历史 RPC 只限制入参数量；多持有人记录必须由维护者确认后处理，不能自动丢弃。
lock table public.account, public.account_holder in share row exclusive mode;

do $$
begin
    if exists (
        select 1 from public.account_holder group by account_id having count(*) > 1
    ) then
        raise exception '存在历史多持有人账户，请确认并整理后重新执行迁移';
    end if;
end;
$$;

create unique index account_holder_single_user_unique on public.account_holder (account_id);

-- 原索引在回填前移除，以复用稳定的约束名；任何失败都会回滚整个迁移。
drop index public.account_active_name_unique;

-- 联表唯一键的内部投影，不作为客户端业务数据来源。
-- 延迟唯一约束允许 RPC 先写账户、再写持有人，以及同一事务内交换名称。
create table public.account_name_scope (
    account_id uuid primary key references public.account(id) on delete cascade,
    ledger_id uuid not null,
    name text not null,
    type text not null,
    currency text not null,
    holder_user_id uuid,
    constraint account_active_name_unique unique nulls not distinct
        (ledger_id, name, type, currency, holder_user_id)
        deferrable initially deferred
);
alter table public.account_name_scope enable row level security;
revoke all on table public.account_name_scope from public, anon, authenticated, service_role;

insert into public.account_name_scope (account_id, ledger_id, name, type, currency, holder_user_id)
select a.id, a.ledger_id, lower(a.name), a.type, a.currency, h.user_id
from public.account a
left join public.account_holder h on h.account_id = a.id
where not a.is_archived;

create function public.sync_account_name_scope(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
begin
    -- 与账户编辑串行化，持有人写入不能用旧账户属性覆盖投影。
    perform 1 from public.account where id = p_account_id for update;

    delete from public.account_name_scope s
    where s.account_id = p_account_id
      and not exists (
          select 1 from public.account a where a.id = p_account_id and not a.is_archived
      );

    insert into public.account_name_scope (account_id, ledger_id, name, type, currency, holder_user_id)
    select a.id, a.ledger_id, lower(a.name), a.type, a.currency, h.user_id
    from public.account a
    left join public.account_holder h on h.account_id = a.id
    where a.id = p_account_id and not a.is_archived
    on conflict (account_id) do update set
        ledger_id = excluded.ledger_id,
        name = excluded.name,
        type = excluded.type,
        currency = excluded.currency,
        holder_user_id = excluded.holder_user_id;
end;
$$;

create function public.refresh_account_name_scope()
returns trigger
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
begin
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

create trigger account_name_scope_refresh
    after insert or update of ledger_id, name, type, currency, is_archived on public.account
    for each row execute function public.refresh_account_name_scope();
create trigger account_holder_name_scope_refresh
    after insert or update or delete on public.account_holder
    for each row execute function public.refresh_account_name_scope();

revoke all on function public.sync_account_name_scope(uuid) from public, anon, authenticated, service_role;
revoke all on function public.refresh_account_name_scope() from public, anon, authenticated, service_role;

commit;
