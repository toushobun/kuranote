begin;

-- Issue #931：账本设置增加多账户付款开关。
--
-- 1. ledger.multi_account_payment_enabled：默认关闭，与 transaction_item_special_status_enabled 相同。
-- 2. 已有多账户记录（有效记录的 transaction_payment 有 2 行及以上）的账本回填为开启。
-- 3. 账本仍有多账户记录时禁止关闭（参考 prevent_disable_special_status_with_active_items）。
-- 4. complete_ledger_setup 接收 payload.multiAccountPaymentEnabled，
--    validate_ledger_setup_completion_payload 要求其为 boolean。
--    账本设置页直接 update ledger（与特殊状态开关相同），不经过 RPC。
-- 5. replace_transaction_payments：开关关闭时拒绝多于 1 个付款账户
--    （新建、编辑、类型转换、关联编辑都经过这里）。以 20261019150000 的定义为基础重建。
--
-- 只看 status = 'active' 的记录：作废记录不会再被编辑，不影响开关。

alter table public.ledger
    add column multi_account_payment_enabled boolean not null default false;

update public.ledger l
   set multi_account_payment_enabled = true
 where exists (
     select 1
     from public.transaction_payment p
     join public.transaction_record tr
       on tr.id = p.transaction_record_id
      and tr.ledger_id = p.ledger_id
     where p.ledger_id = l.id
       and tr.status = 'active'
     group by p.transaction_record_id
     having count(*) >= 2
 );

create or replace function public.prevent_disable_multi_account_payment_with_records()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if new.multi_account_payment_enabled = false
       and old.multi_account_payment_enabled = true
       and exists (
           select 1
           from public.transaction_payment p
           join public.transaction_record tr
             on tr.id = p.transaction_record_id
            and tr.ledger_id = p.ledger_id
           where p.ledger_id = new.id
             and tr.status = 'active'
           group by p.transaction_record_id
           having count(*) >= 2
       ) then
        raise exception 'multi_account_payment_has_records'
            using errcode = '55006', detail = 'multi_account_payment_has_records';
    end if;

    return new;
end;
$$;

revoke all on function public.prevent_disable_multi_account_payment_with_records()
from public, anon, authenticated, service_role;

create trigger ledger_validate_multi_account_payment_disable
before update of multi_account_payment_enabled
on public.ledger
for each row execute function public.prevent_disable_multi_account_payment_with_records();

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
       or jsonb_typeof(p_payload -> 'multiAccountPaymentEnabled') is distinct from 'boolean'
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

revoke all on function public.complete_ledger_setup(uuid, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.complete_ledger_setup(uuid, jsonb) to authenticated;

create or replace function public.replace_transaction_payments(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_payments jsonb,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_payment_index integer;
    v_account_id uuid;
    v_amount numeric;
    v_delta numeric(14,2);
    v_new_account_ids uuid[];
    v_new_deltas numeric(14,2)[] := array[]::numeric(14,2)[];
    v_old_account_ids uuid[];
    v_old_deltas numeric(14,2)[];
    v_all_account_ids uuid[];
    v_locked_account_count integer;
    v_multi_account_payment_enabled boolean;
begin
    v_new_account_ids := public.transaction_payment_account_ids(p_ledger_id, p_payments);

    if array_length(v_new_account_ids, 1) = 1 then
        -- 单账户不提交金额：余额变动 = Σ收入明细 − Σ支出明细，与逐条明细 ±金额 的合计一致。
        select coalesce(sum(case when c.type = 'income' then ti.amount else -ti.amount end), 0)
        into v_delta
        from public.transaction_item ti
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id;

        v_new_deltas := array[v_delta];
    else
        -- 账本关闭多账户付款时拒绝多行（#931）。与 prevent_disable_multi_account_payment_with_records
        -- 互斥：锁住账本行，避免关闭开关与保存多账户记录并发时两边都通过检查。
        -- 与 validate_transaction_item_special_status 读取开关时的锁等级一致（FOR UPDATE），
        -- 并在下面锁账户之前取得，保持 record → ledger → account 的锁顺序。
        select l.multi_account_payment_enabled
        into v_multi_account_payment_enabled
        from public.ledger l
        where l.id = p_ledger_id
        for update;

        if v_multi_account_payment_enabled is distinct from true then
            raise exception 'payment_multi_account_disabled'
                using errcode = '22023', detail = 'payment_multi_account_disabled';
        end if;

        -- 多账户：每行必须提交金额，全部记为支出。
        for v_payment_index in 0..array_length(v_new_account_ids, 1) - 1
        loop
            begin
                v_amount := nullif(p_payments -> v_payment_index ->> 'amount', '')::numeric;
            exception when invalid_text_representation then
                raise exception 'amount_invalid'
                    using errcode = '22023', detail = 'amount_invalid';
            end;

            if v_amount is null then
                raise exception 'payment_amount_required'
                    using errcode = '22023', detail = 'payment_amount_required';
            end if;

            if v_amount < 0 or v_amount <> round(v_amount, 2) or v_amount >= 1e12 then
                raise exception 'amount_invalid'
                    using errcode = '22023', detail = 'amount_invalid';
            end if;

            v_new_deltas := array_append(v_new_deltas, (-v_amount)::numeric(14,2));
        end loop;
    end if;

    select
        coalesce(array_agg(p.account_id order by p.account_id), array[]::uuid[]),
        coalesce(array_agg(p.balance_delta order by p.account_id), array[]::numeric(14,2)[])
    into v_old_account_ids, v_old_deltas
    from public.transaction_payment p
    where p.transaction_record_id = p_transaction_record_id
      and p.ledger_id = p_ledger_id;

    -- 锁顺序：调用方已锁 ledger（需要时）→ record → item / 关联目标；这里按 UUID 一次性锁「旧 ∪ 新」账户。
    -- 使用 FOR NO KEY UPDATE：与余额 UPDATE 本身的锁等级一致，不与明细 / 付款明细外键检查的
    -- KEY SHARE 冲突，避免「先写明细、后锁账户」的两个事务交叉等待。
    v_all_account_ids := array(
        select distinct account_id
        from unnest(v_old_account_ids || v_new_account_ids) as account_id
        order by account_id
    );

    perform 1
    from public.account a
    where a.ledger_id = p_ledger_id
      and a.id = any(v_all_account_ids)
    order by a.id
    for no key update;
    get diagnostics v_locked_account_count = row_count;

    -- 新账户必须属于本账本且未归档；旧账户已归档时与现状一致，整笔不可编辑。
    if v_locked_account_count <> coalesce(array_length(v_all_account_ids, 1), 0)
       or exists (
           select 1
           from public.account a
           where a.ledger_id = p_ledger_id
             and a.id = any(v_all_account_ids)
             and a.is_archived
       ) then
        raise exception 'account_invalid'
            using errcode = '22023', detail = 'account_invalid';
    end if;

    delete from public.transaction_payment p
    where p.transaction_record_id = p_transaction_record_id
      and p.ledger_id = p_ledger_id;

    insert into public.transaction_payment (
        ledger_id, transaction_record_id, account_id, amount, balance_delta,
        sort_order, created_by
    )
    select
        p_ledger_id,
        p_transaction_record_id,
        new_payment.account_id,
        abs(new_payment.balance_delta),
        new_payment.balance_delta,
        (new_payment.ordinality - 1)::integer,
        p_user_id
    from unnest(v_new_account_ids, v_new_deltas)
        with ordinality as new_payment(account_id, balance_delta, ordinality);

    for v_account_id, v_delta in
        select movement.account_id, sum(movement.balance_delta)
        from (
            select account_id, balance_delta
            from unnest(v_new_account_ids, v_new_deltas) as n(account_id, balance_delta)
            union all
            select account_id, -balance_delta
            from unnest(v_old_account_ids, v_old_deltas) as o(account_id, balance_delta)
        ) movement
        group by movement.account_id
        having sum(movement.balance_delta) <> 0
        order by movement.account_id
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_account_id,
            v_delta,
            p_user_id
        );
    end loop;
end;
$$;

revoke all on function public.replace_transaction_payments(uuid, uuid, jsonb, uuid) from public, anon, authenticated, service_role;

commit;
