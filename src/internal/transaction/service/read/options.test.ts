import { describe, expect, it } from "vitest";

import type { CategorySummaryDbRow } from "internal/db-types";

import { buildFormCategoryOptions } from "./options";

function createCategory(
  overrides: Partial<CategorySummaryDbRow>,
): CategorySummaryDbRow {
  return {
    id: "category-1",
    name: "分类",
    parent_id: null,
    type: "expense",
    ...overrides,
  };
}

describe("buildFormCategoryOptions", () => {
  it("按父分类的自定义顺序展开子分类并保留组内顺序", () => {
    const rows = [
      createCategory({
        id: "food-lunch",
        name: "午饭",
        parent_id: "food",
      }),
      createCategory({
        id: "transport-train",
        name: "电车",
        parent_id: "transport",
      }),
      createCategory({
        id: "food-dinner",
        name: "晚饭",
        parent_id: "food",
      }),
      createCategory({
        id: "transport-taxi",
        name: "出租车",
        parent_id: "transport",
      }),
      createCategory({ id: "transport", name: "交通" }),
      createCategory({ id: "food", name: "食品" }),
    ];

    expect(buildFormCategoryOptions(rows)).toEqual([
      {
        id: "transport-train",
        name: "电车",
        parentId: "transport",
        parentName: "交通",
        type: "expense",
      },
      {
        id: "transport-taxi",
        name: "出租车",
        parentId: "transport",
        parentName: "交通",
        type: "expense",
      },
      {
        id: "food-lunch",
        name: "午饭",
        parentId: "food",
        parentName: "食品",
        type: "expense",
      },
      {
        id: "food-dinner",
        name: "晚饭",
        parentId: "food",
        parentName: "食品",
        type: "expense",
      },
    ]);
  });
});
