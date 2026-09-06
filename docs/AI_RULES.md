# AI_RULES.md

本文件用于约束 AI Agent 在本仓库中的开发行为。
本项目会在多台设备（Windows / macOS）之间流转，以项目级规则为准。

## 必须先确认的内容

开始任何开发任务前，必须按以下顺序确认规则：

1. 阅读本文件全文。
2. 如果任务对应 GitHub Issue，再阅读当前要处理的目标 Issue。
3. 涉及 `src/internal/**`、`app/api/**` 等后端分层结构的任务，直接遵循本文件下方的后端分层规则即可。Issue #468（后端架构重构父 Issue）已关闭，规则已定型并整理进本文件，不再需要每次任务都去读取其最新正文。

> Issue #1 保留项目背景、技术选型、产品方向等上下文说明，按需参考。
> Issue #90 保留前端骨架历史决策记录，按需参考。
> Issue #468（后端架构重构父 Issue）已于重构完成后关闭，规则已定型并整理进本文件，不再随迁移进度变化；如需追溯设计决策背景，可按需参考存档正文，但不作为日常任务的必读项。
> 后端业务迁移完成后，业务代码统一归入 `src/internal/<module>/`。不得重新建立顶级 `src/internal/actions`、`services`、`loaders`、`errors`、`validators`、`http` 或 `context` 兼容目录；Next.js 专用行为放入模块 `adapter/next/`，跨模块协作只依赖公开窄 Service Interface。
> `src/internal/<module>/index.ts` 是模块公共契约入口，Router 与 `basePath` 只在 `moduleRegistry.ts` 集中登记。`src/internal/` 外部代码只能通过模块根入口或模块内 `adapter/next/**` 访问业务模块，不得深度导入 Controller、Service、Repository、Schema、errors、entity 或 util 等实现文件。
> 前端与后端相关的核心行为约束均已整理在本文件中，无需每次强制读取 #1 / #90 / #468。

## CodeGraph

如果仓库根目录存在 `.codegraph/`，需要优先使用 CodeGraph 理解或定位代码，再使用 grep/find 或直接读取文件。

- MCP 工具可用时，优先使用 `codegraph_explore` 获取相关符号源码、调用路径和影响范围。工具名称可能以 `mcp__codegraph__` 为前缀，用 ToolSearch 加载。
- 需要读取单个符号或文件时，使用 `codegraph_node`。
- 如果 MCP 工具不可用，可以使用 shell 命令 `codegraph explore "<query>"` 或 `codegraph node <symbol-or-file>`。

## 语言规范

- Issue 正文、PR 正文、PR 描述一律使用中文。
- commit message 使用中文，格式为 `type: 中文说明`，常用类型：`feat / fix / docs / refactor / style / test / chore / perf`。
- 测试文件中的 `it()` 描述一律使用中文，例如：`it("显示错误信息")`。
- 代码注释（行内注释、块注释）一律使用中文。
- 例外：`describe()` 参数使用组件名或文件名等专有名词时保持英文，例如：`describe("RegisterForm")`；HTML / MUI 属性名（`placeholder`、`label`、`href` 等）不翻译；变量名、函数名、类型名保持英文。

## 图标规范

- 静态语义图标优先使用 `@mui/icons-material`。
  - 例如：成功、错误、编辑、删除、添加、日历、账户等。
- 加载 / 处理中状态优先使用 `@mui/material/CircularProgress` 或同类 MUI loading 组件。
  - 例如：检查中、提交中、保存中、加载中。
- 不为了统一 import 来源而把 loading 状态改成静态 icon。
- UI 整体固定 MUI 风格，自定义组件需与 MUI 视觉风格保持一致。
- 不引入 MUI 以外的新图标库，除非当前 Issue 明确要求并说明理由。
- 若 MUI 图标库或 MUI loading 组件中无合适方案，需在对应 Issue 或 PR 中说明原因，经人工确认后方可使用其他方案。

## 安全边界

- 浏览器端只允许使用 Supabase anon key。`service_role` key 只能在服务端使用，禁止出现在 Client Component、浏览器 bundle、前端环境变量中。
- 所有业务表必须启用 RLS 后才允许通过前端访问。
- 所有写操作必须在 Server Action / Route Handler 内部重新验证登录状态，以及用户是否以 `active` 成员身份属于目标 `ledger`，不能信任来自客户端的身份信息。
- 所有来自客户端的数据（表单、URL 参数、searchParams、headers）必须在服务端重新校验，不能直接使用。
- 数据访问逻辑优先封装在 server-only 的 Data Access Layer 中，避免敏感逻辑被 Client Component 引入。
- Route Handler 的 `POST / PUT / PATCH / DELETE` 请求需要进行认证、授权与来源校验。使用 cookie 型认证时，写操作需考虑 CSRF 风险，并通过 SameSite、Origin 校验或 CSRF token 等方式处理。
- 服务端不得自动抓取任意外部 URL。若未来实现外部 URL 抓取（如商家 icon），必须限制协议、校验域名、禁止内网 IP / localhost / metadata address，并处理重定向，单独设计 SSRF 防护后方可实现。

## TypeScript 类型安全

- 禁止使用 `any`。需要表达未知类型时使用 `unknown` 并做类型 narrow。
- 表单状态类型以 `BaseActionState = { error?: string; success?: string }` 为基础扩展，定义在 `src/types/auth.ts`。

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
  破坏 `useActionState`。
- Server Action 的解析失败、前置校验和 Service 失败文案必须来自对应模块的
  单一权威错误定义。页面和组件不得按错误码重复维护文案。
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
  逻辑，也不负责输入校验；不是每个模块都必须有 HTTP 路由。统一 request
  context 与错误处理中间件的挂载规则见上文「统一错误处理」。
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
子目录；完整规则见下文「当前前端骨架方针」「组件与 Hook 拆分规则」。Server
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

## GitHub Issue 规则

创建或编辑 GitHub Issue 时，必须遵循以下规则：

- Issue 标题使用 `type: 中文说明` 格式，例如 `fix: 修复账户错误`。
- Issue 正文默认使用中文。
- 新建 Issue 时必须加上对应 label。日常开发 Issue 优先使用以下 label：`enhancement`、`bug`、`refactor`、`test`、`documentation`、`chore`、`performance`。`design` 作为辅助 label 使用，不作为独立 Issue 类型。
- Issue 标题前缀对应的主 label 必须存在：`feat:` → `enhancement`，`fix:` → `bug`，`docs:` → `documentation`，`chore:` → `chore`，`refactor:` → `refactor`，`test:` → `test`，`perf:` → `performance`。在主 label 基础上可按需追加辅助 label，例如 `feat: 新增画面` 必须包含 `enhancement`，也可以追加 `design`、`documentation` 等；`docs: 更新说明` 必须包含 `documentation`，也可以追加其他辅助 label。
- 暂时不要默认使用 `help wanted`、`invalid`、`question`。这些 label 仅在人工明确要求时使用，不作为 AI Agent 创建 Issue 时的常规选择项。
- Label 选择规则：
  - `bug`：问题修复、异常行为、回归缺陷。
  - `enhancement`：新功能、既有功能改善、用户可见能力增强。
  - `documentation`：README、docs、Issue / PR 模板、开发规则等文档变更。
  - `chore`：依赖更新、配置调整、CI、维护作业、非用户可见的杂项整理。
  - `refactor`：不改变既有行为的代码结构调整、组件拆分、职责整理。
  - `test`：测试追加、测试修正、测试基础设施整理。
  - `performance`：加载速度、查询效率、渲染性能、构建效率或运行效率改善。
  - `design`：辅助 label。仅在 `enhancement` 类 Issue 涉及新画面、UI / UX、视觉设计、布局、插图、主题风格等设计工作时追加使用，不单独作为 Issue 主 label。
- 如果一个 Issue 同时涉及多个维度，优先选择最能代表主要目的的 label，可按需追加辅助 label；不要为了凑数添加无关 label。
- Issue 正文格式必须参考 `.github/ISSUE_TEMPLATE/` 下对应类型的模板：
  - 新功能 / 功能改善使用 `.github/ISSUE_TEMPLATE/feature.yml`。
  - Bug 修正 / 问题修复使用 `.github/ISSUE_TEMPLATE/fix.yml`。
  - 重构 / 结构整理使用 `.github/ISSUE_TEMPLATE/refactor.yml`。
  - 测试追加 / 测试整理使用 `.github/ISSUE_TEMPLATE/test.yml`。
  - 文档新增 / 文档修改使用 `.github/ISSUE_TEMPLATE/docs.yml`。
  - 依赖更新 / 配置调整 / 维护作业使用 `.github/ISSUE_TEMPLATE/chore.yml`。
  - 性能改善 / 效率优化使用 `.github/ISSUE_TEMPLATE/performance.yml`。
- 通过 PowerShell 写入 issue body 文件时，必须显式使用 UTF-8 no BOM，避免 GitHub 正文乱码。

## Git / GitHub 工作流程

- 不要直接向 `main` 提交代码。
- 原则上先创建 GitHub Issue，再根据 Issue 创建对应分支。
- 分支命名遵循 `type/issueNumber_brief_description`，例如：
  - `feature/302_new_bill_can_change_account`
  - `fix/192_account_error`
  - `refactor/158_fab_text_color`
- 通过 Claude Code on the web 开发时，执行环境会预分配形如 `claude/xxx` 的分支名，但此命名不符合规范。必须无视预分配名称，按上述规则另建正确命名的分支后再开发。
- 保持最小差分，不混入无关重构。

## PR 正文规则

创建 PR 时，正文必须遵循 `.github/pull_request_template.md`。

- PR 不需要添加 label。Issue label 规则仅适用于 Issue，除非人工明确要求，否则 AI Agent 不应为 PR 添加 label。
- PR 关联 Issue 时统一使用 `Refs #N`，只建立关联，不触发自动关闭。
- 禁止在 PR 正文中使用 GitHub 自动关闭 Issue 的关键字，包括 `Closes` / `Fixes` / `Resolves` 及其等价形式。

### Issue / PR 关联与关闭规则

- PR merge 与 Issue close 是两个独立步骤。PR merge 后不得自动视为 Issue 已完成，也不得依赖 GitHub 自动关闭关联 Issue。
- PR 自身如果包含 TODO checkbox，在 merge 或手动关闭 PR 前必须全部按实际结果处理；存在未经处理的 checkbox 时禁止 merge / 关闭 PR。
- 关联 Issue 可以在 PR merge 时保留待验收或待回收的 checkbox；这些 checkbox 不因 PR merge 自动视为完成。merge 后必须根据实际合并内容更新对应 checkbox、说明和关联 PR。
- 已完成事项必须有实现、测试、人工验收或明确记录作为依据后才能勾选，禁止为了关闭而虚假勾选。
- 对于不再实施、不适用、拆分到其他 Issue 或改为后续处理的事项，必须先在原正文记录处理结果与去向，再将对应 checkbox 标记为已处理；不得通过删除历史或直接关闭来掩盖剩余事项。
- 涉及 UI、真机、业务流程等人工验收的事项，必须在人工验收通过后再勾选对应验收 checkbox。
- 只要 Issue 仍存在未经处理的 checkbox，就必须保持 open。
- Issue 仅在相关 PR 已 merge（或事项已明确决定不实施 / 转交）、必要自动化验证完成、必要人工验收通过、所有 checkbox 已处理后，由维护者人工关闭。
- closed Issue / PR 不允许残留未经处理的 checkbox。该规则适用于 `completed`、`not planned`、`duplicate` 等任何关闭原因。

PR merge 前后需要回收相关状态：

- merge 前检查 PR 自身的 TODO checkbox 和说明是否已经处理完；关联 Issue 的 post-merge 验收项可以保持未勾选，但不得使用自动关闭关键字。
- merge 前确认 PR 正文通过 `Refs #N` 正确关联 Issue。
- merge 后更新对应 Issue 的 checkbox、状态说明、完成记录、后续事项和关联 PR 链接。
- 如 PR 描述中有 Storybook / 测试说明或 follow-up，merge 后同步更新。
- 完成必要人工验收后，再次确认 Issue 不存在未经处理的 checkbox；满足关闭条件时人工关闭，否则继续保持 open。

## 依赖管理

- 能用 MUI、Supabase 或现有依赖解决的，禁止引入新 npm 包。
- 确实需要新增包时，必须在对应 Issue 或 PR 中说明理由，经人工确认后方可执行 `npm install`。

## 当前前端骨架方针

- 测试框架继续使用 Vitest。
- 不进行 Jest 迁移。
- 前端继续使用 Atomic Design。
- 不新增 `features/` 目录。
- 不新增 `containers/` 目录。
- 业务组件继续放在 `organisms` 下，并按业务模块归属管理，例如：
  - `organisms/dashboard/`
  - `organisms/accounts/`
  - `organisms/merchants/`
- 复杂业务组件优先采用「组件 + hook」结构。
- Theme 本期只支持 light mode。
- 不实现 dark mode。

## 视觉方向

- KuraNote 是家庭共享的生活记录工具，不是企业后台，也不是强金融工具。
- 页面优先采用浅色背景、柔和卡片、适中信息密度。
- 移动端优先，按钮、表单、列表项需要适合手指点击。
- Dashboard 和统计区域优先采用轻量数据卡片风格，不做重型 BI 看板。
- 避免高密度表格、ERP 感、强装饰、赛博风、暗色模式优先设计。

## 样式规范

- 颜色、间距、圆角、阴影、字体大小必须优先来自 MUI theme token，禁止大量散落的 hard-coded 值（例如 `color: "#333"`、`padding: "12px"`）。
- `sx` 可以使用，但应优先引用 theme token（如 `spacing`、`palette`、`shape` 等）。
- 实现圆角时以 [docs/theme.md](theme.md) 的"圆角层级"一节为权威参照，必须从其中定义的 6 档 token 里选择，禁止裸数字或新增档位。
- 面向用户显示的文案不得硬编码散落在多个组件中，至少集中到模块级常量文件统一管理。

## 实现时的注意事项

- 保持最小差分，不混入无关重构。
- 新增或修改含有业务逻辑的 `.ts` 文件时，原则上需要补充 Vitest 单元测试。
- 类型定义文件、常量文件、纯配置文件不强制要求测试。
- 新增或修改 `.tsx` 组件时，原则上需要补充 Vitest 组件测试。
- 同一个源文件只保留一个与源文件同名的 `.test.ts` 或 `.test.tsx` 文件；不同场景使用 `describe` 分组组织，禁止再按 `regression`、`edit`、`pending` 等场景后缀拆分测试文件。migration / RPC 行为测试不对应单一同名源文件，不适用本规则。
- 可复用 UI 组件需要补充 Storybook。
- 新 UI 优先复用 MUI 和现有组件，不要重复造基础组件。
- 页面基础结构优先复用 Theme、PageShell、PageHeader、SectionCard、EmptyState、LoadingState、ErrorState。
- 修改页面设计结构、PageShell / Layout、主要区块层级或 route-level 页面结构时，必须同步检查并更新对应 `loading.tsx`、skeleton 或 Suspense fallback，确保加载骨架与最终 UI 结构一致。
- 同类 UI 结构出现 2 次以上时，必须优先抽象为可复用组件，禁止复制粘贴维护相似 UI。
- 复用优先级：MUI 原生组件 → 项目通用组件 → 业务模块组件 → 页面内局部组件。
- 实现某个功能前，优先确认是否已有现成方案可以直接解决：先看是否有可用的 npm 包 / 内置能力 / 现有依赖（MUI、Supabase 等）能满足需求，其次看代码库中是否已有可复用的工具函数、组件或 Service，最后才考虑新写实现。
- 同一段业务逻辑不允许分散重复写在多个文件里（禁止“东写一处西写一处”）。发现相同或近似逻辑出现在两处以上时，必须先归并到统一的函数 / 工具 / Service，再让调用方引用，不允许各自复制一份维护。

## 组件与 Hook 拆分规则

复杂业务组件推荐采用「组件 + hook」结构，`Xxx.tsx` 只负责 UI 渲染，`useXxx.ts` 负责状态、派生数据、事件处理。

适用场景：

- 组件中存在复杂状态或多个事件处理函数
- 组件中存在数据过滤、排序、聚合等逻辑
- 组件体积明显变大，UI 和逻辑混在一起影响阅读

不适用场景（不拆 hook）：

- 纯展示组件、简单 layout 组件
- EmptyState / LoadingState / ErrorState 等状态组件
- 没有复杂逻辑的小组件

### 组件目录归属

- 模块下每个独立组件（尤其带 Form / Dialog / 专属 hook / 测试 / Story 等配套文件的组件），必须拥有自己的子目录，而不是把多个组件的文件平铺在模块根目录下混在一起。
- 组件本体、`.test.tsx`、`.stories.tsx`、专属 `useXxx.ts` 统一放在该组件自己的路径下，例如：
  - `organisms/merchants/MerchantForm/MerchantForm.tsx`
  - `organisms/merchants/MerchantForm/MerchantForm.test.tsx`
  - `organisms/merchants/MerchantForm/MerchantForm.stories.tsx`
  - `organisms/merchants/MerchantForm/useMerchantForm.ts`（如需要拆 hook）
- 只有单文件、没有配套文件的极简组件（如纯展示型小组件）可以不建子目录，直接平铺。
- `organisms` 组件目录不使用 `index.ts` 桶文件。跨目录引用必须显式指向组件文件，例如 `organisms/merchants/MerchantForm/MerchantForm`；同目录内的测试、Story 与专属辅助文件可使用 `./MerchantForm`。
- 新增组件必须遵循该目录约定。

## Storybook 豁免条件

以下情况不需要新增 Storybook story：

- Next.js route-level 文件（`page.tsx`、`loading.tsx`、`error.tsx`、`layout.tsx`），内部只组合已有 Storybook 覆盖的组件。
- 仅调整运行时逻辑，无新增或变更可见 UI 状态（例如：provider 逻辑、hooks、工具函数、Server Actions、loader）。
- Bug 修复不涉及组件 props 新增或视觉输出变化。
- 纯服务端代码（Server Actions、loader、service、migration、RPC）。
- 对现有 Storybook 已覆盖组件的内部实现改动，不引入新的可测试 UI 状态。

## 测试豁免条件

以下情况不强制要求新增测试：

- 类型定义文件、常量文件、纯配置文件。
- Next.js 路由文件（`page.tsx`、`layout.tsx` 等）仅组合已有测试覆盖的组件时。
- 无任何逻辑的纯展示组件（无条件分支、无计算，只是将 props 原样渲染）。
- 只执行 `redirect()` 的 Server Actions（无验证逻辑、无条件分支）。
- 纯 re-export 文件、临时兼容文件。

不补测试时，需在 PR 描述中说明理由。不为追求覆盖率编写无意义测试，测试应优先覆盖渲染、主要交互、关键边界条件和业务规则。

## Issue 的角色

- #1：项目整体背景、技术选型、产品方向、安全设计说明。
- #90：前端骨架历史决策记录（已完成）。
- #92：Theme / Design Token（已完成）。
- #93：Layout / 状态组件（已完成）。
- #95：前端骨架整体验收记录（已完成）。
- #468：后端架构重构父 Issue（已完成），规则已并入本文件，不再随任务变化，仅作历史存档按需参考。

## Karpathy 编码行为准则

以下四条准则来自 [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)，基于 Andrej Karpathy 对 LLM 编码常见陷阱的归纳，作为本项目 AI Agent 的附加行为约束。

**权衡说明：** 这些准则偏向谨慎而非速度。对于简单任务可酌情判断，但在非琐碎工作中应严格遵守。

### 1. 先思考再编码

**不要假设、不要隐藏困惑、明确呈现取舍。**

动手实现之前：

- 明确列出你的假设。如有不确定，先提问。
- 如果存在多种解读，逐一呈现——不要默默选择。
- 如果有更简单的方案，说出来。必要时提出异议。
- 遇到不清楚的地方，停下来，指出困惑点，提问。

### 2. 简洁优先

**解决问题的最少代码量，不写投机性内容。**

- 不实现未被要求的功能。
- 不为只用一次的代码抽象。
- 不添加未被要求的「灵活性」或「可配置性」。
- 不为不可能发生的场景编写错误处理。
- 如果你写了 200 行但 50 行就能解决，重写。

扪心自问：「高级工程师会觉得这过于复杂吗？」如果是，就简化。

### 3. 外科手术式修改

**只改必须改的，只清理自己制造的混乱。**

编辑现有代码时：

- 不「顺手优化」相邻代码、注释或格式。
- 不重构没有问题的代码。
- 保持与现有代码风格一致，即使你会选择不同的写法。
- 如果发现无关的死码，说出来——不要擅自删除。

当你的改动产生了孤立代码时：

- 删除因**你的改动**而变得无用的 import / 变量 / 函数。
- 不删除原本就存在的死码（除非被明确要求）。

检验标准：每一处改动都应能直接追溯到用户的需求。

### 4. 目标驱动执行

**定义成功标准，循环验证直到达成。**

将任务转化为可验证的目标：

- 「添加验证」→「为非法输入编写测试，然后使其通过」
- 「修复 bug」→「编写能复现该 bug 的测试，然后使其通过」
- 「重构 X」→「确认重构前后测试均通过」

多步骤任务时，先列出简要计划：

```
1. [步骤] → 验证：[检查方式]
2. [步骤] → 验证：[检查方式]
3. [步骤] → 验证：[检查方式]
```

强成功标准让你可以独立循环推进。弱标准（「让它能用」）则需要不断确认。

---

**这些准则有效的标志：** diff 中无用改动减少、因过度复杂导致的返工减少、澄清性提问出现在实现之前而非出错之后。

## 迷路时的判断顺序

如果实现过程中不知道该参考哪个规则，按以下优先级判断：

1. 本文件（AI_RULES.md）
2. 当前目标 Issue
3. Issue #1（项目背景与安全设计）

确认规则后，按最小差分实现。
