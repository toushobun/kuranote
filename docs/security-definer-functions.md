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
| `get_ledger_invite_preview`                             | `pg_catalog, pg_temp` | `extensions.digest()`                                  | PUBLIC 撤销；anon/authenticated    | RPC：`src/internal/ledger/repository/ledgerInvitePreviewRepository.ts`                                                                                                                                                                                                           |
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

## Issue #801：占位模型与账户持有人

本次新增和修改的 SECURITY DEFINER 函数均固定 `search_path = pg_catalog, pg_temp`，应用对象使用完整 schema 限定名，操作人取自 `auth.uid()`。

| 函数                                                                                                   | 变更与权限边界                                                                                                                          |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `create_ledger_placeholder_member(uuid,text)`                                                          | 创建未认领占位，规范化重名返回 `placeholder_name_conflict`。                                                                            |
| `rename_ledger_placeholder_member(uuid,uuid,text)`                                                     | 只更新未认领占位的姓名；已认领返回 `placeholder_already_claimed`。                                                                      |
| `delete_ledger_placeholder_member(uuid,uuid)`                                                          | 拒绝含归档账户在内的持有引用；无引用时撤销邀请、清 token、解除已撤销邀请关联后删除占位，引用冲突返回 `placeholder_in_use`。             |
| `ensure_ledger_placeholder_members(uuid,text[])`                                                       | 全部姓名先校验，在同一事务内去重、创建或复用，返回规范化姓名与占位 ID。                                                                 |
| `lock_ledger_placeholder_management(uuid)`                                                             | 仅内部调用，先核验权限，再锁定未归档账本并复核 active owner/admin。                                                                     |
| `validate_account_holder_active_member()`                                                              | 改为内部 SECURITY DEFINER 触发器，以便在客户端无占位写权限时锁定并校验占位；保留真实 active 用户/成员校验，拒绝变更持有行的账户或账本。 |
| `sync_account_name_scope(uuid)`                                                                        | 内部投影同时保存真实用户和占位 ID；仍禁止客户端与 service_role 调用或直接访问投影表。                                                   |
| `create_account_with_holders`、`update_account_with_holders`、`update_account_with_balance_adjustment` | 删除旧签名后增加末尾可选 `p_placeholder_id uuid default null`，重设授权且不保留重载；创建保留初始余额记录，编辑保留单事务余额调整。     |

四个管理 RPC 及三个账户 RPC 仅向 authenticated 授予 EXECUTE，RPC 内独立要求 active owner/admin。内部锁定与触发器函数撤销 PUBLIC、anon、authenticated、service_role 的 EXECUTE。`normalize_ledger_placeholder_name(text)` 和 `lock_account_holder_placeholders(uuid,uuid,uuid)` 为内部 SECURITY INVOKER 辅助函数，同样撤销客户端及 service_role 的 EXECUTE。

锁顺序为账本 → 旧、新占位（按 ID）→ 涉及的成员 → 账户。账户编辑取得账户锁后复核原占位引用，变化时返回 SQLSTATE `40001`、detail `account_holder_changed`，整个编辑回滚。姓名比较与部分唯一索引统一使用 `collate "C"`；预期姓名冲突仅精确匹配 `ledger_placeholder_member_unclaimed_name_unique` 后转换稳定 detail，不暴露约束名称。

`account_name_scope.test.sql` 在真实 Supabase 上覆盖 CHECK/FK、RLS、RPC、邀请字段约束，并以 dblink 双会话验证同名创建、批量复用、改名与模拟认领、直接 DML 引用锁和编辑旧引用复核；`initial_balance_adjustment.test.sql` 覆盖占位账户的初始余额及事务回滚。未增加邀请绑定或接受 RPC，也未增加认领权限例外。

## Issue #802：占位绑定邀请与原子认领

本次修改的 SECURITY DEFINER 函数继续固定 `search_path = pg_catalog, pg_temp`，应用对象使用完整 schema 限定名，操作人只取 `auth.uid()`。没有新增函数，也没有修改 RLS policy、`current_user_has_ledger_role` / `current_user_can_manage_ledger` / `current_user_can_write_ledger` 或三个账户 RPC。

| 函数                                      | 变更与权限边界                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_ledger_invite_v2(uuid,text,uuid)` | 删除旧 `(uuid,text)` 签名后增加末尾可选 `p_placeholder_id uuid default null`，返回列增加 `placeholder_id`；撤销 PUBLIC、anon、authenticated、service_role 后仅授予 authenticated。匿名分支的校验顺序与错误码不变；绑定分支取得账本锁（归档账本同样返回 `ledger_not_found`）后复核管理权限，再锁定占位并校验归属、未认领与没有有效绑定邀请，部分唯一索引 `ledger_invite_one_pending_placeholder` 冲突精确转换为 `placeholder_invite_pending`。 |
| `revoke_ledger_invite(uuid,uuid)`         | 签名与授权不变；先锁账本行（不附加归档判断，归档账本上的撤销仍允许），再锁绑定的占位和邀请。撤销清空 token，保留历史 `placeholder_id`。                                                                                                                                                                                                                                                                                                       |
| `accept_ledger_invite(text)`              | 返回列增加 `placeholder_id`，删除后重建并仅授予 authenticated。匿名与绑定邀请都按账本 → 占位 → 邀请 → 成员 → 账户（按 ID）加锁；绑定分支依次处理幂等重放、已有成员冲突、经 `app.allow_ledger_invite_accept` 通道插入成员（不使用 UPSERT）、写入接受状态、迁移全部持有行、立即检查名称唯一约束并写入认领标记。`result` 取值为 `joined` / `already_member` / `claimed`。                                                                        |
| `enforce_ledger_management_permission()`  | 在账户余额 GUC 分支之后新增认领窄分支，只放行满足全部条件的 `account_holder` UPDATE（见下文），不依赖任何 GUC；其他表及 INSERT / DELETE 判断不变。继续撤销 PUBLIC、anon、authenticated、service_role 的 EXECUTE。                                                                                                                                                                                                                             |
| `list_pending_ledger_invites(uuid)`       | 返回列增加 `placeholder_id`，删除后重建并仅授予 authenticated；过滤条件、成员校验与 token 可见性不变。                                                                                                                                                                                                                                                                                                                                        |
| `get_ledger_invite_preview(text)`         | 返回列增加 `is_placeholder_bound`、`placeholder_display_name`，删除后重建并仅授予 anon / authenticated。只有未撤销、未接受、账本未归档且占位未认领的绑定邀请返回 true 与实时显示名，其他情况返回 false / null；不返回 `claimed_by`、账户或金额。                                                                                                                                                                                              |

认领窄分支只有在以下条件全部满足时才放行，否则继续走 owner/admin 判断：

- 表为 `account_holder`、操作为 UPDATE，旧行 `placeholder_id` 非空，新行 `placeholder_id` 为空且 `user_id = auth.uid()`、`updated_by = auth.uid()`；
- 除 `user_id`、`placeholder_id`、`updated_by`、`updated_at` 外，新旧行其余列（含 id、ledger_id、account_id、role、share_ratio、created_by、created_at）完全一致；
- 存在同账本、同占位、`accepted_by = auth.uid()` 且 `accepted_at` 非空的邀请，该占位 `claimed_by` 仍为空；
- 接受者是该账本 active 成员且 `app_user.status = 'active'`。

该分支不识别调用方是 RPC 还是直接 DML，生效条件完全是数据状态：存在当前用户已接受的该占位绑定邀请，而该占位的 `claimed_by` 仍为空。这种“邀请已接受、占位未认领”的中间状态无法被单独提交：

- `accepted_at / accepted_by` 只由 `accept_ledger_invite` 写入，它在同一事务内先写接受状态，再迁移全部持有行，最后写 `claimed_by / claimed_at`；任一步失败整个事务回滚，因此已提交的数据只会是“未接受且未认领”或“已接受且已认领”。
- 中间状态只存在于接受事务内部，其他事务按 MVCC 看不到；接受事务持有账本与占位锁，并发的占位管理、账户编辑与直接 DML 引用都要等待它结束。
- 客户端对 `ledger_invite`、`ledger_placeholder_member` 没有写权限，无法伪造接受状态或清空认领标记；对 `account_holder` 也没有 UPDATE 权限，且 `account_holder_update_admin` 仍要求 owner/admin。

因此客户端无法单独构造触发该分支的数据状态，只有 `accept_ledger_invite` 事务内部会满足条件；接受者也不会因认领获得账户或持有人的管理权限。绕过 RPC、拥有表权限的数据库维护角色可以人为制造该状态（数据库测试即以此单独验证分支条件），这属于运维操作而非客户端路径。

锁顺序统一为账本 → 占位 → 邀请 → 成员 → 账户（按 ID）。接受者可能是 member / viewer，因此接受 RPC 不复用要求 owner/admin 的 `lock_ledger_placeholder_management`，而是在函数内直接 `for update`。`account_active_name_unique` 为延迟约束，接受 RPC 在迁移后立即检查，并只在约束名精确匹配时转换为 `placeholder_claim_account_name_conflict`（SQLSTATE `23505`）；并发插入成员命中 `ledger_member_not_removed_user_unique` 时转换为 `placeholder_claim_existing_member`。任一步失败时整个事务回滚。

`ledger_invite_placeholder_claim.test.sql` 在真实 Supabase 上覆盖签名与授权、匿名邀请回归、绑定邀请唯一、撤销后重建、已有成员拒绝、member / viewer 认领后的权限、含归档账户的全量迁移、失败回滚、幂等重放、窄分支绕过与预览字段，并以 dblink 多会话验证并发生成、索引兜底、接受与撤销竞争、匿名接受的账本锁，以及认领持锁期间的占位改名与账户编辑（均等锁后返回 `placeholder_already_claimed`，数据保持认领结果）。

## Issue #809：邀请必须绑定待邀请成员

项目尚未上线，不再支持新建匿名邀请。本次只修改 `create_ledger_invite_v2` 的函数体并新增一条表级 CHECK，没有新增函数，也没有修改其他 RPC、RLS policy 或权限函数。

| 对象                                      | 变更与权限边界                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_ledger_invite_v2(uuid,text,uuid)` | 签名、返回列与授权不变（`create or replace`，仍仅授予 authenticated）。在角色与管理权限校验之后，`p_placeholder_id` 为 NULL 时返回 SQLSTATE `22023`、detail `placeholder_required`；原绑定分支的锁顺序、校验与错误码原样保留。        |
| `ledger_invite`                           | 新增 `ledger_invite_pending_requires_placeholder`：`placeholder_id is not null or accepted_at is not null or revoked_at is not null`。已撤销邀请（`delete_ledger_placeholder_member` 会解除其关联）与已接受的历史匿名邀请仍允许为空。 |

migration 在新增 CHECK 之前，把残留的匿名待接受邀请（`placeholder_id`、`accepted_at`、`revoked_at` 均为空）写入 `revoked_at = now()`、`revoked_by = inviter_user_id` 并清空 `invite_token`。`accept_ledger_invite` 的匿名分支不做修改，现在只剩历史数据能走到。

`ledger_invite_placeholder_claim.test.sql` 改为断言匿名生成返回 `placeholder_required`、CHECK 拒绝直接插入或置空未绑定的待接受邀请、删除占位时解除已撤销邀请关联仍可用，并用维护角色构造的历史匿名邀请验证原接受分支；并发场景 5 改为绑定邀请的接受等待账本锁。烟雾测试改为先创建待邀请成员再生成绑定邀请并认领。

## Issue #811：认领沿用待邀请名字与成员重名检查

同一账本内「未认领待邀请成员名字」与「active 成员有效显示名」不能相同。有效显示名为 `coalesce(nullif(btrim(ledger_member_display_setting.display_name), ''), btrim(app_user.display_name))`；比较口径与占位名字一致，去除首尾空白后按 `collate "C"` 精确比较，不做大小写折叠。只统计 `ledger_member.status = 'active'` 且 `app_user.status = 'active'` 的成员。本次没有修改表结构、RLS policy 或授权。

| 对象                                                      | 变更与权限边界                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger_active_member_display_name_exists(uuid,text)`     | 新增内部 SECURITY INVOKER SQL 函数，固定 `search_path = pg_catalog, pg_temp`，撤销 PUBLIC、anon、authenticated、service_role 的 EXECUTE，只由下列 SECURITY DEFINER RPC 调用。                                                                                                                                                                         |
| `create_ledger_placeholder_member(uuid,text)`             | 签名与授权不变。`lock_ledger_placeholder_management` 取得账本锁后，名字与成员重名时返回 SQLSTATE `23505`、detail `placeholder_name_member_conflict`；与其他待邀请成员重名仍为 `placeholder_name_conflict`。                                                                                                                                           |
| `rename_ledger_placeholder_member(uuid,uuid,text)`        | 签名与授权不变。按账本 → 占位加锁后，名字有变化且与成员重名时返回 `placeholder_name_member_conflict`；改为自身现有名字仍幂等成功。                                                                                                                                                                                                                    |
| `ensure_ledger_placeholder_members(uuid,text[])`          | 签名与授权不变。全部输入规范化后，任一名字与成员重名即返回 `placeholder_name_member_conflict` 并整批回滚，不写入任何占位。                                                                                                                                                                                                                            |
| `update_ledger_member_settings(uuid,uuid,text,text,text)` | 签名与授权不变。输入校验之后、锁成员行之前先 `for update` 锁账本行，锁顺序为账本 → 成员，与占位管理 RPC 一致。新名字（btrim 后）与该成员当前有效显示名不同，且等于同账本某个未认领占位名字时，返回 SQLSTATE `23505`、detail `display_name_placeholder_conflict`；名字不变（只改颜色或角色）时不检查。                                                 |
| `accept_ledger_invite(text)`                              | 签名、返回列与授权不变。绑定分支在写入 `claimed_by / claimed_at` 之后，把接受者在该账本的 `ledger_member_display_setting.display_name` 设为占位名字（只改显示名、保留成员加入时分配的颜色；行不存在时以 `get_next_ledger_member_display_color` 补建）。与认领同一事务，任一步失败整体回滚。匿名分支与幂等重放分支不变，不改 `app_user.display_name`。 |

显示名写入放在认领之后：此时占位已退出未认领名字范围，不会与「成员名不能与未认领占位重名」规则自相矛盾。已知边界：修改账号全局昵称（`app_user.display_name`）会改变没有账本内显示名的成员的有效显示名，本次不做跨账本检查。

`ledger_placeholder_member_name_conflict.test.sql` 在真实 Supabase 上覆盖签名与授权、三个占位 RPC 与成员重名（昵称回退、账本内显示名覆盖、首尾空白、大小写、removed 成员与停用用户、跨账本）、成员改名被拒与名字不变时只改颜色可保存、认领后显示名与幂等重放、认领失败回滚，并以 dblink 双会话验证新建占位与成员改名在账本锁上串行化、后到一方返回稳定错误码。烟雾测试增加认领后显示名断言。

## Issue #808 / #816：占位成员功能遗留问题收尾

本次用 `create or replace` 修改两个函数，签名、返回列与授权不变，没有新增函数，也没有修改表结构、RLS policy 或权限函数。两个函数继续固定 `search_path = pg_catalog, pg_temp`，操作人只取 `auth.uid()`。

| 函数                                                                | 变更与权限边界                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `update_account_with_holders(uuid,uuid,text,text,text,uuid[],uuid)` | 只调整删除旧持有行的条件（#808）：提交「无持有人」（`p_placeholder_id` 为 NULL 且用户数组为空）时，保留「用户持有、且该用户不是同账本 active 成员或不是 active 用户」的行；active 成员与占位的持有行照常删除。提交新的成员或占位时，原持有人（含非活跃成员）照常被替换，单持有人约束不变。三态判断、`account_holder_changed` 复核、锁顺序与名称投影原样保留；`update_account_with_balance_adjustment` 经内部调用获得同样行为。 |
| `get_ledger_invite_preview(text)`                                   | 仅绑定邀请（`placeholder_id` 非空）把「已是成员」判断扩大为该用户在该账本有非 removed 成员行（active 或 invited），与 `accept_ledger_invite` 的 `placeholder_claim_existing_member` 一致；历史匿名邀请仍只看 active。其余字段与判断顺序不变，仍不返回 `claimed_by`、账户或金额，仍授予 anon / authenticated。                                                                                                                  |

并发冲突（SQLSTATE `40P01` 死锁、`40001` 序列化失败，包括接受邀请时的 `account_holder_changed`）没有修改 RPC，由应用层 Repository 在未匹配业务 detail 时按 SQLSTATE 统一转换为可重试的 409。

`placeholder_member_followups.test.sql` 在真实 Supabase 上覆盖签名与授权不变、removed 成员 / 停用用户持有 + 提交无持有人保留、非活跃持有 + 提交成员或占位替换、active 成员与占位持有照常删除、经余额调整 RPC 调用行为一致、名称投影与持有行一致，以及绑定邀请预览对 invited / active / removed / 非成员和历史匿名邀请的结果。

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
- `create_ledger_invite_v2`（未绑定待邀请成员时返回 `placeholder_required`）、`get_ledger_invite_preview`、`accept_ledger_invite` 的 pgcrypto 绑定邀请与认领链路。
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
