import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260710010000_create_ledger_with_owner_settings.sql",
  ),
  "utf8",
);

describe("账本创建初始化 migration", () => {
  it("复用既有账本创建函数并保持同一事务", () => {
    expect(migrationSql).toContain(
      "v_ledger = public.create_ledger_with_owner(",
    );
    expect(migrationSql).toContain("returns public.ledger");
  });

  it("保存当前用户在新账本中的显示名和个性色", () => {
    expect(migrationSql).toContain(
      "insert into public.ledger_member_display_setting",
    );
    expect(migrationSql).toContain("display_name");
    expect(migrationSql).toContain("display_color");
    expect(migrationSql).toContain("if p_display_color is null");
    expect(migrationSql).toContain("btrim(p_display_color)");
  });

  it("创建默认现金账户并将当前用户设为持有人", () => {
    expect(migrationSql).toContain("insert into public.account (");
    expect(migrationSql).toContain("'现金'");
    expect(migrationSql).toContain("'cash'");
    expect(migrationSql).toContain("insert into public.account_holder (");
  });

  it("只向登录用户开放完整初始化 RPC", () => {
    expect(migrationSql).toContain(
      "raise exception 'auth_required' using errcode = '42501';",
    );
    expect(migrationSql).toContain(
      "revoke execute on function public.create_ledger_with_owner(text, text) from authenticated;",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.create_ledger_with_owner_settings(text, text, text, text) to authenticated;",
    );
    expect(migrationSql).toContain(
      "revoke all on function public.create_ledger_with_owner_settings(text, text, text, text) from anon;",
    );
  });
});
