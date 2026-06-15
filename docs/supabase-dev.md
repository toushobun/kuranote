# 本地连接 Supabase dev 开发方式

本文件记录本地 Next.js 连接 Supabase Cloud dev / staging 的开发方式。

## 目的

公司电脑或临时开发环境磁盘空间不足时，可以不启动 Docker Desktop 和 Supabase local stack，只在本地运行 Next.js，并连接 Supabase Cloud 上的 dev / staging 项目做页面确认和基本联动测试。

这个模式用于缓解本地空间压力，不替代数据库层验证。

## 开发模式

| 模式 | 运行方式 | 适用场景 | 注意事项 |
| --- | --- | --- | --- |
| 标准模式：本地 Supabase Docker stack | `npx supabase start` + `npm run dev` | schema / migration / RLS / RPC / seed 开发与验证 | 占用 Docker 镜像、容器和 volume 空间较多 |
| 省空间模式：本地 Next.js + Supabase dev | 只执行 `npm run dev`，通过 `.env.local` 连接 dev / staging | 页面确认、登录流程、读取 / 写入的基本联动测试 | 禁止连接 production，避免破坏真实数据 |

## 环境边界

- `dev`：开发验证用，可以给本地 Next.js 联动确认。
- `staging`：发布前预演用，尽量接近正式环境。
- `production`：真实数据环境，禁止用于本地开发验证。

`.env.local` 只用于本地开发，不提交到仓库。示例文件只能放占位符，不放真实 URL 或 key。

## `.env.local` 配置

复制模板：

```bash
cp .env.example .env.local
```

`.env.example` 中所有连接示例默认注释。根据当前开发模式，只取消注释其中一组配置。

本地 Supabase 模式：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-or-anon-key
```

Supabase dev / staging 模式：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-dev-or-staging-publishable-or-anon-key
```

`NEXT_PUBLIC_` 开头的变量会进入浏览器 bundle，因此只能使用浏览器允许公开的 publishable / anon key。高权限管理用 key 不允许写入 `NEXT_PUBLIC_` 变量，也不应该提交到仓库。

## Supabase dev 初始化步骤

1. 在 Supabase Cloud 创建 dev 或 staging project。
2. 在 Supabase Dashboard 确认 Project URL 和 publishable / anon key。
3. 登录 Supabase CLI，并将本地项目 link 到 dev 项目。

   ```bash
   npx supabase login
   npx supabase link --project-ref <dev-project-ref>
   ```

4. 应用 migrations 前先确认差分。

   ```bash
   npx supabase db diff --linked
   npx supabase db push
   ```

   `db push` 会把本地 migrations 应用到已 link 的远程数据库。执行前必须确认当前 link 的 project ref 是 dev / staging，不是 production。

5. 准备最小验证数据。

   - 可通过 Supabase Dashboard 创建测试用户。
   - 可准备只面向 dev 的最小 seed 数据。
   - 不导入真实家庭记账数据。

6. 在本地 `.env.local` 填入 dev / staging 的 URL 和 publishable / anon key。
7. 执行 `npm run dev`。
8. 打开 `http://localhost:3000`，确认登录、Dashboard、记账相关主要页面可以访问 dev 数据。

## migration / RLS / RPC 验证原则

省空间模式可以减少本地 Docker 依赖，但不能替代数据库层验证。

- 修改 migration 时，优先在本地 Supabase 或一次性 dev 环境中验证。
- 修改 RLS policy 时，需要确认不同用户和账本成员的访问边界。
- 修改 RPC 时，需要确认正常路径、权限不足、参数异常和回滚行为。
- 对 dev / staging 执行 `db push` 前，先确认 project ref，并通过 `db diff --linked` 检查即将应用的内容。
- 禁止对 production 执行开发验证用的 migration、seed 或 reset。

## 防误连 production 清单

- `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL` 不是 production URL。
- Supabase CLI 当前 link 的 project ref 不是 production。
- 本地验证账号不是正式用户账号。
- 要执行的 SQL 不会破坏共享 dev 数据。
- PR 描述中写明是否做过 Supabase dev 联动确认。

## 常用命令

标准模式：

```bash
npx supabase start
npx supabase status
npm run dev
```

省空间模式：

```bash
cp .env.example .env.local
# 取消注释 Supabase Cloud dev / staging 那组配置，并填入真实 URL / key
npm run dev
```

初次配置 Supabase dev 项目，只需执行一次：

```bash
npx supabase login
npx supabase link --project-ref <dev-project-ref>
```

日常应用 migration 到已 link 的 dev 项目：

```bash
npx supabase db diff --linked
npx supabase db push
```
