begin;

-- Issue #826：个人主页修改昵称，可选同步到所属账本的账本内昵称。

-- 读取当前用户所属 active 账本及每个账本内的有效昵称（账本内昵称为空时回退到账号昵称）。
-- security invoker：只依赖 RLS 返回当前用户可见的数据。
create function public.list_current_user_ledger_display_names()
returns table (
    ledger_id uuid,
    ledger_name text,
    display_name text
)
language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
    select
        l.id,
        l.name,
        coalesce(nullif(btrim(lds.display_name), ''), btrim(au.display_name))
    from public.ledger_member lm
    join public.ledger l
      on l.id = lm.ledger_id
    join public.app_user au
      on au.id = lm.user_id
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = lm.ledger_id
     and lds.user_id = lm.user_id
    where lm.user_id = auth.uid()
      and lm.status = 'active'
      and au.status = 'active'
      and l.is_archived = false
    order by lm.joined_at asc nulls last, lm.created_at asc, lm.ledger_id asc;
$$;

revoke all on function public.list_current_user_ledger_display_names() from public, anon, authenticated, service_role;
grant execute on function public.list_current_user_ledger_display_names() to authenticated;

-- 在同一事务内更新账号昵称与勾选账本的账本内昵称。
-- p_sync_ledger_ids 来自客户端，必须全部是当前用户以 active 成员身份所属的未归档账本。
-- 未勾选账本中账本内昵称为空（回退到账号昵称）的，先固定为修改前的账号昵称，
-- 保证「不同步」的账本显示的昵称不变。
-- 勾选账本的昵称冲突沿用 update_ledger_member_settings 规则（#811）：名字有变化时
-- 不能与同账本未认领待邀请成员同名。有冲突时不写入任何数据，返回冲突账本列表；
-- 返回空结果表示全部更新成功。
create function public.update_current_user_display_name(
    p_display_name text,
    p_sync_ledger_ids uuid[] default '{}'::uuid[]
)
returns table (
    ledger_id uuid,
    ledger_name text,
    error_code text
)
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
#variable_conflict use_column
declare
    v_user_id uuid := auth.uid();
    v_display_name text;
    v_previous_display_name text;
    v_sync_ledger_ids uuid[];
    v_active_ledger_ids uuid[];
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required'
            using errcode = '22023', detail = 'display_name_required';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long'
            using errcode = '22023', detail = 'display_name_too_long';
    end if;

    v_display_name := btrim(p_display_name);

    select coalesce(array_agg(distinct input.id), '{}'::uuid[])
      into v_sync_ledger_ids
      from unnest(coalesce(p_sync_ledger_ids, '{}'::uuid[])) as input(id)
     where input.id is not null;

    -- 锁顺序与 update_ledger_member_settings 一致：账本 → 成员；多个账本按 ID 排序加锁。
    select coalesce(array_agg(locked.id order by locked.id), '{}'::uuid[])
      into v_active_ledger_ids
      from (
          select l.id
            from public.ledger l
           where l.is_archived = false
             and exists (
                 select 1
                   from public.ledger_member lm
                  where lm.ledger_id = l.id
                    and lm.user_id = v_user_id
                    and lm.status = 'active'
             )
           order by l.id
           for update of l
      ) locked;

    perform 1
      from public.ledger_member lm
     where lm.ledger_id = any(v_active_ledger_ids)
       and lm.user_id = v_user_id
       and lm.status = 'active'
     order by lm.ledger_id
     for update of lm;

    select au.display_name
      into v_previous_display_name
      from public.app_user au
     where au.id = v_user_id
       and au.status = 'active'
     for update;

    if not found then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    -- 客户端提交的账本必须全部在当前用户的 active 账本范围内。
    if exists (
        select 1
          from unnest(v_sync_ledger_ids) as sync(id)
         where not (sync.id = any(v_active_ledger_ids))
    ) then
        raise exception 'ledger_permission_denied'
            using errcode = '42501', detail = 'ledger_permission_denied';
    end if;

    -- 冲突检查：只要有一个勾选账本冲突就不写入，返回全部冲突账本。
    return query
    select l.id, l.name, 'display_name_placeholder_conflict'::text
      from public.ledger l
      left join public.ledger_member_display_setting lds
        on lds.ledger_id = l.id
       and lds.user_id = v_user_id
     where l.id = any(v_sync_ledger_ids)
       and v_display_name collate "C" is distinct from
           coalesce(nullif(btrim(lds.display_name), ''), btrim(v_previous_display_name)) collate "C"
       and exists (
           select 1
             from public.ledger_placeholder_member p
            where p.ledger_id = l.id
              and p.claimed_by is null
              and p.display_name collate "C" = v_display_name collate "C"
       )
     order by l.id;

    if found then
        return;
    end if;

    -- 未勾选账本：账本内昵称为空时固定为修改前的账号昵称。
    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    )
    select
        unsynced.id,
        v_user_id,
        btrim(v_previous_display_name),
        public.get_next_ledger_member_display_color(unsynced.id),
        v_user_id,
        v_user_id
      from unnest(v_active_ledger_ids) as unsynced(id)
     where not (unsynced.id = any(v_sync_ledger_ids))
     order by unsynced.id
    on conflict on constraint ledger_member_display_setting_unique do update set
        display_name = excluded.display_name,
        updated_by = v_user_id
    where nullif(btrim(ledger_member_display_setting.display_name), '') is null;

    -- 勾选账本：账本内昵称更新为新昵称，保留个性色。
    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    )
    select
        synced.id,
        v_user_id,
        v_display_name,
        public.get_next_ledger_member_display_color(synced.id),
        v_user_id,
        v_user_id
      from unnest(v_sync_ledger_ids) as synced(id)
     order by synced.id
    on conflict on constraint ledger_member_display_setting_unique do update set
        display_name = excluded.display_name,
        updated_by = v_user_id;

    update public.app_user
       set display_name = v_display_name,
           updated_by = v_user_id
     where id = v_user_id;
end;
$$;

revoke all on function public.update_current_user_display_name(text, uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.update_current_user_display_name(text, uuid[]) to authenticated;

commit;
