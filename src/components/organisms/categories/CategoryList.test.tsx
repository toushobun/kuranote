import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryList } from "./CategoryList";

const categories = [
  {
    children: [
      {
        created_at: "2026-01-01T00:00:00.000Z",
        id: "expense-child",
        name: "外食",
        parent_id: "expense-root",
        sort_order: 10,
        type: "expense" as const,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    id: "expense-root",
    name: "餐饮",
    parent_id: null,
    sort_order: 10,
    type: "expense" as const,
  },
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    id: "income-root",
    name: "工资",
    parent_id: null,
    sort_order: 10,
    type: "income" as const,
  },
];

afterEach(() => {
  cleanup();
});

describe("CategoryList", () => {
  it("按支出和收入显示分类", () => {
    const { container } = render(
      <CategoryList
        archiveCategoryAction={vi.fn(async () => {})}
        categories={categories}
        errorCategoryId={null}
        errorMessage={null}
        updateCategoryAction={vi.fn(async () => {})}
      />,
    );

    expect(
      within(container).getByRole("heading", { name: "支出分类" }),
    ).toBeTruthy();
    expect(
      within(container).getByRole("heading", { name: "收入分类" }),
    ).toBeTruthy();
    expect(within(container).getByDisplayValue("餐饮")).toBeTruthy();
    expect(within(container).getByDisplayValue("外食")).toBeTruthy();
    expect(within(container).getByDisplayValue("工资")).toBeTruthy();
  });

  it("显示指定分类的错误信息", () => {
    const { container } = render(
      <CategoryList
        archiveCategoryAction={vi.fn(async () => {})}
        categories={categories}
        errorCategoryId="expense-child"
        errorMessage="分类更新失败。"
        updateCategoryAction={vi.fn(async () => {})}
      />,
    );

    expect(within(container).getByRole("alert").textContent).toBe(
      "分类更新失败。",
    );
  });
});
