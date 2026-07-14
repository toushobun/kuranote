# 声明式数据库 schema

`00_current_schema.sql` 是 KuraNote 应用数据库的当前最终结构入口。

- 该文件描述 `public` schema 中当前应存在的表、函数、视图、trigger、RLS policy 与权限。
- `supabase/migrations/` 继续保存不可回改的增量历史，并用于本地 reset 与生产 `db push`。
- `supabase/seed.sql` 与 `supabase/seeds/` 只保存本地数据，不属于声明式 schema。

日常变更流程和已知限制见 [`docs/database-schema.md`](../../docs/database-schema.md)。
