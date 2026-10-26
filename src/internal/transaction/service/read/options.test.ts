import { describe, expect, it, vi } from "vitest";

import type { CategorySummaryDbRow } from "internal/db-types";

import {
  buildFormCategoryOptions,
  loadTransactionFilterOptions,
} from "./options";

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

  it("父分类不存在时仍保留子分类", () => {
    const rows = [
      createCategory({
        id: "orphan-child",
        name: "孤立分类",
        parent_id: "missing-parent",
      }),
      createCategory({
        id: "food-lunch",
        name: "午饭",
        parent_id: "food",
      }),
      createCategory({ id: "food", name: "食品" }),
    ];

    expect(buildFormCategoryOptions(rows)).toEqual([
      {
        id: "food-lunch",
        name: "午饭",
        parentId: "food",
        parentName: "食品",
        type: "expense",
      },
      {
        id: "orphan-child",
        name: "孤立分类",
        parentId: "missing-parent",
        parentName: null,
        type: "expense",
      },
    ]);
  });
});

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

describe("loadTransactionFilterOptions", () => {
  it("持有人候选来自账户模块，末尾追加「未指定持有人」", async () => {
    const listTransactionHolderOptions = vi.fn().mockResolvedValue([
      { id: "placeholder-grandma", name: "奶奶" },
      { id: userId, name: "我" },
    ]);

    const options = await loadTransactionFilterOptions(
      {
        accountQueryService: {
          getTransactionContext: vi.fn(),
          listTransactionHolderOptions,
          listTransactionOptions: vi.fn().mockResolvedValue([]),
        },
        categoryQueryService: {
          findSummariesByIds: vi.fn(),
          listActiveSummaries: vi.fn().mockResolvedValue([]),
        },
        currentUserId: userId,
        merchantQueryService: {
          findSummariesByIds: vi.fn(),
          listActiveOptions: vi.fn().mockResolvedValue([]),
        },
        transactionRepository: {
          findUserSummaries: vi.fn().mockResolvedValue([]),
          listActiveMemberIds: vi.fn().mockResolvedValue([]),
        },
      },
      {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
    );

    expect(listTransactionHolderOptions).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
    expect(options.holders).toEqual([
      { id: "placeholder-grandma", name: "奶奶" },
      { id: userId, name: "我" },
      { id: "none", name: "未指定持有人" },
    ]);
  });
});
