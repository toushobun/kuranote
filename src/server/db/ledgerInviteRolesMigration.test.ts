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

describe("邀请角色与安全替换 migration", () => {
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

  it("接受邀请的 trigger 允许三种邀请角色", () => {
    expect(
      migrationSql.match(/new\.role in \('admin', 'member', 'viewer'\)/g),
    ).toHaveLength(2);
  });

  it("创建与替换均只持久化 token 摘要", () => {
    expect(
      migrationSql.match(
        /encode\(extensions\.digest\(v_token, 'sha256'\), 'hex'\)/g,
      ),
    ).toHaveLength(2);
  });

  it("替换时先锁定旧邀请，并在同一事务撤销后创建新邀请", () => {
    expect(migrationSql).toContain("function public.replace_ledger_invite");
    expect(migrationSql).toContain("for update;");
    expect(migrationSql).toContain("set revoked_at = now()");
    expect(migrationSql.indexOf("set revoked_at = now()")).toBeLessThan(
      migrationSql.lastIndexOf("insert into public.ledger_invite"),
    );
  });

  it("新 RPC 仅向 authenticated 授权", () => {
    for (const signature of [
      "create_ledger_invite_v2(uuid, text)",
      "replace_ledger_invite(uuid, uuid)",
    ]) {
      expect(migrationSql).toContain(
        `revoke all on function public.${signature} from anon;`,
      );
      expect(migrationSql).toContain(
        `grant execute on function public.${signature} to authenticated;`,
      );
    }
  });
});
