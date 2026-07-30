// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  getNextCategorySortOrder,
  hasDuplicateCategoryName,
} from "./categorySiblings";

describe("categorySiblings", () => {
  it("忽略大小写并移除图标前缀后判断同级名称重复", () => {
    expect(
      hasDuplicateCategoryName(
        [
          {
            iconName: "🍔",
            id: "category-1",
            name: "🍔 Food",
            sortOrder: 10,
          },
        ],
        " food ",
      ),
    ).toBe(true);
  });

  it("更新分类时从判重中排除自身", () => {
    expect(
      hasDuplicateCategoryName(
        [
          {
            iconName: "🍔",
            id: "category-1",
            name: "🍔 食费",
            sortOrder: 10,
          },
        ],
        "食费",
        "category-1",
      ),
    ).toBe(false);
  });

  it("按有效的同级最大排序值加 10", () => {
    expect(
      getNextCategorySortOrder([
        {
          iconName: null,
          id: "category-1",
          name: "餐饮",
          sortOrder: 20,
        },
        {
          iconName: null,
          id: "category-2",
          name: "交通",
          sortOrder: Number.NaN,
        },
      ]),
    ).toBe(30);
  });

  it("没有同级分类时从默认排序值 10 开始", () => {
    expect(getNextCategorySortOrder([])).toBe(10);
  });
});
