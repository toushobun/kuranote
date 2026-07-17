// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createCategoryService } from "server/category/service/categoryService";
import type { CategoryRepository } from "server/category/repository/categoryRepository";
import type { CategoryRow } from "types/categories";

function createService(rows: CategoryRow[]) {
  const categoryRepository: CategoryRepository = {
    findActiveByLedgerId: vi.fn().mockResolvedValue(rows),
  };
  return createCategoryService({ categoryRepository });
}

const baseRow = {
  created_at: "2026-01-01T00:00:00.000Z",
  icon_name: null,
  sort_order: 0,
  type: "expense" as const,
};

describe("createCategoryService", () => {
  it("把大分类和小分类组装成树", async () => {
    const rows: CategoryRow[] = [
      { ...baseRow, id: "root-1", name: "餐饮", parent_id: null },
      { ...baseRow, id: "child-1", name: "外食", parent_id: "root-1" },
    ];
    const service = createService(rows);

    const view = await service.getCategoriesView({
      ledgerId: "ledger-1",
      ledgerName: "家庭账本",
      role: "member",
    });

    expect(view.categories).toEqual([{ ...rows[0], children: [rows[1]] }]);
    expect(view.parentOptions).toEqual([
      { id: "root-1", name: "餐饮", type: "expense" },
    ]);
    expect(view.ledgerName).toBe("家庭账本");
  });

  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
    ["viewer", false],
  ] as const)(
    "角色 %s 的 canManageCategories 为 %s",
    async (role, expected) => {
      const service = createService([]);

      const view = await service.getCategoriesView({
        ledgerId: "ledger-1",
        ledgerName: "家庭账本",
        role,
      });

      expect(view.canManageCategories).toBe(expected);
    },
  );
});
