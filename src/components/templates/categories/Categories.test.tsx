import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoriesTemplate } from "./Categories";

const baseProps = {
  archiveCategoryAction: vi.fn(async () => {}),
  categories: [
    {
      children: [
        {
          created_at: "2026-01-01T00:00:00.000Z",
          icon_name: "🍜",
          id: "00000000-0000-4000-8000-000000000102",
          name: "外食",
          parent_id: "00000000-0000-4000-8000-000000000101",
          sort_order: 10,
          type: "expense" as const,
        },
      ],
      created_at: "2026-01-01T00:00:00.000Z",
      icon_name: "🍽️",
      id: "00000000-0000-4000-8000-000000000101",
      name: "餐饮",
      parent_id: null,
      sort_order: 10,
      type: "expense" as const,
    },
  ],
  createCategoryAction: vi.fn(async () => {}),
  ledgerName: "家庭账本",
  parentOptions: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      name: "餐饮",
      type: "expense" as const,
    },
  ],
  reorderCategoryAction: vi.fn(async () => ({})),
  updateCategoryAction: vi.fn(async () => {}),
};

afterEach(() => {
  cleanup();
});

describe("CategoriesTemplate", () => {
  it("显示分类管理标题和当前账本", () => {
    const { container } = render(<CategoriesTemplate {...baseProps} />);

    expect(
      within(container).getByRole("heading", { name: "分类管理" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("当前账本：家庭账本"),
    ).toBeInTheDocument();
  });

  it("显示新增入口和分类列表", () => {
    const { container } = render(<CategoriesTemplate {...baseProps} />);

    expect(
      within(container).getByRole("button", { name: "新增分类" }),
    ).toBeInTheDocument();
    expect(within(container).getByText("餐饮")).toBeInTheDocument();
    expect(within(container).getByText("外食")).toBeInTheDocument();
  });
});
