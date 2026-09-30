begin;
set local search_path = public, extensions;
select no_plan();

-- Issue #826：头像 bucket 与 Storage RLS。已登录用户只能写入自己的目录（第一层目录 = auth.uid()）。
create function pg_temp.uid(p_n integer) returns uuid language sql immutable as $$
    select ('82610000-0000-4000-8000-' || lpad(p_n::text, 12, '0'))::uuid;
$$;
create function pg_temp.path(p_owner integer, p_file text) returns text language sql immutable as $$
    select pg_temp.uid(p_owner)::text || '/' || p_file;
$$;
create function pg_temp.act(p_n integer) returns void language sql as $$
    select set_config('request.jwt.claim.sub', case when p_n is null then '' else pg_temp.uid(p_n)::text end, true);
$$;
-- 返回 SQLSTATE，便于断言 RLS 拒绝（42501）。
create function pg_temp.err(p_sql text) returns text language plpgsql as $$
begin
    execute p_sql;
    return 'ok';
exception when others then
    return sqlstate;
end;
$$;
create function pg_temp.insert_sql(p_path text) returns text language sql immutable as $$
    select format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'avatars', p_path);
$$;
-- 返回受影响行数；RLS 过滤掉的行不会报错，只会影响 0 行。
create function pg_temp.affected(p_sql text) returns integer language plpgsql as $$
declare v_count integer;
begin
    execute p_sql;
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;
-- 以 security definer 读取，authenticated 会话中也能观察结果。
create function pg_temp.object_exists(p_path text) returns boolean language sql stable security definer as $$
    select exists (select 1 from storage.objects where bucket_id = 'avatars' and name = p_path);
$$;
create function pg_temp.object_version(p_path text) returns text language sql stable security definer as $$
    select version from storage.objects where bucket_id = 'avatars' and name = p_path;
$$;

insert into auth.users (id, aud, role, email)
select pg_temp.uid(n), 'authenticated', 'authenticated', format('issue826-avatar-%s@example.test', n)
from generate_series(1, 2) n;

-- 用户 2 已有头像（以 postgres 写入，绕过 RLS）。
insert into storage.objects (bucket_id, name, owner_id, version)
values ('avatars', pg_temp.path(2, 'other.webp'), pg_temp.uid(2)::text, 'v1');

-- Storage API 删除对象时需要此设置，否则 protect_delete trigger 会拒绝直接删除。
set local storage.allow_delete_query = 'true';

select diag('bucket 配置');
select is((select public from storage.buckets where id = 'avatars'), true, 'avatars bucket 公开读取');
select is((select file_size_limit from storage.buckets where id = 'avatars'), 1048576::bigint, '文件上限 1MB');
select is((select allowed_mime_types from storage.buckets where id = 'avatars'),
          array['image/jpeg', 'image/png', 'image/webp'], '只允许 JPEG、PNG、WebP');

select diag('已登录用户写入自己的目录');
set local role authenticated;
select pg_temp.act(1);
select is(pg_temp.err(pg_temp.insert_sql(pg_temp.path(1, 'mine.webp'))), 'ok', '可以上传到自己的目录');
select is(pg_temp.affected(format(
    'update storage.objects set version = %L where bucket_id = %L and name = %L',
    'v2', 'avatars', pg_temp.path(1, 'mine.webp'))), 1, '可以更新自己目录的对象');
select results_eq(
    $$select name from storage.objects where bucket_id = 'avatars' order by name$$,
    array[pg_temp.path(1, 'mine.webp')],
    '只能查询到自己目录的对象（删除旧头像前需要读取）');
select is(pg_temp.affected(format(
    'delete from storage.objects where bucket_id = %L and name = %L',
    'avatars', pg_temp.path(1, 'mine.webp'))), 1, '可以删除自己目录的对象');
select is(pg_temp.object_exists(pg_temp.path(1, 'mine.webp')), false, '自己的对象已删除');

select diag('不能写入别人的目录');
select is(pg_temp.err(pg_temp.insert_sql(pg_temp.path(2, 'evil.webp'))), '42501', '不能上传到别人的目录');
select is(pg_temp.err(pg_temp.insert_sql('evil.webp')), '42501', '不能上传到 bucket 根目录');
select is(pg_temp.err(pg_temp.insert_sql(pg_temp.uid(1)::text || 'x/evil.webp')), '42501',
          '不能上传到以自己 ID 为前缀的其他目录');
select is(pg_temp.affected(format(
    'update storage.objects set version = %L where bucket_id = %L and name = %L',
    'hacked', 'avatars', pg_temp.path(2, 'other.webp'))), 0, '不能更新别人的对象');
select is(pg_temp.affected(format(
    'delete from storage.objects where bucket_id = %L and name = %L',
    'avatars', pg_temp.path(2, 'other.webp'))), 0, '不能删除别人的对象');
reset role;
select is(pg_temp.object_version(pg_temp.path(2, 'other.webp')), 'v1', '别人的对象未被修改或删除');

select diag('已登录用户不能把自己的对象移动到别人的目录');
insert into storage.objects (bucket_id, name, owner_id)
values ('avatars', pg_temp.path(1, 'move.webp'), pg_temp.uid(1)::text);
set local role authenticated;
select pg_temp.act(1);
select is(pg_temp.err(format(
    'update storage.objects set name = %L where bucket_id = %L and name = %L',
    pg_temp.path(2, 'move.webp'), 'avatars', pg_temp.path(1, 'move.webp'))), '42501',
    '更新后的路径也必须在自己的目录');
reset role;

select diag('未登录不能写入');
set local role anon;
select pg_temp.act(null);
select is(pg_temp.err(pg_temp.insert_sql(pg_temp.path(1, 'anon.webp'))), '42501', '未登录不能上传');
select is(pg_temp.affected(format(
    'delete from storage.objects where bucket_id = %L and name = %L',
    'avatars', pg_temp.path(2, 'other.webp'))), 0, '未登录不能删除');
select is((select count(*) from storage.objects where bucket_id = 'avatars'), 0::bigint,
          '未登录不能列出对象（公开读取只通过公开 URL）');
reset role;
select is(pg_temp.object_exists(pg_temp.path(2, 'other.webp')), true, '别人的对象仍然存在');

select * from finish();
rollback;
