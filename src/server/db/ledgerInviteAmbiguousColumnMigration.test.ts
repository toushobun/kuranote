import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260717105000_fix_ledger_invite_ambiguous_column.sql",
  ),
  "utf8",
);

const schemaSnapshot = readFileSync(
  join(process.cwd(), "supabase/schema_snapshot/current_schema.sql"),
  "utf8",
);

function extractSchemaFunction(functionName: string): string {
  const startMarker = `CREATE OR REPLACE FUNCTION "public"."${functionName}"`;
  const endMarker = `ALTER FUNCTION "public"."${functionName}"`;
  const startIndex = schemaSnapshot.indexOf(startMarker);
  const endIndex = schemaSnapshot.indexOf(endMarker, startIndex);

  if (startIndex < 0 || endIndex < 0) {
    throw new Error(`最终 schema 中未找到函数：${functionName}`);
  }

  return schemaSnapshot.slice(startIndex, endIndex);
}

const finalAcceptInviteFunction = extractSchemaFunction("accept_ledger_invite");

describe("接受账本邀请列名歧义 migration", () => {
  it("在函数级别将歧义标识符优先解释为表列", () => {
    const bodyIndex = migrationSql.indexOf("as $$");
    const directiveIndex = migrationSql.indexOf("#variable_conflict use_column");
    const declareIndex = migrationSql.indexOf("declare", bodyIndex);

    expect(bodyIndex).toBeGreaterThan(-1);
    expect(directiveIndex).toBeGreaterThan(bodyIndex);
    expect(directiveIndex).toBeLessThan(declareIndex);
    expect(finalAcceptInviteFunction).toContain("#variable_conflict use_column");
  });

  it("保留部分唯一索引的冲突目标和既有 RPC 输出字段", () => {
    const conflictTarget =
      "on conflict (ledger_id, user_id) where status <> 'removed' do update set";

    expect(migrationSql).toContain(conflictTarget);
    expect(finalAcceptInviteFunction).toContain(conflictTarget);
    expect(migrationSql).toContain("returns table (\n    ledger_id uuid,");
    expect(finalAcceptInviteFunction).toContain(
      'RETURNS TABLE("ledger_id" "uuid", "ledger_name" "text", "result" "text")',
    );
  });

  it("保留接受邀请的权限开关、token 生命周期和 current ledger 更新", () => {
    expect(finalAcceptInviteFunction).toContain(
      "set_config('app.allow_ledger_invite_accept', 'true', true)",
    );
    expect(finalAcceptInviteFunction).toContain(
      "set_config('app.allow_ledger_invite_accept', 'false', true)",
    );
    expect(finalAcceptInviteFunction).toContain("invite_token = null");
    expect(finalAcceptInviteFunction).toContain("update public.app_user");
    expect(finalAcceptInviteFunction).toContain(
      "set current_ledger_id = v_invite.ledger_id",
    );
  });

  it("保留安全 search_path 与 authenticated 执行权限", () => {
    expect(migrationSql).toContain("set search_path = pg_catalog, pg_temp");
    expect(migrationSql).toContain(
      "revoke all on function public.accept_ledger_invite(text) from public",
    );
    expect(migrationSql).toContain(
      "revoke all on function public.accept_ledger_invite(text) from anon",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.accept_ledger_invite(text) to authenticated",
    );
  });
});
