import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260716213000_restore_ledger_owner_bootstrap.sql",
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

const finalCreateLedgerFunction = extractSchemaFunction(
  "create_ledger_with_owner",
);
const finalMemberPermissionFunction = extractSchemaFunction(
  "enforce_ledger_member_management_permission",
);

describe("首次账本所有者 bootstrap migration", () => {
  it("最终 schema 只允许账本创建函数临时开启 bootstrap", () => {
    const enableIndex = finalCreateLedgerFunction.indexOf(
      "set_config('app.allow_ledger_owner_bootstrap', 'true', true)",
    );
    const ownerInsertIndex = finalCreateLedgerFunction.indexOf(
      "insert into public.ledger_member",
    );
    const disableIndex = finalCreateLedgerFunction.indexOf(
      "set_config('app.allow_ledger_owner_bootstrap', 'false', true)",
    );
    const initializeIndex = finalCreateLedgerFunction.indexOf(
      "initialize_ledger_default_data",
    );

    expect(enableIndex).toBeGreaterThan(-1);
    expect(ownerInsertIndex).toBeGreaterThan(enableIndex);
    expect(disableIndex).toBeGreaterThan(ownerInsertIndex);
    expect(initializeIndex).toBeGreaterThan(disableIndex);
    expect(finalMemberPermissionFunction).toContain(
      "current_setting('app.allow_ledger_owner_bootstrap', true) = 'true'",
    );
  });

  it("最终 schema 严格限制首个所有者成员的身份和审计字段", () => {
    expect(finalMemberPermissionFunction).toContain("new.user_id = auth.uid()");
    expect(finalMemberPermissionFunction).toContain("new.role = 'owner'");
    expect(finalMemberPermissionFunction).toContain("new.status = 'active'");
    expect(finalMemberPermissionFunction).toContain(
      "new.invited_by = auth.uid()",
    );
    expect(finalMemberPermissionFunction).toContain(
      "new.created_by = auth.uid()",
    );
    expect(finalMemberPermissionFunction).toContain(
      "new.updated_by = auth.uid()",
    );
    expect(finalMemberPermissionFunction).toContain(
      "l.owner_user_id = auth.uid()",
    );
    expect(finalMemberPermissionFunction).toContain(
      "where existing_member.ledger_id = l.id",
    );
  });

  it("最终 schema 保持成员权限触发器绑定", () => {
    expect(schemaSnapshot).toContain(
      'CREATE OR REPLACE TRIGGER "ledger_member_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."ledger_member" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_member_management_permission"();',
    );
  });

  it("禁止绕过完整账本初始化入口", () => {
    expect(migrationSql).toContain(
      "revoke all on function public.create_ledger_with_owner(text, text) from authenticated",
    );
    expect(migrationSql).toContain(
      "revoke insert on table public.ledger from authenticated",
    );
    expect(migrationSql).toContain(
      "drop policy if exists ledger_insert_self_owner on public.ledger",
    );
    expect(migrationSql).not.toContain(
      "grant execute on function public.create_ledger_with_owner(text, text) to authenticated",
    );

    const ledgerGrant = schemaSnapshot
      .split("\n")
      .find((line) =>
        line.includes('ON TABLE "public"."ledger" TO "authenticated"'),
      );

    expect(ledgerGrant).toBeDefined();
    expect(ledgerGrant).not.toContain("INSERT");
    expect(schemaSnapshot).not.toContain(
      'CREATE POLICY "ledger_insert_self_owner"',
    );
    expect(schemaSnapshot).not.toContain(
      'GRANT ALL ON FUNCTION "public"."create_ledger_with_owner"("p_name" "text", "p_base_currency" "text") TO "authenticated";',
    );
    expect(schemaSnapshot).toContain(
      'GRANT ALL ON FUNCTION "public"."create_ledger_with_owner_settings"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text") TO "authenticated";',
    );
  });

  it("最终 schema 保留邀请接受分支", () => {
    const inviteAcceptanceFlags = finalMemberPermissionFunction.match(
      /app\.allow_ledger_invite_accept/g,
    );

    expect(inviteAcceptanceFlags).toHaveLength(2);
    expect(finalMemberPermissionFunction).toContain(
      "new.role in ('admin', 'member', 'viewer')",
    );
    expect(finalMemberPermissionFunction).toContain("old.status = 'invited'");
  });

  it("最终 schema 在 bootstrap 后保留通用权限校验和稳定错误详情", () => {
    const bootstrapIndex = finalMemberPermissionFunction.indexOf(
      "app.allow_ledger_owner_bootstrap",
    );
    const genericPermissionIndex = finalMemberPermissionFunction.indexOf(
      "current_user_can_manage_ledger(v_ledger_id)",
    );

    expect(bootstrapIndex).toBeGreaterThan(-1);
    expect(genericPermissionIndex).toBeGreaterThan(bootstrapIndex);
    expect(finalMemberPermissionFunction).toContain("errcode = '42501'");
    expect(finalMemberPermissionFunction).toContain(
      "detail = 'permission_denied'",
    );
  });
});
