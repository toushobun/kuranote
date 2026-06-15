# Vercel + Supabase dev / preview 部署说明

本文件记录 UchiLog 的线上 dev / preview 验证方式。

目标是在本地 Docker 或公司 VPC 受限时，通过浏览器访问 Vercel 部署后的最新代码，并连接 Supabase dev / staging 项目完成基本验证。

## 部署边界

| 环境 | 用途 | 数据要求 |
| --- | --- | --- |
| Vercel Preview | PR / 分支验证 | 连接 Supabase dev / staging |
| Vercel Production | main 分支发布验证 | 暂不作为正式生产环境使用 |
| Supabase dev | 开发验证数据库 | 可重建，可准备测试数据 |
| Supabase staging | 发布前验证数据库 | 尽量接近正式环境 |
| Supabase production | 真实数据数据库 | 禁止作为本地或 preview 验证目标 |

当前阶段优先打通 dev / preview 链路，不在本 Issue 中处理正式 production 发布策略。

## Vercel 项目设置

1. 在 Vercel Dashboard 新建 Project。
2. Import Git Repository，选择 `toushobun/uchilog`。
3. Framework Preset 选择 Next.js。
4. Build Command 使用默认 `npm run build`。
5. Install Command 使用默认 `npm install` 或 `npm ci`。
6. Output Directory 保持 Next.js 默认值。
7. 在 Environment Variables 中配置 Supabase dev / staging 使用的公开变量。

至少需要配置：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

注意：

- Preview / Development / Production 三类 Vercel 环境变量应按用途分开配置。
- Preview 阶段应连接 Supabase dev 或 staging。
- 不要把 production Supabase 项目用于 PR preview。
- 不要把真实环境值写入仓库、Issue、PR、README 或构建日志。

## Supabase Auth 回调设置

如果 Vercel preview / production URL 需要登录，需要在 Supabase Dashboard 的 Auth URL 设置中允许对应 URL。

建议先配置：

```text
http://localhost:3000
https://<vercel-project>.vercel.app
https://*.vercel.app
```

如后续使用自定义域名，再补充正式域名。

## Supabase migration 应用方式

当前仓库新增了手动触发 workflow：

```text
.github/workflows/supabase-migrations.yml
```

该 workflow 用于在 GitHub Actions 上执行：

```bash
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase migration list --linked
supabase db push
```

设计原则：

- 只允许手动触发，不随 main push 自动执行。
- 只面向 dev / staging，不直接操作 production。
- 执行前需要确认 GitHub repository 里已配置所需受保护配置。
- 执行后需要在 Supabase Dashboard 确认 migration 状态。

## GitHub 受保护配置

运行 Supabase migration workflow 前，需要在 GitHub repository settings 中配置：

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_REF
```

用途：

| 名称 | 用途 |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | 让 GitHub Actions 使用 Supabase CLI 访问目标 project |
| `SUPABASE_DB_PASSWORD` | 让 Supabase CLI 连接目标数据库 |
| `SUPABASE_PROJECT_REF` | 指定 Supabase dev / staging project ref |

这些值不能提交到仓库，也不能写进 Issue / PR 正文。

## 推荐验证顺序

1. 在 Supabase dev / staging 上应用 migrations。
2. 在 Supabase Dashboard 准备最小测试用户和测试数据。
3. 在 Vercel 配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
4. 触发 Vercel preview deployment。
5. 打开 Vercel preview URL。
6. 验证登录、Dashboard、记账相关页面可以访问 dev / staging 数据。
7. 确认没有连接 production Supabase。

## 排查要点

### Vercel build 失败

先确认：

- Vercel 使用 Node.js 20 或以上。
- `npm run build` 在 GitHub Actions CI 中通过。
- Vercel 环境变量名称与 `.env.example` 一致。

### 页面可以打开但 Supabase 请求失败

先确认：

- Vercel 当前 deployment 的环境变量已经重新部署后生效。
- Supabase URL 指向 dev / staging。
- publishable key 属于同一个 Supabase project。
- Supabase Auth 允许当前 Vercel URL。

### migration workflow 失败

先确认：

- GitHub 受保护配置已经设置。
- Supabase project ref 指向 dev / staging。
- Supabase 数据库密码正确。
- Supabase migration 文件没有重复创建对象。

## 不包含范围

- 不在本 Issue 中配置正式 production 发布策略。
- 不自动把 main push 后的 migration 推到数据库。
- 不提交任何真实环境值。
- 不新增业务逻辑。