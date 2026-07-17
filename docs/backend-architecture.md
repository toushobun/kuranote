# KuraNote 后端架构规范

## 1. 文档目的

本文档定义 KuraNote 后端长期遵守的目录结构、依赖方向、API 与 SSR 双入口、权限、安全、缓存和测试规则。

架构父 Issue：[#468](https://github.com/toushobun/kuranote/issues/468)

本次重构的目标不是单纯移动文件，而是解决以下问题：

- 同一业务功能分散在 `actions / services / loaders / errors` 等多个顶级目录
- Server Action、Route Handler、Loader 的职责和错误处理不一致
- SSR 读取、浏览器写请求和页面刷新容易形成多套业务逻辑
- 认证、权限、Same-Origin、日志、错误映射和缓存失效容易重复实现
- Service 与 Supabase 查询混杂，难以测试和替换
- 模块之间缺少稳定公开契约，容易依赖实现细节
- RESTful API、OpenAPI / Swagger 和未来客户端缺少统一入口

重构过程中必须保持现有 UI、公开 URL、用户操作流程和数据库行为不变，除非对应子 Issue 明确要求改变。

---

## 2. 总体调用链

后端存在两类入口。两类入口共用同一套 Service / Repository，不得通过内部 HTTP 相互调用。

### 2.1 浏览器或外部客户端 API 请求

```text
Browser / External Client
  → app/api/[[...route]]/route.ts
  → Hono Master Router
  → Module Router
  → Middleware
  → Controller
  → Service
  → Repository Interface
  → Supabase Repository
  → Supabase / RPC / PostgreSQL
```

### 2.2 Next.js Server Component / SSR 数据读取

```text
Server Component / Layout
  → createServerRequestDependencies()
  → Request Container
  → Service
  → Repository Interface
  → Supabase Repository
  → Supabase / RPC / PostgreSQL
```

SSR 不得为了复用 API 而从服务器内部 `fetch("/api/...")` 请求自身。

原因：

- 增加不必要的内部网络往返
- 需要额外转发 Cookie / Session
- 增加首屏延迟和错误面
- 容易造成 API 与 SSR 两套认证状态不一致

Hono Router / Controller 只负责 HTTP 边界；Server Component 通过进程内函数调用直接复用 Service。

---

## 3. 技术决策

### 3.1 Hono

- Hono 作为统一 API Router。
- 采用 Master Router + Module Router 结构。
- 不自行实现 URL 匹配器。
- 不在 Hono 之外维护第二套路由注册表。
- Next.js 统一 API 入口为：

```text
app/api/[[...route]]/route.ts
```

- 入口显式声明：

```ts
export const runtime = "nodejs";
```

### 3.2 OpenAPI / Swagger

- API 后续按 RESTful 方式设计。
- 不建立单独 `dto/` 层。
- 请求、响应和校验契约由各模块 `schema.ts` 或 `schema/` 管理。
- 前端类型和客户端后续从 OpenAPI 契约生成，避免重复手写。
- OpenAPI / Schema 具体库在实施子 Issue 中确认。
- Swagger UI 默认只在开发环境开放；生产环境默认不注册，确有需要时必须增加认证或管理员限制。
- OpenAPI Schema 不得包含 Token、Cookie、密钥、数据库信息、内部堆栈或敏感示例。

---

## 4. 目录结构

业务模块直接放在 `src/server/`，不增加 `modules/` 层。

```text
src/server/
├─ router.ts
├─ serverModule.ts
├─ moduleRegistry.ts
├─ container.ts
├─ shared/
│  ├─ context/
│  ├─ http/
│  ├─ middleware/
│  ├─ auth/
│  ├─ errors/
│  ├─ logging/
│  ├─ schema/
│  └─ supabase/
├─ auth/
├─ user/
├─ ledger/
├─ account/
├─ category/
├─ merchant/
├─ transaction/
└─ statistics/
```

单个业务模块按需包含：

```text
index.ts
router.ts
schema.ts / schema/
controller/
service/
repository/
entity/
middleware/
cache/
adapter/next/
util/
mock/
```

规则：

- 不为形式创建空目录。
- 不要求每个模块单独维护依赖组装 `module.ts`。
- 不建立单独 `dto/` 目录。
- 模块专用工具函数放在该模块 `util/`。
- 模块专用 middleware 放在该模块 `middleware/`。
- Next.js 专用逻辑放在该模块 `adapter/next/`。
- 测试替身、fixture、factory 放在模块 `mock/`。
- 生产代码不得依赖 `mock/`。

### 4.1 业务模块归属

- `auth`：登录、注册、Google OAuth、OTP、邮箱可用性、Session、登出
- `user`：用户资料、昵称、用户级设置和偏好
- `ledger`：账本创建、当前账本、账本设置、成员、权限、邀请、账本切换
- `account`：账户管理、排序、状态、余额读取
- `category`：收入/支出分类、大分类、小分类、排序和默认分类
- `merchant`：商户管理、搜索和建议
- `transaction`：收入、支出、转账、明细 CRUD、列表、搜索和筛选
- `statistics`：Dashboard 聚合、趋势、分类统计、成员统计和其他只读聚合

发现新的独立业务边界时，应基于真实职责补充模块，不得强行塞入现有目录。

---

## 5. Module 注册规则

所有 API 模块遵守统一定义：

```ts
export type ServerModule = {
  name: string;
  basePath: string;
  router: Hono<AppEnv>;
};
```

模块从 `index.ts` 导出定义，并在 `moduleRegistry.ts` 中统一登记。

```ts
export const ledgerModule = {
  name: "ledger",
  basePath: "/ledgers",
  router: ledgerRouter,
} satisfies ServerModule;
```

Master Router 统一挂载：

```ts
for (const module of serverModules) {
  apiRouter.route(module.basePath, module.router);
}
```

新增模块不需要复制一套依赖组装模板。

---

## 6. Request Dependencies 与 Request Container

### 6.1 与 Hono 解耦

`createRequestContainer` 不接收 Hono Context，只接收框架无关的请求依赖。

```ts
export type RequestDependencies = {
  requestId: string;
  auth: AuthContext;
  logger: Logger;
  supabase: SupabaseClient<Database>;
};

export function createRequestContainer(
  dependencies: RequestDependencies,
): RequestContainer {
  // Repository / Service 组装
}
```

### 6.2 Hono 路径

```text
Hono middleware
  → 创建 RequestDependencies
  → createRequestContainer(dependencies)
  → 写入 Hono Context
  → Controller 使用
```

### 6.3 SSR 路径

```text
Server Component
  → createServerRequestDependencies()
  → createRequestContainer(dependencies)
  → 直接调用 Service
```

### 6.4 SSR 请求内去重

`createServerRequestDependencies()` 使用模块顶层 `React.cache()` 包装：

```ts
import { cache } from "react";

async function createServerRequestDependenciesUncached() {
  // 读取 Session / User，创建请求依赖
}

export const createServerRequestDependencies = cache(
  createServerRequestDependenciesUncached,
);
```

约束：

- `cache()` 在模块顶层调用并导出同一个 memoized function。
- 不得在每个 Component 内重复 `cache(fn)`。
- 仅用于 Server Component 渲染路径，不用于 Hono Route Handler。
- 不得跨用户或跨请求共享认证对象。
- 测试或可验证设计必须证明同一 SSR 请求内重复调用只读取一次认证状态。

### 6.5 惰性初始化

Container 不应在每个请求中无条件实例化全部模块依赖。

允许采用：

- memoized getter
- 模块级 lazy factory
- 首次访问 `container.ledger`、`container.transaction` 时再创建对应依赖

Container 不得演化成 Service Locator。跨模块依赖由 Container 在组装阶段显式注入窄接口。

---

## 7. 分层职责

### 7.1 Master Router

负责：

- 全局 middleware
- API 分组
- Module Router 挂载
- 统一 404
- 统一异常响应

### 7.2 Module Router

负责：

- 模块 URL
- HTTP Method
- 模块级和路由级 middleware
- Controller 挂载

### 7.3 Controller

负责：

- 读取 path params、query、headers、body
- 使用 Schema 校验请求
- 获取认证信息和 Request Container
- 调用 Service
- 选择 `200 / 201 / 202 / 204`
- 将 Service 结果作为 API Response 返回
- 写操作成功后调用模块 `adapter/next/revalidate.ts`

不得：

- 直接访问 Supabase
- 承载复杂业务规则
- 成为资源级权限的唯一判断点
- 转换数据库 Row
- 进行主要业务数据加工
- 拼接 `?error=...`
- 把失败包装为 `200`

### 7.4 Service

承担 UseCase 职责：

- 业务流程编排
- 业务状态校验
- 资源级权限判断
- 调用 Repository 和公开窄 Service Interface
- 组合、过滤、排序、分组和派生字段计算
- 对数据库结果进行最终业务加工
- 形成 Controller 或 Server Component 需要的数据结构
- 抛出稳定应用错误

Service 权限判断必须独立成立，不能假设调用一定经过 Router middleware。

不得依赖：

- Hono Context
- Request / Response
- `NextResponse`
- `redirect()` / `notFound()`
- HTTP 状态码
- `next/cache`
- Supabase 原始错误结构

### 7.5 Repository

采用“接口 + Supabase 实现 + 依赖注入”。

负责：

- Supabase Query / RPC
- 数据库 Row 到 Entity / 基础结果转换
- 数据库原始错误到安全错误转换

不得：

- 返回 HTTP Response
- 决定 HTTP 状态码
- 读取 Hono Context、Request 或页面 Session
- 承载复杂业务编排
- 依赖 `next/cache`

多表原子操作继续通过 PostgreSQL 函数 / Supabase RPC 完成，不为模仿 Go 强行设计通用 TypeScript `Tx` 参数。

数据流：

```text
Repository
  → 数据库基础结果 / Entity
Service
  → 业务加工后的最终结果
Controller / Server Component
  → 各自边界处理
```

---

## 8. 跨模块调用

同进程跨模块调用必须使用进程内函数调用，不发内部 HTTP。

允许：

- 入口从 Request Container 获取多个公开 Service
- Container 向编排 Service 注入其他模块的窄 Service Interface
- `statistics` 使用公开查询 Service 契约
- 聚合场景建立 Statistics 专用只读 Repository / RPC

禁止：

- Service 内 `fetch("/api/...")`
- import 其他模块的 Supabase Repository 实现
- Service 随意访问整个全局 Container
- 循环依赖

---

## 9. `shared/` 边界

`shared/` 只放多个模块稳定复用、且不包含具体业务语义的基础设施。不得把暂时不知道归属的代码随手放入 `shared/`。

### 9.1 `shared/context`

- Request ID
- 当前认证用户
- 请求级 Logger
- 请求级 Supabase Client
- Request Dependencies 类型

不得放具体业务参数。

### 9.2 `shared/http`

- 成功响应 helper
- 错误响应 helper
- 应用错误到 HTTP 状态映射
- 通用请求解析和响应类型

### 9.3 `shared/middleware`

- Request ID
- Access Log
- Authentication
- Same-Origin / CSRF
- 安全 Header
- 统一异常捕获
- 通用限流执行机制

模块专用权限 middleware 必须放回业务模块。

### 9.4 `shared/auth`

- 读取 Session / User
- 创建认证上下文
- 通用登录状态校验
- 认证公共类型

`shared/auth` 是通用认证基础设施；`auth` 模块承载登录、注册、OTP、OAuth 等业务。

### 9.5 `shared/errors`

统一应用错误基础设施，例如：

- `AppError`
- `ValidationError`
- `AuthenticationError`
- `AuthorizationError`
- `NotFoundError`
- `ConflictError`
- `RateLimitError`
- `RepositoryError`
- 未知异常包装

业务错误码可定义在模块中，但必须转换为稳定应用错误。Supabase / PostgreSQL 原始错误不得暴露给 Controller 或客户端。

HTTP 状态码映射归 `shared/http`；Service 不依赖 HTTP 状态码。

### 9.6 `shared/logging`

负责结构化服务端日志：

- Request ID
- 操作名称
- 模块名称
- 请求耗时
- 应用错误码
- 服务端原始错误
- 敏感数据脱敏

不得记录密码、Cookie、Access Token、邀请 Token、密钥或数据库连接信息。

### 9.7 `shared/schema`

只放多个模块稳定复用的 Schema 片段：

- 分页参数
- 排序方向
- 常用 ID 参数
- 日期范围
- 通用搜索参数
- 通用错误响应 Schema

模块专用筛选、枚举和响应结构仍放模块自身。

### 9.8 `shared/supabase`

负责：

- 创建携带当前 Session 的认证 Client
- 创建匿名 Client
- 显式创建 `service_role` Client
- 区分不同 Client 的合法调用场景
- 公共 Supabase 类型
- Supabase 原始错误的安全转换

安全约束：

- `service_role` key 只能在服务端使用，不进入客户端 bundle。
- 默认使用携带用户身份并受 RLS 保护的 Client。
- `service_role` Client 必须通过明确命名的工厂创建。
- 不得自动降级、自动切换或无意绕过 RLS。
- 使用 `service_role` 的代码必须单独测试和审查权限边界。

---

## 10. 限流边界

- 通用限流执行机制、统一 `429` 和 `RateLimitError` 放在 `shared/`。
- OTP、登录、邀请、搜索等具体限流策略、计数和冷却规则放在对应业务模块。
- 限流错误应提供必要的 `Retry-After` 信息。
- 现有 OTP attempt 逻辑迁入 `auth` 模块，不得整体塞入 `shared/`。

---

## 11. SSR / Loader 迁移

现有 `src/server/loaders/` 不作为长期顶级架构保留。

迁移规则：

- Supabase Query / RPC → Repository
- 业务聚合、排序、权限、派生字段 → Service
- `redirect()`、`notFound()`、缓存失效 → 模块 `adapter/next/` 或页面边界
- 纯工具函数 → 模块 `util/`
- Server Component → 直接调用 Service

迁移后不得出现：

- Loader 与新 Repository 同时维护同一查询
- SSR 为复用 Controller 而请求自身 API
- 权限只存在于 Router middleware
- 同一业务规则在 Loader 与 Service 各维护一份

---

## 12. 写操作后的缓存失效与页面刷新

### 12.1 服务端缓存失效

当前阶段只使用项目中真实生效的 `revalidatePath()`。

模块在 `adapter/next/revalidate.ts` 集中维护受影响路径：

```ts
export function revalidateLedgerMutation() {
  revalidatePath(routePaths.dashboard);
  revalidatePath(routePaths.ledgers);
}
```

规则：

- Hono Controller 与现存 Server Action 必须调用同一个模块级 revalidate 函数。
- 不得各自维护 path 列表。
- Service / Repository 不依赖 `next/cache`。
- 只有业务写入成功后才触发失效。
- 写入失败时不得失效。
- path 常量集中维护，不散落魔法字符串。

当前不使用没有读取端 tag 的 `revalidateTag()`。

未来引入 tag cache 时，必须在同一项改动中完成：

1. 读取端通过支持的缓存 API 声明 tag
2. 写入端失效同名 tag
3. tag 常量集中维护
4. 读取端与失效端配套测试

不得只添加失效端调用。

### 12.2 客户端刷新

普通 `/api/**` 写请求成功后，调用方必须显式：

- `router.refresh()`，或
- 刷新对应客户端查询缓存

`router.refresh()` 不替代服务端 `revalidatePath()`；两者解决不同缓存层。

后续应建立统一 mutation 封装，避免组件重复实现 `fetch + error + refresh`。

---

## 13. PR #467 衔接

PR #467 已落地的以下能力必须复用：

- 统一错误响应
- 账本邀请错误映射
- Same-Origin 校验
- 邀请接受 Route Handler

相关文件逐步收编到 `shared/http / shared/errors / shared/middleware`，不得重写另一套。

旧 Route Handler 只有在 Hono 路径完成切换并通过回归后才能删除。同一路径不得长期存在两套实现。

---

## 14. OpenAPI / Swagger 安全边界

- OpenAPI JSON 可在开发、构建或 CI 中生成。
- Swagger UI 默认只在开发环境开放。
- 生产环境默认不注册 Swagger UI；确有需要时必须认证或限制管理员。
- Schema 不包含 Token、Cookie、密钥、数据库信息、内部堆栈或敏感示例。
- 错误响应只描述安全应用错误，不暴露 Supabase / PostgreSQL 原始异常。

---

## 15. 测试策略

### Router

- URL / Method 匹配
- middleware 顺序
- `401 / 403 / 404 / 409 / 429 / 500`
- Request ID 和统一错误结构

### Controller

- 请求参数解析与 Schema 校验
- Service 调用参数
- 成功状态码与响应
- 写成功时调用模块 revalidate 函数
- Service 失败时不触发 revalidate

### Service

- 业务流程
- 权限独立成立
- 状态冲突
- Repository / 跨模块 Service 调用
- SSR 与 API 路径业务结果一致

### Repository

- Supabase Query / RPC 参数
- Row 转换
- 错误转换
- RLS / `service_role` 安全边界

### SSR

- 不发内部 `/api` 请求
- 同一请求内 Request Dependencies 去重
- 未授权用户不能因绕过 Router middleware 读取资源
- Loader 迁移前后页面数据与行为一致

### 缓存

- 写成功后服务端缓存失效
- 写失败不失效
- Server Action 与 Hono Controller 共用同一函数
- 客户端 API 成功后刷新当前页面或查询缓存
- 使用 tag cache 时验证读取端打标与写入端失效成对存在

### Vitest 环境

- Router / Controller / Service / Repository 后端测试使用 Node environment。
- React 组件和页面 UI 测试继续使用 jsdom。
- 初期可使用文件级 `@vitest-environment node`。
- 后端测试规模扩大后再评估 Vitest projects / 独立配置。

---

## 16. 依赖方向

允许：

```text
Router → Controller
Controller → Service
Controller → 模块 Next.js revalidate adapter
Service → Repository Interface
Service → 公开窄 Service Interface
Repository Implementation → Supabase
Repository Implementation → Entity
Module → Shared
Server Component → Request Container → Service
Server Action → Service + 模块 Next.js revalidate adapter
```

禁止：

```text
Repository → Service
Repository → Controller
Service → Controller / Hono / NextResponse
Service → 内部 HTTP API
Service → next/cache
Entity → Supabase
Shared → 具体业务模块
Controller → 直接操作 Supabase
Module A → Module B 的 Repository Implementation
生产代码 → mock
只有失效端、没有读取端打标的 revalidateTag
```

---

## 17. 迁移顺序

### 阶段 1：基础设施

- Hono Catch-all Route、Master Router、Module Registry
- Request Dependencies 与惰性 Container
- `shared/http / errors / middleware / logging / auth / schema / supabase`
- OpenAPI / Schema 技术选型
- Node 测试环境

### 阶段 2：HTTP API 样板

- 以 PR #467 账本邀请接受流程为样板
- 迁移为 Router → Controller → Service → Repository
- 复用错误响应和 Same-Origin 能力

### 阶段 3：单业务域 SSR 样板

- 选择只依赖已迁移模块或单一业务域的 Loader
- 不使用 Dashboard
- 验证 cached Request Dependencies → Container → Service → Repository

### 阶段 4：Ledger / Auth / User

### 阶段 5：Account / Category / Merchant

### 阶段 6：Transaction

### 阶段 7：Statistics / Dashboard

- 仅在依赖模块公开查询契约稳定后迁移
- 使用窄 Service Interface 或 Statistics 专用只读 Repository / RPC

### 阶段 8：收尾

- 迁移剩余入口
- 删除废弃顶级旧实现
- 更新开发规则与本文档
- 完成全量回归

---

## 18. 架构变更维护规则

- 子 Issue 和 PR 必须引用本文档对应章节。
- 架构规则变化时，必须同步更新本文档和 #468 的关键决策摘要。
- 不得只更新 Issue 评论或只修改实现而不更新文档。
- 文档和代码冲突时，PR 必须明确说明并在同一改动中修正文档。
