# AGENTS.md

本文件用于约束 Codex 在本仓库中的开发行为。

开始任何任务前，必须先阅读并遵循 `docs/AI_RULES.md`。

如果 `AGENTS.md` 与 `docs/AI_RULES.md` 存在冲突，以 `docs/AI_RULES.md` 为准。

## 异常处理

- 不得通过在 URL 中追加 `?error=failed`、`?error=xxx` 等查询参数传递异常状态，也不得通过异常重定向后读取 `searchParams` 的方式触发错误提示。
- Server Action 的失败态统一以 `BaseActionState` 为基础，返回当前请求的 inline `{ error, errorKey? }` 状态（可按需保留 `success`），并由页面复用 `FailureFeedbackDialog` 展示。`errorKey` 仅用于区分连续发生的失败并触发本次反馈，每次失败可生成新的随机值，不是稳定业务错误码；禁止为各 flow 新增 `{ ok, error }` 协议或失败 `redirect()`，成功后的真实页面导航仍可使用 `redirect()`。
- 无论失败发生在表单解析、前置校验还是 Service 调用阶段，用户侧错误文案都必须由对应的校验或业务错误源头提供为可直接展示的安全 message，Action 只负责写入状态；页面与组件不得再根据错误码维护重复文案映射。现有 flow 中的页面层映射应在迁移该 flow 时清理，不得继续扩散。
- `RequestRegisterOtpActionState` 与 `SubmitRegisterOtpActionState` 的既有 `status` 枚举属于本次 Issue #462 范围外的存量协议，不要求在本次迁移中改造，也不得作为新 flow 的实现先例。
- 用户侧异常应优先复用项目现有异常处理机制，在当前页面通过弹框或提示组件显示安全、可理解的异常消息。
- HTTP 请求应返回符合语义的标准状态码，并在响应体中使用统一的 `error.code`、`error.message`、`error.status` 结构；不得将失败请求统一包装为 `200`，也不得使用无关的 `3xx` 掩盖异常。
- 原始数据库错误、SQL、堆栈、密钥和连接信息只能记录在安全的服务端日志中，不得直接返回客户端。
- Cookie 认证的写请求必须复用 `internal/shared/middleware/sameOriginRequest` 进行同源校验，或采用项目后续统一的 CSRF 防护机制。
- `3xx` 仅用于真实的页面或资源重定向。正常的 `next`、筛选、分页、搜索等查询参数不属于禁止范围。
- 弹框关闭后应维持当前 URL，刷新页面不得重复显示已经处理完毕的历史异常。
- 新增或修改功能时，应优先复用现有异常处理机制，避免再次引入 URL 错误参数方案。

## 后端模块归属

- 后端业务代码必须放入 `src/internal/<module>/`，框架相关的 Server Action、`redirect()`、`notFound()` 与缓存失效放入模块内 `adapter/next/`。
- 不得重新建立顶级 `src/internal/actions`、`services`、`loaders`、`errors`、`validators`、`http` 或 `context` 兼容目录；跨模块调用只使用公开的窄 Service Interface。
- 通用错误、日志、Schema、Supabase 与 middleware 能力放入 `src/internal/shared/`，不得把业务规则塞入 `shared/`。
- 每个模块的 `router.ts` 必须是主 HTTP 路由的可视入口，在同一文件中声明 Method、Path 与 Controller Handler 绑定；额外 basePath 的路由使用语义明确的 `*Router.ts` 文件。Controller 不得定义 `createRoute()`，也不得反向依赖 Router。
- `src/internal/<module>/index.ts` 只公开模块外部可依赖的稳定契约，不负责 Router 注册。`moduleRegistry.ts` 集中登记 Router、模块名与 `basePath`。
- `src/internal/` 目录外的代码只能从 `internal/<module>` 模块根入口或 `internal/<module>/adapter/next/**` 导入；不得直接访问 Controller、Service、Repository、Schema、errors、entity 或 util 等实现文件。
- Router / Controller 与模块公共边界由基于 TypeScript AST 的 `internalBoundary.test.ts` 检查，不得退回依赖源码格式的正则解析。
- `src/internal` 目录命名与 Router 可视化规则以 Issue #468 的最新正文为准，由 #500 / PR #501 落地；`routeRegistry.test.ts` 固化最终 Method、URL 与模块挂载结果。
