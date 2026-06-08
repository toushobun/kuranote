import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryForm } from "./CategoryForm";

afterEach(() => {
  cleanup();
});

const parentOptions = [
  { id: "expense-root", name: "餐饮", type: "expense" as const },
  { id: "income-root", name: "收入", type: "income" as const },
];

describe("CategoryForm", () => {
  it("显示新增分类表单", () => {
    const { container } = render(
      <CategoryForm
        createCategoryAction={vi.fn(async () => {})}
        parentOptions={parentOptions}
      />,
    );

    expect(
      within(container).getByRole("heading", { name: "新增分类" }),
    ).toBeTruthy();
    expect(
      within(container).getByPlaceholderText("例如：餐饮、工资、交通"),
    ).toBeTruthy();
    expect(within(container).getAllByText("分类类型").length).toBeGreaterThan(
      0,
    );
    expect(within(container).getAllByText("上级分类").length).toBeGreaterThan(
      0,
    );
    expect(
      within(container).getByRole("button", { name: "新增分类" }),
    ).toBeTruthy();
  });

  it("说明大分类和小分类的创建方式", () => {
    const { container } = render(
      <CategoryForm
        createCategoryAction={vi.fn(async () => {})}
        parentOptions={parentOptions}
      />,
    );

    expect(
      within(container).getByText(
        "留空时创建大分类；选择大分类时创建可用于记账的小分类。",
      ),
    ).toBeTruthy();
  });

  it("按分类类型过滤上级分类", () => {
    const { container } = render(
      <CategoryForm
        createCategoryAction={vi.fn(async () => {})}
        parentOptions={parentOptions}
      />,
    );

    expect(within(container).queryByText("餐饮")).toBeTruthy();
    expect(within(container).queryByText("收入")).toBeNull();

    fireEvent.mouseDown(within(container).getByRole("combobox", { name: "分类类型" }));
    fireEvent.click(within(document.body).getByRole("option", { name: "收入" }));

    expect(within(container).queryByText("餐饮")).toBeNull();
    expect(within(container).queryByText("收入")).toBeTruthy();
  });

  it("没有上级分类候选时也能显示表单", () => {
    const { container } = render(
      <CategoryForm
        createCategoryAction={vi.fn(async () => {})}
        parentOptions={[]}
      />,
    );

    expect(
      within(container).getByRole("button", { name: "新增分类" }),
    ).toBeTruthy();
    expect(within(container).getByText("无上级分类")).toBeTruthy();
  });
});
