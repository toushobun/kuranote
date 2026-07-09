import { describe, expect, it } from "vitest";

import migration from "../../../supabase/migrations/20260709090000_use_ledger_member_display_name_for_transaction_groups.sql?raw";

describe("load_transaction_group_summaries member display name migration", () => {
  it("成员分组标签优先使用账本内成员昵称", () => {
    expect(migration).toContain(
      "left join public.ledger_member_display_setting lmds",
    );
    expect(migration).toContain(
      "else coalesce(nullif(btrim(lmds.display_name), ''), au.display_name, '未知成员')",
    );
  });

  it("继续限制 RPC 执行权限", () => {
    expect(migration).toContain("revoke all on function");
    expect(migration).toContain("from public");
    expect(migration).toContain("from anon");
    expect(migration).toContain("grant execute on function");
    expect(migration).toContain("to authenticated");
  });
});
