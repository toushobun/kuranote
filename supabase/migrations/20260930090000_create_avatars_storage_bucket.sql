-- Issue #826：个人主页更换头像。
-- 新建公开读取的头像 bucket；已登录用户只能写入自己的目录（第一层目录 = auth.uid()）。
-- 读取依靠 public bucket 的公开 URL。删除旧头像需要 Storage 先读取对象行，
-- 因此另外允许用户查询自己目录下的对象（不影响公开读取，也不能列出他人目录）。
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select_own_folder
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );

create policy avatars_insert_own_folder
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );

create policy avatars_update_own_folder
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    )
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );

create policy avatars_delete_own_folder
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );

commit;
