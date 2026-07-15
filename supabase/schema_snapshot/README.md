# 数据库结构快照

`current_schema.sql` 是全部时间戳 migrations 从空库回放后自动生成的数据库最终结构快照。

- 唯一事实来源是 `supabase/migrations/*.sql`。
- 禁止手工修改快照，也禁止从快照反向生成 migration。
- `supabase/config.toml` 的 `schema_paths` 保持为空，本目录不参与 Declarative Database Schemas。
- 更新命令：`npm run db:schema:snapshot:update`。
- 详细流程见 [数据库结构维护文档](../../docs/database-schema.md)。
