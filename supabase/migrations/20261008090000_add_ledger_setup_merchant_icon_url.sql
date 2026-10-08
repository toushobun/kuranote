begin;

-- Issue #395：创建账本向导（实施拆分第 10 项）。向导写入的预设商家没有头像。
--
-- 原因：手动新增商家时，服务端用商家官网生成 Google favicon 地址，确认能取到图片后写入
-- merchant.icon_url；complete_ledger_setup 只写入了 website_url，没有写入 icon_url。
--
-- 处理：
-- 1. 完成写入时不逐个抓取几十个商家的图标（会让「完成创建」变慢甚至超时），
--    由 Service 按与手动新增相同的规则（utils/merchants 的 buildMerchantFaviconUrl）
--    直接生成头像地址放入 payload 的 iconUrl。
-- 2. validate_ledger_setup_completion_payload 校验 iconUrl 必须为 null，
--    或等于按该商家 websiteUrl 生成的地址（public.merchant_favicon_url），不信任客户端。
-- 3. complete_ledger_setup 写入 icon_url。icon_fetch_status / icon_fetched_at 与手动新增一致：
--    手动新增（create_merchant_with_tags）只写入 icon_url，这两列保持默认值 'none' / null。
-- 4. 一次性回填已有商家（见文件末尾）。

-- 按商家官网生成 Google favicon 请求地址，与 TypeScript 侧 buildMerchantFaviconUrl 结果一致：
-- https://www.google.com/s2/favicons?domain_url=<官网 origin（URL 编码）>&sz=128。
-- 生成的地址满足 getReusableMerchantIconUrl 的规则（https 的 www.google.com/s2/favicons，
-- 且 domain_url 的 origin 与官网 origin 一致）。
-- 数据库侧只处理主机名为 ASCII 字母、数字、「.」「-」的 http(s) 官网（可带端口，不可带用户信息），
-- 主机名转为小写并省略默认端口，与 URL.origin 的结果相同；其他形式返回 null。
-- 预设模板的官网均满足该形式（ledgerSetupTemplate.test.ts 校验）。
create or replace function public.merchant_favicon_url(p_website_url text)
returns text
language sql immutable parallel safe
set search_path = pg_catalog, pg_temp
as $$
    select 'https://www.google.com/s2/favicons?domain_url='
        || replace(
               replace(
                   regexp_replace(
                       lower(origin_match[1]),
                       '^(https://[^:]+):443$|^(http://[^:]+):80$',
                       '\1\2'
                   ),
                   ':',
                   '%3A'
               ),
               '/',
               '%2F'
           )
        || '&sz=128'
    from regexp_match(
        btrim(p_website_url),
        '^(https?://[A-Za-z0-9.-]+(?::[0-9]{1,5})?)(?:[/?#]|$)',
        'i'
    ) origin_match;
$$;

revoke all on function public.merchant_favicon_url(text) from public, anon, authenticated, service_role;

-- 完成写入 payload 的通用校验：结构、条数上限、字段长度、类型枚举、标签引用存在、
-- 名称在 payload 内不重复。payload 由 Service 根据草稿与代码模板生成；
-- owner 直接调用时最多写入自己账本的普通数据，与完成后手动添加等价。
create or replace function public.validate_ledger_setup_completion_payload(p_payload jsonb)
returns void
language plpgsql immutable
set search_path = pg_catalog, pg_temp
as $$
begin
    if p_payload is null
       or jsonb_typeof(p_payload) <> 'object'
       or jsonb_typeof(p_payload -> 'accounts') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'merchantTags') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'merchants') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'specialStatusEnabled') is distinct from 'boolean'
       or jsonb_array_length(p_payload -> 'accounts') > 50
       or jsonb_array_length(p_payload -> 'merchantTags') > 50
       or jsonb_array_length(p_payload -> 'merchants') > 200 then
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

revoke all on function public.validate_ledger_setup_completion_payload(jsonb) from public, anon, authenticated, service_role;

-- 向导完成写入。同一事务内依次写入默认分类 → 账户 → 商家标签 → 商家 → 商家别名 →
-- 商家标签关联 → 功能开关，再将账本标记为 completed 并切换为当前账本。
-- 账户、商家、商家标签为空（用户跳过）时正常完成。
create or replace function public.complete_ledger_setup(
    p_ledger_id uuid,
    p_payload jsonb
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
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

revoke all on function public.complete_ledger_setup(uuid, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.complete_ledger_setup(uuid, jsonb) to authenticated;


-- 一次性回填：本 migration 之前由向导写入的预设商家没有头像。
-- 范围：website_url 不为空、icon_url 为空、icon_fetch_status = 'none' 的商家，
-- 按与完成写入相同的规则写入 icon_url（数据库侧无法生成地址的官网形式保持不变）。
-- icon_fetch_status 目前没有任何流程会改为 'failed' 等值（手动新增抓取失败时同样保持
-- 'none' 且 icon_url 为空），条件中保留该列，避免今后记录了抓取状态的商家被覆盖。
-- 正式环境目前只有维护者的测试数据。回填逻辑放在函数中，供 smoke 测试验证同一条语句；
-- 不对任何客户端角色开放。migration 以无登录身份执行，商家权限 trigger 放行。
create or replace function public.backfill_merchant_favicon_urls()
returns integer
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_count integer;
begin
    update public.merchant m
       set icon_url = public.merchant_favicon_url(m.website_url)
     where m.website_url is not null
       and m.icon_url is null
       and m.icon_fetch_status = 'none'
       and public.merchant_favicon_url(m.website_url) is not null;

    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

revoke all on function public.backfill_merchant_favicon_urls() from public, anon, authenticated, service_role;

select public.backfill_merchant_favicon_urls();

commit;
