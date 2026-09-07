<p align="right">
  简体中文 |
  <a href="./README.ja.md">日本語</a> |
  <a href="./README.en.md">English</a>
</p>

# KuraNote

KuraNote 是一个以家庭记账为当前核心的多语言家庭生活记录 PWA，支持中文、日语和英语。它用于记录和可视化收入、支出、账户、转账、分类以及家庭共享消费，并帮助家庭理解钱主要花在哪些商家、每个商家涉及哪些消费分类，以及家庭成员之间如何共享日常消费。

本仓库同时作为个人开发过程记录使用。
当前核心记账闭环与多账本共享能力已经落地，项目正在从基础功能建设转向持续使用验证、UX 一致性、共通组件收敛和产品化打磨；仍在持续开发中，尚未作为正式公开产品发布。

## 项目简介

KuraNote 的目标是做一个适合家庭日常使用的 merchant-first 家庭生活记录应用。

传统记账软件通常先按分类管理消费，但实际回顾家庭支出时，“在哪个商家花了钱”往往更直观。KuraNote 会把商家作为重要入口，让用户可以围绕商家查看消费记录、分类分布和支出趋势。

当前核心方向包括：

- 快速记录日常收支与账户间转账
- 以商家为入口管理和回顾消费
- 管理现金、银行卡、信用卡、电子钱包等账户
- 管理支出分类、收入分类与标签
- 支持一张小票 / 一笔普通记账中的多条明细与混合收支
- 支持退款、报销及其与原支出的关联和净额重算
- 支持多账本、成员权限和家庭共享记账
- 按月份查看基础收支、商家和分类统计
- 优先优化手机端的日常使用体验
- 保持功能清晰、操作简单，避免记账软件常见的复杂膨胀

本项目当前主要使用中文进行需求整理、Issue 编写和开发记录。
代码、目录名、变量名和技术标识使用英文。

## 当前开发状态

项目已经完成主要家庭记账闭环，当前重点是产品化打磨和后续增强，而不是继续搭建早期 MVP 骨架。

### 已完成的核心能力

- Supabase Auth 登录体系与受保护页面
- 登录后的 App Shell、Dashboard 与底部导航
- 多账本创建、选择、切换和设置
- 账本成员、成员角色、成员个性色与共享权限
- 邀请链接加入账本与邀请二维码
- 账户管理与账户持有人管理
- 分类管理与标签基础能力
- 商家管理、商家别名、显示名与搜索基础能力
- “收支 / 转账”统一记账入口
- 普通记账多明细与同一笔记录内的混合收入 / 支出
- 交易新增、列表、搜索、详情相关展示与编辑流程
- 账户间转账
- 退款 / 报销关联、核销状态与关联编辑
- 报销 / 退款累计超过原支出后的净额转正与统计口径切换
- Dashboard 月度概览
- 月度收入、支出、净收支、商家支出和分类支出统计
- PWA manifest、移动端布局与 safe-area 基础支持
- 本地 Supabase seed、数据库 schema snapshot 与 migration 管理
- Vitest、React Testing Library、Storybook 与 GitHub Actions CI
- 后端模块边界、Repository / Service 分层与架构回归测试
- Vercel / Supabase Cloud 部署工作流

### 当前正在推进

- 商家管理新增 / 编辑 / 列表页面的 UX 一致性收尾
- 圆角、主题色、按钮、标签、反馈状态等 Design Token / 共通组件收敛
- 全局确认弹窗等跨页面交互基础设施
- iOS PWA safe-area 与状态栏在真实设备上的兼容性确认
- 对已经完成的页面继续进行真实使用验证和细节修正

### 后续主要方向

以下能力仍处于待实现、设计或后续阶段：

- 新用户首次创建账本的分步骤初始化向导
- CSV 数据导入 / 导出
- 快速记一笔预设模板
- 定时记账 / 固定收支
- 月度预算与预算对比
- 多币种记账、跨币种转账与汇率快照 / 自动刷新
- 更细化的记录人 / 消费者模型
- 更完整的趋势统计与长期分析
- AI 小票识别与图片相关能力

具体优先级和实现边界以当前 GitHub Issues 为准。

## 技术栈

### 前端

- Next.js App Router
- React
- TypeScript
- MUI
- PWA

### 服务端 / API

- Next.js Server Actions / Route Handlers
- Hono
- Zod
- 请求级模块 / Service / Repository 分层

### 数据库 / BaaS

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- Supabase RPC / PostgreSQL function & trigger

### 测试与开发工具

- Vitest
- React Testing Library
- Storybook
- ESLint
- Prettier
- Supabase CLI
- GitHub Issues / Pull Requests
- GitHub Actions
- Vercel

具体依赖版本以 [`package.json`](package.json) 为准。

## 已实现功能

### 认证

- 邮箱密码注册 / 登录
- Google OAuth 相关登录流程
- 登出
- 未登录访问受保护页面时跳转到登录页
- 已登录访问登录页时进入应用
- 邀请链接在登录 / 注册流程中的回跳处理

### 应用外壳与 PWA

- 登录后的 App Shell
- Dashboard
- 底部导航
- 移动端优先布局
- PWA manifest 与主屏幕运行基础配置
- safe-area 基础处理
- 用户主题相关 UI 与插画映射

> iOS 主屏幕 PWA 的部分状态栏 / safe-area 视觉细节仍在持续验证，具体见对应 open Issue。

### 账本与家庭共享

- 获取并维护当前账本（current ledger）
- 无账本状态下的创建引导
- 新建账本并初始化默认数据
- 账本列表、切换和设置
- 账本成员管理基础
- `owner / admin / member / viewer` 权限模型
- 账本内成员个性色与记录人展示
- 邀请链接创建、撤销、替换与接受
- 邀请角色选择
- 邀请二维码
- 核心 loader / action / RPC / RLS 的 current ledger 边界

### 账户管理

- 当前账本下的账户列表
- 新增账户
- 编辑账户基础信息
- 归档账户
- 账户持有人选择与维护
- 账户类型与金额格式化展示
- 账户相关交易上下文与余额变化逻辑

### 分类与标签

- 当前账本下的分类管理
- 支出 / 收入分类与子分类结构
- 记账时选择分类
- 标签基础管理与记账关联
- 分类在交易列表、详情与统计中的展示和聚合

### 商家管理

- 当前账本下的商家列表
- 新增商家
- 编辑商家基础信息
- 归档商家
- 商家别名新增 / 归档
- 商家名称 / 别名搜索
- 商家显示名相关能力
- 以商家为交易记录和统计分析的重要入口

商家管理页面仍在持续进行 UX 与视觉一致性收尾，当前状态以相关 open Issue 为准。

### 记账与转账

- “收支 / 转账”统一入口
- 普通记账新增与编辑
- 一笔普通记账中同时存在收入明细和支出明细
- 一张小票内多条明细
- 商家、账户、分类、标签、日期与备注
- 交易列表
- 交易搜索
- 交易编辑
- 按日期汇总收入 / 支出 / 合计
- 账户间同币种转账
- 交易相关权限与服务端校验

### 退款与报销

- 支出标记为待报销
- 退款 / 报销收入关联到原支出
- 退款与报销的核销状态展示
- 关联后的净额重算
- `pending_reimbursement / reimbursed / reimbursement_surplus` 三态
- 多笔退款 / 报销持续关联同一支出
- 累计关联金额超过原始支出后支持净额转正
- 净额转正后从支出口径切换到收入口径
- 已关联交易的受控编辑、同步确认、乐观锁与数据库一致性保护
- 子项删除时解除关联、母项仍有子项时的删除保护

### Dashboard 与统计

- Dashboard 月度收入 / 支出概览
- 指定月份统计
- 月收入合计
- 月支出合计
- 月净收支
- 商家支出汇总
- 分类支出汇总
- 混合收支、退款 / 报销净额等业务口径同步进入统计

### 本地开发数据

- `supabase/seed.sql`
- 本地测试用户
- 家庭账本及相关基础数据
- 账户、商家、别名、分类等开发数据

seed 内容会随功能迭代持续调整，具体以 `supabase/seed.sql` 为准。

### 工程化

- GitHub Actions CI
  - Format check
  - Lint
  - Type check
  - Vitest
  - RSC 相关测试
  - Build
  - Storybook build
  - 数据库 / schema 相关检查
- Vitest 单元测试与组件测试
- React Testing Library
- Storybook 组件与页面状态展示
- Supabase migration 与 schema snapshot
- SECURITY DEFINER 安全检查
- 后端模块依赖方向 / 深度导入等架构边界测试
- Vercel 部署 workflow

## 当前开发路线

项目早期的“从 0 搭建 MVP”阶段已经完成。现在按以下方向继续推进：

1. **核心流程稳定化**：继续基于真实使用修复记账、账户、商家、分类、共享账本等流程中的边界问题。
2. **UI / UX 收口**：统一页面层级、圆角、主题色、操作反馈、确认弹窗和管理类页面交互。
3. **首次使用体验**：完善创建账本初始化向导和使用引导，降低新用户第一次进入应用的配置成本。
4. **数据可迁移性**：加入 CSV 导入 / 导出和更明确的数据备份能力。
5. **高频记账效率**：推进快速模板、定时记账等减少重复输入的功能。
6. **财务能力扩展**：按需推进预算、多币种、汇率与更长期的统计分析。
7. **长期方向**：AI 小票识别、更多家庭生活记录能力等继续独立拆分，不混入当前核心记账功能。

开发任务的最新状态、拆分和优先级以 GitHub Issues 为准。

## 本地启动

### 前置要求

需要准备：

- Node.js 20 或以上
- npm
- Docker
- Supabase CLI

### 安装依赖

```bash
npm install
```

如果希望严格按照 `package-lock.json` 安装，也可以使用：

```bash
npm ci
```

### 启动本地 Supabase

```bash
npx supabase start
```

确认 Supabase 本地服务状态：

```bash
npx supabase status
```

Supabase Studio 默认地址通常是：

```text
http://127.0.0.1:54323
```

### 环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

然后根据本地 Supabase 输出填写 `.env.local`。

示例：

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
```

`.env.local` 只用于本地开发，不应提交到仓库。

### 本地测试用户

`npx supabase db reset` 会自动执行 `supabase/seed.sql`，并创建本地开发用测试用户。

登录信息：

```text
邮箱：local@example.test
密码：password123

邮箱：local2@example.test
密码：password123
```

seed 还会创建家庭账本和开发验证所需的基础数据，方便 reset 后直接做 UI 手动验证。

如需手动查看或调整本地 Auth 用户，可以打开 Supabase Studio：

```text
http://127.0.0.1:54323
```

### 重置本地数据库

```bash
npx supabase db reset
```

重置后如果浏览器中残留旧登录状态，可能会出现 refresh token 相关错误。重新登录即可。

### 查看数据库最终结构

全部时间戳 migrations 回放后的只读结构快照位于：

```text
supabase/schema_snapshot/current_schema.sql
```

数据库变更仍然先创建并编写新的时间戳 migration，再运行 `npm run db:schema:snapshot:update` 更新快照。详细流程见 [`docs/database-schema.md`](docs/database-schema.md)。

### 启动 Next.js 开发服务器

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

### 启动 Storybook 并确认组件展示

```bash
npm run storybook
```

打开 Storybook：

```text
http://localhost:6006
```

## 常用命令

### 启动开发服务器

```bash
npm run dev
```

### 执行格式检查

```bash
npm run format:check
```

### 自动格式化

```bash
npm run format
```

### 执行 lint

```bash
npm run lint
```

### 执行类型检查

```bash
npm run type-check
```

### 执行单元 / 组件测试

```bash
npm run test
```

### 执行 RSC 测试

```bash
npm run test:rsc
```

### 执行 build

```bash
npm run build
```

### 启动 Storybook 开发服务器

```bash
npm run storybook
```

### 执行 Storybook build

```bash
npm run build-storybook
```

### 重置本地 Supabase 数据库并执行 seed

```bash
npx supabase db reset
```

### 检查数据库结构快照

⚠️ 会执行 `supabase db reset`，清空本地 Supabase 中未纳入 seed 的数据。

```bash
npm run db:schema:snapshot:check
```

### 检查 SECURITY DEFINER 函数安全配置

```bash
npm run db:security-definer:check
```

## 开发流程

本项目采用 Issue-first 的开发方式。

基本流程：

1. 创建或选择一个 GitHub Issue
2. 根据 Issue 创建对应分支
3. 在新分支中进行开发
4. 本地执行检查
5. 创建 Pull Request
6. 等待 GitHub Actions CI 通过
7. 确认后合并 PR
8. PR 合并后回到对应 Issue 更新 checkbox / 完成记录，并在验收完成后再关闭 Issue

分支名示例：

```text
feature/302_new_bill_can_change_account
fix/192_account_error
docs/704_update_readme_current_status
```

Commit 示例：

```text
feat: 实现登录后基础 App Shell
docs: 更新 README 当前开发状态
chore: 添加 GitHub Actions CI
```

## 截图

KuraNote 的 UI 仍在持续打磨中，Dashboard、交易、账户、分类、商家、账本设置等页面均已具备实际实现。

为避免仓库首页截图快速过期，当前 README 暂不固定一套静态截图；组件和主要页面状态可通过 Storybook 与实际部署环境进行确认。

## 作为求职作品的说明

本项目不仅是一个记账应用，也用于展示一个小型 Web 产品从 0 到 1、再从功能可用走向产品化的完整开发过程。

重点展示内容包括：

- Issue 驱动的需求拆分、PR 拆分、review 与人工验收
- Next.js App Router 与移动端 PWA 页面设计
- Supabase Auth、PostgreSQL 与 Row Level Security
- 多账本、成员角色、邀请共享和 current ledger 数据隔离
- 小票式多明细、混合收支、转账、退款和报销等业务建模
- Server Action / Hono / Service / Repository 的后端边界
- 数据库 RPC、trigger、并发控制和一致性保护
- Atomic Design、MUI Theme / Design Token 与 Storybook
- Vitest、组件测试、架构回归测试与数据库检查
- GitHub Actions CI 和部署流程
- 从真实使用反馈中持续发现问题、拆 Issue、修复和收敛共通能力的迭代过程

当前项目仍在开发中，因此仓库会持续保留 Issue、PR 和 Commit 记录。

## 公开仓库说明

本仓库用于记录开发过程和展示项目实现方式。

仓库中不会提交本地环境变量文件、真实用户数据或个人记账数据。

## License

暂未选择 License。