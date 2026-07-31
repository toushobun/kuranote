import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260630010000_refactor_transaction_type_model.sql",
);
const removeTagsMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260731020336_remove_transaction_tags.sql",
);
const dropStatTypeMigrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260630020000_drop_transaction_item_stat_type.sql",
);

function readMigration(filePath: string) {
  return readFileSync(filePath, "utf8");
}

describe("普通记账 normal 类型后端规则", () => {
  it("将 transaction_record.type 收敛为 normal / transfer", () => {
    const migration = readMigration(migrationPath);

    expect(migration).toContain("type in ('normal', 'transfer')");
    expect(migration).toContain("when type = 'transfer' then 'transfer'");
    expect(migration).toContain("else 'normal'");
    expect(migration).toContain("'normal'");
  });

  it("普通明细统计方向改由 category.type 决定", () => {
    const migration = readMigration(migrationPath);

    expect(migration).toContain("select c.type");
    expect(migration).toContain("v_item_category_type");
    expect(migration).toContain("when v_item_category_type = 'expense'");
    expect(migration).toContain(
      "drop index if exists public.transaction_item_stat_type_idx",
    );
    expect(migration).toContain("alter column stat_type drop not null");
  });

  it("已被引用的分类不能跨收入 / 支出方向修改", () => {
    const migration = readMigration(migrationPath);

    expect(migration).toContain("prevent_used_category_type_change");
    expect(migration).toContain("category_type_locked");
    expect(migration).toContain("category_prevent_used_type_change");
  });

  it("移除整体标签 RPC 参数、同步函数和数据表", () => {
    const migration = readMigration(removeTagsMigrationPath);

    expect(migration).toContain(
      "drop function if exists public.sync_transaction_record_tags",
    );
    const policyDropIndex = migration.indexOf(
      'drop policy if exists "transaction_tag_select_assigned_archived"',
    );
    const recordTagTableDropIndex = migration.indexOf(
      "drop table if exists public.transaction_record_tag",
    );
    const tagTableDropIndex = migration.indexOf(
      "drop table if exists public.transaction_tag",
    );

    expect(policyDropIndex).toBeGreaterThanOrEqual(0);
    expect(recordTagTableDropIndex).toBeGreaterThan(policyDropIndex);
    expect(tagTableDropIndex).toBeGreaterThan(recordTagTableDropIndex);
    expect(migration).toContain("public.create_transaction(");
    expect(migration).toContain("public.update_transaction(");
    expect(migration).toContain("public.convert_transaction_type(");
    expect(migration).not.toContain("p_tag_names");
    expect(migration).not.toContain("p_tag_id");
  });

  it("最终物理删除 transaction_item.stat_type", () => {
    const migration = readMigration(dropStatTypeMigrationPath);

    expect(migration).toContain("drop column if exists stat_type");
    expect(migration).toContain(
      "create or replace function public.create_transaction(",
    );
    expect(migration).toContain(
      "create or replace function public.update_transaction(",
    );
    expect(migration).toContain(
      "create or replace function public.create_transfer_transaction(",
    );
    expect(migration).toContain(
      "create or replace function public.update_transfer_transaction(",
    );
    expect(migration).toContain(
      "create or replace function public.void_transaction(",
    );
    expect(migration).toContain(
      "create or replace function public.convert_transaction_type(",
    );
    expect(migration).not.toContain("expense_offset");
  });

  it("同一个 migration 中删除仍引用 stat_type 的旧 RPC 重载", () => {
    const migration = readMigration(dropStatTypeMigrationPath);

    expect(migration).toContain(
      "drop function if exists public.create_transaction(",
    );
    expect(migration).toContain(
      "drop function if exists public.update_transaction(",
    );
  });
});
