import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260715105000_qualify_ledger_invite_pgcrypto_functions.sql",
  ),
  "utf8",
);

describe("邀请 pgcrypto 显式 schema migration SQL 内容", () => {
  it("在应用函数定义前确认生产环境具备所需扩展函数", () => {
    expect(migrationSql).toContain(
      "to_regprocedure('extensions.gen_random_bytes(integer)')",
    );
    expect(migrationSql).toContain(
      "to_regprocedure('extensions.digest(text,text)')",
    );
  });

  it("创建、预览和接受邀请均显式调用 extensions schema", () => {
    expect(migrationSql).toContain(
      "encode(extensions.gen_random_bytes(32), 'hex')",
    );
    expect(migrationSql.match(/encode\(extensions\.digest\(/g)).toHaveLength(3);
  });

  it("三个邀请 RPC 不再通过 search_path 隐式解析 extensions", () => {
    expect(
      migrationSql.match(/set search_path = pg_catalog, pg_temp/g),
    ).toHaveLength(3);
    expect(migrationSql).not.toContain(
      "set search_path = pg_catalog, extensions, pg_temp",
    );
  });

  it("接受邀请匹配未移除成员的部分唯一索引", () => {
    expect(migrationSql).toContain("and lm.status <> 'removed'");
    expect(migrationSql).toContain(
      "on conflict (ledger_id, user_id) where status <> 'removed' do update set",
    );
    expect(migrationSql).not.toContain(
      "on conflict (ledger_id, user_id) do update set",
    );
  });
});
