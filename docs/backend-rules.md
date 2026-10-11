# 后端规则

本文件从 `docs/AI_RULES.md` 拆出，与其具有同等约束力，包含「统一错误处理」与
「后端架构模型」两部分。涉及 `src/internal/**`、`app/api/**`、Server Action、
Repository / Service / Controller / Router 或错误处理的任务，必须先阅读本文件全文。

## 统一错误处理

本节是项目错误处理的权威规则来源。模块实现与测试必须遵守本节；Issue #462
保留迁移和验收记录，Issue #468 保留后端分层规则。

### 应用错误与 HTTP 状态

- 参数格式或业务校验失败使用 `ValidationError`，映射为 `400`。
- 未登录或会话失效使用 `AuthenticationError`，映射为 `401`。
- 已登录但无权限使用 `AuthorizationError`，映射为 `403`。
- 资源不存在或不可访问使用 `NotFoundError`，映射为 `404`。
- 唯一约束、重复操作或状态竞争使用 `ConflictError`，映射为 `409`。
- 限流使用 `RateLimitError`，映射为 `429`；安全的
  `details.retryAfterSeconds` 同步输出为 `Retry-After`。
- 数据库、Supabase 或外部持久层失败使用 `RepositoryError`，映射为
  `500`。
- 未知程序错误由 `errorHandlingMiddleware` 记录后转换为安全
  `internal_error` `500`。
- 不得用普通 `AppError` 或普通 `Error` 模糊代替语义明确的上述子类。
  HTTP status 与响应体 `error.status` 必须一致。

### 分层职责与数据库异常

- Repository 负责 Query / RPC、Row 转换和原始异常转换；不得直接
  `throw error`、`throw new Error(error.message)`，也不得用 `null`、
  `false` 或空数组掩盖数据库失败。
- “没有查询到数据”可以返回 `null` 或空数组；“查询执行失败”必须记录在
  安全服务端日志中并抛出 `RepositoryError`。两者不得混用。
- PostgreSQL 稳定 code（例如唯一约束 `23505`）或 RPC 明确返回的稳定业务
  code 可以转换为 `ConflictError` 等业务错误。RPC 业务 code 只从约定字段
  精确匹配，不得解析或模糊匹配英文 `message`。
- Service 负责业务编排、权限和状态判断，并抛出语义正确且 message 可安全
  直接展示的应用错误；不得依赖 HTTP、Hono 或 Next.js 导航行为。
- Controller 负责输入 Schema、调用 Service、成功状态与响应；不得另建错误
  响应协议或自行泄露异常。
- Router 挂载统一 request context、错误处理中间件和模块路由。

原始数据库 message、details、SQL、表名、约束内部名称、连接信息、堆栈、密钥
和内部 cause 只能存在于安全服务端日志或不会被序列化的内部字段中。统一错误
响应不得序列化内部 cause。`details` 只用于客户端确实需要且已确认安全、稳定的
结构化信息（例如重试秒数或受控跳转路径），不得承载原始数据库异常。

### 日志、requestId 与入口差异

- Hono/API 未知异常日志至少包含 `requestId`、请求 `path` 和安全的
  `errorName`；有请求级 logger 时必须使用它，仅在 logger 不可用时回退到
  `console.error`。
- 客户端只能收到安全 message、稳定 code、真实 status，以及可用时的
  `requestId`，不得收到未知异常的原始 message。
- HTTP API 失败通过真实 `4xx` / `5xx` 与统一 `error` 响应体表达。
- Server Action 不是独立 HTTP API。失败态以 `BaseActionState` 为基础返回
  inline `{ error, errorKey? }`，由当前页面复用 `FailureFeedbackDialog`
  展示；Action 记录未知异常并返回安全 message，不得为制造 HTTP `500`
  破坏 `useActionState`。`errorKey` 仅用于区分连续发生的失败并触发本次
  反馈，每次失败可生成新的随机值，不是稳定业务错误码；禁止为各 flow
  新增 `{ ok, error }` 协议或失败 `redirect()`，成功后的真实页面导航仍
  可使用 `redirect()`。
- 无论失败发生在表单解析、前置校验还是 Service 调用阶段，用户侧错误文案
  都必须由对应的校验或业务错误源头提供为可直接展示的安全 message，Action
  只负责写入状态。Server Action 的解析失败、前置校验和 Service 失败文案
  必须来自对应模块的单一权威错误定义。页面和组件不得按错误码重复维护
  文案；现有 flow 中的页面层映射应在迁移该 flow 时清理，不得继续扩散。
- `RequestRegisterOtpActionState` 与 `SubmitRegisterOtpActionState` 的既有
  `status` 枚举属于 Issue #462 范围外的存量协议，不要求改造，也不得作为
  新 flow 的实现先例。
- 弹框关闭后应维持当前 URL，刷新页面不得重复显示已经处理完毕的历史异常。
- 模块错误定义默认集中在模块根目录的 `errors.ts`。当模块错误数量较多且可按
  独立业务流程清晰拆分时，可以使用 `errors/` 目录，并以业务流程命名目录内
  文件；不得使用 `categoryErrors.ts` 一类重复模块名前缀的命名。Service、
  Server Action、页面和组件必须引用该权威定义，不得复制错误文案字面量。

### Redirect、查询参数与测试

- 禁止用失败 `redirect()`、`?error=...` 或读取 `searchParams.error` 传递
  异常。成功后的真实导航、OAuth 协议回跳、登录 `next`、筛选、分页、搜索等
  正常查询参数不在禁止范围。
- 新增错误码时，至少补充子类到 HTTP status 的共享映射测试，并在受影响的
  Repository / Service / Router 或 Server Action 层补充最接近真实入口的
  回归测试。
- Router 测试必须同时断言真实 HTTP status、响应体 status、code、安全
  message、可用时的 requestId，以及不会泄露原始异常。
- 成功入口需验证实际 `2xx` 和 OpenAPI 声明一致；可通过真实
  `Response` 观察的正常跳转需验证实际 `3xx` 与 `Location`。不得把
  `NEXT_REDIRECT` 单元测试冒充真实 HTTP 状态测试。

## 后端架构模型

本节是 kuranote 后端分层模型的权威说明。模型从 Next.js App Router、Supabase、
Hono 与请求级 DI 的实际约束出发，不照搬任何单一语言或框架的既有惯例。
Issue #532、#533 保留 `service/read/` 与类型归属的试点落地记录。

### 模块内部分层（`src/internal/<module>/`）

```text
<module>/
├── index.ts                  # 模块唯一公共入口
├── router.ts                 # 路由 path → handler 静态表（不是所有模块都需要）
├── controller/               # HTTP handler
├── service/
│   ├── <module>Service.ts    # 主 Service：显式契约 + 工厂
│   └── read/                 # 模块内部共享读取逻辑
├── repository/               # interface + 工厂，唯一碰 Supabase client 的地方
├── entity/                   # 模块公共领域类型
├── schema.ts                 # zod 边界契约 + Server Action 表单解析
├── errors.ts                 # 模块错误定义（具体文件组织约定见 #535）
├── adapter/next/             # Next.js 专属胶水
└── util/                     # 零 I/O 纯函数
```

各层职责如下：

- **`index.ts`**：模块唯一公共入口，只导出真正需要跨模块或跨层使用的窄
  Service 接口、`entity/` 类型、错误码，以及从 `schema.ts` 推导出的公共类型。
  模块外代码不得绕过它深度导入实现文件。模块公共 API 只由此入口决定，不按
  单个文件 export 的数量判断某个符号是否公共。
- **`router.ts`**：声明路由 path、method 与 handler 的静态映射，不包含业务
  逻辑，也不负责输入校验；不是每个模块都必须有 HTTP 路由。`router.ts`
  必须是主 HTTP 路由的可视入口，在同一文件中声明 Method、Path 与
  Controller Handler 绑定；额外 basePath 的路由使用语义明确的
  `*Router.ts` 文件。Controller 不得定义 `createRoute()`，也不得反向
  依赖 Router。统一 request context 与错误处理中间件的挂载规则见上文
  「统一错误处理」。
- **`controller/`**：读取 `schema` 校验结果、调用 Service，并封装成功状态码
  与响应，不包含业务逻辑。Controller 维持具名 handler 分别导出，不打包成
  对象；路由在应用启动时静态注册，此时还没有请求级 Container 可以注入，
  打包没有实际收益。异常职责统一引用上文「统一错误处理」，不得另建协议。
- **`service/<module>Service.ts`**：使用显式命名的契约类型（`interface
XxxService` 或对象字面量 `type XxxService` 均可，不强制机械统一）与
  `createXxxService()` 工厂表达可注入边界，负责业务编排、权限判断，以及只
  通过目标模块 `index.ts` 窄接口进行的跨模块调用。错误语义与安全文案规则见
  上文「统一错误处理」。Service 构造依赖类型默认不 export。
- **`service/read/`**：放置由本模块一个或多个 Service 使用、**不持有构造
  注入依赖、无需独立实例生命周期**的读取、查询或聚合辅助逻辑。这些文件不
  注册进 DI 容器，也不从模块 `index.ts` 导出。
- **`repository/`**：统一使用 `interface XxxRepository` 与
  `createXxxRepository()` 工厂表达可注入边界，是模块内唯一直接接触
  Supabase client 的层，负责 Query / RPC、数据库 Row 与领域类型的转换。
  数据库异常转换规则统一引用上文「统一错误处理」，此处不重复维护。
- **`entity/`**：只放两类类型：经 `index.ts` 导出的模块公共契约类型；或被
  Controller、Service、Repository、前端中至少两层稳定复用的业务概念类型。
  不得因为「两个文件用了」或字段形状相同就放入 `entity/`；结构相同不代表
  语义相同，例如两个 `{ id, name }` 可能分别代表账户选项和成员摘要。新建前
  必须先确认是否已经存在表达同一业务概念且语义一致的类型。仅供 Service
  内部多个实现文件共用、不构成模块公共契约的辅助类型留在 `service/read/`。
- **`schema.ts`**：用一份 zod schema 同时提供运行时校验、OpenAPI 文档与
  编译期类型，并放置 Server Action 的表单解析函数。需要新增手写类型前，先
  判断能否从 schema 推导。HTTP 请求与响应类型应从这里的 schema 推导。
- **`errors.ts`**：集中模块错误码与安全、可直接展示的错误文案；单一权威
  定义及其消费规则见上文「统一错误处理」，具体文件组织约定由 #535 定型。
- **`adapter/next/`**：Next.js 专属胶水。Server Component 的 loader 直接调用
  `createRequestContainer(...).xxx.service`，不向自身发送 HTTP 请求；Server
  Action 负责校验、调用与 `revalidate`，其失败状态规则见上文「统一错误处理」。
- **`util/`**：只放零 I/O、零权限判断的纯计算逻辑，可被包括前端在内的调用方
  安全复用。不要把符合 `service/read/` 语义的读取辅助放入 `util/`。

数据库 Row 类型归 Repository；只在一个函数签名中使用一次的类型可以留在
原地，不强行升级为共享类型。

### 跨模块协作

- 跨模块调用只能依赖目标模块 `index.ts` 导出的窄接口，禁止深度导入。
- `container.ts` 是组合根，也是唯一允许深度导入各模块具体工厂函数的地方。
- 模块之间不得出现双向依赖。
- 通用错误、日志、Schema、Supabase 与 middleware 能力放入 `src/internal/shared/`，
  不得把业务规则塞入 `shared/`。
- Router / Controller 与模块公共边界由基于 TypeScript AST 的
  `internalBoundary.test.ts` 检查，不得退回依赖源码格式的正则解析；
  最终 Method、URL 与模块挂载结果由 `routeRegistry.test.ts` 固化。

### DI 与 RequestContainer

- 每个请求拥有一个 `RequestContainer`，其中的模块字段按需惰性构造。Supabase
  client 绑定当前用户登录态，不能跨请求复用，因此不能照搬「应用启动时装配
  一次、长期存活」的容器模型。
- 多个模块共用的叶子依赖（例如 `ledgerAccessService`）通过容器顶层闭包变量
  惰性构造并共享一次，不得在每个模块字段内重复构造。
- 不引入 Wire 一类编译期 DI 生成器；当前请求级容器已经足够轻量。

### 安全边界：RLS 与 Service 双重防线

- Supabase RLS 是第一道防线，保证即使代码权限判断出现缺陷，数据库也不会
  越权返回数据；每张业务表都必须具备这一层保护。
- Service 的权限判断是第二道防线，负责角色、账本归属等「业务规则是否允许
  操作」的判断。它与 RLS 互补，两层都必须能够独立生效，不能只依赖其中一层。

### 前端与服务端读取路径

前端继续使用 Atomic Design（`atoms`、`molecules`、`organisms`、`templates`），
业务组件按模块归属放置，复杂组件采用「组件 + hook」，配套文件收进组件自己的
子目录；完整规则见 `docs/AI_RULES.md` 的「当前前端骨架方针」「组件与 Hook 拆分规则」。Server
Component 优先直接调用 `loadXxxView()`，不向自身发送 HTTP 请求；需要交互的
操作使用 Server Action。

### 新场景的判断准则

1. 逻辑是否需要构造时注入依赖，或是否拥有独立生命周期？有则放入正式
   Service；没有但被多处复用则放入 `service/read/`；没有且只有一个调用点则
   就地内联。
2. 类型是否是模块对外的承诺？会被其他模块或前端依赖则放入 `entity/`；只在
   当前文件使用一次则内联；只在同层内部的几个文件间传递则留在原地或
   `service/read/`。
3. 两个类型形状相同，是否确实代表同一个业务概念？不确定时不要合并，宁可
   暂时保留两份。
4. 操作是否真的需要经过 HTTP？Server Component 的读取路径默认直接连接
   Service，并非默认都要创建 Controller 与 Router。
5. 规则能否由 RLS 兜底？能则 RLS 与 Service 两道防线都实现；不能则必须在
   Service 层显式处理。
6. 无法判断时，不要问「某个参考过的 Go 项目会怎么做」，而要问「一个只懂
   Next.js、Supabase、Hono，没见过 Go 的人会怎么做」。RLS、zod 单一来源、
   Server Component 直连 Service 等技术栈本身的惯用法才是参照系，而不是
   任何单一语言的既有习惯。

### 已明确否决的做法

- **新增 UseCase 层**：当前跨模块编排通过 Service 依赖目标模块窄接口已经
  足够，不需要在 Controller 与 Service 之间再增加一层。
- **把 Controller 包装为构造注入类**：路由在应用启动时静态注册，此时没有
  请求级 Container 可供注入；套用该模式只是没有实际注入对象的包装。
- **机械规定「一个文件只 export 一个符号」**：Service 的契约、工厂与紧密
  关联的输入输出类型放在同一文件具有正确的高内聚性，不应为满足 export 数量
  而拆散。
