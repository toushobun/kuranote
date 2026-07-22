-- Issue #469：使用单个 PostgreSQL RPC 在同一事务内校验并保存分类排序。
-- 分类写操作统一锁定所属账本行，使同一账本内的新增、归档、更新和排序串行执行，
-- 避免完整 sibling 集合校验与批量更新之间被并发写入穿插。

create or replace function public.serialize_category_write_by_ledger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_old_ledger_id uuid;
    v_new_ledger_id uuid;
begin
    if tg_op <> 'INSERT' then
        v_old_ledger_id := old.ledger_id;
    end if;

    if tg_op <> 'DELETE' then
        v_new_ledger_id := new.ledger_id;
    end if;

    if v_old_ledger_id is not null
       and v_new_ledger_id is not null
       and v_old_ledger_id is distinct from v_new_ledger_id then
        perform 1
        from public.ledger l
        where l.id in (v_old_ledger_id, v_new_ledger_id)
        order by l.id
        for update;
    else
        perform 1
        from public.ledger l
        where l.id = coalesce(v_new_ledger_id, v_old_ledger_id)
        for update;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.serialize_category_write_by_ledger() from public;
revoke all on function public.serialize_category_write_by_ledger() from anon;
revoke all on function public.serialize_category_write_by_ledger() from authenticated;

drop trigger if exists category_serialize_writes on public.category;
create trigger category_serialize_writes
before insert or update or delete on public.category
for each row execute function public.serialize_category_write_by_ledger();

create or replace function public.reorder_categories(
    p_ledger_id uuid,
    p_type text,
    p_parent_id uuid,
    p_category_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_category_count integer;
    v_distinct_count integer;
    v_locked_ledger_id uuid;
    v_sibling_ids uuid[];
    v_submitted_ids uuid[];
    v_updated_count integer;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null then
        raise exception 'ledger_required'
            using errcode = '22023', detail = 'ledger_required';
    end if;

    if p_type is null or p_type not in ('expense', 'income') then
        raise exception 'category_type_invalid'
            using errcode = '22023', detail = 'category_type_invalid';
    end if;

    v_category_count := coalesce(cardinality(p_category_ids), 0);
    if v_category_count < 1 or v_category_count > 200 then
        raise exception 'category_order_invalid'
            using errcode = '22023', detail = 'category_order_invalid';
    end if;

    if exists (
        select 1
        from unnest(p_category_ids) as submitted(category_id)
        where submitted.category_id is null
    ) then
        raise exception 'category_order_invalid'
            using errcode = '22023', detail = 'category_order_invalid';
    end if;

    select count(*)
      into v_distinct_count
      from (
          select distinct submitted.category_id
          from unnest(p_category_ids) as submitted(category_id)
      ) distinct_categories;

    if v_distinct_count <> v_category_count then
        raise exception 'category_order_invalid'
            using errcode = '22023', detail = 'category_order_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    select l.id
      into v_locked_ledger_id
      from public.ledger l
     where l.id = p_ledger_id
       and l.is_archived = false
     for update;

    if v_locked_ledger_id is null then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    if p_parent_id is not null and not exists (
        select 1
        from public.category parent
        where parent.id = p_parent_id
          and parent.ledger_id = p_ledger_id
          and parent.type = p_type
          and parent.parent_id is null
          and parent.is_archived = false
    ) then
        raise exception 'category_parent_invalid'
            using errcode = '22023', detail = 'category_parent_invalid';
    end if;

    select coalesce(array_agg(locked_category.id order by locked_category.id), '{}'::uuid[])
      into v_sibling_ids
      from (
          select c.id
          from public.category c
          where c.ledger_id = p_ledger_id
            and c.type = p_type
            and c.parent_id is not distinct from p_parent_id
            and c.is_archived = false
          order by c.id
          for update
      ) locked_category;

    select coalesce(array_agg(submitted.category_id order by submitted.category_id), '{}'::uuid[])
      into v_submitted_ids
      from unnest(p_category_ids) as submitted(category_id);

    if v_submitted_ids is distinct from v_sibling_ids then
        raise exception 'category_set_invalid'
            using errcode = '22023', detail = 'category_set_invalid';
    end if;

    with submitted_order as (
        select ordered.category_id, ordered.position
        from unnest(p_category_ids) with ordinality as ordered(category_id, position)
    )
    update public.category c
       set sort_order = (submitted_order.position * 10)::integer,
           updated_by = v_user_id
      from submitted_order
     where c.id = submitted_order.category_id
       and c.ledger_id = p_ledger_id
       and c.type = p_type
       and c.parent_id is not distinct from p_parent_id
       and c.is_archived = false;

    get diagnostics v_updated_count = row_count;

    if v_updated_count <> v_category_count then
        raise exception 'category_write_failed'
            using errcode = 'P0001', detail = 'category_write_failed';
    end if;

    return v_updated_count;
end;
$$;

revoke all on function public.reorder_categories(uuid, text, uuid, uuid[]) from public;
revoke all on function public.reorder_categories(uuid, text, uuid, uuid[]) from anon;
grant execute on function public.reorder_categories(uuid, text, uuid, uuid[]) to authenticated;

comment on function public.reorder_categories(uuid, text, uuid, uuid[])
is '在单一事务内校验完整同级分类集合并按提交顺序批量更新 sort_order。';
