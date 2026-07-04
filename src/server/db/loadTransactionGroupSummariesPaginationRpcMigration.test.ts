import { describe, expect, it } from "vitest";

import migration from "../../../supabase/migrations/20260704060000_load_transaction_group_summaries_pagination.sql?raw";

describe("load_transaction_group_summaries RPC pagination migration", () => {
  it("替换旧 RPC 签名并加入分页参数", () => {
    expect(migration).toContain("drop function if exists");
    expect(migration).toContain("p_offset integer default 0");
    expect(migration).toContain("p_limit integer default 20");
    expect(migration).toContain("integer,");
  });

  it("在 SQL 层使用稳定排序和分页", () => {
    expect(migration).toContain(
      "order by ag.latest_transaction_at desc, ag.group_id asc",
    );
    expect(migration).toContain("limit greatest(coalesce(p_limit, 20), 0)");
    expect(migration).toContain("offset greatest(coalesce(p_offset, 0), 0)");
  });

  it("继续限制 RPC 执行权限", () => {
    expect(migration).toContain("revoke all on function");
    expect(migration).toContain("from public");
    expect(migration).toContain("from anon");
    expect(migration).toContain("grant execute on function");
    expect(migration).toContain("to authenticated");
  });
});
