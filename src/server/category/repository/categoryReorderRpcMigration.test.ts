// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260722110000_reorder_categories_transactionally.sql",
);

function readMigration() {
  return readFileSync(migrationPath, "utf8");
}

describe("分类排序事务型 RPC migration", () => {
  it("只允许认证用户执行并在数据库内重新校验 active 管理权限", () => {
    const migration = readMigration();

    expect(migration).toContain("v_user_id uuid := auth.uid()");
    expect(migration).toContain("lm.user_id = v_user_id");
    expect(migration).toContain("lm.status = 'active'");
    expect(migration).toContain("lm.role in ('owner', 'admin')");
    expect(migration).toContain("au.status = 'active'");
    expect(migration).toContain(
      "grant execute on function public.reorder_categories(uuid, text, uuid, uuid[]) to authenticated",
    );
    expect(migration).toContain(
      "revoke all on function public.reorder_categories(uuid, text, uuid, uuid[]) from anon",
    );
  });

  it("校验账本、类型、父分类和完整同级分类集合", () => {
    const migration = readMigration();

    expect(migration).toContain("l.is_archived = false");
    expect(migration).toContain("p_type not in ('expense', 'income')");
    expect(migration).toContain("parent.parent_id is null");
    expect(migration).toContain(
      "c.parent_id is not distinct from p_parent_id",
    );
    expect(migration).toContain("v_distinct_count <> v_category_count");
    expect(migration).toContain(
      "v_submitted_ids is distinct from v_sibling_ids",
    );
    expect(migration).toContain("category_set_invalid");
  });

  it("使用单次批量 UPDATE 并在写入数异常时使事务失败", () => {
    const migration = readMigration();
    const updateStatements =
      migration.match(/update public\.category c/g) ?? [];

    expect(updateStatements).toHaveLength(1);
    expect(migration).toContain("unnest(p_category_ids) with ordinality");
    expect(migration).toContain(
      "sort_order = (submitted_order.position * 10)::integer",
    );
    expect(migration).toContain(
      "get diagnostics v_updated_count = row_count",
    );
    expect(migration).toContain("category_write_failed");
  });

  it("并发排序和其他分类写入不会交错为混合结果", () => {
    const migration = readMigration();

    expect(migration).toContain(
      "lock table public.category in share row exclusive mode",
    );
    expect(migration).toContain("for update");
    expect(migration.indexOf("lock table public.category")).toBeLessThan(
      migration.indexOf("select coalesce(array_agg(locked_category.id"),
    );
    expect(
      migration.indexOf("select coalesce(array_agg(locked_category.id"),
    ).toBeLessThan(migration.indexOf("update public.category c"));
  });
});
