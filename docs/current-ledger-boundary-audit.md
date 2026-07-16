# Current ledger 数据边界审计

关联 Issue：#445  
Parent：#380  
审计基线：`main`（2026-07-15）  
审计分支：`chore/445_current_ledger_boundary_audit`

## 目的

确认 KuraNote 的核心读取与写入路径均以服务端取得的 current ledger 为边界，避免跨账本读取、修改、删除或缓存残留。

本审计不以“代码里出现了 `ledger_id`”作为完成标准。每个业务域同时检查：

1. current ledger 的可信来源。
2. loader / 查询的账本过滤。
3. Server Action 是否忽略客户端伪造的账本信息。
4. Service / RPC 是否重新校验目标数据归属。
5. RLS / trigger 是否能阻止绕过页面的直接写入。
6. current ledger 变化后的缓存刷新。
7. 是否有跨账本回归测试。

## 最终审计结果

<!-- prettier-ignore -->
| 业务域 | 读取边界 | 写入边界 | RPC / RLS / trigger | 缓存刷新 | 测试证据 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| Current ledger 共通上下文 | active `ledger_member` + 未归档 `ledger` | 创建、切换与接受邀请统一写入 `app_user.current_ledger_id` | `validate_app_user_current_ledger` 再校验 active 成员与未归档账本 | React `cache` 仅限单次请求 | context / service 既有测试 + 本次 Action / DB / migration 测试 | 通过 |
| Dashboard | 记录、明细、账户、分类、商家均限定 `currentLedger.id` | 无独立写入；复用现有记账入口 | 复用各业务表 RLS / trigger | current ledger 变化时刷新 Dashboard | `dashboard.currentLedger.test.ts` 覆盖有账本和无账本路径 | 通过 |
| 记账 / 明细 | 列表、分组、详情、表单和筛选候选限定 `currentLedger.id` | Action 使用服务端 current ledger；不信任客户端 `ledgerId` | 新增、编辑、转账、类型转换、删除 RPC 校验账本权限及目标记录 / 账户 / 分类 / 商家 / 标签归属 | 写操作刷新明细和账户；current ledger 变化时刷新记账页面 | Action 伪造账本测试 + 双账本筛选测试 + DB 边界测试 | 通过 |
| 统计 | 记录、明细、商家、分类限定 `currentLedger.id` | 只读 | 依赖业务表 RLS | current ledger 变化时刷新统计页 | `statistics.currentLedger.test.ts` | 通过 |
| 账户 | 账户、持有人、成员显示设置限定 `currentLedger.id` | Action 使用服务端 current ledger；更新 / 归档限定账户 ID 与账本 ID | 账户 RPC 校验权限和持有人归属；账户及持有人 trigger 要求管理权限 | 账户操作和 current ledger 变化时刷新账户页 | 既有 Service 跨账本失败测试 + 本次 Loader / Action / DB 测试 | 通过 |
| 分类 | 分类树和候选限定 `currentLedger.id` | 父分类、编辑、归档限定目标账本 | 分类管理 trigger + 父子分类同账本 trigger | 分类操作和 current ledger 变化时刷新分类页 | 既有父分类 / 更新 / 归档跨账本测试 + 本次 Loader / DB 测试 | 通过 |
| 商家 | 商家限定 `currentLedger.id`；别名仅从当前账本商家集合读取 | 商家和别名操作使用服务端 current ledger；别名写入前再次确认商家归属 | 商家与别名 trigger 要求管理权限 | 商家操作和 current ledger 变化时刷新商家页 | 既有商家 / 别名跨账本测试 + 本次 Loader / DB 测试 | 通过 |
| 标签 | 表单候选、筛选、交易关联和标签名加载限定 `currentLedger.id` | 标签同步由交易 RPC 传入服务端 current ledger | 同账本组合外键 + 交易子表 trigger / RLS + 内部函数执行权限收口 | 随记账与 current ledger 变化刷新 | 双账本筛选测试 + DB 标签同步边界测试 | 通过 |
| Current ledger 缓存 | 不适用 | 创建、手动切换和接受邀请共用同一刷新入口 | 不适用 | Dashboard、明细、新增、搜索、账户、分类、商家、统计、设置、账本管理全部刷新 | 共通刷新测试 + 三条 Action 测试 | 通过 |

## 已修复问题

### 1. 接受邀请后写入了错误的 current ledger 存储位置

审计确认应用读取 current ledger 的事实来源是 `app_user.current_ledger_id`：

- `getCurrentLedgerContext` 从 `app_user.current_ledger_id` 读取当前账本。
- 手动切换账本的 `updateCurrentLedgerService` 也更新 `app_user.current_ledger_id`。

但 `accept_ledger_invite` RPC 在加入成功和已经是成员两条路径中写入的是 `user_setting.current_ledger_id`。应用没有从该字段读取 current ledger，因此接受邀请后虽然成员关系创建成功，Dashboard 仍可能继续使用旧账本。

修复：

- 新增 migration `20260716200000_fix_ledger_invite_current_ledger_target.sql`。
- 两条成功路径汇合后统一更新 `public.app_user.current_ledger_id`。
- 更新仅命中当前 active 用户；未命中时抛出 `user_inactive`，使整笔邀请事务回滚。
- 保留 `pg_catalog, pg_temp` 安全 `search_path`、邀请锁、未归档账本校验和成员归属校验。
- 新增 `ledgerInviteCurrentLedgerMigration.test.ts` 防止回退到 `user_setting`。

### 2. 三条 current ledger 变化路径维护了不同的缓存刷新清单

创建账本、手动切换账本和接受邀请都会改变 current ledger，但原实现各自维护刷新路径：

- 手动切换包含 10 个核心页面。
- 创建账本漏掉明细搜索页。
- 接受邀请只刷新 5 个页面，漏掉新增记账、明细搜索、账户、分类和商家。

这会导致接受邀请或创建账本后，部分已缓存页面仍可能显示旧账本数据。

修复：

- 新增 `server/cache/currentLedger.ts`，集中维护完整刷新路径。
- `createLedger`、`updateCurrentLedger`、`acceptLedgerInvite` 统一调用 `revalidateCurrentLedgerPaths()`。
- 新增共通刷新测试，固定完整列表及每个路径只刷新一次。
- 更新创建账本、切换账本和接受邀请 Action 测试，避免三份清单再次分叉。

## 已确认的实现证据

### Current ledger 来源

- `getCurrentLedgerContext` 从登录 claims 取得用户 ID。
- 账本列表只读取该用户 `status = active` 的 `ledger_member`。
- 账本实体只读取 `is_archived = false` 的记录。
- 存储的 current ledger 不在可访问账本集合时，不会被采用。
- `validate_app_user_current_ledger` 阻止 current ledger 指向未加入或已归档账本。

### 核心读取路径

以下 loader 已逐条确认使用 `currentLedger.id` 或由该值派生的受限 ID 集合：

- `src/server/loaders/dashboard.ts`
- `src/server/loaders/accounts.ts`
- `src/server/loaders/categories.ts`
- `src/server/loaders/merchants.ts`
- `src/server/loaders/statistics.ts`
- `src/server/loaders/transactionForm.ts`
- `src/server/loaders/transactionStep4Groups/groupLoaders.ts`
- `src/server/loaders/transactionStep4Groups/context.ts`
- `src/server/loaders/transactionStep4Groups/options.ts`
- `src/server/loaders/loadCategoriesByIdsWithParents.ts`

### 核心写入路径

以下 Action 均从服务端 current ledger 上下文取得账本 ID：

- `src/server/actions/accounts.ts`
- `src/server/actions/categories.ts`
- `src/server/actions/merchants.ts`
- `src/server/actions/transactions.ts`

以下交易 RPC 已确认同时校验账本权限和业务对象的账本归属：

- `create_transaction`
- `create_transfer_transaction`
- `update_transaction`
- `update_transfer_transaction`
- `convert_transaction_type`
- `void_transaction`
- `sync_transaction_record_tags`
- `load_transaction_group_summaries`

### 数据库兜底

- 账户、账户持有人、分类、商家、商家别名和标签写入由管理权限 trigger 保护。
- 交易记录、交易明细和交易标签关联由交易权限 trigger 保护。
- `transaction_record_tag` 通过组合外键保证记录、标签和账本一致。
- 内部余额更新和标签同步函数不向 `authenticated` 开放执行权限。
- 前端隐藏按钮不作为权限边界。

## 本次新增或扩展的回归测试

- `src/server/db/currentLedgerBoundaryAudit.test.ts`
  - current ledger、角色判断、交易 RPC、业务对象归属和权限 trigger。
- `src/server/db/ledgerInviteCurrentLedgerMigration.test.ts`
  - 接受邀请统一更新 `app_user.current_ledger_id`，不再写入 `user_setting`。
- `src/server/actions/currentLedgerBoundary.test.ts`
  - 创建账户和创建记账忽略客户端伪造的 `ledgerId`。
- `src/server/cache/currentLedger.test.ts`
  - 固化所有依赖 current ledger 的刷新路径。
- `src/server/actions/ledgerCreate.test.ts`
- `src/server/actions/currentLedger.test.ts`
- `src/server/actions/ledgerInvite.test.ts`
  - 三条 current ledger 变化路径统一使用完整刷新范围。
- `src/server/loaders/dashboard.currentLedger.test.ts`
  - Dashboard 交易和账户查询使用 current ledger；无账本时不查询业务数据。
- `src/server/loaders/statistics.currentLedger.test.ts`
  - 月度统计查询使用 current ledger。
- `src/server/loaders/masterData.currentLedger.test.ts`
  - 账户、成员、成员显示设置、分类和商家查询使用 current ledger。
- `src/server/loaders/transactionStep4Groups/options.test.ts`
  - 双账本场景下，账户、分类、商家、标签和成员筛选候选不会串账。
- `src/test/supabaseMock.ts`
  - 补充 `.lt()` 查询记录能力，用于日期范围 loader 测试。

## 审计结论

本次确认并修复两处问题：邀请接受写错 current ledger 存储位置，以及 current ledger 变化路径的缓存刷新范围不一致。

除此之外，未发现其他已确认的跨账本读取或写入漏洞。核心读取路径、写入路径、数据库权限和缓存刷新均已形成对应测试证据。后续修改如果删除关键 `ledger_id` 条件、改为信任客户端账本参数、再次写回旧字段，或让刷新清单重新分叉，新增回归测试应直接失败。

## 非目标

- 不在本审计中实现邀请二维码、汇率、预算或定时记账。
- 不修改 UI 和 Storybook。
- 不进行与数据边界无关的架构重写。
- 不因为审计而统一所有错误文案或普通代码风格。
