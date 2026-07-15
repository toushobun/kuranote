import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260715131000_fix_ledger_invite_ledger_archive_check.sql",
  ),
  "utf8",
);

describe("邀请 RPC 账本归档状态 migration SQL 内容", () => {
  it("三个邀请 RPC 不再读取 ledger 上不存在的 status 列", () => {
    expect(migrationSql).not.toContain("l.status");
  });

  it("生成和接受邀请只允许未归档账本", () => {
    expect(migrationSql.match(/and l\.is_archived = false/g)).toHaveLength(2);
  });

  it("已归档账本的邀请预览返回 invalid", () => {
    expect(migrationSql).toContain("when l.is_archived then 'invalid'");
  });

  it("保留邀请 RPC 的安全 schema 与既有冲突目标修复", () => {
    expect(
      migrationSql.match(/set search_path = pg_catalog, pg_temp/g),
    ).toHaveLength(3);
    expect(migrationSql).toContain(
      "on conflict (ledger_id, user_id) where status <> 'removed' do update set",
    );
  });
});
