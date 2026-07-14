import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260714161000_fix_ledger_invite_pgcrypto_search_path.sql",
  ),
  "utf8",
);

const inviteRpcSignatures = [
  "create_ledger_invite(uuid, text)",
  "get_ledger_invite_preview(text)",
  "accept_ledger_invite(text)",
];

describe("邀请 pgcrypto schema migration", () => {
  it("为创建、预览和接受邀请 RPC 仅使用受信任 schema", () => {
    inviteRpcSignatures.forEach((signature) => {
      expect(migrationSql).toContain(
        `alter function public.${signature}\nset search_path to pg_catalog, extensions;`,
      );
    });
  });
});
