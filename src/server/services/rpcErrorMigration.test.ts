import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readMigrationSql(fileName: string) {
  return readFileSync(
    join(process.cwd(), "supabase/migrations", fileName),
    "utf8",
  );
}

const rpcErrorMigrationSql = readMigrationSql(
  "20260710060000_add_rpc_business_error_details.sql",
);
const createLedgerOwnerErrorMigrationSql = readMigrationSql(
  "20260710070000_add_create_ledger_owner_error_details.sql",
);
const allMigrationSql = [
  rpcErrorMigrationSql,
  createLedgerOwnerErrorMigrationSql,
].join("\n");

function getFunctionSql(migrationSql: string, functionName: string) {
  const startMarker = `create or replace function public.${functionName}`;
  const startIndex = migrationSql.indexOf(startMarker);
  const endIndex = migrationSql.indexOf("\n$$;", startIndex);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return migrationSql.slice(startIndex, endIndex + 4);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expectStructuredError(
  functionSql: string,
  errorCode: string,
  sqlState: string,
) {
  const escapedErrorCode = escapeRegExp(errorCode);
  const raisePattern = new RegExp(
    `raise exception '${escapedErrorCode}'`,
    "g",
  );
  const structuredPattern = new RegExp(
    `raise exception '${escapedErrorCode}'\\s+using errcode = '${sqlState}', detail = '${escapedErrorCode}';`,
    "g",
  );
  const raiseCount = functionSql.match(raisePattern)?.length ?? 0;
  const structuredCount = functionSql.match(structuredPattern)?.length ?? 0;

  expect(raiseCount).toBeGreaterThan(0);
  expect(structuredCount).toBe(raiseCount);
}

function expectSecurityDefiner(functionSql: string) {
  expect(functionSql).toMatch(
    /language plpgsql\s+security definer\s+set search_path = public/,
  );
}

describe("RPC 结构化业务错误 migration", () => {
  it("底层账本创建 RPC 通过 detail 返回稳定业务错误码", () => {
    const functionSql = getFunctionSql(
      createLedgerOwnerErrorMigrationSql,
      "create_ledger_with_owner",
    );

    expectSecurityDefiner(functionSql);
    expectStructuredError(functionSql, "auth_required", "42501");
    expectStructuredError(functionSql, "user_inactive", "42501");
  });

  it("账本创建包装 RPC 通过 detail 返回稳定业务错误码", () => {
    const functionSql = getFunctionSql(
      rpcErrorMigrationSql,
      "create_ledger_with_owner_settings",
    );

    expectSecurityDefiner(functionSql);
    expectStructuredError(functionSql, "auth_required", "42501");
    expectStructuredError(functionSql, "ledger_name_required", "22023");
    expectStructuredError(functionSql, "ledger_name_too_long", "22023");
    expectStructuredError(functionSql, "currency_invalid", "22023");
    expectStructuredError(functionSql, "display_name_required", "22023");
    expectStructuredError(functionSql, "display_name_too_long", "22023");
    expectStructuredError(functionSql, "display_color_invalid", "22023");
  });

  it("账本成员设置 RPC 通过 detail 返回稳定业务错误码", () => {
    const functionSql = getFunctionSql(
      rpcErrorMigrationSql,
      "update_ledger_member_settings",
    );

    expectSecurityDefiner(functionSql);
    expectStructuredError(functionSql, "auth_required", "42501");
    expectStructuredError(functionSql, "permission_denied", "42501");
    expectStructuredError(functionSql, "display_name_required", "22023");
    expectStructuredError(functionSql, "display_name_too_long", "22023");
    expectStructuredError(functionSql, "display_color_invalid", "22023");
    expectStructuredError(functionSql, "role_invalid", "22023");
    expectStructuredError(functionSql, "member_not_found", "22023");
  });

  it("保持三个 RPC 的执行权限限制", () => {
    const permissionStatements = [
      "revoke all on function public.create_ledger_with_owner(text, text) from public;",
      "revoke all on function public.create_ledger_with_owner(text, text) from anon;",
      "grant execute on function public.create_ledger_with_owner(text, text) to authenticated;",
      "revoke all on function public.create_ledger_with_owner_settings(text, text, text, text) from public;",
      "revoke all on function public.create_ledger_with_owner_settings(text, text, text, text) from anon;",
      "grant execute on function public.create_ledger_with_owner_settings(text, text, text, text) to authenticated;",
      "revoke all on function public.update_ledger_member_settings(uuid, uuid, text, text, text) from public;",
      "revoke all on function public.update_ledger_member_settings(uuid, uuid, text, text, text) from anon;",
      "grant execute on function public.update_ledger_member_settings(uuid, uuid, text, text, text) to authenticated;",
    ];

    permissionStatements.forEach((statement) => {
      expect(allMigrationSql).toContain(statement);
    });
  });
});
