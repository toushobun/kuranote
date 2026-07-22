-- Issue #469：使用单个 PostgreSQL RPC 在同一事务内校验并保存分类排序。
-- 排序期间取得 SHARE ROW EXCLUSIVE 表锁，使分类新增、更新、归档和其他排序请求
-- 无法穿插到完整 sibling 集合校验与批量更新之间；同级分类行仍显式 FOR UPDATE。

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

    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
          and lm.role in ('owner', 'admin')
          and au.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    -- PostgreSQL 不提供可锁定“不存在行”的谓词锁。为了同时防住并发新增、
    -- 归档和排序，使用最小可证明正确的表级写锁，而不是只锁当前 sibling 行。
    lock table public.category in share row exclusive mode;

    if not exists (
        select 1
        from public.ledger l
        where l.id = p_ledger_id
          and l.is_archived = false
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    -- 取得并发锁后再次验证成员和权限，避免等待锁期间权限已发生变化。
    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
          and lm.role in ('owner', 'admin')
          and au.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
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
