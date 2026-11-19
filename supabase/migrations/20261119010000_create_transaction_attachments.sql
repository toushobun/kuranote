-- #1120：私有小票照片、待认领附件与删除队列。
-- 文件路径只包含账本 ID 和附件 ID，不能由客户端决定。
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('transaction-attachments', 'transaction-attachments', false, 2097152, array['image/jpeg'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy transaction_attachments_storage_read_active_member
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'transaction-attachments'
        and (storage.foldername(name))[1] in (
            select ledger_id::text from public.current_user_active_ledger_ids() as ledger_id
        )
    );
-- 不授予前端 Storage 写策略。所有上传签名、物理删除均经服务端完成。

create table public.transaction_attachment (
    id uuid primary key default extensions.gen_random_uuid(),
    ledger_id uuid not null references public.ledger(id) on delete cascade,
    transaction_record_id uuid references public.transaction_record(id) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'uploaded')),
    storage_path text not null unique,
    thumbnail_path text not null unique,
    byte_size integer not null check (byte_size between 1 and 2097152),
    width integer not null check (width between 1 and 20000),
    height integer not null check (height between 1 and 20000),
    sort_order integer not null default 0 check (sort_order >= 0),
    created_by uuid not null references public.app_user(id),
    created_at timestamptz not null default now(),
    constraint attachment_paths_match_id check (
        storage_path = ledger_id::text || '/' || id::text || '.jpg'
        and thumbnail_path = ledger_id::text || '/' || id::text || '_thumb.jpg'
    ),
    constraint attachment_claim_requires_upload check (
        transaction_record_id is null or status = 'uploaded'
    )
);

create index transaction_attachment_record_order_idx
    on public.transaction_attachment(ledger_id, transaction_record_id, sort_order);
create index transaction_attachment_pending_cleanup_idx
    on public.transaction_attachment(created_at, id)
    where transaction_record_id is null;

alter table public.transaction_attachment enable row level security;
revoke all on public.transaction_attachment from public, anon, authenticated, service_role;
grant select on public.transaction_attachment to authenticated;
grant select, insert, update, delete on public.transaction_attachment to service_role;

create policy transaction_attachment_select_active_member
    on public.transaction_attachment
    for select
    to authenticated
    using (ledger_id in (select public.current_user_active_ledger_ids()));

-- 独立于账本 FK：账本物理删除时队列必须保留，等待 Storage API 清除。
create table public.transaction_attachment_storage_deletion (
    id uuid primary key default extensions.gen_random_uuid(),
    storage_path text not null,
    thumbnail_path text not null,
    created_at timestamptz not null default now(),
    unique (storage_path, thumbnail_path)
);
create index transaction_attachment_storage_deletion_created_idx
    on public.transaction_attachment_storage_deletion(created_at, id);

alter table public.transaction_attachment_storage_deletion enable row level security;
revoke all on public.transaction_attachment_storage_deletion
    from public, anon, authenticated, service_role;
grant select, delete on public.transaction_attachment_storage_deletion to service_role;

create function public.enqueue_transaction_attachment_deletion()
returns trigger language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    insert into public.transaction_attachment_storage_deletion(storage_path, thumbnail_path)
    values (old.storage_path, old.thumbnail_path)
    on conflict (storage_path, thumbnail_path) do nothing;
    return old;
end;
$$;
revoke all on function public.enqueue_transaction_attachment_deletion()
    from public, anon, authenticated, service_role;
create trigger enqueue_deleted_transaction_attachment
    after delete on public.transaction_attachment
    for each row execute function public.enqueue_transaction_attachment_deletion();

-- 申请上传仅生成待认领行。签名 URL 由服务端 Storage Repository 发放。
create function public.request_transaction_attachment_upload(
    p_ledger_id uuid, p_byte_size integer, p_width integer, p_height integer
)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_id uuid := extensions.gen_random_uuid();
begin
    if auth.uid() is null then
        raise exception 'not_authenticated'
            using errcode = '28000', detail = 'not_authenticated';
    end if;
    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden'
            using errcode = '42501', detail = 'ledger_forbidden';
    end if;
    if p_byte_size not between 1 and 2097152
       or p_width not between 1 and 20000
       or p_height not between 1 and 20000 then
        raise exception 'attachment_invalid'
            using errcode = '22023', detail = 'attachment_invalid';
    end if;
    insert into public.transaction_attachment(
        id, ledger_id, status, storage_path, thumbnail_path,
        byte_size, width, height, created_by
    )
    values (
        v_id, p_ledger_id, 'pending',
        p_ledger_id::text || '/' || v_id::text || '.jpg',
        p_ledger_id::text || '/' || v_id::text || '_thumb.jpg',
        p_byte_size, p_width, p_height, auth.uid()
    );
    return v_id;
end;
$$;
revoke all on function public.request_transaction_attachment_upload(uuid, integer, integer, integer)
    from public, anon, authenticated, service_role;
grant execute on function public.request_transaction_attachment_upload(uuid, integer, integer, integer)
    to authenticated;

-- Repository 必须先通过 Storage API 验证两个对象都存在，才允许调用确认 RPC。
create function public.confirm_transaction_attachment_upload(
    p_ledger_id uuid, p_attachment_id uuid
)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'not_authenticated' using errcode = '28000', detail = 'not_authenticated';
    end if;
    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501', detail = 'ledger_forbidden';
    end if;
    -- RPC 可被已登录用户直接调用，数据库自身也必须确认两个文件存在。
    if not exists (
        select 1
        from public.transaction_attachment a
        where a.id = p_attachment_id
          and a.ledger_id = p_ledger_id
          and a.created_by = auth.uid()
          and a.transaction_record_id is null
          and a.status = 'pending'
          and exists (
              select 1 from storage.objects obj
              where obj.bucket_id = 'transaction-attachments'
                and obj.name = a.storage_path
          )
          and exists (
              select 1 from storage.objects obj
              where obj.bucket_id = 'transaction-attachments'
                and obj.name = a.thumbnail_path
          )
    ) then
        raise exception 'attachment_invalid'
            using errcode = '22023', detail = 'attachment_invalid';
    end if;
    update public.transaction_attachment
    set status = 'uploaded'
    where id = p_attachment_id
      and ledger_id = p_ledger_id
      and created_by = auth.uid()
      and transaction_record_id is null
      and status = 'pending';
    if not found then
        raise exception 'attachment_invalid' using errcode = '22023', detail = 'attachment_invalid';
    end if;
end;
$$;
revoke all on function public.confirm_transaction_attachment_upload(uuid, uuid)
    from public, anon, authenticated, service_role;
grant execute on function public.confirm_transaction_attachment_upload(uuid, uuid)
    to authenticated;

create function public.delete_transaction_attachment_draft(
    p_ledger_id uuid, p_attachment_id uuid
)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'not_authenticated' using errcode = '28000', detail = 'not_authenticated';
    end if;
    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501', detail = 'ledger_forbidden';
    end if;
    delete from public.transaction_attachment
    where id = p_attachment_id
      and ledger_id = p_ledger_id
      and created_by = auth.uid()
      and transaction_record_id is null;
    if not found then
        raise exception 'attachment_invalid' using errcode = '22023', detail = 'attachment_invalid';
    end if;
end;
$$;
revoke all on function public.delete_transaction_attachment_draft(uuid, uuid)
    from public, anon, authenticated, service_role;
grant execute on function public.delete_transaction_attachment_draft(uuid, uuid)
    to authenticated;

-- 创建和编辑共享一套验证、锁定、认领和解除逻辑。只供两个交易 RPC 调用。
create function public.sync_transaction_attachments(
    p_ledger_id uuid, p_transaction_record_id uuid, p_attachment_ids uuid[]
)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_ids uuid[] := coalesce(p_attachment_ids, array[]::uuid[]);
    v_valid_count integer;
begin
    if auth.uid() is null then
        raise exception 'not_authenticated' using errcode = '28000', detail = 'not_authenticated';
    end if;
    if not public.current_user_can_mutate_transaction(p_ledger_id, p_transaction_record_id) then
        raise exception 'ledger_forbidden' using errcode = '42501', detail = 'ledger_forbidden';
    end if;
    perform 1 from public.transaction_record
    where id = p_transaction_record_id and ledger_id = p_ledger_id
      and type = 'normal' and status = 'active';
    if not found then
        raise exception 'attachment_invalid' using errcode = '22023', detail = 'attachment_invalid';
    end if;
    if cardinality(v_ids) > 5
       or array_position(v_ids, null) is not null
       or (select count(distinct id) from unnest(v_ids) as ids(id)) <> cardinality(v_ids) then
        raise exception 'attachment_invalid' using errcode = '22023', detail = 'attachment_invalid';
    end if;

    -- 固定加锁顺序，避免并发认领时发生交叉等待。
    select count(*) into v_valid_count
    from (
        select id
        from public.transaction_attachment
        where id = any(v_ids)
          and ledger_id = p_ledger_id
          and status = 'uploaded'
          and (
              transaction_record_id = p_transaction_record_id
              or (transaction_record_id is null and created_by = auth.uid())
          )
        order by id
        for update
    ) as available;
    if v_valid_count <> cardinality(v_ids) then
        raise exception 'attachment_invalid' using errcode = '22023', detail = 'attachment_invalid';
    end if;

    delete from public.transaction_attachment
    where ledger_id = p_ledger_id
      and transaction_record_id = p_transaction_record_id
      and not (id = any(v_ids));

    update public.transaction_attachment
    set transaction_record_id = p_transaction_record_id,
        sort_order = array_position(v_ids, id) - 1
    where ledger_id = p_ledger_id and id = any(v_ids);
end;
$$;
revoke all on function public.sync_transaction_attachments(uuid, uuid, uuid[])
    from public, anon, authenticated, service_role;

-- 保留原有 RPC 作为内部事务入口；带 attachment_ids 的重载在同一事务内认领。
create function public.create_transaction(
    p_ledger_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_payments jsonb,
    p_merchant_id uuid,
    p_note text,
    p_attachment_ids uuid[]
)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_record_id uuid;
begin
    v_record_id := public.create_transaction(
        p_ledger_id, p_type, p_transaction_at, p_items,
        p_payments, p_merchant_id, p_note
    );
    if p_attachment_ids is not null then
        perform public.sync_transaction_attachments(p_ledger_id, v_record_id, p_attachment_ids);
    end if;
    return v_record_id;
end;
$$;
revoke all on function public.create_transaction(uuid, text, timestamptz, jsonb, jsonb, uuid, text, uuid[])
    from public, anon, authenticated, service_role;
grant execute on function public.create_transaction(uuid, text, timestamptz, jsonb, jsonb, uuid, text, uuid[])
    to authenticated;

create function public.update_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_payments jsonb,
    p_merchant_id uuid,
    p_note text,
    p_attachment_ids uuid[]
)
returns uuid language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_record_id uuid;
begin
    v_record_id := public.update_transaction(
        p_ledger_id, p_transaction_record_id, p_type,
        p_transaction_at, p_items, p_payments, p_merchant_id, p_note
    );
    if p_attachment_ids is not null then
        perform public.sync_transaction_attachments(p_ledger_id, v_record_id, p_attachment_ids);
    end if;
    return v_record_id;
end;
$$;
revoke all on function public.update_transaction(uuid, uuid, text, timestamptz, jsonb, jsonb, uuid, text, uuid[])
    from public, anon, authenticated, service_role;
grant execute on function public.update_transaction(uuid, uuid, text, timestamptz, jsonb, jsonb, uuid, text, uuid[])
    to authenticated;

-- 关联退款 / 报销编辑使用专门 RPC；照片同步仍必须处于同一事务。
create function public.update_linked_transaction_edit(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_transaction_at timestamptz,
    p_merchant_id uuid,
    p_note text,
    p_item_updates jsonb,
    p_payments jsonb,
    p_expected_record_updated_at timestamptz,
    p_attachment_ids uuid[]
)
returns void language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    perform public.update_linked_transaction_edit(
        p_ledger_id, p_transaction_record_id, p_transaction_at,
        p_merchant_id, p_note, p_item_updates,
        p_payments, p_expected_record_updated_at
    );
    if p_attachment_ids is not null then
        perform public.sync_transaction_attachments(
            p_ledger_id, p_transaction_record_id, p_attachment_ids
        );
    end if;
end;
$$;
revoke all on function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb, jsonb, timestamptz, uuid[]
) from public, anon, authenticated, service_role;
grant execute on function public.update_linked_transaction_edit(
    uuid, uuid, timestamptz, uuid, text, jsonb, jsonb, timestamptz, uuid[]
) to authenticated;

commit;
