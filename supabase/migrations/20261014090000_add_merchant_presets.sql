begin;

-- Issue #878：模板内容仅由服务端提供，事务内重新判重、沿用标签并一次性写入。
create or replace function public.add_merchant_presets(
    p_ledger_id uuid,
    p_currency text,
    p_payload jsonb
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_currency text;
    v_item jsonb;
    v_tag jsonb;
    v_tag_key text;
    v_tag_id uuid;
    v_tag_ids uuid[];
    v_merchant_id uuid;
    v_count integer := 0;
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501', detail = 'permission_denied';
    end if;

    -- 与商家 / 标签排序使用同一账本锁，两个并发批次不会重复创建商家或标签。
    perform pg_advisory_xact_lock(hashtext(p_ledger_id::text));
    select l.base_currency into v_currency
      from public.ledger l
     where l.id = p_ledger_id and l.is_archived = false and l.setup_status = 'completed'
       for update;

    -- 等待锁期间成员权限可能已改变，必须再次校验。
    if not found or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501', detail = 'permission_denied';
    end if;
    if p_currency is distinct from v_currency then
        raise exception 'merchant_preset_invalid' using errcode = '22023', detail = 'merchant_preset_invalid';
    end if;

    -- 复用向导 payload 的结构、官网 / 头像、别名与标签引用校验。
    perform public.validate_ledger_setup_completion_payload(p_payload);

    for v_item in select value from jsonb_array_elements(p_payload -> 'merchants') loop
        -- 仅有效商家与有效别名参与判重，归档等同删除；已存在的资料完全不修改。
        if exists (
            select 1
              from public.merchant m
             where m.ledger_id = p_ledger_id
               and m.is_archived = false
               and exists (
                   select 1
                     from (
                         select v_item ->> 'name' as name
                         union all
                         select value ->> 'alias' from jsonb_array_elements(v_item -> 'aliases')
                     ) preset
                    where lower(btrim(preset.name)) = lower(btrim(m.name))
                       or exists (
                           select 1 from public.merchant_alias a
                            where a.merchant_id = m.id
                              and a.is_archived = false
                              and lower(btrim(a.alias)) = lower(btrim(preset.name))
                       )
               )
        ) then
            continue;
        end if;

        v_tag_ids := '{}'::uuid[];
        for v_tag_key in select value from jsonb_array_elements_text(v_item -> 'tagKeys') loop
            select value into v_tag from jsonb_array_elements(p_payload -> 'merchantTags')
             where value ->> 'key' = v_tag_key;
            select t.id into v_tag_id from public.merchant_tags t
             where t.ledger_id = p_ledger_id and t.is_archived = false
               and lower(btrim(t.name)) = lower(btrim(v_tag ->> 'name'))
             order by t.created_at, t.id limit 1;
            if v_tag_id is null then
                v_tag_id := public.create_merchant_tag(p_ledger_id, v_tag ->> 'name', v_tag ->> 'icon');
            end if;
            v_tag_ids := array_append(v_tag_ids, v_tag_id);
        end loop;

        v_merchant_id := public.create_merchant_with_tags(
            p_ledger_id => p_ledger_id,
            p_name => v_item ->> 'name',
            p_website_url => v_item ->> 'websiteUrl',
            p_note => null,
            p_tag_ids => v_tag_ids,
            p_icon_url => v_item ->> 'iconUrl'
        );
        insert into public.merchant_alias (merchant_id, alias, locale, sort_order, created_by, updated_by)
        select v_merchant_id, btrim(a.value ->> 'alias'), nullif(btrim(a.value ->> 'locale'), ''),
               a.ordinality - 1, v_user_id, v_user_id
          from jsonb_array_elements(v_item -> 'aliases') with ordinality a(value, ordinality);
        v_count := v_count + 1;
    end loop;
    return v_count;
end;
$$;

revoke all on function public.add_merchant_presets(uuid, text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.add_merchant_presets(uuid, text, jsonb) to authenticated;

commit;
