# SECURITY DEFINER 函数安全规范

## 适用范围

本规范适用于 `supabase/migrations` 中由应用维护的 PostgreSQL `SECURITY DEFINER` 函数。目标是避免可写 schema 中的同名对象劫持，并确保 Supabase 扩展函数在 `extensions` schema 下稳定解析。

## 基线规则

1. 应用表、视图和函数必须使用完整 schema 限定名，例如 `public.ledger`、`public.current_user_can_manage_ledger()`、`auth.uid()`。
2. `search_path` 只包含函数实际需要的可信 schema，且 `pg_catalog` 必须显式置前。
3. 不默认加入 `public`。确有需要时，PR 必须说明原因，并确认该 schema 不可由非受信角色写入。
4. `pg_temp` 必须显式置于最后，避免临时对象优先解析。
5. 扩展函数必须使用 `extensions` schema 显式限定，例如 `extensions.digest()`、`extensions.gen_random_bytes()`；不依赖隐式搜索路径。
6. 已应用的历史 migration 不回改，整改一律使用新的向前 migration。
7. 调整 `search_path` 时不得顺带改变函数签名、业务逻辑、RLS 语义、owner 或 EXECUTE 权限。

## 普通函数模板

```sql
create or replace function public.example_function(p_ledger_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    return exists (
        select 1
        from public.ledger l
        where l.id = p_ledger_id
          and l.owner_user_id = auth.uid()
    );
end;
$$;
```

## 依赖 extensions 的函数模板

优先显式限定扩展函数，`search_path` 仍保持最小集合：

```sql
create or replace function public.example_token()
returns text
language sql
security definer
set search_path = pg_catalog, pg_temp
as $$
    select encode(extensions.gen_random_bytes(32), 'hex');
$$;
```

只有无法显式限定扩展对象且已确认 schema 可信时，才允许将 `extensions` 放入 `search_path`：

```sql
set search_path = pg_catalog, extensions, pg_temp
```

该例外必须在 PR 中说明原因。

## 既存函数盘点方式

以 migrations 全量回放后的 `pg_catalog.pg_proc` 为准，按函数签名去重，避免把同一函数的历史版本重复计算：

```sql
select
    p.oid::regprocedure as function_signature,
    pg_get_userbyid(p.proowner) as owner,
    p.proacl as execute_acl,
    p.proconfig as runtime_config
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.oid::regprocedure::text;
```

Issue #435 的向前 migration 会统一处理查询结果中的全部 public `SECURITY DEFINER` 函数。函数体、owner、EXECUTE ACL 和公开签名保持不变；邀请 RPC 的 pgcrypto 调用继续使用 `extensions.digest()` / `extensions.gen_random_bytes()` 显式限定。

## 新增函数检查清单

- [ ] 应用对象均使用完整 schema 限定名。
- [ ] `search_path` 以 `pg_catalog` 开头、以 `pg_temp` 结尾。
- [ ] 未无说明地加入 `public`。
- [ ] 扩展对象使用 `extensions` 显式限定，或在 PR 中记录例外理由。
- [ ] owner 与 EXECUTE 权限符合调用方需求，未扩大权限。
- [ ] RPC 签名和业务逻辑未因安全配置调整而改变。
