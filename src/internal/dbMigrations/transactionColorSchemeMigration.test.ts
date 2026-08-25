// @vitest-environment node

import { describe, expect, it } from "vitest";

import migration from "../../../supabase/migrations/20260825010000_add_transaction_color_scheme.sql?raw";

describe("收支配色方案 migration", () => {
  it("为 app_user 添加新默认和二选一约束", () => {
    expect(migration).toContain(
      "add column transaction_color_scheme text not null",
    );
    expect(migration).toContain("default 'expense_green_income_red'");
    expect(migration).toContain("app_user_transaction_color_scheme_check");
    expect(migration).toContain("'expense_red_income_green'");
    expect(migration).toContain("'expense_green_income_red'");
    expect(migration).not.toContain("create policy");
  });
});
