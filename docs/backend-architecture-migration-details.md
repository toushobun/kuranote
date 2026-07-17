# 后端架构迁移补充说明

本文档补充 [`backend-architecture.md`](./backend-architecture.md) 第 11 节与第 17 节，记录现有混合职责代码的具体拆分映射，以及阶段 4～6 的实施范围。后续修改主架构文档时，应将本文件内容合并回对应章节，并保持与 #468 同步。

## 1. 现有混合职责代码迁移映射

迁移前必须判断文件的真实职责，必要时拆分，禁止按当前目录名机械搬运。

### `src/server/cache/currentLedger.ts`

该文件依赖 Next.js `revalidatePath()`，且只服务当前账本相关页面。

目标归属：

- `src/server/ledger/cache/`；或
- `src/server/ledger/adapter/next/`。

不得仅因当前目录名为 `cache` 就迁入全局 `shared/`。

### `src/server/context/currentLedger.ts`

该文件包含 `redirect()` 等 Next.js 页面行为，不属于纯通用 Request Context。

目标归属：

- 页面边界；或
- `src/server/ledger/adapter/next/`。

其中纯认证、当前用户或请求依赖部分可拆入 `shared/context` / `shared/auth`，但包含导航行为的代码必须留在框架适配层。

### `src/server/permissions/ledgerPermissions.ts`

该文件同时包含数据查询、业务权限编排和纯角色判断，迁移时必须拆分：

- Supabase 查询 / 资源读取 → 对应模块 `repository/`
- 业务权限编排 → 对应模块 `service/`
- 不访问数据库的纯角色判断 → 对应模块 `util/`、entity 或 domain 文件

涉及交易明细修改权限的部分应按真实业务归入 `transaction`，不得因文件名包含 `ledger` 就整体放入 `ledger/util/`。

### `src/server/db/`

数据库 migration 回归测试、schema 边界测试等不属于单一业务模块。

迁移初期继续保留 `src/server/db/`，后续可单独评估是否改名为 `src/server/database/`。不得为了目录统一而强行拆散到业务模块。

## 2. 阶段 4：Ledger / Auth / User

- 完成账本创建、当前账本、账本设置、成员、权限、邀请和账本切换迁移
- 迁移登录、注册、Google OAuth、OTP、Session、登出等认证业务
- 迁移用户资料、昵称及被其他模块依赖的用户级设置
- 按本文件第 1 节拆分 `cache/currentLedger.ts`、`context/currentLedger.ts` 和相关混合职责代码
- 保留现有 UI、公开 URL、角色权限、邀请流程和缓存刷新行为
- 所有调用方切换并通过回归后，删除对应旧 actions / services / loaders

## 3. 阶段 5：Account / Category / Merchant

- 分别建立各模块 Router、Controller、Service、Repository、Schema 和必要的 SSR 读取入口
- 迁移账户管理、排序、状态、余额读取及持有人显示信息
- 迁移收入/支出分类、大分类、小分类、默认分类和排序
- 迁移商户管理、搜索和建议
- 明确模块间只通过公开窄 Service Interface 协作
- 保持现有页面展示、筛选、排序、颜色和缓存刷新行为不变
- 每个模块独立拆分子 Issue 和可审查的小型 PR

## 4. 阶段 6：Transaction

- 迁移收入、支出、转账和明细 CRUD
- 迁移明细列表、搜索、筛选及页面 SSR 读取
- 完成与 Account / Category / Merchant 的窄接口协作
- 按本文件第 1 节拆分现有交易修改权限查询、业务判断和纯角色规则
- 多表原子写入继续使用 PostgreSQL 函数 / Supabase RPC
- 完整覆盖 owner / admin / member / viewer 权限和创建者权限
- 保持现有编辑、删除、搜索、筛选、金额计算及缓存刷新行为不变
