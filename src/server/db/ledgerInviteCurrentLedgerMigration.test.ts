import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260716200000_fix_ledger_invite_current_ledger_target.sql",
  ),
  "utf8",
);

describe("接受账本邀请后的 current ledger migration", () => {
  it("不再写入应用未读取的 user_setting", () => {
    expect(migrationSql).not.toContain("public.user_setting");
  });

  it("加入成功和已是成员两条路径都汇合后更新 app_user.current_ledger_id", () => {
    const alreadyMemberIndex = migrationSql.indexOf(
      "v_result := 'already_member';",
    );
    const joinedIndex = migrationSql.indexOf("v_result := 'joined';");
    const updateCurrentLedgerIndex = migrationSql.indexOf(
      "update public.app_user",
    );

    expect(alreadyMemberIndex).toBeGreaterThan(-1);
    expect(joinedIndex).toBeGreaterThan(-1);
    expect(updateCurrentLedgerIndex).toBeGreaterThan(alreadyMemberIndex);
    expect(updateCurrentLedgerIndex).toBeGreaterThan(joinedIndex);
    expect(migrationSql.match(/update public\.app_user/g)).toHaveLength(1);
    expect(migrationSql).toContain(
      "set current_ledger_id = v_invite.ledger_id",
    );
  });

  it("只更新当前 active 用户，并在更新失败时整体回滚", () => {
    expect(migrationSql).toContain("where id = v_user_id");
    expect(migrationSql).toContain("and status = 'active'");
    expect(migrationSql).toContain("if not found then");
    expect(migrationSql).toContain("detail = 'user_inactive'");
  });

  it("保留邀请 RPC 的安全 search_path 和账本归属校验", () => {
    expect(migrationSql).toContain("set search_path = pg_catalog, pg_temp");
    expect(migrationSql).toContain("l.id = v_invite.ledger_id");
    expect(migrationSql).toContain("l.is_archived = false");
    expect(migrationSql).toContain("lm.ledger_id = v_invite.ledger_id");
    expect(migrationSql).toContain("lm.user_id = v_user_id");
  });
});
