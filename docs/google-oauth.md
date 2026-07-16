# Google 账号登录配置

本文件记录 KuraNote 使用 Supabase Auth 接入 Google OAuth 时的部署配置和验证方式。

## 流程边界

KuraNote 使用 Supabase Auth 的 PKCE OAuth 流程：

1. 登录页或注册页调用 `signInWithOAuth({ provider: "google" })`。
2. Supabase 将用户重定向到 Google 授权页面。
3. Google 将授权结果返回 Supabase Auth callback。
4. Supabase 再将授权 code 返回 KuraNote 的 `/auth/callback`。
5. KuraNote 服务端调用 `exchangeCodeForSession`，将 session 写入 cookie。
6. 完成后返回经过安全校验的 `next` 页面，默认进入 Dashboard。

OAuth code 和 session 只在服务端 callback 中处理，不向浏览器代码暴露 Google Client Secret 或 Supabase 高权限 key。

## Google Cloud 配置

在 Google Auth Platform 中为 KuraNote 配置 Audience、Data Access、Branding 和 OAuth Client。

### Audience

根据当前发布范围选择 Internal 或 External。使用 External 且应用仍处于测试阶段时，需要把实际联动验证账号加入 Test users。

### Data Access

Supabase Google 登录至少需要以下 scopes：

```text
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

其中 `openid` 需要在 Google Auth Platform 的 Data Access 页面中确认已添加。不要追加联系人、日历等本功能不需要的敏感 scope。

### Branding

配置应用名称、支持邮箱，并按发布计划补充 Logo 和已授权域名。正式开放前确认 Google 授权画面显示的是可识别的 KuraNote 信息，而不是难以辨认的项目标识。

### OAuth Client

在 Google Auth Platform 的 Clients 页面创建 Web application 类型的 OAuth Client。

#### Authorized JavaScript origins

按实际使用环境配置来源，例如：

```text
http://localhost:3000
https://<vercel-project>.vercel.app
```

使用自定义域名后，需要追加正式域名。

#### Authorized redirect URIs

这里填写 Supabase Auth 的 callback URL，而不是 KuraNote 的 `/auth/callback`：

```text
https://<supabase-project-ref>.supabase.co/auth/v1/callback
```

使用本地 Supabase 时填写：

```text
http://127.0.0.1:54321/auth/v1/callback
```

Google Client ID 和 Client Secret 只配置在 Google Cloud、Supabase Dashboard 或本地私密环境变量中，不提交到仓库。

## Supabase 配置

在 Supabase Dashboard 的 Authentication → Providers → Google 中：

1. 启用 Google provider。
2. 填入 Google Client ID。
3. 填入 Google Client Secret。
4. 保存配置。

在 Authentication → URL Configuration 中，将以下应用 callback 加入 Redirect URLs：

```text
http://localhost:3000/auth/callback
https://<vercel-project>.vercel.app/auth/callback
```

使用自定义域名后，需要追加对应的 `/auth/callback`。

Site URL 应指向当前正式应用地址。不要把任意外部域名或宽泛的通配符加入 Redirect URLs。

当前项目不为 PR 自动创建 Vercel Preview 部署。以后如果启用 Preview，需要先确定稳定、可控的 callback 域名和环境变量策略，再加入 Google 与 Supabase 的允许列表，不能直接放开任意外部域名。

## 功能开关

Google Cloud、Supabase Provider 和 Redirect URLs 全部配置并验证完成前，保持：

```env
GOOGLE_AUTH_ENABLED=false
```

完成配置后，在对应的本地或 Vercel 环境中设为：

```env
GOOGLE_AUTH_ENABLED=true
```

修改 Vercel 环境变量后需要重新部署。该变量只在服务端读取；未启用时登录页和注册页不会显示 Google 入口，服务端 Action 与 callback 也不会处理 Google OAuth。

## 本地 Supabase 配置

本地 Supabase 可在 `supabase/config.toml` 中配置 Google provider：

```toml
[auth.external.google]
enabled = true
client_id = "<google-client-id>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

Client Secret 通过未提交的本地环境变量提供：

```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<google-client-secret>
```

## 账号关联确认

Supabase Auth 会把相同、已验证邮箱的 OAuth identity 自动关联到同一个 Auth 用户。KuraNote 不自行创建或合并 `auth.users`，也不通过手工插入 `app_user` 绕过 Supabase Auth。

上线前仍必须使用测试账号确认以下行为：

- 首次使用 Google 登录时，只创建一个 `auth.users` 用户和一个 `app_user`。
- Google 返回的 `name` 可以被现有 `handle_new_auth_user` trigger 用作昵称来源。
- 已使用 Google 登录的用户再次登录时，不重复创建业务用户。
- 已使用邮箱密码注册的用户使用相同、已验证邮箱的 Google 账号登录时，Google identity 关联到原 Auth 用户，不产生重复业务账号。
- 如果实际项目配置或测试结果与上述行为不符，应停止上线并先查明 Auth 配置，不允许通过业务表补数据掩盖身份冲突。

参考：[`Identity Linking`](https://supabase.com/docs/guides/auth/auth-identity-linking)。

## 验证清单

- [ ] Google Auth Platform 的 Audience、Test users 和 Data Access 已配置
- [ ] `openid`、`userinfo.email`、`userinfo.profile` scopes 已配置
- [ ] 登录页可以发起 Google OAuth
- [ ] 注册页可以发起 Google OAuth
- [ ] 首次 Google 注册后可以进入 Dashboard
- [ ] 已有 Google 用户可以再次登录
- [ ] 从邀请链接登录后可以返回原邀请页面
- [ ] 非法 `next` 参数会回退到 Dashboard
- [ ] 用户取消授权后返回原登录或注册页并显示提示
- [ ] callback code 无效时不创建登录 session
- [ ] 邮箱密码登录、邮箱验证码注册和 Turnstile 流程没有回归
- [ ] Google Client Secret 未出现在仓库、前端环境变量、日志或 URL 中
- [ ] Provider 配置完成前 Google 入口保持隐藏
