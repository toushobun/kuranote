# 声明式数据库 schema

`00_current_schema.sql` 是 KuraNote 应用数据库的当前最终结构入口。

- 该文件描述 `public` schema 中当前应存在的表、函数、视图、trigger、RLS policy 与权限。
- `supabase/migrations/` 继续保存不可回改的增量历史，并用于本地 reset 与生产 `db push`。
- `supabase/seed.sql` 与 `supabase/seeds/` 只保存本地数据，不属于声明式 schema。
- `_reference/` 保存 `public` schema dump 覆盖不到、但由本项目自定义的 `auth` schema 对象基线（目前是 `auth.users` 上的 `on_auth_user_created` trigger），用于 CI 检测该对象被误删或修改。

日常变更流程和已知限制见 [`docs/database-schema.md`](../../docs/database-schema.md)。
