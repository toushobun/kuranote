import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { analyzeRepository } from "./check-security-definer-search-path.mjs";

const baseline = "20260722093000_harden_security_definer_search_path.sql";

function createRepository({ migration = "", snapshot }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "security-definer-check-"));
  const migrationsDirectory = path.join(root, "supabase", "migrations");
  const snapshotDirectory = path.join(root, "supabase", "schema_snapshot");
  fs.mkdirSync(migrationsDirectory, { recursive: true });
  fs.mkdirSync(snapshotDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(snapshotDirectory, "current_schema.sql"),
    snapshot,
  );
  if (migration) {
    fs.writeFileSync(path.join(migrationsDirectory, baseline), migration);
  }
  return root;
}

const safeSnapshot = `
create table public.ledger (id uuid primary key);
create or replace function public.safe_function(p_ledger_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, pg_temp
as $$
  select exists (select 1 from public.ledger where id = p_ledger_id);
$$;
`;

test("安全的 SECURITY DEFINER 定义可以通过", () => {
  const root = createRepository({ snapshot: safeSnapshot });
  assert.deepEqual(analyzeRepository({ root, baseline }), []);
});

test("检测同一文件中的不安全函数", () => {
  const root = createRepository({
    snapshot: `${safeSnapshot}
create or replace function public.unsafe_function()
returns boolean
language sql
security definer
set search_path = public
as $$ select true; $$;
`,
  });
  const errors = analyzeRepository({ root, baseline });
  assert.ok(errors.some((error) => error.includes("包含 public")));
  assert.ok(errors.some((error) => error.includes("pg_catalog")));
  assert.ok(errors.some((error) => error.includes("pg_temp")));
});

test("检测缺少 search_path 的函数", () => {
  const root = createRepository({
    snapshot: `${safeSnapshot}
create or replace function public.missing_path()
returns boolean
language sql
security definer
as $$ select true; $$;
`,
  });
  assert.ok(
    analyzeRepository({ root, baseline }).some((error) =>
      error.includes("必须显式设置 search_path"),
    ),
  );
});

test("检测未限定的应用对象与扩展函数", () => {
  const root = createRepository({
    snapshot: `${safeSnapshot}
create or replace function public.unsafe_references()
returns text
language sql
security definer
set search_path = pg_catalog, pg_temp
as $$
  select encode(digest(id::text, 'sha256'), 'hex') from ledger limit 1;
$$;
`,
  });
  const errors = analyzeRepository({ root, baseline });
  assert.ok(errors.some((error) => error.includes("ledger 未使用 public")));
  assert.ok(errors.some((error) => error.includes("digest()")));
});

test("检测向前 migration 中的不安全 ALTER FUNCTION", () => {
  const root = createRepository({
    migration: `alter function public.safe_function(uuid) set search_path to public;`,
    snapshot: safeSnapshot,
  });
  assert.ok(
    analyzeRepository({ root, baseline }).some((error) =>
      error.includes("包含 public"),
    ),
  );
});
