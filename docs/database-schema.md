# Supabase 数据库结构维护

## 职责边界

| 路径                                          | 职责                                                   | 是否用于生产发布       |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------- |
| `supabase/migrations/*.sql`                   | 数据库结构的唯一事实来源；保存不可回改的时间戳增量历史 | 是，`supabase db push` |
| `supabase/schema_snapshot/current_schema.sql` | migrations 从空库回放后自动生成的只读最终结构快照      | 否                     |
| `supabase/seed.sql`、`supabase/seeds/*.sql`   | 本地开发和测试数据                                     | 否                     |

本项目继续使用 migration-first。整体 schema 只用于查看和审查，不参与 migration 生成。

`supabase/config.toml` 的 `schema_paths` 必须保持为空，禁止启用 Declarative Database Schemas。

## 查看当前最终结构

直接查看：

```text
supabase/schema_snapshot/current_schema.sql
```

快照包含 `public` schema，以及应用维护但不包含在 public dump 中的 `auth.users` 自定义 trigger。

## 日常数据库变更

### 1. 创建时间戳 migration

继续使用原有方式创建 migration，例如：

```bash
npx supabase migration new add_example_column
```

所有结构变更都写在新生成的 `supabase/migrations/<timestamp>_*.sql` 中。已经合入共享环境的历史 migration 不得修改、删除或重命名。

### 2. 编写并审查 SQL

在新的 migration 中编写 `CREATE`、`ALTER`、`DROP` 等 SQL，并人工审查数据丢失、RLS、权限、函数签名和回滚影响。

### 3. 更新整体快照

> ⚠️ 以下命令会执行 `supabase db reset --local --no-seed`，清空本地 Supabase 中未纳入 seed 的数据。交互式终端会先要求确认。

```bash
npm run db:schema:snapshot:update
```

该命令从空库回放全部 migrations，再覆盖自动生成的最终结构快照。不要手工修改快照。

### 4. 检查快照

```bash
npm run db:schema:snapshot:check
```

该命令同样会重置本地数据库，然后比较 migrations 回放结果与已提交快照。相关文件变化时，GitHub Actions 也会执行相同检查。

正确流程是：

```text
新建并编写时间戳 migration
        ↓
审查 migration
        ↓
更新整体 schema 快照
        ↓
同时提交 migration 与快照
```

## 生产发布

生产部署流程保持不变：

1. PR 中审查新的向前 migration 和自动生成的快照变化。
2. merge 到 `main` 后，`.github/workflows/deploy.yml` 运行 `supabase db push`。
3. 生产环境只应用尚未执行的时间戳 migrations。

禁止在生产或本地数据库中直接执行 `current_schema.sql`。
