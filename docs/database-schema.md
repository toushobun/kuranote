# Supabase 数据库结构维护

## 目的

仓库同时维护两种互补的数据库表示：

| 路径                                        | 职责                                   | 是否用于生产发布       |
| ------------------------------------------- | -------------------------------------- | ---------------------- |
| `supabase/schemas/00_current_schema.sql`    | 当前期望结构，便于阅读、审查与生成差分 | 否                     |
| `supabase/migrations/*.sql`                 | 不可回改的增量历史                     | 是，`supabase db push` |
| `supabase/seed.sql`、`supabase/seeds/*.sql` | 本地开发数据                           | 否                     |

声明式 schema 不是第二套独立维护的 migration 历史。它由全部 migration 在空库回放后的结构 dump 生成，CI 会比较两者，避免漂移。

## 首次准备

以下命令需要 Docker 和本地 Supabase：

```bash
npx supabase start
```

仓库将 Supabase CLI 固定为 `2.106.0`。本机已安装 `supabase` 命令时，维护脚本优先使用该命令；否则通过 `npx` 使用固定版本。

## 查看当前最终结构

直接查看：

```text
supabase/schemas/00_current_schema.sql
```

该文件只包含应用维护的 `public` schema。Supabase 管理的 `auth`、`storage` 等 schema 不在此文件中重复维护。

## 日常结构变更

### 1. 修改声明式 schema

先在 `supabase/schemas/00_current_schema.sql` 中表达期望的最终结构。数据库对象应使用明确的 schema 限定名，并保持文件可从空库执行。

### 2. 生成向前 migration

使用简短、snake_case 的 migration 名称：

```bash
npm run db:migration:new -- -f add_example_column
```

Supabase CLI 会根据 `supabase/config.toml` 中的 `schema_paths` 比较现有 migrations 与声明式 schema，并在 `supabase/migrations/` 生成新的时间戳 migration。

必须人工审查生成的 SQL，特别是 drop、数据类型变化、默认值、RLS、权限和函数签名。不得直接修改已经在共享环境应用过的历史 migration。

### 3. 回放并标准化最终结构

```bash
npm run db:schema:update
```

该命令会：

1. 使用 `--no-seed` 从空库回放全部 migrations。
2. dump `public` schema。
3. 覆盖 `supabase/schemas/00_current_schema.sql`，得到稳定的当前结构基线。

### 4. 检查漂移

```bash
npm run db:schema:check
```

该命令重新回放 migrations，并将实际 dump 与提交的声明式 schema 比较。相关路径变更时，GitHub Actions 也会执行同一检查。

CI 同时禁止修改或删除已经合入 `main` 的历史 migration。数据库变更必须通过新的向前 migration 表达；同一 PR 中新建、尚未合入的 migration 可以继续调整。

## DML 与特殊对象

声明式 schema 只表达数据库结构。以下内容继续通过手写向前 migration 维护：

- 数据回填、修复、标准化等 DML。
- seed 与本地测试用户。
- cron、Storage bucket、Vault secret 等不能可靠通过 schema diff 表达的配置。
- Supabase 管理 schema 内的对象。

Supabase CLI 对 view owner / grant、materialized view、policy 更新、列级权限、publication、partition、domain 等对象存在已知差分限制。涉及这些对象时，需要人工审查生成 migration，并以 migration 回放后的 dump 为最终基线。

## 生产发布边界

生产部署流程保持不变：

1. PR 中同时审查声明式 schema 和新增 migration。
2. merge 到 `main` 后，`.github/workflows/deploy.yml` 执行 `supabase db push`。
3. 生产环境只应用尚未执行的向前 migration。

禁止在生产环境直接执行 `00_current_schema.sql`，也禁止使用 `db reset` 或 dump 覆盖生产数据库。
