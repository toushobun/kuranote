-- Issue #435：统一 public schema 中既存 SECURITY DEFINER 函数的 search_path。
-- 函数体中的应用对象必须使用完整 schema 限定名；pgcrypto 调用已显式限定 extensions schema。
-- 本 migration 仅调整函数运行时配置，不修改函数签名、业务逻辑、owner 或 EXECUTE 权限。

do $$
declare
    v_function record;
begin
    for v_function in
        select p.oid::regprocedure as function_signature
        from pg_catalog.pg_proc p
        join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.prosecdef
        order by p.oid::regprocedure::text
    loop
        execute format(
            'alter function %s set search_path to pg_catalog, pg_temp',
            v_function.function_signature
        );
    end loop;
end;
$$;

-- 防止 migration 回放后仍残留不安全或未明确的 SECURITY DEFINER search_path。
do $$
declare
    v_unsafe_functions text;
begin
    select string_agg(p.oid::regprocedure::text, ', ' order by p.oid::regprocedure::text)
      into v_unsafe_functions
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef
       and coalesce(p.proconfig, array[]::text[]) <> array['search_path=pg_catalog, pg_temp'];

    if v_unsafe_functions is not null then
        raise exception 'SECURITY DEFINER search_path 不符合规范: %', v_unsafe_functions;
    end if;
end;
$$;
