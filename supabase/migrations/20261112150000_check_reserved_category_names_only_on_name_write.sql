-- 普通分类只在新建或改名时检查保留名称；已有同名分类仍可维护排序、图标与归档。
create or replace function public.guard_system_category()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
  v_parent_key text;
  v_normalized_name text;
  v_allow_system_write boolean :=
    current_user = 'postgres'
    and current_setting('app.allow_system_category_write', true) = 'true';
begin
  if tg_op = 'DELETE' then
    -- 删除整个账本由既有的受控 RPC 执行，不能被系统分类防线阻断。
    if public.ledger_deletion_allows_delete(old.ledger_id) then
      return old;
    end if;
    if old.system_key is not null then
      raise exception 'category_system_locked'
        using errcode = '22023', detail = 'category_system_locked';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.system_key is not null then
    -- 排序可以改变，但系统分类的身份、名称、图标及归档等业务字段不可改变。
    if (to_jsonb(new) - array['sort_order', 'updated_at', 'updated_by'])
       is distinct from
       (to_jsonb(old) - array['sort_order', 'updated_at', 'updated_by']) then
      raise exception 'category_system_locked'
        using errcode = '22023', detail = 'category_system_locked';
    end if;
    return new;
  end if;

  if new.system_key is not null and not v_allow_system_write then
    raise exception 'category_system_locked'
      using errcode = '22023', detail = 'category_system_locked';
  end if;

  if new.parent_id is not null then
    select c.system_key into v_parent_key
      from public.category c
     where c.id = new.parent_id
       and c.ledger_id = new.ledger_id;
    if v_parent_key = 'special_income'
       and coalesce(new.system_key, '') not in ('refund', 'reimbursement') then
      raise exception 'category_system_parent_locked'
        using errcode = '22023', detail = 'category_system_parent_locked';
    end if;
  end if;

  if new.system_key is not null then
    if new.type <> 'income'
       or (new.system_key = 'special_income' and new.parent_id is not null)
       or (new.system_key in ('refund', 'reimbursement')
           and (new.parent_id is null or v_parent_key is distinct from 'special_income')) then
      raise exception 'category_system_invalid'
        using errcode = '22023', detail = 'category_system_invalid';
    end if;
  else
    -- 分类库在存储名称前加 emoji 前缀，保留名称按用户实际看到的名称判断。
    v_normalized_name := btrim(
      regexp_replace(btrim(new.name), '^[^[:space:]]+[[:space:]]+', '')
    );
    if v_normalized_name in ('特殊收入', '退款', '报销')
       and (tg_op = 'INSERT' or v_normalized_name is distinct from btrim(
         regexp_replace(btrim(old.name), '^[^[:space:]]+[[:space:]]+', '')
       )) then
      raise exception 'category_name_reserved'
        using errcode = '22023', detail = 'category_name_reserved';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_system_category() from public, anon, authenticated, service_role;
