drop function if exists public.create_merchant_with_tags(uuid, text, text, text, uuid[]);
drop function if exists public.update_merchant_with_tags(uuid, uuid, text, text, text, uuid[]);

create function public.create_merchant_with_tags(
    p_ledger_id uuid,
    p_name text,
    p_website_url text,
    p_icon_url text,
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
        ledger_id, name, website_url, icon_url, note, sort_order, created_by, updated_by
    ) values (
        p_ledger_id, p_name, p_website_url, p_icon_url, p_note, 0, v_user_id, v_user_id
    )
    returning id into v_merchant_id;

    insert into public.merchant_tag_links (merchant_id, tag_id)
    select v_merchant_id, submitted.tag_id
    from unnest(coalesce(p_tag_ids, '{}'::uuid[])) submitted(tag_id);

    return v_merchant_id;
end;
$$;

create function public.update_merchant_with_tags(
    p_ledger_id uuid,
    p_merchant_id uuid,
    p_name text,
    p_website_url text,
    p_icon_url text,
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
           icon_url = p_icon_url,
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

revoke all on function public.create_merchant_with_tags(uuid, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.create_merchant_with_tags(uuid, text, text, text, text, uuid[]) to authenticated;
revoke all on function public.update_merchant_with_tags(uuid, uuid, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.update_merchant_with_tags(uuid, uuid, text, text, text, text, uuid[]) to authenticated;
