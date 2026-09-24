import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260925090000_require_placeholder_for_ledger_invite.sql",
  ),
  "utf8",
).replaceAll("\r\n", "\n");

describe("邀请必须绑定待邀请成员 migration", () => {
  it("先撤销残留的匿名待接受邀请，再新增表级 CHECK", () => {
    const revokeIndex = migrationSql.indexOf(
      "set revoked_at = now(),\n       revoked_by = inviter_user_id,\n       invite_token = null\n where placeholder_id is null\n   and accepted_at is null\n   and revoked_at is null;",
    );
    const checkIndex = migrationSql.indexOf(
      "add constraint ledger_invite_pending_requires_placeholder",
    );

    expect(revokeIndex).toBeGreaterThan(-1);
    expect(checkIndex).toBeGreaterThan(revokeIndex);
    expect(migrationSql).toContain(
      "check (placeholder_id is not null or accepted_at is not null or revoked_at is not null)",
    );
  });

  it("生成 RPC 保持签名，并在权限校验之后要求占位", () => {
    const permissionIndex = migrationSql.indexOf(
      "if not public.current_user_can_manage_ledger(p_ledger_id) then",
    );
    const requiredIndex = migrationSql.indexOf(
      "raise exception 'placeholder_required'",
    );

    expect(migrationSql).toContain(
      "create or replace function public.create_ledger_invite_v2(",
    );
    expect(migrationSql).not.toContain("drop function");
    expect(permissionIndex).toBeGreaterThan(-1);
    expect(requiredIndex).toBeGreaterThan(permissionIndex);
    expect(migrationSql).toContain(
      "using errcode = '22023', detail = 'placeholder_required'",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.create_ledger_invite_v2(uuid, text, uuid) to authenticated;",
    );
  });
});
