-- #1125：更新商家资料、标签、别名和显示名作为单一数据库事务。
-- 原有列表页的快捷切换仍使用 set_merchant_preferred_alias，故保留该函数。
drop function if exists public.update_merchant_with_tags(uuid, uuid, text, text, text, text, uuid[]);

create function public.update_merchant_with_tags(
    p_ledger_id uuid,
    p_merchant_id uuid,
    p_name text,
    p_website_url text,
    p_icon_url text,
    p_note text,
    p_tag_ids uuid[],
    p_added_aliases text[],
    p_archived_alias_ids uuid[],
    p_preferred_alias text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_tag_count integer := coalesce(cardinality(p_tag_ids), 0);
    v_added_count integer := coalesce(cardinality(p_added_aliases), 0);
    v_archived_count integer := coalesce(cardinality(p_archived_alias_ids), 0);
    v_preferred_alias_id uuid;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;
    if p_ledger_id is null or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    -- 锁住商家主行，序列化同一商家的并发写入和显示名切换。
    perform 1 from public.merchant m
    where m.id = p_merchant_id
      and m.ledger_id = p_ledger_id
      and m.is_archived = false
    for update;
    if not found then return false; end if;

    if p_tag_ids is null
       or v_tag_count > 100
       or exists (select 1 from unnest(p_tag_ids) ids(id) where id is null)
       or (select count(distinct id) from unnest(p_tag_ids) ids(id)) <> v_tag_count
       or (select count(*) from public.merchant_tags mt
           where mt.ledger_id = p_ledger_id and not mt.is_archived
             and mt.id = any(p_tag_ids)) <> v_tag_count then
        raise exception 'merchant_tags_invalid'
            using errcode = '22023', detail = 'merchant_tags_invalid';
    end if;

    if p_added_aliases is null
       or p_archived_alias_ids is null
       or v_added_count > 100
       or v_archived_count > 100
       or exists (
           select 1 from unnest(p_added_aliases) names(alias)
           where alias is null or length(btrim(alias)) not between 1 and 100
              or lower(btrim(alias)) = lower(btrim(p_name))
       )
       or (select count(distinct lower(btrim(alias)))
           from unnest(p_added_aliases) names(alias)) <> v_added_count then
        raise exception 'merchant_alias_invalid'
            using errcode = '22023', detail = 'merchant_alias_invalid';
    end if;

    if exists (select 1 from unnest(p_archived_alias_ids) ids(id) where id is null)
       or (select count(distinct id) from unnest(p_archived_alias_ids) ids(id)) <> v_archived_count
       or (select count(*) from public.merchant_alias ma
           where ma.merchant_id = p_merchant_id and not ma.is_archived
             and ma.id = any(p_archived_alias_ids)) <> v_archived_count then
        raise exception 'merchant_alias_invalid'
            using errcode = '22023', detail = 'merchant_alias_invalid';
    end if;

    if exists (
        select 1 from unnest(p_added_aliases) names(alias)
        join public.merchant_alias ma
          on ma.merchant_id = p_merchant_id
         and not ma.is_archived
         and ma.id <> all(p_archived_alias_ids)
         and lower(ma.alias) = lower(btrim(names.alias))
    ) then
        raise exception 'merchant_alias_duplicate'
            using errcode = '22023', detail = 'merchant_alias_duplicate';
    end if;

    if p_preferred_alias is not null
       and (length(btrim(p_preferred_alias)) not between 1 and 100
            or not (
                exists (
                    select 1 from public.merchant_alias ma
                    where ma.merchant_id = p_merchant_id
                      and not ma.is_archived
                      and ma.id <> all(p_archived_alias_ids)
                      and lower(ma.alias) = lower(btrim(p_preferred_alias))
                )
                or exists (
                    select 1 from unnest(p_added_aliases) names(alias)
                    where lower(btrim(alias)) = lower(btrim(p_preferred_alias))
                )
            )) then
        raise exception 'merchant_preferred_invalid'
            using errcode = '22023', detail = 'merchant_preferred_invalid';
    end if;

    update public.merchant m
    set name = p_name,
        website_url = p_website_url,
        icon_url = p_icon_url,
        note = p_note,
        updated_by = v_user_id
    where m.id = p_merchant_id;

    delete from public.merchant_tag_links mtl
    where mtl.merchant_id = p_merchant_id;
    insert into public.merchant_tag_links (merchant_id, tag_id)
    select p_merchant_id, id from unnest(p_tag_ids) ids(id);

    update public.merchant_alias ma
    set is_archived = true,
        archived_at = now(),
        archived_by = v_user_id,
        is_preferred = false,
        updated_by = v_user_id
    where ma.merchant_id = p_merchant_id
      and ma.id = any(p_archived_alias_ids)
      and not ma.is_archived;

    insert into public.merchant_alias (merchant_id, alias, sort_order, created_by, updated_by)
    select p_merchant_id, btrim(alias), 0, v_user_id, v_user_id
    from unnest(p_added_aliases) names(alias);

    -- 必须先清掉旧的首选位，保证部分唯一索引在并发下始终成立。
    update public.merchant_alias ma
    set is_preferred = false, updated_by = v_user_id
    where ma.merchant_id = p_merchant_id
      and not ma.is_archived
      and ma.is_preferred;

    if p_preferred_alias is not null then
        select ma.id into v_preferred_alias_id
        from public.merchant_alias ma
        where ma.merchant_id = p_merchant_id
          and not ma.is_archived
          and lower(ma.alias) = lower(btrim(p_preferred_alias))
        limit 1;

        if v_preferred_alias_id is null then
            raise exception 'merchant_preferred_invalid'
                using errcode = '22023', detail = 'merchant_preferred_invalid';
        end if;

        update public.merchant_alias
        set is_preferred = true, updated_by = v_user_id
        where id = v_preferred_alias_id;
    end if;

    return true;
end;
$$;

revoke all on function public.update_merchant_with_tags(
    uuid, uuid, text, text, text, text, uuid[], text[], uuid[], text
) from public, anon, service_role;
grant execute on function public.update_merchant_with_tags(
    uuid, uuid, text, text, text, text, uuid[], text[], uuid[], text
) to authenticated;

comment on function public.update_merchant_with_tags(
    uuid, uuid, text, text, text, text, uuid[], text[], uuid[], text
) is '同事务更新商家基础资料、分类、别名及显示名，锁定商家行防止并发破坏首选别名唯一约束。';
