import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260711010000_assign_ledger_member_display_colors.sql",
  ),
  "utf8",
);

const orderedColors = [
  "amber",
  "sakura",
  "lime",
  "jade",
  "sky",
  "lavender",
] as const;

describe("账本成员默认颜色 migration", () => {
  it("按固定顺序检索第一个未被 active 成员使用的颜色", () => {
    for (let index = 0; index < orderedColors.length - 1; index += 1) {
      const currentColor = orderedColors[index];
      const nextColor = orderedColors[index + 1];

      expect(migrationSql.indexOf(`('${currentColor}'::text`)).toBeLessThan(
        migrationSql.indexOf(`('${nextColor}'::text`),
      );
    }

    expect(migrationSql).toContain("where not exists (");
    expect(migrationSql).toContain("lm.status = 'active'");
    expect(migrationSql).toContain(
      "setting.display_color = option.display_color",
    );
  });

  it("成员首次成为 active 时自动建立显示色设置", () => {
    expect(migrationSql).toContain(
      "create trigger ledger_member_assign_default_display_color",
    );
    expect(migrationSql).toContain(
      "after insert or update of status on public.ledger_member",
    );
    expect(migrationSql).toContain(
      "public.get_next_ledger_member_display_color(new.ledger_id)",
    );
  });

  it("并发加入时锁定账本并在六色占满后回退第一色", () => {
    expect(migrationSql).toContain("for update;");
    expect(migrationSql).toContain("'amber'\n    );");
  });

  it("为既存 active 成员补齐缺失的颜色设置", () => {
    expect(migrationSql).toContain("for v_member in");
    expect(migrationSql).toContain(
      "from public.ledger_member_display_setting setting",
    );
    expect(migrationSql).toContain(
      "public.get_next_ledger_member_display_color(v_member.ledger_id)",
    );
  });
});
