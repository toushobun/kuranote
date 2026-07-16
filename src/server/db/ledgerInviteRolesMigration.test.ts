import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260715150000_improve_ledger_invite_roles_and_replacement.sql",
  ),
  "utf8",
);

describe("邀请角色 migration", () => {
  it("只允许 Admin、Member、Viewer，不允许 Owner", () => {
    expect(migrationSql).toContain(
      "check (role in ('admin', 'member', 'viewer'))",
    );
    expect(migrationSql).toContain(
      "if v_role not in ('admin', 'member', 'viewer') then",
    );
    expect(migrationSql).not.toContain(
      "v_role not in ('owner', 'admin', 'member', 'viewer')",
    );
  });

  it("移除已由 v2 替代的旧创建 RPC", () => {
    expect(migrationSql).toContain(
      "drop function if exists public.create_ledger_invite(uuid, text);",
    );
  });

  it("接受邀请的 trigger 允许三种邀请角色", () => {
    expect(
      migrationSql.match(/new\.role in \('admin', 'member', 'viewer'\)/g),
    ).toHaveLength(2);
  });

  it("创建 RPC 持久化 token 摘要并返回原始 token", () => {
    expect(migrationSql).toContain(
      "encode(extensions.digest(v_token, 'sha256'), 'hex')",
    );
    expect(migrationSql).toContain(
      "select v_invite_id, v_token, l.name, v_role",
    );
  });

  it("不再创建未上线的邀请替换 RPC", () => {
    expect(migrationSql).not.toContain("function public.replace_ledger_invite");
  });

  it("创建 RPC 禁止匿名调用并只授权 authenticated", () => {
    expect(migrationSql).toContain(
      "revoke all on function public.create_ledger_invite_v2(uuid, text) from anon;",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.create_ledger_invite_v2(uuid, text) to authenticated;",
    );
  });
});
