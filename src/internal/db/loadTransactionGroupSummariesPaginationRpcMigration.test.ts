import { describe, expect, it } from "vitest";

import migration from "../../../supabase/migrations/20260704060000_load_transaction_group_summaries_pagination.sql?raw";

const normalizedMigration = migration.replaceAll("\r\n", "\n");

describe("load_transaction_group_summaries RPC pagination migration", () => {
  it("替换旧 RPC 签名并加入分页参数", () => {
    expect(normalizedMigration).toContain("drop function if exists");
    expect(normalizedMigration).toContain("p_offset integer default 0");
    expect(normalizedMigration).toContain("p_limit integer default 20");
    expect(normalizedMigration).toContain("uuid,\n    integer,\n    integer");
  });

  it("在 SQL 层使用稳定排序和分页", () => {
    expect(normalizedMigration).toContain(
      "order by ag.latest_transaction_at desc, ag.group_id asc",
    );
    expect(normalizedMigration).toContain(
      "limit greatest(coalesce(p_limit, 20), 0)",
    );
    expect(normalizedMigration).toContain(
      "offset greatest(coalesce(p_offset, 0), 0)",
    );
  });

  it("继续限制 RPC 执行权限", () => {
    expect(normalizedMigration).toContain("revoke all on function");
    expect(normalizedMigration).toContain("from public");
    expect(normalizedMigration).toContain("from anon");
    expect(normalizedMigration).toContain("grant execute on function");
    expect(normalizedMigration).toContain("to authenticated");
  });
});
