-- Issue #416：区分交易记录人与消费者。
-- 消费者挂在 transaction_record 级别，一笔交易可以关联多个当前账本 active 成员。

create table public.transaction_consumer (
    ledger_id uuid not null,
    transaction_record_id uuid not null,
    user_id uuid not null references public.app_user(id) on delete restrict,

    created_by uuid references public.app_user(id),
    created_at timestamptz not null default now(),

    constraint transaction_consumer_pkey
        primary key (transaction_record_id, user_id),

    constraint transaction_consumer_record_same_ledger_fk
        foreign key (transaction_record_id, ledger_id)
        references public.transaction_record (id, ledger_id)
        on delete cascade
);

create index transaction_consumer_ledger_id_idx
on public.transaction_consumer (ledger_id);

create index transaction_consumer_user_id_idx
on public.transaction_consumer (user_id);

-- 消费者必须始终是同一账本内的 active 成员，且 app_user 本身仍为 active。
create function public.validate_transaction_consumer_active_member()
returns trigger
language plpgsql
as $$
begin
    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au on au.id = lm.user_id
        where lm.ledger_id = new.ledger_id
          and lm.user_id = new.user_id
          and lm.status = 'active'
          and au.status = 'active'
    ) then
        raise exception 'consumer_invalid'
            using errcode = '22023', detail = 'consumer_invalid';
    end if;

    return new;
end;
$$;

create trigger transaction_consumer_validate_active_member
before insert or update on public.transaction_consumer
for each row
execute function public.validate_transaction_consumer_active_member();

alter table public.transaction_consumer enable row level security;

create policy transaction_consumer_select_active_ledger_member
on public.transaction_consumer
for select
to authenticated
using (
    public.current_user_is_active_ledger_member(ledger_id)
);

create policy transaction_consumer_insert_transaction_editor
on public.transaction_consumer
for insert
to authenticated
with check (
    public.current_user_can_mutate_transaction(
        ledger_id,
        transaction_record_id
    )
);

create policy transaction_consumer_delete_transaction_editor
on public.transaction_consumer
for delete
to authenticated
using (
    public.current_user_can_mutate_transaction(
        ledger_id,
        transaction_record_id
    )
);

-- 公开 RPC 统一通过这个内部函数替换消费者集合。
-- 函数本身不开放给客户端；active 成员校验同时由这里和表触发器各自兜底。
create function public.replace_transaction_consumers(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_consumer_user_ids uuid[],
    p_default_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_consumer_user_ids uuid[];
begin
    if not exists (
        select 1
        from public.transaction_record tr
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type in ('normal', 'transfer')
    ) then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    if p_consumer_user_ids is null or cardinality(p_consumer_user_ids) = 0 then
        if p_default_user_id is null then
            raise exception 'consumer_invalid'
                using errcode = '22023', detail = 'consumer_invalid';
        end if;
        v_consumer_user_ids := array[p_default_user_id];
    else
        if array_position(p_consumer_user_ids, null) is not null then
            raise exception 'consumer_invalid'
                using errcode = '22023', detail = 'consumer_invalid';
        end if;

        select array_agg(distinct consumer_user_id)
        into v_consumer_user_ids
        from pg_catalog.unnest(p_consumer_user_ids) consumer_user_id;
    end if;

    if v_consumer_user_ids is null
       or cardinality(v_consumer_user_ids) = 0
       or exists (
            select 1
            from pg_catalog.unnest(v_consumer_user_ids) consumer_user_id
            where not exists (
                select 1
                from public.ledger_member lm
                join public.app_user au on au.id = lm.user_id
                where lm.ledger_id = p_ledger_id
                  and lm.user_id = consumer_user_id
                  and lm.status = 'active'
                  and au.status = 'active'
            )
       ) then
        raise exception 'consumer_invalid'
            using errcode = '22023', detail = 'consumer_invalid';
    end if;

    delete from public.transaction_consumer tc
    where tc.ledger_id = p_ledger_id
      and tc.transaction_record_id = p_transaction_record_id;

    insert into public.transaction_consumer (
        ledger_id,
        transaction_record_id,
        user_id,
        created_by
    )
    select
        p_ledger_id,
        p_transaction_record_id,
        lm.user_id,
        auth.uid()
    from public.ledger_member lm
    where lm.ledger_id = p_ledger_id
      and lm.status = 'active'
      and lm.user_id = any(v_consumer_user_ids)
    order by lm.joined_at, lm.user_id;
end;
$$;

revoke all on function public.replace_transaction_consumers(
    uuid, uuid, uuid[], uuid
) from public, anon, authenticated;

-- 所有新建交易（包括转账和未来复用 transaction_record 的写入路径）先自动绑定记录人。
-- 普通记账公开 RPC 若收到显式消费者，会在同一事务内再替换为最终集合。
create function public.set_default_transaction_consumer()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if new.created_by is not null
       and new.status = 'active'
       and new.type in ('normal', 'transfer') then
        perform public.replace_transaction_consumers(
            new.ledger_id,
            new.id,
            array[new.created_by],
            new.created_by
        );
    end if;

    return new;
end;
$$;

revoke all on function public.set_default_transaction_consumer()
from public, anon, authenticated;

create trigger transaction_record_set_default_consumer
after insert on public.transaction_record
for each row
execute function public.set_default_transaction_consumer();

-- 既存记录以原 created_by 作为默认消费者回填；已经不是 active 成员的历史记录不写入，
-- 避免破坏“消费者必须是当前 active 成员”的数据库约束。
insert into public.transaction_consumer (
    ledger_id,
    transaction_record_id,
    user_id,
    created_by,
    created_at
)
select
    tr.ledger_id,
    tr.id,
    tr.created_by,
    tr.created_by,
    tr.created_at
from public.transaction_record tr
join public.ledger_member lm
  on lm.ledger_id = tr.ledger_id
 and lm.user_id = tr.created_by
 and lm.status = 'active'
join public.app_user au
  on au.id = tr.created_by
 and au.status = 'active'
where tr.status = 'active'
  and tr.type in ('normal', 'transfer')
  and tr.created_by is not null
on conflict (transaction_record_id, user_id) do nothing;

-- create_transaction：保留现有锁顺序 wrapper，只追加可选消费者参数。
drop function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
);

create function public.create_transaction(
    p_ledger_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid default null,
    p_note text default null,
    p_consumer_user_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_requires_link_lock boolean := false;
    v_transaction_record_id uuid;
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    if jsonb_typeof(p_items) = 'array' then
        select exists (
            select 1
            from jsonb_array_elements(p_items) item
            where nullif(item ->> 'reimbursementItemId', '') is not null
               or nullif(item ->> 'refundedItemId', '') is not null
               or nullif(item ->> 'specialStatus', '') is not null
        )
        into v_requires_link_lock;
    end if;

    if v_requires_link_lock then
        perform 1
        from public.ledger l
        where l.id = p_ledger_id
        for update;
    end if;

    v_transaction_record_id := public.create_transaction_locked_impl(
        p_ledger_id,
        p_type,
        p_transaction_at,
        p_items,
        p_account_id,
        p_merchant_id,
        p_note
    );

    perform public.replace_transaction_consumers(
        p_ledger_id,
        v_transaction_record_id,
        p_consumer_user_ids,
        v_user_id
    );

    return v_transaction_record_id;
end;
$$;

revoke all on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text, uuid[]
) from public, anon;
grant execute on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text, uuid[]
) to authenticated;

-- update_transaction：省略消费者参数时保持原集合；显式传入空数组时恢复为原记录人。
drop function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
);

create function public.update_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid,
    p_note text default null,
    p_consumer_user_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_requires_link_lock boolean := p_type = 'income';
    v_record_created_by uuid;
    v_transaction_record_id uuid;
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;

    if not v_requires_link_lock and jsonb_typeof(p_items) = 'array' then
        select exists (
            select 1
            from jsonb_array_elements(p_items) item
            where nullif(item ->> 'reimbursementItemId', '') is not null
               or nullif(item ->> 'refundedItemId', '') is not null
               or nullif(item ->> 'specialStatus', '') is not null
        )
        into v_requires_link_lock;
    end if;

    if v_requires_link_lock then
        perform 1
        from public.ledger l
        where l.id = p_ledger_id
        for update;
    end if;

    v_transaction_record_id := public.update_transaction_locked_impl(
        p_ledger_id,
        p_transaction_record_id,
        p_type,
        p_transaction_at,
        p_items,
        p_account_id,
        p_merchant_id,
        p_note
    );

    if p_consumer_user_ids is not null then
        select tr.created_by
        into v_record_created_by
        from public.transaction_record tr
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id
          and tr.status = 'active';

        perform public.replace_transaction_consumers(
            p_ledger_id,
            p_transaction_record_id,
            p_consumer_user_ids,
            v_record_created_by
        );
    end if;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text, uuid[]
) from public, anon;
grant execute on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text, uuid[]
) to authenticated;


-- 转账新增 / 编辑也接受显式消费者；保留旧签名给既有调用方，应用层始终调用带消费者的新签名。
create function public.create_transfer_transaction(
    p_ledger_id uuid,
    p_transaction_at timestamptz,
    p_amount numeric,
    p_from_account_id uuid,
    p_to_account_id uuid,
    p_note text,
    p_consumer_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_transaction_record_id uuid;
begin
    v_transaction_record_id := public.create_transfer_transaction(
        p_ledger_id,
        p_transaction_at,
        p_amount,
        p_from_account_id,
        p_to_account_id,
        p_note
    );

    perform public.replace_transaction_consumers(
        p_ledger_id,
        v_transaction_record_id,
        p_consumer_user_ids,
        v_user_id
    );

    return v_transaction_record_id;
end;
$$;

revoke all on function public.create_transfer_transaction(
    uuid, timestamptz, numeric, uuid, uuid, text, uuid[]
) from public, anon;
grant execute on function public.create_transfer_transaction(
    uuid, timestamptz, numeric, uuid, uuid, text, uuid[]
) to authenticated;

create function public.update_transfer_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_at timestamptz,
    p_amount numeric,
    p_from_account_id uuid,
    p_to_account_id uuid,
    p_note text,
    p_consumer_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_record_created_by uuid;
    v_transaction_record_id uuid;
begin
    v_transaction_record_id := public.update_transfer_transaction(
        p_ledger_id,
        p_transaction_record_id,
        p_transaction_at,
        p_amount,
        p_from_account_id,
        p_to_account_id,
        p_note
    );

    if p_consumer_user_ids is not null then
        select tr.created_by
        into v_record_created_by
        from public.transaction_record tr
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id
          and tr.status = 'active';

        perform public.replace_transaction_consumers(
            p_ledger_id,
            p_transaction_record_id,
            p_consumer_user_ids,
            v_record_created_by
        );
    end if;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.update_transfer_transaction(
    uuid, uuid, timestamptz, numeric, uuid, uuid, text, uuid[]
) from public, anon;
grant execute on function public.update_transfer_transaction(
    uuid, uuid, timestamptz, numeric, uuid, uuid, text, uuid[]
) to authenticated;

-- 类型转换为普通交易时同样把消费者交给 update_transaction；转换为转账时默认保持既有集合。
drop function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
);

create function public.convert_transaction_type_with_special_status(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_target_type text,
    p_transaction_at timestamptz,
    p_note text default null,
    p_account_id uuid default null,
    p_merchant_id uuid default null,
    p_items jsonb default null,
    p_from_account_id uuid default null,
    p_to_account_id uuid default null,
    p_transfer_amount numeric default null,
    p_consumer_user_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
    v_record_created_by uuid;
begin
    v_transaction_record_id := public.convert_transaction_type(
        p_ledger_id,
        p_transaction_record_id,
        p_target_type,
        p_transaction_at,
        p_note,
        p_account_id,
        p_merchant_id,
        p_items,
        p_from_account_id,
        p_to_account_id,
        p_transfer_amount
    );

    if p_target_type <> 'transfer' then
        perform public.update_transaction(
            p_ledger_id,
            p_transaction_record_id,
            p_target_type,
            p_transaction_at,
            p_items,
            p_account_id,
            p_merchant_id,
            p_note,
            p_consumer_user_ids
        );
    elsif p_consumer_user_ids is not null then
        select tr.created_by
        into v_record_created_by
        from public.transaction_record tr
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id
          and tr.status = 'active';

        perform public.replace_transaction_consumers(
            p_ledger_id,
            p_transaction_record_id,
            p_consumer_user_ids,
            v_record_created_by
        );
    end if;

    return v_transaction_record_id;
end;
$$;

revoke all on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric, uuid[]
) from public, anon;
grant execute on function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric, uuid[]
) to authenticated;

-- 已关联交易的原子编辑也在同一 RPC 事务内更新消费者，避免只改消费者时发生部分提交。
drop function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb
);

create function public.update_linked_transaction_edit(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_at timestamptz,
    p_merchant_id uuid,
    p_note text,
    p_item_updates jsonb,
    p_consumer_user_ids uuid[] default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_transaction_item_id uuid;
    v_expected_updated_at timestamptz;
    v_amount numeric;
    v_account_id uuid;
    v_category_id uuid;
    v_record_created_by uuid;
begin
    if v_user_id is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;

    if not public.current_user_can_mutate_transaction(
        p_ledger_id,
        p_transaction_record_id
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid'
            using errcode = '22023', detail = 'transaction_at_invalid';
    end if;

    if p_note is not null and char_length(p_note) > 2000 then
        raise exception 'note_too_long'
            using errcode = '22023', detail = 'note_too_long';
    end if;

    if jsonb_typeof(p_item_updates) is distinct from 'array' then
        raise exception 'linked_edit_items_invalid'
            using errcode = '22023', detail = 'linked_edit_items_invalid';
    end if;

    if p_merchant_id is null or (
        not exists (
            select 1
            from public.merchant m
            where m.id = p_merchant_id
              and m.ledger_id = p_ledger_id
              and m.is_archived = false
        )
        and not exists (
            select 1
            from public.transaction_record tr
            where tr.id = p_transaction_record_id
              and tr.ledger_id = p_ledger_id
              and tr.status = 'active'
              and tr.type = 'normal'
              and tr.merchant_id = p_merchant_id
        )
    ) then
        raise exception 'merchant_invalid'
            using errcode = '22023', detail = 'merchant_invalid';
    end if;

    for v_item in
        select value
        from pg_catalog.jsonb_array_elements(p_item_updates)
        order by value ->> 'transactionItemId'
    loop
        if jsonb_typeof(v_item) is distinct from 'object' then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        begin
            v_transaction_item_id :=
                nullif(v_item ->> 'transactionItemId', '')::uuid;
            v_expected_updated_at :=
                nullif(v_item ->> 'expectedUpdatedAt', '')::timestamptz;
            v_amount := nullif(v_item ->> 'amount', '')::numeric;
            v_account_id := nullif(v_item ->> 'accountId', '')::uuid;
            v_category_id := nullif(v_item ->> 'categoryId', '')::uuid;
        exception
            when invalid_text_representation
                or invalid_datetime_format
                or datetime_field_overflow
                or numeric_value_out_of_range
            then
                raise exception 'linked_edit_items_invalid'
                    using errcode = '22023', detail = 'linked_edit_items_invalid';
        end;

        if v_transaction_item_id is null
           or v_expected_updated_at is null
           or v_amount is null
           or v_account_id is null
           or v_category_id is null then
            raise exception 'linked_edit_items_invalid'
                using errcode = '22023', detail = 'linked_edit_items_invalid';
        end if;

        perform public.update_linked_transaction_item(
            p_ledger_id,
            p_transaction_record_id,
            v_transaction_item_id,
            v_expected_updated_at,
            v_amount,
            v_account_id,
            v_category_id
        );
    end loop;

    update public.transaction_record tr
    set
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal';

    if not found then
        raise exception 'transaction_not_found'
            using errcode = '22023', detail = 'transaction_not_found';
    end if;

    if p_consumer_user_ids is not null then
        select tr.created_by
        into v_record_created_by
        from public.transaction_record tr
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id
          and tr.status = 'active';

        perform public.replace_transaction_consumers(
            p_ledger_id,
            p_transaction_record_id,
            p_consumer_user_ids,
            v_record_created_by
        );
    end if;
end;
$$;

revoke all on function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb, uuid[]
) from public, anon;
grant execute on function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb, uuid[]
) to authenticated;
