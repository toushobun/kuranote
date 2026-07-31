import { describe, expect, it } from "vitest";

import migration from "../../../supabase/migrations/20260731020336_remove_transaction_tags.sql?raw";

function getFunctionSql(functionName: string) {
  const start = migration.indexOf(
    `create or replace function public.${functionName}`,
  );
  const end = migration.indexOf("\n$$;", start);

  if (start < 0 || end < 0) {
    throw new Error(`migration 中没有找到函数：${functionName}`);
  }

  return migration.slice(start, end);
}

describe("load_transaction_group_summaries RPC migration", () => {
  it("重建非时间分组聚合 RPC 并限制执行权限", () => {
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

  it("仅覆盖商家、账户、分类和成员分组", () => {
    const functionSql = getFunctionSql("load_transaction_group_summaries");

    for (const groupBy of [
      "merchant",
      "account",
      "parentCategory",
      "category",
      "member",
    ]) {
      expect(functionSql).toContain(groupBy);
    }

    expect(functionSql).not.toContain("'tag'");
    expect(functionSql).not.toContain("p_tag_id");
    expect(functionSql).not.toContain("transaction_record_tag");
  });
});
