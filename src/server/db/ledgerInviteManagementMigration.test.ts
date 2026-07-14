import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260713190000_add_pending_ledger_invite_management.sql",
  ),
  "utf8",
);

describe("待接受邀请管理 migration", () => {
  it("仅返回未接受且未撤销的邀请并按创建时间排序", () => {
    expect(migrationSql).toContain("li.accepted_at is null");
    expect(migrationSql).toContain("li.revoked_at is null");
    expect(migrationSql).toContain("order by li.created_at desc, li.id;");
  });

  it("待邀请列表只允许当前账本 active 成员读取", () => {
    expect(migrationSql).toContain("lm.user_id = v_user_id");
    expect(migrationSql).toContain("lm.status = 'active'");
    expect(migrationSql).toContain(
      "errcode = '42501', detail = 'permission_denied'",
    );
  });

  it("撤销邀请先校验管理权限，再按账本和 invite_id 加锁", () => {
    const permissionCheckIndex = migrationSql.lastIndexOf(
      "if not public.current_user_can_manage_ledger(p_ledger_id) then",
    );
    const inviteLookupIndex = migrationSql.indexOf(
      "where li.id = p_invite_id",
      permissionCheckIndex,
    );

    expect(permissionCheckIndex).toBeGreaterThan(-1);
    expect(inviteLookupIndex).toBeGreaterThan(permissionCheckIndex);
    expect(migrationSql).toContain("and li.ledger_id = p_ledger_id");
    expect(migrationSql).toContain("for update;");
  });

  it("已接受或已撤销邀请返回稳定业务错误码", () => {
    expect(migrationSql).toContain(
      "errcode = '23505', detail = 'invite_already_used'",
    );
    expect(migrationSql).toContain(
      "errcode = '23505', detail = 'invite_already_revoked'",
    );
  });

  it("撤销时同时记录时间和操作者", () => {
    expect(migrationSql).toContain("set revoked_at = now(),");
    expect(migrationSql).toContain("revoked_by = v_user_id");
  });

  it("两个 RPC 均禁止匿名调用并只授权 authenticated", () => {
    expect(migrationSql).toContain(
      "revoke all on function public.list_pending_ledger_invites(uuid) from anon;",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.list_pending_ledger_invites(uuid) to authenticated;",
    );
    expect(migrationSql).toContain(
      "revoke all on function public.revoke_ledger_invite(uuid, uuid) from anon;",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.revoke_ledger_invite(uuid, uuid) to authenticated;",
    );
  });
});
