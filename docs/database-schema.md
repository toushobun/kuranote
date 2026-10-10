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

## Issue #875：放弃创建

`abandon_ledger_setup(uuid)` 仅允许 active owner 删除未归档的 `in_progress` 账本；与完成创建共用 ledger 行锁。草稿保存在 `ledger.setup_draft`，随本体删除。不支持删除 completed 账本，保持 ledger 无客户端 DELETE policy。

核对所有引用 `ledger(id)` 的外键：

| 表                                                                | 删除行为 | 放弃创建时处理                                                               |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| account、budget、category、merchant、merchant_tags                | RESTRICT | 创建阶段不写入这些业务表，不主动清理；异常关联由 RESTRICT 拒绝删除并整体回滚 |
| ledger_member_display_setting、ledger_member                      | RESTRICT | 按此顺序显式清理                                                             |
| ledger_placeholder_member                                         | RESTRICT | 任意占位成员存在即拒绝                                                       |
| ledger_invite                                                     | CASCADE  | 任意邀请存在即拒绝（包括历史邀请）                                           |
| transaction_record                                                | RESTRICT | 存在交易即拒绝；同时检查 transaction_item（通过 record 关联账本）            |
| transaction_item_refund_link、transaction_item_reimbursement_link | CASCADE  | 存在关联即拒绝，不允许隐式清理交易                                           |
| app_user.current_ledger_id                                        | SET NULL | 不更新指针；现有约束只允许指向已完成账本，创建中账本无法成为当前账本         |

创建阶段只写入账本、owner 成员与显示设置；完成创建在同一事务内写入业务数据，失败整体回滚，因此放弃创建无需清理业务表。整个清理事务失败时全部回滚。新增 ledger 外键时必须同步审查此 RPC 和行为测试。

## Issue #890：删除已有账本

`delete_ledger(uuid)` 在一个事务内硬删除已完成账本，仅允许账本 `owner_user_id` 对应的 active owner 成员操作。先 `FOR UPDATE` 锁住 ledger 行，拒绝未登录、越权、不存在和创建中的账本。客户端仍无 ledger DELETE 权限。

删除前显式更新所有 `app_user.current_ledger_id` 指向该账本的用户（不只调用者）：从该用户其他 `active` 成员记录中选择未归档、`completed` 账本，按 `joined_at DESC NULLS LAST, created_at DESC, ledger_id ASC` 排序取第一项，没有则置空。既有 `validate_app_user_current_ledger` 原样验证新指针，不依赖外键 SET NULL。

以下依赖以全部 migrations 回放后的实际 `pg_constraint` 和 schema snapshot 为准；所有表均显式清理，不依赖隐式级联：

| 删除顺序 | 表                                                                | 外键与处理                                                                                                                                                 |
| -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | transaction_item_refund_link、transaction_item_reimbursement_link | ledger CASCADE；指向明细 RESTRICT。先清关联，删除时跳过本次目标账本的状态重算                                                                              |
| 2        | transaction_item、transaction_record                              | 明细到 record / account / category 为 RESTRICT；record 到 ledger / merchant 为 RESTRICT。含普通交易、转账、已撤销交易与余额调整记录                        |
| 3        | budget                                                            | ledger / category RESTRICT                                                                                                                                 |
| 4        | account_holder、account_name_scope、account                       | holder 到 account / placeholder 为 RESTRICT；name_scope 到 account 为 CASCADE；account 到 ledger 为 RESTRICT。先清持有人和名称投影，再清账户，包含归档账户 |
| 5        | merchant_alias、merchant_tag_links、merchant、merchant_tags       | alias 到 merchant 为 RESTRICT；tag_links 两端 CASCADE；merchant / tags 到 ledger 为 RESTRICT。先清别名和关联，再清商家及标签                               |
| 6        | category                                                          | ledger / parent 为 RESTRICT；先小分类再大分类                                                                                                              |
| 7        | ledger_invite、ledger_placeholder_member                          | invite 到 ledger 为 CASCADE、到 placeholder 为 RESTRICT；placeholder 到 ledger 为 RESTRICT。先删除全部邀请（含历史邀请），再删除全部占位成员（含已认领）   |
| 8        | ledger_member_display_setting、ledger_member、ledger              | 前两表到 ledger 为 RESTRICT；最后清理账本本体                                                                                                              |

`ledger_deletion_context` 是内部授权上下文表，主键为当前事务 ID，记录已由 RPC 校验的账本与用户。它启用 RLS 且没有客户端 policy，撤销 PUBLIC / anon / authenticated / service_role 的全部权限，不作为业务数据暴露，不增加外键。RPC 在事务内写入并在结束时清除，失败自动回滚。仅伪造 `app.deleting_ledger_id` 无法放行删除；详见 [安全函数规范](security-definer-functions.md)。

删除中任一步失败，数据、当前账本指针和上下文一起回滚。新增直接或间接账本外键时，必须同步审查删除顺序、权限及副作用触发器，并补充 `supabase/tests/database/delete_ledger.test.sql`。
