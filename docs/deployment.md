# Vercel + Supabase 单环境部署说明

本文件记录 UchiLog 当前阶段的部署和验证方式。

## 当前模型

当前阶段只使用一个 Supabase project。

| 环境              | 用途          | 连接目标                  |
| ----------------- | ------------- | ------------------------- |
| Vercel Preview    | PR / 分支验证 | 同一个 Supabase project   |
| Vercel Production | main 分支部署 | 同一个 Supabase project   |
| Supabase project  | 当前唯一 DB   | Preview / Production 共用 |

创建 PR 时，Vercel 生成 Preview Deployment。PR merge 到 main 后，Vercel 更新 Production Deployment。两者暂时共用同一个 Supabase DB。

这种方式适合当前个人开发和小范围使用。限制是 Preview 中的写入也会进入同一个 DB，因此不要在 Preview 中随意做破坏性测试。

## Vercel 项目设置

1. 在 Vercel Dashboard 新建 Project。
2. Import Git Repository，选择 `toushobun/uchilog`。
3. Framework Preset 选择 Next.js。
4. Build Command 使用默认 `npm run build`。
5. Install Command 使用默认 `npm install` 或 `npm ci`。
6. Output Directory 保持 Next.js 默认值。
7. 在 Vercel Project Settings 中配置当前 Supabase project 的公开连接信息。
8. 在 Vercel Project Settings 的 Environment Variables 中配置 `GITHUB_TOKEN`，用于 Preview build 跳过脚本读取 PR 状态。

当前阶段 Preview / Production 可以配置同一组 Supabase 公开连接信息。变量名以 `.env.example` 为准。

`GITHUB_TOKEN` 需要使用 GitHub Personal Access Token。只用于读取当前仓库 PR 状态即可，不需要写权限。未配置时脚本会退回未认证 GitHub API 请求，短期内仍可运行，但会受到较低的 rate limit 限制。

## Vercel Preview 部署条件

为避免 Draft PR 开发中每个 commit 都触发完整 Preview build，当前仓库提供 Vercel build 跳过脚本：

```text
npm run vercel:ignore-build
```

需要在 Vercel Project Settings 的构建跳过设置中配置该命令。

判断规则：

- Production deployment 总是继续 build。
- 没有关联 PR 的 Preview deployment 跳过。
- Draft PR 的 Preview deployment 跳过。
- 非 Draft PR 的 Preview deployment 继续 build。
- 无法确认 PR 状态时继续 build，避免误跳过需要验证的部署。

推荐流程是：开发中保持 PR 为 Draft；需要预览测试时，将 PR 标记为 Ready for review，再推送一次 commit 或手动重新部署。

## Supabase Auth 回调设置

如果 Vercel Preview / Production URL 需要登录，需要在 Supabase Dashboard 的 Auth URL 设置中允许对应 URL。

建议先允许：

```text
http://localhost:3000
https://<vercel-project>.vercel.app
https://*.vercel.app
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

当前选择 GitHub Actions 手动触发作为 migration 应用方式。

workflow 文件：

```text
.github/workflows/supabase-migrations.yml
```

原则：

- PR 创建、分支 push、main push 时都不自动执行 migration。
- migration 原则上在相关 PR merge 后手动执行。
- 执行对象是当前唯一的 Supabase project。
- 执行前先确认本次是否包含 `supabase/migrations/` 变更，以及这些变更对现有数据是否安全。
- 执行后在 Supabase Dashboard 确认 migration 状态。

## 推荐验证顺序

### 普通 PR

1. Draft PR 开发中持续 push，Vercel Preview build 默认跳过。
2. 需要预览测试时，将 PR 标记为 Ready for review。
3. 推送一次 commit 或手动重新部署，等待 Vercel Preview Deployment 完成。
4. 打开 Vercel Preview URL。
5. 验证登录、Dashboard、记账相关页面。
6. 确认没有明显问题后 merge。
7. merge 后确认 Vercel Production Deployment 完成。

### 包含 migration 的 PR

1. Draft PR 开发中持续 push，Vercel Preview build 默认跳过。
2. Review `supabase/migrations/` 变更。
3. 将 PR 标记为 Ready for review。
4. 推送一次 commit 或手动重新部署，等待 Vercel Preview Deployment 完成。
5. merge PR。
6. 在 GitHub Actions 手动触发 `Supabase migrations` workflow。
7. 确认 workflow 成功，并在 Supabase Dashboard 确认 migration 状态。
8. 打开 Vercel Production URL，验证主要页面。

## 排查要点

### Vercel build 失败

先确认：

- Vercel 使用 Node.js 20 或以上。
- `npm run build` 在 GitHub Actions CI 中通过。
- Vercel 公开连接信息已经配置并重新部署。
- Vercel Preview 部署条件脚本没有误跳过。

### 页面可以打开但 Supabase 请求失败

先确认：

- Vercel 当前 deployment 的配置已经重新部署后生效。
- Supabase 连接目标是当前唯一的 Supabase project。
- Supabase Auth 允许当前 Vercel URL。

### migration workflow 失败

先确认：

- GitHub repository 的 workflow 配置已经设置。
- Supabase project ref 指向当前唯一的 Supabase project。
- Supabase migration 文件没有重复创建对象。
- 本次执行发生在相关 PR merge 后。

## 不包含范围

- 不在本 Issue 中拆分 Supabase dev / staging / production。
- 不为每个 PR 自动创建独立 Supabase database。
- 不自动把 PR 创建、分支 push 或 main push 后的 migration 推到数据库。
- 不新增业务逻辑。
