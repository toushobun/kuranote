-- 生活地区独立于记账币种；存量账本只在此次迁移中按币种回填。
alter table public.ledger add column living_region text
    constraint ledger_living_region_check check (living_region in ('jp', 'cn'));
update public.ledger set living_region = case base_currency when 'JPY' then 'jp' when 'CNY' then 'cn' end;


drop function public.create_ledger_setup(text, text, text, text);

CREATE OR REPLACE FUNCTION "public"."create_ledger_setup"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text", "p_living_region" "text" DEFAULT NULL) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_ledger_id uuid;
    v_constraint text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    perform public.validate_ledger_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    if not public.current_app_user_is_active() then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    if p_living_region is not null and p_living_region not in ('jp', 'cn') then
        raise exception 'ledger_setup_region_required' using errcode = '22023', detail = 'ledger_setup_region_required';
    end if;

    begin
        insert into public.ledger (
            name,
            base_currency,
            living_region,
            owner_user_id,
            setup_status,
            setup_step,
            setup_draft,
            created_by,
            updated_by
        )
        values (
            btrim(p_name),
            upper(btrim(p_base_currency)),
            p_living_region,
            v_user_id,
            'in_progress',
            2,
            '{}'::jsonb,
            v_user_id,
            v_user_id
        )
        returning id into v_ledger_id;
    exception when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'ledger_owner_in_progress_setup_key' then
            raise exception 'ledger_setup_in_progress_exists'
                using errcode = '23505', detail = 'ledger_setup_in_progress_exists';
        end if;
        raise;
    end;

    perform public.bootstrap_ledger_owner_member(v_ledger_id, v_user_id);

    perform public.upsert_ledger_member_display_setting(
        v_ledger_id,
        v_user_id,
        p_display_name,
        p_display_color
    );

    return v_ledger_id;
end;
$$;

revoke all on function public.create_ledger_setup(text, text, text, text, text) from public;
grant execute on function public.create_ledger_setup(text, text, text, text, text) to authenticated;

drop function public.update_ledger_setup_basic_info(uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION "public"."update_ledger_setup_basic_info"("p_ledger_id" "uuid", "p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text", "p_living_region" "text" DEFAULT NULL) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
    v_currency text;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);

    perform public.validate_ledger_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    if p_living_region is not null and p_living_region not in ('jp', 'cn') then
        raise exception 'ledger_setup_region_required' using errcode = '22023', detail = 'ledger_setup_region_required';
    end if;
    v_currency := upper(btrim(p_base_currency));

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set name = btrim(p_name),
           base_currency = v_currency,
           living_region = coalesce(p_living_region, living_region),
           setup_draft = case
               when p_living_region is null or p_living_region is not distinct from living_region then setup_draft
               else setup_draft || jsonb_build_object('templateRegion', p_living_region)
                   || case when living_region is not null and setup_draft ? 'merchants' then
                       jsonb_build_object('merchants', (setup_draft -> 'merchants') || jsonb_build_object('additionalRegions', jsonb_build_array(living_region)))
                      else '{}'::jsonb end
                   || case when living_region is not null and setup_draft ? 'accounts' then
                       jsonb_build_object('accounts', (setup_draft -> 'accounts') || jsonb_build_object('additionalRegions', jsonb_build_array(living_region)))
                      else '{}'::jsonb end
           end,
           updated_by = v_user_id
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);

    perform public.upsert_ledger_member_display_setting(
        p_ledger_id,
        v_user_id,
        p_display_name,
        p_display_color
    );
end;
$$;

revoke all on function public.update_ledger_setup_basic_info(uuid, text, text, text, text, text) from public;
grant execute on function public.update_ledger_setup_basic_info(uuid, text, text, text, text, text) to authenticated;

drop function public.get_current_user_setup_ledger();

CREATE OR REPLACE FUNCTION "public"."get_current_user_setup_ledger"() RETURNS TABLE("ledger_id" "uuid", "ledger_name" "text", "base_currency" "text", "setup_step" smallint, "setup_draft" "jsonb", "living_region" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
    select
        l.id,
        l.name,
        l.base_currency,
        l.setup_step,
        l.setup_draft,
        l.living_region
    from public.ledger l
    where l.owner_user_id = auth.uid()
      and l.setup_status = 'in_progress'
      and l.is_archived = false
      and public.current_user_has_ledger_role(l.id, array['owner']::text[])
    limit 1;
$$;

revoke all on function public.get_current_user_setup_ledger() from public;
grant execute on function public.get_current_user_setup_ledger() to authenticated;

CREATE OR REPLACE FUNCTION "public"."save_ledger_setup_draft"("p_ledger_id" "uuid", "p_step" integer, "p_draft" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_ledger public.ledger;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);

    if p_step is null or p_step < 1 or p_step > 5 then
        raise exception 'ledger_setup_step_invalid'
            using errcode = '22023', detail = 'ledger_setup_step_invalid';
    end if;

    if p_draft is null or jsonb_typeof(p_draft) <> 'object' then
        raise exception 'ledger_setup_draft_invalid'
            using errcode = '22023', detail = 'ledger_setup_draft_invalid';
    end if;

    if octet_length(p_draft::text) > public.ledger_setup_draft_max_bytes() then
        raise exception 'ledger_setup_draft_too_large'
            using errcode = '22023', detail = 'ledger_setup_draft_too_large';
    end if;

    if p_draft ->> 'templateRegion' is distinct from v_ledger.living_region then
        raise exception 'ledger_setup_region_mismatch'
            using errcode = '22023', detail = 'ledger_setup_region_mismatch';
    end if;

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set setup_step = p_step,
           setup_draft = p_draft,
           updated_by = auth.uid()
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."validate_ledger_setup_completion_payload"("p_payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
begin
    if p_payload is null
       or jsonb_typeof(p_payload) <> 'object'
       or jsonb_typeof(p_payload -> 'accounts') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'merchantTags') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'merchants') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'specialStatusEnabled') is distinct from 'boolean'
       or jsonb_typeof(p_payload -> 'multiAccountPaymentEnabled') is distinct from 'boolean'
       or jsonb_array_length(p_payload -> 'accounts') > 50
       or jsonb_array_length(p_payload -> 'merchantTags') > 50
       or jsonb_array_length(p_payload -> 'merchants') > 300 then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 账户：类型枚举、名称长度；同一类型内名称（忽略大小写）不重复。
    -- 向导中账户的币种与持有人都相同，因此与 account_active_name_unique 的范围一致。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'accounts') a(v)
           where jsonb_typeof(a.v) <> 'object'
              or jsonb_typeof(a.v -> 'type') is distinct from 'string'
              or jsonb_typeof(a.v -> 'name') is distinct from 'string'
              or a.v ->> 'type' not in ('cash', 'bank', 'credit_card', 'e_money')
              or length(btrim(a.v ->> 'name')) not between 1 and 100
       )
       or (
           select count(*)
           from (
               select distinct lower(btrim(a.v ->> 'name')), a.v ->> 'type'
               from jsonb_array_elements(p_payload -> 'accounts') a(v)
           ) distinct_accounts
       ) <> jsonb_array_length(p_payload -> 'accounts') then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 商家标签：key / 名称 / icon 长度；key 与名称（忽略大小写）不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
           where jsonb_typeof(t.v) <> 'object'
              or jsonb_typeof(t.v -> 'key') is distinct from 'string'
              or jsonb_typeof(t.v -> 'name') is distinct from 'string'
              or jsonb_typeof(t.v -> 'icon') is distinct from 'string'
              or length(t.v ->> 'key') not between 1 and 100
              or length(btrim(t.v ->> 'name')) not between 1 and 100
              or length(t.v ->> 'icon') not between 1 and 32
       )
       or (
           select count(distinct t.v ->> 'key')
           from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
       ) <> jsonb_array_length(p_payload -> 'merchantTags')
       or (
           select count(distinct lower(btrim(t.v ->> 'name')))
           from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
       ) <> jsonb_array_length(p_payload -> 'merchantTags') then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 商家：名称长度、官网 URL（https、长度）、头像地址、别名与标签引用；名称（忽略大小写）不重复。
    -- 头像地址（iconUrl）为 null，或必须等于按该商家 websiteUrl 生成的 Google favicon 地址：
    -- 即以 https://www.google.com/s2/favicons? 开头、domain_url 为官网 origin，
    -- 与 getReusableMerchantIconUrl 认可的地址格式一致；无官网时只能为 null。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           where jsonb_typeof(m.v) <> 'object'
              or jsonb_typeof(m.v -> 'name') is distinct from 'string'
              or length(btrim(m.v ->> 'name')) not between 1 and 100
              or jsonb_typeof(m.v -> 'websiteUrl') not in ('string', 'null')
              or (
                  jsonb_typeof(m.v -> 'websiteUrl') = 'string'
                  and (
                      m.v ->> 'websiteUrl' !~ '^https://'
                      or length(m.v ->> 'websiteUrl') > 2048
                  )
              )
              or jsonb_typeof(m.v -> 'iconUrl') not in ('string', 'null')
              or (
                  jsonb_typeof(m.v -> 'iconUrl') = 'string'
                  and (m.v ->> 'iconUrl') is distinct from public.merchant_favicon_url(m.v ->> 'websiteUrl')
              )
              or jsonb_typeof(m.v -> 'tagKeys') is distinct from 'array'
              or jsonb_typeof(m.v -> 'aliases') is distinct from 'array'
              or jsonb_array_length(m.v -> 'tagKeys') > 20
              or jsonb_array_length(m.v -> 'aliases') > 20
       )
       or (
           select count(distinct lower(btrim(m.v ->> 'name')))
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
       ) <> jsonb_array_length(p_payload -> 'merchants') then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 标签引用：必须是字符串、存在于 merchantTags 中，且同一商家内不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           cross join lateral jsonb_array_elements(m.v -> 'tagKeys') k(v)
           where jsonb_typeof(k.v) <> 'string'
              or not exists (
                  select 1
                  from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
                  where t.v ->> 'key' = k.v #>> '{}'
              )
       )
       or exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           where (
               select count(distinct k.v)
               from jsonb_array_elements(m.v -> 'tagKeys') k(v)
           ) <> jsonb_array_length(m.v -> 'tagKeys')
       ) then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 别名：长度与 locale 符合 merchant_alias 的约束；同一商家内（忽略大小写）不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           cross join lateral jsonb_array_elements(m.v -> 'aliases') a(v)
           where jsonb_typeof(a.v) <> 'object'
              or jsonb_typeof(a.v -> 'alias') is distinct from 'string'
              or length(btrim(a.v ->> 'alias')) not between 1 and 100
              or jsonb_typeof(a.v -> 'locale') not in ('string', 'null')
              or (
                  jsonb_typeof(a.v -> 'locale') = 'string'
                  and length(btrim(a.v ->> 'locale')) not between 2 and 20
              )
       )
       or exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           where (
               select count(distinct lower(btrim(a.v ->> 'alias')))
               from jsonb_array_elements(m.v -> 'aliases') a(v)
           ) <> jsonb_array_length(m.v -> 'aliases')
       ) then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."complete_ledger_setup"("p_ledger_id" "uuid", "p_payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
    v_item record;
    v_account_id uuid;
    v_merchant_id uuid;
    v_tag_id uuid;
    v_tag_ids jsonb := '{}'::jsonb;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);

    perform public.validate_ledger_setup_completion_payload(p_payload);
    if v_ledger.living_region is not null and p_payload ->> 'templateRegion' is distinct from v_ledger.living_region then
        raise exception 'ledger_setup_region_mismatch' using errcode = '22023', detail = 'ledger_setup_region_mismatch';
    end if;
    perform set_config('app.ledger_setup_completion_ledger_id', p_ledger_id::text, true);

    perform public.initialize_ledger_default_categories(p_ledger_id, v_user_id);

    for v_item in
        select a.v, a.ordinality
        from jsonb_array_elements(p_payload -> 'accounts') with ordinality a(v, ordinality)
        order by a.ordinality
    loop
        insert into public.account (
            ledger_id,
            name,
            type,
            currency,
            initial_balance,
            sort_order,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            btrim(v_item.v ->> 'name'),
            v_item.v ->> 'type',
            v_ledger.base_currency,
            0,
            v_item.ordinality - 1,
            v_user_id,
            v_user_id
        )
        returning id into v_account_id;

        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            v_account_id,
            v_user_id,
            'owner',
            v_user_id,
            v_user_id
        );
    end loop;

    for v_item in
        select t.v, t.ordinality
        from jsonb_array_elements(p_payload -> 'merchantTags') with ordinality t(v, ordinality)
        order by t.ordinality
    loop
        insert into public.merchant_tags (
            ledger_id,
            name,
            icon,
            sort_order,
            created_by
        ) values (
            p_ledger_id,
            btrim(v_item.v ->> 'name'),
            v_item.v ->> 'icon',
            v_item.ordinality - 1,
            v_user_id
        )
        returning id into v_tag_id;

        v_tag_ids := v_tag_ids || jsonb_build_object(v_item.v ->> 'key', v_tag_id);
    end loop;

    for v_item in
        select m.v, m.ordinality
        from jsonb_array_elements(p_payload -> 'merchants') with ordinality m(v, ordinality)
        order by m.ordinality
    loop
        insert into public.merchant (
            ledger_id,
            name,
            website_url,
            icon_url,
            sort_order,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            btrim(v_item.v ->> 'name'),
            v_item.v ->> 'websiteUrl',
            v_item.v ->> 'iconUrl',
            v_item.ordinality - 1,
            v_user_id,
            v_user_id
        )
        returning id into v_merchant_id;

        insert into public.merchant_alias (
            merchant_id,
            alias,
            locale,
            sort_order,
            created_by,
            updated_by
        )
        select
            v_merchant_id,
            btrim(a.v ->> 'alias'),
            nullif(btrim(a.v ->> 'locale'), ''),
            a.ordinality - 1,
            v_user_id,
            v_user_id
        from jsonb_array_elements(v_item.v -> 'aliases') with ordinality a(v, ordinality);

        insert into public.merchant_tag_links (merchant_id, tag_id)
        select v_merchant_id, (v_tag_ids ->> k.tag_key)::uuid
        from jsonb_array_elements_text(v_item.v -> 'tagKeys') k(tag_key);
    end loop;

    perform set_config('app.ledger_setup_completion_ledger_id', '', true);

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set transaction_item_special_status_enabled = (p_payload ->> 'specialStatusEnabled')::boolean,
           multi_account_payment_enabled = (p_payload ->> 'multiAccountPaymentEnabled')::boolean,
           setup_status = 'completed',
           setup_step = null,
           setup_draft = null,
           updated_by = v_user_id
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);

    update public.app_user
       set current_ledger_id = p_ledger_id,
           updated_by = v_user_id
     where id = v_user_id;
end;
$$;

drop function public.add_merchant_presets(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION "public"."add_merchant_presets"("p_ledger_id" "uuid", "p_regions" "text"[], "p_payload" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();

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
    perform l.id
      from public.ledger l
     where l.id = p_ledger_id and l.is_archived = false and l.setup_status = 'completed'
       for update;

    -- 等待锁期间成员权限可能已改变，必须再次校验。
    if not found or not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501', detail = 'permission_denied';
    end if;
    if p_regions is null or cardinality(p_regions) not between 1 and 2
       or exists (select 1 from unnest(p_regions) r where r is null or r not in ('jp', 'cn')) then
        raise exception 'merchant_preset_invalid' using errcode = '22023', detail = 'merchant_preset_invalid';
    end if;
    if exists (select 1 from jsonb_array_elements(p_payload -> 'merchants') m
        where jsonb_typeof(m -> 'matchNames') is distinct from 'array'
           or jsonb_array_length(m -> 'matchNames') = 0
           or jsonb_array_length(m -> 'matchNames') > 21) then
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
               and (lower(btrim(m.name)) = lower(btrim(v_item ->> 'name')) or exists (
                   select 1
                     from (
                         select value as name from jsonb_array_elements_text(v_item -> 'matchNames')
                     ) preset
                    where lower(btrim(preset.name)) = lower(btrim(m.name))
                       or exists (
                           select 1 from public.merchant_alias a
                            where a.merchant_id = m.id
                              and a.is_archived = false
                              and lower(btrim(a.alias)) = lower(btrim(preset.name))
                       )
               ))
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

revoke all on function public.add_merchant_presets(uuid, text[], jsonb) from public;
grant execute on function public.add_merchant_presets(uuid, text[], jsonb) to authenticated;
