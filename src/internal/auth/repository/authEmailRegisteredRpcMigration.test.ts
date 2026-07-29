// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260729103000_create_is_email_registered_rpc.sql",
);

function readMigration() {
  return readFileSync(migrationPath, "utf8");
}

describe("注册邮箱查询 RPC migration", () => {
  it("通过 auth.users 精确判断标准化邮箱是否存在", () => {
    const migration = readMigration();

    expect(migration).toContain(
      "create or replace function public.is_email_registered(p_email text)",
    );
    expect(migration).toContain("returns boolean");
    expect(migration).toContain("from auth.users u");
    expect(migration).toContain(
      "pg_catalog.lower(u.email) = pg_catalog.lower(pg_catalog.btrim(p_email))",
    );
  });

  it("使用安全 search_path 且只允许 service_role 执行", () => {
    const migration = readMigration();

    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = pg_catalog, pg_temp");
    expect(migration).toContain(
      "revoke all on function public.is_email_registered(text) from public",
    );
    expect(migration).toContain(
      "revoke all on function public.is_email_registered(text) from anon",
    );
    expect(migration).toContain(
      "revoke all on function public.is_email_registered(text) from authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.is_email_registered(text) to service_role",
    );
  });
});
