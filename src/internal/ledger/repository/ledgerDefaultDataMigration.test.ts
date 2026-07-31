import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260623090000_initialize_ledger_default_data.sql",
  ),
  "utf8",
);

const removeTagsMigrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260731020336_remove_transaction_tags.sql",
  ),
  "utf8",
);

const currentLedgerMigrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260707072000_add_current_ledger_id.sql",
  ),
  "utf8",
);

const seedSql = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8");

function extractValuesBlock(sql: string, aliasName: string): string {
  const match = sql.match(
    new RegExp(`from \\(\\s*values([\\s\\S]*?)\\s*\\) as ${aliasName}`),
  );

  if (!match) {
    throw new Error(`${aliasName} 的 values 没有找到`);
  }

  return match[1];
}

describe("账本默认数据初始化 migration", () => {
  it("新建账本时会调用默认数据初始化函数", () => {
    expect(migrationSql).toContain(
      "perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);",
    );
  });

  it("移除标签后账本初始化不再创建默认标签", () => {
    const functionStart = removeTagsMigrationSql.indexOf(
      "create or replace function public.initialize_ledger_default_data",
    );
    const functionEnd = removeTagsMigrationSql.indexOf("\n$$;", functionStart);
    const functionSql = removeTagsMigrationSql.slice(
      functionStart,
      functionEnd,
    );

    expect(functionStart).toBeGreaterThanOrEqual(0);
    expect(functionEnd).toBeGreaterThan(functionStart);
    expect(functionSql).not.toContain("transaction_tag");
    expect(removeTagsMigrationSql).toContain(
      "drop table if exists public.transaction_record_tag",
    );
    expect(removeTagsMigrationSql).toContain(
      "drop table if exists public.transaction_tag",
    );
  });

  it("商家别名初始化条数与 seed 覆盖数量保持一致，都是 110", () => {
    const aliasBlock = extractValuesBlock(migrationSql, "default_alias");
    const initializeAliasRows = Array.from(
      aliasBlock.matchAll(
        /\(\s*'(?:[^']|'')*'\s*,\s*'(?:[^']|'')*'\s*,\s*'(?:zh-Hans|ja|en)'\s*,\s*\d+\s*\)/g,
      ),
    );
    const seedAliasRows = Array.from(
      seedSql.matchAll(/00000000-0000-4000-8000-000000003\d{3}/g),
    );

    expect(initializeAliasRows).toHaveLength(110);
    expect(seedAliasRows).toHaveLength(110);
    expect(aliasBlock).toContain("('業務スーパー', '业务超市', 'zh-Hans', 10)");
    expect(aliasBlock).toContain("('麦当劳', 'McDonald''s', 'en', 10)");
    expect(aliasBlock).toContain("('吉野家', 'よしのや', 'ja', 20)");
  });

  it("商家别名通过 ledger 内 merchant name 解析 merchant_id，不硬编码 UUID", () => {
    expect(migrationSql).toContain(
      "lower(m.name) = lower(default_alias.merchant_name)",
    );
    expect(migrationSql).not.toMatch(/00000000-0000-4000-8000-[0-9a-f]{12}/);
  });

  it("重复执行初始化时不会重复创建商家别名", () => {
    expect(migrationSql).toContain("where ma.merchant_id = m.id");
    expect(migrationSql).toContain(
      "and lower(ma.alias) = lower(default_alias.alias)",
    );
  });

  it("McDonald 英文别名使用 SQL 标准直引号转义", () => {
    expect(migrationSql).toContain("McDonald''s");
    expect(migrationSql).not.toContain("McDonald’s");
  });

  it("账本创建错误使用机器可读标识，不含中文异常", () => {
    expect(migrationSql).toContain(
      "raise exception 'auth_required' using errcode = '42501';",
    );
    expect(migrationSql).toContain(
      "raise exception 'user_inactive' using errcode = '42501';",
    );
    expect(migrationSql).not.toContain("必须登录后才能创建账本");
    expect(migrationSql).not.toContain("当前用户不存在或已停用");
  });

  it("current ledger migration 覆盖账本创建函数时保留错误标识约定", () => {
    expect(currentLedgerMigrationSql).toContain(
      "raise exception 'auth_required' using errcode = '42501';",
    );
    expect(currentLedgerMigrationSql).toContain(
      "raise exception 'user_inactive' using errcode = '42501';",
    );
    expect(currentLedgerMigrationSql).not.toContain("login required");
    expect(currentLedgerMigrationSql).not.toContain("active app_user required");
  });
});
