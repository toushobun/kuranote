-- Issue #529：通过 service_role 专用 RPC 精确判断注册邮箱是否已存在。
-- 函数只读取 auth.users，不修改 Supabase Auth 管理的 schema 或数据。

create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
security definer
set search_path = pg_catalog, pg_temp
stable
as $$
    select exists (
        select 1
        from auth.users u
        where pg_catalog.lower(u.email) = pg_catalog.lower(pg_catalog.btrim(p_email))
    );
$$;

revoke all on function public.is_email_registered(text) from public;
revoke all on function public.is_email_registered(text) from anon;
revoke all on function public.is_email_registered(text) from authenticated;
grant execute on function public.is_email_registered(text) to service_role;

comment on function public.is_email_registered(text)
is '供服务端注册流程精确判断邮箱是否已存在，仅允许 service_role 执行。';
