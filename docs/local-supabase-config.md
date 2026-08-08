# Local Supabase 备用配置说明

## 背景

部分公司 Windows 环境可能存在端口占用或网络限制，导致默认 Supabase 本地环境无法启动。

例如：

- 默认 API 端口 `54321` 无法绑定
- 默认 DB 端口 `54322` 无法绑定
- analytics 容器端口冲突
- Edge Runtime 访问外部资源时受到公司网络证书拦截

本文说明如何在受限环境下临时切换本地 Supabase 配置。

## 原则

该配置仅用于特殊开发环境。

不要修改并提交默认 `supabase/config.toml`，避免影响其他开发者环境。

也不要提交个人实际 `.env.local` 内容。

## 备用端口配置

在本机 `supabase/config.toml` 中临时调整：

```toml
[api]
port = 55431

[db]
port = 55432

[studio]
port = 55433
api_url = "http://127.0.0.1:55431"

[inbucket]
port = 55434

[edge_runtime]
enabled = false

[analytics]
enabled = false
```

## 环境变量同步

修改端口后，需要同步 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55431
```

publishable key、service key 等值不要手写固定值。

使用：

```powershell
npx supabase status -o env
```

获取当前本地环境输出。

## 启动流程

停止旧环境：

```powershell
npx supabase stop --no-backup
```

启动：

```powershell
npx supabase start
```

确认状态：

```powershell
npx supabase status
```

启动应用：

```powershell
npm run dev
```

## 注意事项

- 这是受限环境 workaround，不是项目默认配置。
- 当前 KuraNote 本地开发不依赖 analytics 容器，因此可以关闭 analytics。
- 当前项目不使用 Supabase Edge Functions，因此特殊环境可以关闭 edge runtime。
- 如果未来开始使用 Edge Functions，需要重新评估该配置。
