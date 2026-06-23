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

  it("默认标签是 8 个，且包含指定的生产初始化集合", () => {
    const tagBlock = extractValuesBlock(migrationSql, "default_tag");
    const tagRows = Array.from(
      tagBlock.matchAll(/\(\s*'[^']+'\s*,\s*'#[0-9A-Fa-f]{6}'\s*,\s*\d+\s*\)/g),
    );

    expect(tagRows).toHaveLength(8);
    expect(tagBlock).toContain("('日常', '#E0F2FE', 10)");
    expect(tagBlock).toContain("('腐败', '#FCE7F3', 20)");
    expect(tagBlock).toContain("('公司', '#D1FAE5', 30)");
    expect(tagBlock).toContain("('人情', '#BBF7D0', 40)");
    expect(tagBlock).toContain("('孩子', '#FED7AA', 50)");
    expect(tagBlock).toContain("('旅游', '#DBEAFE', 60)");
    expect(tagBlock).toContain("('装修', '#DDD6FE', 70)");
    expect(tagBlock).toContain("('结婚', '#FDE68A', 80)");
  });

  it("migration 不包含旧中间态标签", () => {
    expect(migrationSql).not.toContain("'旅行'");
    expect(migrationSql).not.toContain("'医疗'");
    expect(migrationSql).not.toContain("'固定支出'");
    expect(migrationSql).not.toContain("'临时'");
    expect(migrationSql).not.toContain("'报销'");
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
});
