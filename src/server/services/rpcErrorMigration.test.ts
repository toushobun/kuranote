import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260710060000_add_rpc_business_error_details.sql",
  ),
  "utf8",
);

function expectStructuredError(errorCode: string, sqlState: string) {
  expect(migrationSql).toMatch(
    new RegExp(
      `raise exception '${errorCode}'\\s+using errcode = '${sqlState}', detail = '${errorCode}';`,
    ),
  );
}

describe("RPC 结构化业务错误 migration", () => {
  it("账本创建 RPC 通过 detail 返回稳定业务错误码", () => {
    expect(migrationSql).toContain(
      "create or replace function public.create_ledger_with_owner_settings",
    );

    expectStructuredError("auth_required", "42501");
    expectStructuredError("ledger_name_required", "22023");
    expectStructuredError("ledger_name_too_long", "22023");
    expectStructuredError("currency_invalid", "22023");
    expectStructuredError("display_name_required", "22023");
    expectStructuredError("display_name_too_long", "22023");
    expectStructuredError("display_color_invalid", "22023");
  });

  it("账本成员设置 RPC 通过 detail 返回稳定业务错误码", () => {
    expect(migrationSql).toContain(
      "create or replace function public.update_ledger_member_settings",
    );

    expectStructuredError("permission_denied", "42501");
    expectStructuredError("member_not_found", "22023");
    expectStructuredError("role_invalid", "22023");
  });

  it("保持两个 RPC 的执行权限限制", () => {
    expect(migrationSql).toContain(
      "grant execute on function public.create_ledger_with_owner_settings(text, text, text, text) to authenticated;",
    );
    expect(migrationSql).toContain(
      "grant execute on function public.update_ledger_member_settings(uuid, uuid, text, text, text) to authenticated;",
    );
  });
});
