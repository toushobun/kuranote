# Vercel + Supabase 单环境部署说明

本文件记录 KuraNote 当前阶段的部署和验证方式。

## 当前模型

当前阶段只使用一个 Supabase project。

| 环境              | 用途          | 连接目标                |
| ----------------- | ------------- | ----------------------- |
| Vercel Production | main 分支部署 | 同一个 Supabase project |
| Supabase project  | 当前唯一 DB   | Production 使用         |

PR merge 到 main 后，GitHub Actions 依次执行 Supabase migration → Vercel 生产部署。PR 阶段不部署任何 Vercel 环境。

## Vercel 项目设置

1. 在 Vercel Dashboard 新建 Project。
2. Import Git Repository，选择 `toushobun/kuranote`。
3. Framework Preset 选择 Next.js。
4. Build Command 使用默认 `npm run build`。
5. Install Command 使用默认 `npm install` 或 `npm ci`。
6. Output Directory 保持 Next.js 默认值。
7. 在 Vercel Project Settings 中配置当前 Supabase project 的公开连接信息。
8. 自动 Git 部署由仓库根目录 `vercel.json` 的 `git.deploymentEnabled: false` 关闭。生产部署只允许通过 GitHub Actions 的 `.github/workflows/deploy.yml` 执行，避免 Vercel Git Integration 绕过 Supabase migration。

当前阶段只需配置 Production 的 Supabase 公开连接信息。变量名以 `.env.example` 为准。

## Supabase Auth 回调设置

如果 Vercel Production URL 需要登录，需要在 Supabase Dashboard 的 Auth URL 设置中允许对应 URL。

建议先允许：

```text
http://localhost:3000
https://<vercel-project>.vercel.app
```

如后续使用自定义域名，再补充正式域名。

## 本地 Supabase 开发

本地开发有两种模式：

| 模式                                      | 运行方式                                                      | 适用场景                                         | 注意事项                                 |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| 标准模式：本地 Supabase Docker stack      | `npx supabase start` + `npm run dev`                          | schema / migration / RLS / RPC / seed 开发与验证 | 占用 Docker 镜像、容器和 volume 空间较多 |
| 省空间模式：本地 Next.js + Supabase Cloud | 只执行 `npm run dev`，通过 `.env.local` 连接 Supabase project | 页面确认、登录流程、读取 / 写入的基本联动测试    | 禁止连接 production，避免破坏真实数据    |

`.env.local` 只用于本地开发，不提交到仓库。复制模板后填入当前开发模式需要的公开连接信息：

```bash
cp .env.example .env.local
```

本地 Supabase 模式：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-or-anon-key
```

Supabase Cloud 联动模式：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

`NEXT_PUBLIC_` 开头的变量会进入浏览器 bundle，因此只能使用浏览器允许公开的 publishable / anon key。`service_role` key 或其他高权限管理用 key 不允许写入 `NEXT_PUBLIC_` 变量，也不应该提交到仓库。

### 标准模式

修改 migration、RLS policy、RPC 或 seed 时，优先使用本地 Supabase Docker stack 验证。

```bash
npx supabase start
npx supabase status
npm run dev
```

打开 `http://localhost:3000`，确认登录、Dashboard、记账相关主要页面可以访问本地 Supabase 数据。

### Supabase Cloud 联动模式

如果本地环境不适合启动 Docker Desktop，可以只运行 Next.js，并连接 Supabase Cloud project 做页面确认和基本联动测试。这个模式用于缓解本地空间压力，不替代数据库层验证。

初次配置：

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

日常应用 migration 到已 link 的 Supabase project 前，先确认差分：

```bash
npx supabase db diff --linked
npx supabase db push
```

`db push` 会把本地 migrations 应用到已 link 的远程数据库。执行前必须确认当前 link 的 project ref 不是 production。

### migration / RLS / RPC 验证原则

- 修改 migration 时，优先在本地 Supabase 或一次性开发验证用 project 中验证。
- 数据库最终结构统一记录在 `supabase/schemas/00_current_schema.sql`；结构变更需同步提交声明式 schema 与新的向前 migration，具体流程见 [`database-schema.md`](database-schema.md)。
- 修改 RLS policy 时，需要确认不同用户和账本成员的访问边界。
- 修改 RPC 时，需要确认正常路径、权限不足、参数异常和回滚行为。
- 对 Supabase Cloud project 执行 `db push` 前，先确认 project ref，并通过 `db diff --linked` 检查即将应用的内容。
- 禁止对 production 执行开发验证用的 migration、seed 或 reset。

### 防误连 production 清单

- `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL` 不是 production URL。
- Supabase CLI 当前 link 的 project ref 不是 production。
- 本地验证账号不是正式用户账号。
- 要执行的 SQL 不会破坏共享数据。
- PR 描述中写明是否做过 Supabase 联动确认。

## Supabase migration 应用方式

migration 通过 GitHub Actions 的 `deploy.yml` 自动执行。生产部署不得依赖 Vercel Git 自动部署。

workflow 文件：

```text
.github/workflows/deploy.yml
```

触发方式：

1. push 到 `main`。
2. 在 GitHub Actions 页面手动执行 `workflow_dispatch`。

执行顺序：

1. Checkout 当前提交。
2. 连接 `SUPABASE_PROJECT_REF` 指向的 Supabase project。
3. 显示当前远程 migration 状态。
4. 执行 `supabase db push`。
5. 再次显示远程 migration 状态。
6. migration 成功后，使用 Vercel CLI 执行 Production build / deploy。

原则：

- `supabase/schemas/00_current_schema.sql` 仅作为当前结构入口和 migration 差分来源，不直接应用到 production。
- 每次生产部署前都执行 `supabase db push`，不再只依赖当前提交是否包含 `supabase/migrations/` diff。
- 这样可以覆盖「上一次 migration 失败，下一次提交没有 migration diff」的场景，避免应用代码先部署、生产 DB 仍停在旧 schema。
- `migrate` job 失败时，`deploy` job 不会执行。
- `vercel.json` 已关闭 Vercel Git 自动部署，避免绕过 `migrate` job。
- 执行后在 Supabase Dashboard 或 SQL Editor 确认 migration 状态。

## 推荐验证顺序

### 普通 PR

1. 开发中持续 push，CI 自动运行（Stage 1: format-check / type-check / lint 并行 → Stage 2: test → Stage 3: build / storybook-build 并行）。
2. CI 全部通过后发起 Review，确认无问题后 merge。
3. merge 到 main 后，`deploy.yml` 自动启动，并在生产部署前执行 `supabase db push`。
4. 打开 Vercel Production URL，验证登录、Dashboard、记账相关页面。

### 包含 migration 的 PR

1. 开发中持续 push，CI 自动运行。
2. Review `supabase/migrations/` 变更，确认对现有数据安全。
3. CI 全部通过后 merge。
4. merge 到 main 后，`deploy.yml` 自动启动，执行 Supabase migration → Vercel Production 部署。
5. 在 Supabase Dashboard 或 SQL Editor 确认 migration 状态。
6. 打开 Vercel Production URL，验证主要页面。

## 排查要点

### Vercel build 失败

先确认：

- Vercel 使用 Node.js 20 或以上。
- `npm run build` 在 GitHub Actions CI 中通过。
- Vercel 公开连接信息已经配置并重新部署。
- `vercel.json` 中 `git.deploymentEnabled` 保持为 `false`，不要重新启用 Vercel Git 自动部署。

### 页面可以打开但 Supabase 请求失败

先确认：

- Vercel 当前 deployment 的配置已经重新部署后生效。
- Supabase 连接目标是当前唯一的 Supabase project。
- Supabase Auth 允许当前 Vercel URL。

### deploy.yml 中 migration 失败

先确认：

- GitHub repository 的 Secrets 已正确配置（`SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` / `SUPABASE_PROJECT_REF`）。
- Supabase project ref 指向当前唯一的 Supabase project。
- Supabase migration 文件没有重复创建对象。
- migration 失败后 Vercel 部署不会触发，需要修复问题后重新触发 `deploy.yml`（可在 GitHub Actions 页面手动触发）。

### 生产应用和 DB schema 不一致

先确认：

```sql
select version
from supabase_migrations.schema_migrations
order by version desc
limit 20;
```

如果生产应用已经部署到新代码，但缺少对应 migration，优先手动触发 `deploy.yml`，让 `supabase db push` 补齐远程 migration。不要直接修改业务查询兼容旧 schema，除非正在做明确的回滚方案。

## 不包含范围

- 不在本阶段拆分 Supabase dev / staging / production。
- 不为每个 PR 自动创建独立 Supabase database。
- 不新增业务逻辑。
