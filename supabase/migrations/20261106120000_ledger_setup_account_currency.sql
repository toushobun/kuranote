-- #1001 创建账本向导：账户候选按地区携带货币（日本 = JPY、中国 = CNY），
-- 完成写入时按每个账户 payload 中的 currency 创建，不再统一使用账本默认货币。
-- 生活地区与账本默认货币解耦后，「人民币现金」等账户须保持与名称一致的货币。

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

    -- 账户：类型枚举、名称长度、货币代码；同一类型内名称（忽略大小写）不重复。
    -- 持有人都相同；不同地区的候选名称不重叠，因此按类型 + 名称判重比 account_active_name_unique 更严格。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'accounts') a(v)
           where jsonb_typeof(a.v) <> 'object'
              or jsonb_typeof(a.v -> 'type') is distinct from 'string'
              or jsonb_typeof(a.v -> 'name') is distinct from 'string'
              or jsonb_typeof(a.v -> 'currency') is distinct from 'string'
              or a.v ->> 'type' not in ('cash', 'bank', 'credit_card', 'e_money')
              or a.v ->> 'currency' !~ '^[A-Z]{3}$'
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
            v_item.v ->> 'currency',
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
