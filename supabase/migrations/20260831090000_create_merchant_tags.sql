-- Issue #651：账本级商家标签、多对多关联及事务性写入。

create table public.merchant_tags (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null references public.ledger(id) on delete restrict,
    name text not null,
    icon text not null,
    sort_order integer not null default 0,
    is_archived boolean not null default false,
    archived_at timestamptz,
    archived_by uuid references public.app_user(id),
    created_at timestamptz not null default now(),
    created_by uuid references public.app_user(id),

    constraint merchant_tags_name_check
        check (length(trim(name)) between 1 and 100),
    constraint merchant_tags_icon_check
        check (length(icon) between 1 and 32),
    constraint merchant_tags_archive_check
        check (
            (is_archived = false and archived_at is null and archived_by is null)
            or
            (is_archived = true and archived_at is not null and archived_by is not null)
        )
);

create unique index merchant_tags_active_name_unique
on public.merchant_tags (ledger_id, lower(name))
where is_archived = false;

create index merchant_tags_active_order_idx
on public.merchant_tags (ledger_id, sort_order, id)
where is_archived = false;

create table public.merchant_tag_links (
    merchant_id uuid not null references public.merchant(id) on delete cascade,
    tag_id uuid not null references public.merchant_tags(id) on delete cascade,
    primary key (merchant_id, tag_id)
);

create index merchant_tag_links_tag_id_idx
on public.merchant_tag_links (tag_id, merchant_id);

create or replace function public.validate_merchant_tag_link_ledger()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_merchant_ledger_id uuid;
    v_tag_ledger_id uuid;
    v_merchant_archived boolean;
    v_tag_archived boolean;
begin
    select m.ledger_id, m.is_archived
      into v_merchant_ledger_id, v_merchant_archived
      from public.merchant m
     where m.id = new.merchant_id;

    select mt.ledger_id, mt.is_archived
      into v_tag_ledger_id, v_tag_archived
      from public.merchant_tags mt
     where mt.id = new.tag_id;

    if v_merchant_ledger_id is null
       or v_tag_ledger_id is null
       or v_merchant_ledger_id <> v_tag_ledger_id
       or v_merchant_archived
       or v_tag_archived then
        raise exception 'merchant_tag_link_invalid'
            using errcode = '22023', detail = 'merchant_tag_link_invalid';
    end if;

    return new;
end;
$$;

create trigger merchant_tag_links_validate_ledger
before insert or update on public.merchant_tag_links
for each row
execute function public.validate_merchant_tag_link_ledger();

create trigger merchant_tags_require_management_permission
before insert or update or delete on public.merchant_tags
for each row
execute function public.enforce_ledger_management_permission('ledger_id');

create or replace function public.enforce_merchant_tag_link_management_permission()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
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

    if v_ledger_id is null
       or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.enforce_merchant_tag_link_management_permission()
from public, anon, authenticated;

create trigger merchant_tag_links_require_management_permission
before insert or update or delete on public.merchant_tag_links
for each row
execute function public.enforce_merchant_tag_link_management_permission();

alter table public.merchant_tags enable row level security;
alter table public.merchant_tag_links enable row level security;

revoke all on table public.merchant_tags from public, anon, authenticated;
revoke all on table public.merchant_tag_links from public, anon, authenticated;

grant select, insert on table public.merchant_tags to authenticated;
grant update (name, icon) on table public.merchant_tags to authenticated;
grant select, insert, delete on table public.merchant_tag_links to authenticated;

create policy merchant_tags_select_active_member
on public.merchant_tags
for select
to authenticated
using (
    is_archived = false
    and public.current_user_is_active_ledger_member(ledger_id)
);

create policy merchant_tags_insert_manager
on public.merchant_tags
for insert
to authenticated
with check (public.current_user_can_manage_ledger(ledger_id));

create policy merchant_tags_update_manager
on public.merchant_tags
for update
to authenticated
using (public.current_user_can_manage_ledger(ledger_id))
with check (public.current_user_can_manage_ledger(ledger_id));

create policy merchant_tag_links_select_active_member
on public.merchant_tag_links
for select
to authenticated
using (
    exists (
        select 1
        from public.merchant m
        join public.merchant_tags mt
          on mt.id = merchant_tag_links.tag_id
         and mt.ledger_id = m.ledger_id
        where m.id = merchant_tag_links.merchant_id
          and public.current_user_is_active_ledger_member(m.ledger_id)
    )
);

create policy merchant_tag_links_insert_manager
on public.merchant_tag_links
for insert
to authenticated
with check (
    exists (
        select 1
        from public.merchant m
        join public.merchant_tags mt
          on mt.id = merchant_tag_links.tag_id
         and mt.ledger_id = m.ledger_id
        where m.id = merchant_tag_links.merchant_id
          and public.current_user_can_manage_ledger(m.ledger_id)
    )
);

create policy merchant_tag_links_delete_manager
on public.merchant_tag_links
for delete
to authenticated
using (
    exists (
        select 1
        from public.merchant m
        join public.merchant_tags mt
          on mt.id = merchant_tag_links.tag_id
         and mt.ledger_id = m.ledger_id
        where m.id = merchant_tag_links.merchant_id
          and public.current_user_can_manage_ledger(m.ledger_id)
    )
);

create or replace function public.create_merchant_with_tags(
    p_ledger_id uuid,
    p_name text,
    p_website_url text,
    p_note text,
    p_tag_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_merchant_id uuid;
    v_tag_count integer := coalesce(cardinality(p_tag_ids), 0);
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if v_tag_count > 100
       or exists (
           select 1
           from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id)
           where submitted.tag_id is null
       )
       or (
           select count(distinct submitted.tag_id)
           from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id)
       ) <> v_tag_count
       or (
           select count(*)
           from public.merchant_tags mt
           where mt.ledger_id = p_ledger_id
             and mt.is_archived = false
             and mt.id = any(coalesce(p_tag_ids, '{}'::uuid[]))
       ) <> v_tag_count then
        raise exception 'merchant_tags_invalid'
            using errcode = '22023', detail = 'merchant_tags_invalid';
    end if;

    insert into public.merchant (
        ledger_id, name, website_url, note, sort_order, created_by, updated_by
    ) values (
        p_ledger_id, p_name, p_website_url, p_note, 0, v_user_id, v_user_id
    )
    returning id into v_merchant_id;

    insert into public.merchant_tag_links (merchant_id, tag_id)
    select v_merchant_id, submitted.tag_id
    from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id);

    return v_merchant_id;
end;
$$;

create or replace function public.update_merchant_with_tags(
    p_ledger_id uuid,
    p_merchant_id uuid,
    p_name text,
    p_website_url text,
    p_note text,
    p_tag_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_tag_count integer := coalesce(cardinality(p_tag_ids), 0);
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    perform 1
    from public.merchant m
    where m.id = p_merchant_id
      and m.ledger_id = p_ledger_id
      and m.is_archived = false
    for update;

    if not found then
        return false;
    end if;

    if v_tag_count > 100
       or exists (
           select 1
           from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id)
           where submitted.tag_id is null
       )
       or (
           select count(distinct submitted.tag_id)
           from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id)
       ) <> v_tag_count
       or (
           select count(*)
           from public.merchant_tags mt
           where mt.ledger_id = p_ledger_id
             and mt.is_archived = false
             and mt.id = any(coalesce(p_tag_ids, '{}'::uuid[]))
       ) <> v_tag_count then
        raise exception 'merchant_tags_invalid'
            using errcode = '22023', detail = 'merchant_tags_invalid';
    end if;

    update public.merchant m
       set name = p_name,
           website_url = p_website_url,
           note = p_note,
           updated_by = v_user_id
     where m.id = p_merchant_id
       and m.ledger_id = p_ledger_id
       and m.is_archived = false;

    delete from public.merchant_tag_links mtl
    where mtl.merchant_id = p_merchant_id;

    insert into public.merchant_tag_links (merchant_id, tag_id)
    select p_merchant_id, submitted.tag_id
    from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id);

    return true;
end;
$$;

create or replace function public.archive_merchant_tag(
    p_ledger_id uuid,
    p_tag_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au on au.id = lm.user_id
        join public.ledger l on l.id = lm.ledger_id and l.is_archived = false
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
          and lm.role in ('owner', 'admin')
          and au.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    update public.merchant_tags mt
       set is_archived = true,
           archived_at = now(),
           archived_by = v_user_id
     where mt.id = p_tag_id
       and mt.ledger_id = p_ledger_id
       and mt.is_archived = false;

    if not found then
        return false;
    end if;

    delete from public.merchant_tag_links mtl
    where mtl.tag_id = p_tag_id;

    return true;
end;
$$;

create or replace function public.reorder_merchant_tags(
    p_ledger_id uuid,
    p_tag_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_tag_count integer;
    v_distinct_count integer;
    v_active_ids uuid[];
    v_submitted_ids uuid[];
    v_updated_count integer;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    v_tag_count := coalesce(cardinality(p_tag_ids), 0);
    if p_ledger_id is null or v_tag_count < 1 or v_tag_count > 200 then
        raise exception 'merchant_tag_order_invalid'
            using errcode = '22023', detail = 'merchant_tag_order_invalid';
    end if;

    if exists (
        select 1 from unnest(p_tag_ids) submitted(tag_id)
        where submitted.tag_id is null
    ) then
        raise exception 'merchant_tag_order_invalid'
            using errcode = '22023', detail = 'merchant_tag_order_invalid';
    end if;

    select count(distinct submitted.tag_id)
      into v_distinct_count
      from unnest(p_tag_ids) submitted(tag_id);

    if v_distinct_count <> v_tag_count then
        raise exception 'merchant_tag_order_invalid'
            using errcode = '22023', detail = 'merchant_tag_order_invalid';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
          and lm.role in ('owner', 'admin')
          and au.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    lock table public.merchant_tags in share row exclusive mode;

    if not exists (
        select 1 from public.ledger l
        where l.id = p_ledger_id and l.is_archived = false
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
          and lm.role in ('owner', 'admin')
          and au.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    select coalesce(array_agg(locked_tag.id order by locked_tag.id), '{}'::uuid[])
      into v_active_ids
      from (
          select mt.id
          from public.merchant_tags mt
          where mt.ledger_id = p_ledger_id
            and mt.is_archived = false
          order by mt.id
          for update
      ) locked_tag;

    select coalesce(array_agg(submitted.tag_id order by submitted.tag_id), '{}'::uuid[])
      into v_submitted_ids
      from unnest(p_tag_ids) submitted(tag_id);

    if v_submitted_ids is distinct from v_active_ids then
        raise exception 'merchant_tag_set_invalid'
            using errcode = '22023', detail = 'merchant_tag_set_invalid';
    end if;

    with submitted_order as (
        select submitted.tag_id, submitted.position
        from unnest(p_tag_ids) with ordinality submitted(tag_id, position)
    )
    update public.merchant_tags mt
       set sort_order = (submitted_order.position - 1)::integer
      from submitted_order
     where mt.id = submitted_order.tag_id
       and mt.ledger_id = p_ledger_id
       and mt.is_archived = false;

    get diagnostics v_updated_count = row_count;
    if v_updated_count <> v_tag_count then
        raise exception 'merchant_tag_write_failed'
            using errcode = 'P0001', detail = 'merchant_tag_write_failed';
    end if;

    return v_updated_count;
end;
$$;

revoke all on function public.create_merchant_with_tags(uuid, text, text, text, uuid[]) from public, anon;
grant execute on function public.create_merchant_with_tags(uuid, text, text, text, uuid[]) to authenticated;
revoke all on function public.update_merchant_with_tags(uuid, uuid, text, text, text, uuid[]) from public, anon;
grant execute on function public.update_merchant_with_tags(uuid, uuid, text, text, text, uuid[]) to authenticated;
revoke all on function public.archive_merchant_tag(uuid, uuid) from public, anon;
grant execute on function public.archive_merchant_tag(uuid, uuid) to authenticated;
revoke all on function public.reorder_merchant_tags(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_merchant_tags(uuid, uuid[]) to authenticated;

-- 保留既有初始化实现，并用同名入口追加默认商家标签下发。
alter function public.initialize_ledger_default_data(uuid, uuid)
rename to initialize_ledger_default_data_without_merchant_tags;

revoke all on function public.initialize_ledger_default_data_without_merchant_tags(uuid, uuid)
from public, anon, authenticated;

create function public.initialize_ledger_default_data(
    p_ledger_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    perform public.initialize_ledger_default_data_without_merchant_tags(
        p_ledger_id,
        p_user_id
    );

    insert into public.merchant_tags (
        ledger_id, name, icon, sort_order, created_by
    )
    select p_ledger_id, defaults.name, defaults.icon, defaults.sort_order, p_user_id
    from (
        values
            ('超市', '🛒', 0),
            ('便利店', '🏪', 1),
            ('餐饮', '🍽️', 2),
            ('百货店', '🏬', 3),
            ('电商', '📦', 4),
            ('旅行', '✈️', 5),
            ('通讯', '📶', 6),
            ('生活', '🏠', 7)
    ) defaults(name, icon, sort_order)
    where not exists (
        select 1
        from public.merchant_tags mt
        where mt.ledger_id = p_ledger_id
          and mt.is_archived = false
          and lower(mt.name) = lower(defaults.name)
    );
end;
$$;

revoke all on function public.initialize_ledger_default_data(uuid, uuid)
from public, anon, authenticated;

comment on function public.reorder_merchant_tags(uuid, uuid[])
is '在单一事务内校验完整未归档商家标签集合并按提交顺序批量更新 sort_order。';
