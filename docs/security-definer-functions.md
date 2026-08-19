# SECURITY DEFINER 函数安全规范

## 适用范围

本规范适用于 `supabase/migrations` 中由应用维护的 PostgreSQL `SECURITY DEFINER` 函数。目标是避免可写 schema 中的同名对象劫持，并确保 Supabase 扩展函数在 `extensions` schema 下稳定解析。

## 基线规则

1. 应用表、视图和函数必须使用完整 schema 限定名，例如 `public.ledger`、`public.current_user_can_manage_ledger()`、`auth.uid()`。
2. `search_path` 只包含函数实际需要的可信 schema，且 `pg_catalog` 必须显式置前。
3. 不默认加入 `public`。确有需要时，PR 必须说明原因，并确认该 schema 不可由非受信角色写入。
4. `pg_temp` 必须显式置于最后，避免临时对象优先解析。
5. 扩展函数优先使用 `extensions` schema 显式限定，例如 `extensions.digest()`、`extensions.gen_random_bytes()`，不依赖隐式解析。
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
    select pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
$$;
```

只有扩展对象无法显式限定、对应 schema 已确认可信，并且 PR 正文记录了原因和风险时，才允许使用以下例外：

```sql
set search_path = pg_catalog, extensions, pg_temp
```

不得为了省略 `public.` 或 `auth.` 前缀而把应用 schema 加入 `search_path`。

## 既存函数盘点方法

盘点以 migrations 全量回放后的 `pg_catalog.pg_proc` 为准，按最终函数签名去重，不把历史上的多次 `create or replace` 重复计数：

```sql
select
    p.oid::regprocedure as function_signature,
    pg_catalog.pg_get_userbyid(p.proowner) as owner,
    p.proacl as execute_acl,
    p.proconfig as runtime_config
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.oid::regprocedure::text;
```

同时通过 `pg_catalog.pg_get_functiondef()` 检查函数体中的应用对象和扩展对象引用，并搜索 `src/**`、`app/**` 中的 Supabase RPC 调用点、数据库 trigger、RLS policy 和函数间调用。

## Issue #435 盘点结果

- Issue #435 当时最终生效的 `SECURITY DEFINER` 函数共 41 个；随着后续功能补充（含 Issue #567 新增的 1 个），当前 schema snapshot 共 49 个。
- 36 个函数原为 `search_path = public`，由 `20260722093000_harden_security_definer_search_path.sql` 向前整改。
- 5 个函数原本已使用 `pg_catalog, pg_temp`，保持不变。
- 整改后 41 个函数全部使用 `pg_catalog, pg_temp`。
- Issue #551 新增的 4 个 `SECURITY DEFINER` 函数（`apply_transaction_item_links`、`convert_transaction_type_with_special_status`、`load_transaction_group_summaries_with_special_status`、`validate_linked_transaction_item_mutation`）也直接声明 `pg_catalog, pg_temp`；`validate_transaction_item_special_status` 为默认 `SECURITY INVOKER`。
- `prevent_disable_special_status_with_active_items` 直接声明 `pg_catalog, pg_temp`，并仅由账本开关更新触发器调用。
- `load_frequent_transaction_category_counts` 直接声明 `pg_catalog, pg_temp`，撤销 `PUBLIC` / `anon` 的 EXECUTE 并仅授权 `authenticated`。
- 全部函数 owner 均为 `postgres`，本次不修改 owner。
- 函数体中的应用表、视图和应用函数均已使用 `public.*` / `auth.*` 完整限定名，未发现依赖隐式 `public` 解析的对象引用。
- `create_ledger_invite_v2`、`get_ledger_invite_preview`、`accept_ledger_invite` 依赖 pgcrypto，并已显式调用 `extensions.digest()` / `extensions.gen_random_bytes()`。
- 应用侧 RPC 调用点全部位于 `src/internal/**`，未发现前端直接调用这些 RPC。
- EXECUTE ACL 仅记录现状，本 Issue 不调整与 `search_path` 无关的授权设计。表中的“默认 PUBLIC EXECUTE”表示快照中没有对应的显式 `REVOKE`，不是本次新增权限。

### Issue #598 / #606 / #605 收尾同步

- #598 PR1～PR5 没有新增 `SECURITY DEFINER` 函数数量，但重写了 `apply_transaction_item_links`、`clear_transaction_item_income_links`、`validate_linked_transaction_item_mutation`、`prevent_disable_special_status_with_active_items` 的报销关联表、冻结防线与开关语义；#606 再次重写 `apply_transaction_item_links` 的退款分支，将退款从多目标比例分摊收敛为收入侧单目标。最终函数数量和权限仍以当前 schema snapshot 为准。
- `apply_transaction_item_links` 的新建关联路径统一先锁定账本行；#606 后报销和退款都只锁定各自的单个目标支出，因此正式新建路径的锁顺序统一为 `ledger → target`。#605 已解除按目标剩余可核销金额截断关联金额的规则，目标锁不再用于计算 `LEAST(收入金额, 剩余额度)`，而是继续用于保证同一目标上的关联写入、状态重算与并发一致性。#574 仍需要把清关联 / 编辑路径同步收敛到这一顺序，避免形成 `target → ledger` 的反向等待。
- `clear_transaction_item_income_links` 已使用 `transaction_item_reimbursement_link` / `transaction_item_refund_link` 清理收入侧关联，不再依赖 `settled_by_item_id`；最终清单不再保留任何依赖该旧字段的 `SECURITY DEFINER` 函数。
- `validate_linked_transaction_item_mutation` 与 `prevent_disable_special_status_with_active_items` 均已按新报销 / 退款关联结构判断活跃关联，owner、`search_path` 与 EXECUTE 边界没有扩大。

| 函数                                                    | 整改前 search_path    | extensions 依赖                                        | owner / EXECUTE 现状               | 调用方                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------- | --------------------- | ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accept_ledger_invitation`                              | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | 未发现现行调用点                                                                                                                                                                                                                                                                 |
| `accept_ledger_invite`                                  | `pg_catalog, pg_temp` | `extensions.digest()`                                  | PUBLIC 撤销；authenticated         | RPC：`src/internal/ledger/repository/ledgerInviteRepository.ts`                                                                                                                                                                                                                  |
| `apply_account_balance_delta`                           | `public`              | 无                                                     | PUBLIC 撤销；service_role          | 函数：`convert_transaction_type`、`create_transaction`、`create_transfer_transaction`、`update_transaction`、`update_transfer_transaction`、`void_transaction`                                                                                                                   |
| `apply_transaction_item_links`                          | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销                        | 函数：`create_transaction`、`update_transaction`；在同一事务内建立或重建报销与退款关联                                                                                                                                                                                           |
| `assign_ledger_member_default_display_color`            | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`ledger_member_assign_default_display_color`                                                                                                                                                                                                                             |
| `cleanup_ledger_member_display_setting_on_member_leave` | `public`              | 无                                                     | 默认 PUBLIC EXECUTE                | 触发器：`ledger_member_display_setting_cleanup_on_member_leave`                                                                                                                                                                                                                  |
| `clear_transaction_item_income_links`                   | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；无应用角色            | 函数：`update_transaction`                                                                                                                                                                                                                                                       |
| `convert_transaction_type`                              | `public`              | 无                                                     | 默认 PUBLIC EXECUTE；authenticated | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `convert_transaction_type_with_special_status`          | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/transaction/repository/transactionRepository.ts`；函数：`convert_transaction_type`、`update_transaction`                                                                                                                                                      |
| `create_account_with_holders`                           | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/account/repository/accountRepository.ts`                                                                                                                                                                                                                      |
| `create_ledger_invite_v2`                               | `pg_catalog, pg_temp` | `extensions.digest()`, `extensions.gen_random_bytes()` | PUBLIC 撤销；authenticated         | RPC：`src/internal/ledger/repository/ledgerInviteRepository.ts`                                                                                                                                                                                                                  |
| `create_ledger_with_owner`                              | `public`              | 无                                                     | PUBLIC 撤销                        | 函数：`create_ledger_with_owner_settings`                                                                                                                                                                                                                                        |
| `create_ledger_with_owner_settings`                     | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/ledger/repository/ledgerRepository.ts`                                                                                                                                                                                                                        |
| `create_transaction`                                    | `public`              | 无                                                     | 默认 PUBLIC EXECUTE；authenticated | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `create_transfer_transaction`                           | `public`              | 无                                                     | 默认 PUBLIC EXECUTE；authenticated | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `current_app_user_is_active`                            | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RLS：3 条                                                                                                                                                                                                                                                                        |
| `current_user_can_manage_ledger`                        | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | 函数：`create_ledger_invite_v2`、`enforce_ledger_management_permission`、`enforce_ledger_member_management_permission`、`enforce_merchant_alias_management_permission`、`list_pending_ledger_invites`、`revoke_ledger_invite`；RLS：16 条                                        |
| `current_user_can_manage_member_display_setting`        | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RLS：2 条                                                                                                                                                                                                                                                                        |
| `current_user_can_mutate_transaction`                   | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | 函数：`enforce_transaction_child_permission`、`enforce_transaction_record_permission`；RLS：5 条                                                                                                                                                                                 |
| `current_user_can_write_ledger`                         | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | 函数：`convert_transaction_type`、`create_account_with_holders`、`create_transaction`、`create_transfer_transaction`、`enforce_transaction_record_permission`、`update_account_with_holders`、`update_transaction`、`update_transfer_transaction`、`void_transaction`；RLS：1 条 |
| `current_user_has_ledger_role`                          | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | 函数：`current_user_can_manage_ledger`、`current_user_can_write_ledger`                                                                                                                                                                                                          |
| `current_user_is_active_ledger_member`                  | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | 函数：`load_transaction_group_summaries`；RLS：12 条                                                                                                                                                                                                                             |
| `enforce_ledger_management_permission`                  | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`account_holder_require_management_permission`、`account_require_management_permission`、`budget_require_management_permission`、`category_require_management_permission`、`ledger_require_management_permission`、`merchant_require_management_permission`              |
| `enforce_ledger_member_management_permission`           | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`ledger_member_require_management_permission`                                                                                                                                                                                                                            |
| `enforce_merchant_alias_management_permission`          | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`merchant_alias_require_management_permission`                                                                                                                                                                                                                           |
| `enforce_transaction_child_permission`                  | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`transaction_item_require_write_permission`                                                                                                                                                                                                                              |
| `enforce_transaction_record_permission`                 | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`transaction_record_require_write_permission`                                                                                                                                                                                                                            |
| `get_ledger_invite_preview`                             | `pg_catalog, pg_temp` | `extensions.digest()`                                  | PUBLIC 撤销；anon/authenticated    | RPC：`src/internal/services/ledgerInvite.ts`                                                                                                                                                                                                                                     |
| `get_next_ledger_member_display_color`                  | `public`              | 无                                                     | PUBLIC 撤销                        | 函数：`assign_ledger_member_default_display_color`                                                                                                                                                                                                                               |
| `handle_new_auth_user`                                  | `public`              | 无                                                     | 默认 PUBLIC EXECUTE                | 触发器：`on_auth_user_created`                                                                                                                                                                                                                                                   |
| `initialize_ledger_default_data`                        | `public`              | 无                                                     | PUBLIC 撤销                        | 函数：`create_ledger_with_owner`                                                                                                                                                                                                                                                 |
| `is_email_registered`                                   | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；仅 service_role       | RPC：`src/internal/auth/repository/authSecurityRepository.ts`                                                                                                                                                                                                                    |
| `list_pending_ledger_invites`                           | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/ledger/repository/ledgerInviteRepository.ts`                                                                                                                                                                                                                  |
| `load_frequent_transaction_category_counts`             | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；仅 authenticated      | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `load_transaction_group_summaries`                      | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `load_transaction_group_summaries_with_special_status`  | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `normalize_transaction_record_type_for_compat`          | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`transaction_record_normalize_type_for_compat`                                                                                                                                                                                                                           |
| `prevent_disable_special_status_with_active_items`      | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销                        | 触发器：`ledger_validate_special_status_disable`                                                                                                                                                                                                                                 |
| `prevent_used_category_type_change`                     | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`category_prevent_used_type_change`                                                                                                                                                                                                                                      |
| `reorder_categories`                                    | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；仅 authenticated      | RPC：`src/internal/category/repository/categoryRepository.ts`                                                                                                                                                                                                                    |
| `revoke_ledger_invite`                                  | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/ledger/repository/ledgerInviteRepository.ts`                                                                                                                                                                                                                  |
| `update_account_with_holders`                           | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/account/repository/accountRepository.ts`                                                                                                                                                                                                                      |
| `update_ledger_member_settings`                         | `public`              | 无                                                     | PUBLIC 撤销；authenticated         | RPC：`src/internal/ledger/repository/ledgerSettingsRepository.ts`                                                                                                                                                                                                                |
| `update_transaction`                                    | `public`              | 无                                                     | 默认 PUBLIC EXECUTE；authenticated | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `update_transfer_transaction`                           | `public`              | 无                                                     | 默认 PUBLIC EXECUTE；authenticated | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |
| `validate_ledger_member_display_setting_member`         | `public`              | 无                                                     | 默认 PUBLIC EXECUTE                | 触发器：`ledger_member_display_setting_validate_member`                                                                                                                                                                                                                          |
| `validate_linked_transaction_item_mutation`             | `pg_catalog, pg_temp` | 无                                                     | PUBLIC 撤销                        | 触发器：`transaction_item_freeze_linked_mutation`、`transaction_item_prevent_linked_delete`                                                                                                                                                                                      |
| `validate_transaction_item_category_shape`              | `public`              | 无                                                     | PUBLIC 撤销                        | 触发器：`transaction_item_validate_category_shape`                                                                                                                                                                                                                               |
| `void_transaction`                                      | `public`              | 无                                                     | 默认 PUBLIC EXECUTE；authenticated | RPC：`src/internal/transaction/repository/transactionRepository.ts`                                                                                                                                                                                                              |

## 自动化检查

`npm run db:security-definer:check` 同时检查：

- `supabase/schema_snapshot/current_schema.sql` 中最终生效的全部 `SECURITY DEFINER` 定义。
- 基线 migration 及之后新增的函数定义和 `ALTER FUNCTION ... SET search_path`。
- `search_path` 是否以 `pg_catalog` 开头、以 `pg_temp` 结尾，是否包含 `public` 或未登记 schema。
- 新增函数体是否存在未限定的应用对象引用。
- 常见 pgcrypto 函数是否遗漏 `extensions.` 限定。

检查器使用 `.mjs`，是为了让 Node.js 在 GitHub Actions 中无需 TypeScript 编译或额外运行器即可直接执行；它只依赖 Node.js 标准库，不引入新的构建步骤或 npm 依赖。

`npm run db:security-definer:test` 使用独立 SQL fixture 覆盖安全定义、同文件多函数、缺少 `search_path`、未限定应用对象、未限定 pgcrypto 和不安全 `ALTER FUNCTION`。

静态检查基于 SQL 文本解析与正则扫描，无法可靠理解 `EXECUTE format(...)` 等动态 SQL。当前 49 个函数均未使用动态 SQL；今后如在 `SECURITY DEFINER` 中引入动态 SQL，必须在 PR 中单独说明拼接来源、schema 限定和注入防护，并补充针对该函数的数据库运行时测试，不能仅以静态检查通过作为安全依据。

## 运行时烟雾测试

`Schema snapshot check` 会在本地 Supabase 回放全部 migrations 后执行事务内烟雾测试，覆盖：

- `create_ledger_with_owner_settings` 创建账本及默认数据。
- `create_account_with_holders` 创建账户与持有人，并触发账户初始化和基础数据权限 trigger。
- `create_transaction` 创建交易，验证交易明细、余额同步及交易表 trigger 路径。
- `create_ledger_invite_v2`、`get_ledger_invite_preview`、`accept_ledger_invite` 的 pgcrypto 邀请链路。
- 普通 member 直接修改商家时，`enforce_ledger_management_permission` 必须以 `42501` 拒绝。
- #598 / #606 的 `apply_transaction_item_links`、`validate_linked_transaction_item_mutation`、`prevent_disable_special_status_with_active_items`、`clear_transaction_item_income_links` 由 `scripts/security-definer-smoke-issue-598.sql` 持续验证报销关联、单目标退款关联、冻结、关闭开关防线与受控清理。

基础 smoke 数据在同一事务中创建并 `ROLLBACK`；#598 / #606 smoke 同样使用独立事务回滚。基础路径已在 PR #494 的数据库验证中实际执行通过，关联路径由当前 schema snapshot check 持续验证。

## 新增或修改函数检查清单

- [ ] 应用对象均使用完整 schema 限定名。
- [ ] `search_path` 以 `pg_catalog` 开头、以 `pg_temp` 结尾。
- [ ] 未无说明地加入 `public` 或其他 schema。
- [ ] 扩展对象使用 `extensions` 显式限定，或在 PR 中记录例外理由。
- [ ] owner 与 EXECUTE 权限符合调用方需求，未扩大权限。
- [ ] RPC 签名、业务逻辑和 RLS 语义未因安全配置调整而改变。
- [ ] 已运行静态检查、schema snapshot check、migration dry-run 和受影响 RPC 烟雾测试。