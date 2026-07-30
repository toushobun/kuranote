// @vitest-environment node

import { describe, expect, it } from "vitest";

import type { CategoryRow } from "types/categories";

import { buildCategoriesView } from "./categoriesView";

const parentId = "00000000-0000-4000-8000-000000000101";
const childId = "00000000-0000-4000-8000-000000000102";

const baseRow = {
  created_at: "2026-07-01T00:00:00.000Z",
  icon_name: null,
  sort_order: 10,
  type: "expense" as const,
};

describe("categoriesView", () => {
  it("按 parent_id 组装分类树并从根分类派生父级选项", () => {
    const categories: CategoryRow[] = [
      { ...baseRow, id: parentId, name: "餐饮", parent_id: null },
      { ...baseRow, id: childId, name: "外食", parent_id: parentId },
    ];

    expect(
      buildCategoriesView({
        categories,
        ledgerName: "家庭账本",
        role: "owner",
      }),
    ).toEqual({
      canManageCategories: true,
      categories: [{ ...categories[0], children: [categories[1]] }],
      ledgerName: "家庭账本",
      parentOptions: [{ id: parentId, name: "餐饮", type: "expense" }],
    });
  });

  it("普通成员不能管理分类且孤立子分类不会进入分类树", () => {
    const orphan: CategoryRow = {
      ...baseRow,
      id: childId,
      name: "孤立分类",
      parent_id: "00000000-0000-4000-8000-000000000199",
    };

    expect(
      buildCategoriesView({
        categories: [orphan],
        ledgerName: "家庭账本",
        role: "member",
      }),
    ).toEqual({
      canManageCategories: false,
      categories: [],
      ledgerName: "家庭账本",
      parentOptions: [],
    });
  });
});
