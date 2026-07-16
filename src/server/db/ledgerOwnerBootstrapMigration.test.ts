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

describe("首次账本所有者 bootstrap migration", () => {
  it("只允许账本创建 RPC 临时开启 bootstrap", () => {
    const enableIndex = migrationSql.indexOf(
      "set_config('app.allow_ledger_owner_bootstrap', 'true', true)",
    );
    const ownerInsertIndex = migrationSql.indexOf(
      "insert into public.ledger_member",
    );
    const disableIndex = migrationSql.indexOf(
      "set_config('app.allow_ledger_owner_bootstrap', 'false', true)",
    );

    expect(enableIndex).toBeGreaterThan(-1);
    expect(ownerInsertIndex).toBeGreaterThan(enableIndex);
    expect(disableIndex).toBeGreaterThan(ownerInsertIndex);
    expect(migrationSql).toContain(
      "current_setting('app.allow_ledger_owner_bootstrap', true) = 'true'",
    );
  });

  it("严格限制首个所有者成员的身份和审计字段", () => {
    expect(migrationSql).toContain("new.user_id = auth.uid()");
    expect(migrationSql).toContain("new.role = 'owner'");
    expect(migrationSql).toContain("new.status = 'active'");
    expect(migrationSql).toContain("new.invited_by = auth.uid()");
    expect(migrationSql).toContain("new.created_by = auth.uid()");
    expect(migrationSql).toContain("new.updated_by = auth.uid()");
    expect(migrationSql).toContain("l.owner_user_id = auth.uid()");
    expect(migrationSql).toContain("where existing_member.ledger_id = l.id");
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
  });

  it("保留邀请接受分支", () => {
    const inviteAcceptanceFlags = migrationSql.match(
      /app\.allow_ledger_invite_accept/g,
    );

    expect(inviteAcceptanceFlags).toHaveLength(2);
    expect(migrationSql).toContain("new.role in ('admin', 'member', 'viewer')");
    expect(migrationSql).toContain("old.status = 'invited'");
  });

  it("保留通用校验和稳定错误详情", () => {
    expect(migrationSql).toContain("current_user_can_manage_ledger");
    expect(migrationSql).toContain("errcode = '42501'");
    expect(migrationSql).toContain("detail = 'permission_denied'");
  });
});
