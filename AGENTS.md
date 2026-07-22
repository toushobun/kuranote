# AGENTS.md

本文件用于约束 Codex 在本仓库中的开发行为。

开始任何任务前，必须先阅读并遵循 `docs/AI_RULES.md`。

如果 `AGENTS.md` 与 `docs/AI_RULES.md` 存在冲突，以 `docs/AI_RULES.md` 为准。

## 异常处理

- 不得通过在 URL 中追加 `?error=failed`、`?error=xxx` 等查询参数传递异常状态，也不得通过异常重定向后读取 `searchParams` 的方式触发错误提示。
- 用户侧异常应优先复用项目现有异常处理机制，在当前页面通过弹框或提示组件显示安全、可理解的异常消息。
- HTTP 请求应返回符合语义的标准状态码，并在响应体中使用统一的 `error.code`、`error.message`、`error.status` 结构；不得将失败请求统一包装为 `200`，也不得使用无关的 `3xx` 掩盖异常。
- 原始数据库错误、SQL、堆栈、密钥和连接信息只能记录在安全的服务端日志中，不得直接返回客户端。
- Cookie 认证的写请求必须复用 `server/shared/middleware/sameOriginRequest` 进行同源校验，或采用项目后续统一的 CSRF 防护机制。
- `3xx` 仅用于真实的页面或资源重定向。正常的 `next`、筛选、分页、搜索等查询参数不属于禁止范围。
- 弹框关闭后应维持当前 URL，刷新页面不得重复显示已经处理完毕的历史异常。
- 新增或修改功能时，应优先复用现有异常处理机制，避免再次引入 URL 错误参数方案。

## 后端模块归属

- 后端业务代码必须放入 `src/server/<module>/`，框架相关的 Server Action、`redirect()`、`notFound()` 与缓存失效放入模块内 `adapter/next/`。
- 不得重新建立顶级 `src/server/actions`、`services`、`loaders`、`errors`、`validators`、`http` 或 `context` 兼容目录；跨模块调用只使用公开的窄 Service Interface。
- 通用错误、日志、Schema、Supabase 与 middleware 能力放入 `src/server/shared/`，不得把业务规则塞入 `shared/`。
