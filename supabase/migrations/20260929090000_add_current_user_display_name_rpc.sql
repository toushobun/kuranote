begin;

-- Issue #826：个人主页修改昵称，可选同步到所属账本的账本内昵称。
-- 账本内昵称改为在成员加入时明确写入，不再依赖「为空时显示账号昵称」；
-- 各读取处的回退逻辑保留，作为兜底。

-- 成员首次成为 active 时建立显示设置，同时写入当时的账号昵称（btrim 后）。
-- 已有设置保持不变（on conflict do nothing），不覆盖原昵称。
-- 认领待邀请成员时：accept_ledger_invite 先插入成员行（本 trigger 在该语句内
-- AFTER INSERT 执行，写入账号昵称），之后在同一函数内 upsert 为待邀请成员的名字，
-- 因此最终结果是待邀请成员的名字。其余逻辑与现有定义一致。
create or replace function public.assign_ledger_member_default_display_color()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_actor_id uuid;
    v_display_name text;
begin
    if new.status <> 'active' then
        return new;
    end if;

    if tg_op = 'UPDATE' and old.status = 'active' then
        return new;
    end if;

    -- 同一账本的并发加入流程串行分配颜色，避免两名成员同时拿到同一个空闲色。
    perform 1
    from public.ledger l
    where l.id = new.ledger_id
    for update;

    v_actor_id = coalesce(auth.uid(), new.created_by, new.user_id);

    select btrim(au.display_name)
      into v_display_name
      from public.app_user au
     where au.id = new.user_id;

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        new.ledger_id,
        new.user_id,
        v_display_name,
        public.get_next_ledger_member_display_color(new.ledger_id),
        v_actor_id,
        v_actor_id
    )
    on conflict (ledger_id, user_id) do nothing;

    return new;
end;
$$;

comment on function public.assign_ledger_member_default_display_color() is
    '成员首次成为 active 时自动建立账本内显示设置（显示色与当时的账号昵称）。';

-- 补填：active 成员（账号 active）中账本内昵称为空的记录，写入当前账号昵称（btrim 后）。
-- 读取处的有效昵称为 coalesce(nullif(btrim(display_name), ''), btrim(app_user.display_name))，
-- 补填值与原回退值相同，页面显示不变。账号已停用的成员不在显示设置校验范围内，保持回退。
-- 保留为内部函数（不授予任何角色），便于数据库测试验证补填结果。
create function public.backfill_ledger_member_display_names()
returns integer
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_count integer;
begin
    update public.ledger_member_display_setting lds
       set display_name = btrim(au.display_name)
      from public.ledger_member lm,
           public.app_user au
     where lm.ledger_id = lds.ledger_id
       and lm.user_id = lds.user_id
       and lm.status = 'active'
       and au.id = lds.user_id
       and au.status = 'active'
       and nullif(btrim(lds.display_name), '') is null;

    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

revoke all on function public.backfill_ledger_member_display_names() from public, anon, authenticated, service_role;

select public.backfill_ledger_member_display_names();

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
-- 成员加入时已写入账本内昵称（见本文件开头的 trigger 与补填），未勾选的账本不做任何修改。
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

    -- 勾选账本：账本内昵称更新为新昵称，保留个性色。
    -- 显示设置行正常情况下已由成员加入 trigger 建立，这里的 insert 只是兜底。
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
