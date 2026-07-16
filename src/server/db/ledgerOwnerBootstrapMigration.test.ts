import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260716213000_restore_ledger_owner_bootstrap.sql",
  ),
  "utf8",
);

describe("首次账本所有者 bootstrap migration", () => {
  it("在通用校验前恢复首个所有者分支", () => {
    const bootstrapIndex = migrationSql.indexOf("and new.role = 'owner'");
    const genericCheckIndex = migrationSql.indexOf(
      "current_user_can_manage_ledger(v_ledger_id)",
    );

    expect(bootstrapIndex).toBeGreaterThan(-1);
    expect(genericCheckIndex).toBeGreaterThan(bootstrapIndex);
    expect(migrationSql).toContain("l.owner_user_id = auth.uid()");
    expect(migrationSql).toContain(
      "where existing_member.ledger_id = l.id",
    );
  });

  it("保留邀请接受分支", () => {
    const inviteAcceptanceFlags = migrationSql.match(
      /app\.allow_ledger_invite_accept/g,
    );

    expect(inviteAcceptanceFlags).toHaveLength(2);
    expect(migrationSql).toContain(
      "new.role in ('admin', 'member', 'viewer')",
    );
    expect(migrationSql).toContain("old.status = 'invited'");
  });

  it("保留通用校验和稳定错误详情", () => {
    expect(migrationSql).toContain("current_user_can_manage_ledger");
    expect(migrationSql).toContain("errcode = '42501'");
    expect(migrationSql).toContain("detail = 'permission_denied'");
  });
});
