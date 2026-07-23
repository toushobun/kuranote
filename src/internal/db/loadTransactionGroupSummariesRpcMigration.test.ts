import { describe, expect, it } from "vitest";

import migration from "../../../supabase/migrations/20260704043000_load_transaction_group_summaries.sql?raw";

describe("load_transaction_group_summaries RPC migration", () => {
  it("创建非时间分组聚合 RPC 并限制执行权限", () => {
    expect(migration).toContain(
      "create or replace function public.load_transaction_group_summaries",
    );
    expect(migration).toContain(
      "public.current_user_is_active_ledger_member(p_ledger_id)",
    );
    expect(migration).toContain("grant execute on function");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("from anon");
  });

  it("覆盖商家、账户、分类、标签、成员分组", () => {
    for (const groupBy of [
      "merchant",
      "account",
      "parentCategory",
      "category",
      "tag",
      "member",
    ]) {
      expect(migration).toContain(groupBy);
    }
  });
});
