# AI_RULES.md

本文件用于约束 AI Agent 在本仓库中的开发行为。
本项目会在多台设备（Windows / macOS）之间流转，以项目级规则为准。

## 必须先确认的内容

开始任何开发任务前，必须按以下顺序确认规则：

1. 阅读本文件全文。
2. 如果任务对应 GitHub Issue，再阅读当前要处理的目标 Issue。
3. 如果任务涉及 `src/internal/**`、`app/api/**` 等后端分层结构，还需阅读 Issue #468（后端架构重构父 Issue），确认当前适用的分层规则、模块归属和迁移阶段要求。

> Issue #1 保留项目背景、技术选型、产品方向等上下文说明，按需参考。
> Issue #90 保留前端骨架历史决策记录，按需参考。
> Issue #468 保留后端架构分层规则、迁移阶段和验收条件，规则随迁移进度持续更新，后端任务必须参考最新正文，不能只按本文件推断。
> 后端业务迁移完成后，业务代码统一归入 `src/internal/<module>/`。不得重新建立顶级 `src/internal/actions`、`services`、`loaders`、`errors`、`validators`、`http` 或 `context` 兼容目录；Next.js 专用行为放入模块 `adapter/next/`，跨模块协作只依赖公开窄 Service Interface。
> `src/internal/<module>/index.ts` 是模块公共契约入口，Router 与 `basePath` 只在 `moduleRegistry.ts` 集中登记。`src/internal/` 外部代码只能通过模块根入口或模块内 `adapter/next/**` 访问业务模块，不得深度导入 Controller、Service、Repository、Schema、errors、entity 或 util 等实现文件。
> 前端相关的核心行为约束已全部整理在本文件中，无需每次强制读取 #1 / #90；后端任务仍需按上一条参考 #468。

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

PR merge 后需要回收相关状态：

- 确认对应 Issue / PR 中相关 TODO checkbox 已勾选。
- 更新对应 Issue 的状态、说明或后续事项。
- 如 PR 描述中有未完成事项、Storybook / 测试说明或 follow-up，merge 后同步更新。
- 确认关联关系正确，例如 PR 正文包含 `Closes #N` 或在 Issue 中补充对应 PR 链接。

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
- 面向用户显示的文案不得硬编码散落在多个组件中，至少集中到模块级常量文件统一管理。

## 实现时的注意事项

- 保持最小差分，不混入无关重构。
- 新增或修改含有业务逻辑的 `.ts` 文件时，原则上需要补充 Vitest 单元测试。
- 类型定义文件、常量文件、纯配置文件不强制追加测试，但必须通过 TypeScript 类型检查与既有相关测试。
- 修改 Server Action、Route Handler、Repository、数据库 RPC 或 RLS 时，必须补充对应成功、失败、权限与边界条件测试。
- 写操作的缓存失效必须发生在成功完成之后，失败路径不得刷新缓存。
- 不得把 Next.js 的 `redirect()`、`notFound()`、`revalidatePath()`、`cookies()` 等框架行为放入 Service 或 Repository。
- 新增模块时，必须按 `Router → Controller → Service → Repository → Schema` 分层，并在 `moduleRegistry.ts` 登记 Router 与 `basePath`。
- Controller 只读取已校验的请求数据、调用 Service、选择 HTTP 状态码和响应体；不得定义 `createRoute()`，不得反向依赖 Router，也不得直接访问 Repository。
- `src/internal/<module>/index.ts` 只公开稳定公共契约；模块外部代码不得绕过根入口深度导入实现文件，Next.js 边界代码除外，仅允许通过模块内 `adapter/next/**` 访问。
- OpenAPI Route Contract 的 Method、Path 与 Handler 绑定必须集中在 Router 文件中，错误响应声明优先复用 `internal/shared/http/openApiErrorResponses`。
- 结构边界测试必须使用 TypeScript AST 或运行时契约验证，不得依赖格式敏感的源码正则匹配。
