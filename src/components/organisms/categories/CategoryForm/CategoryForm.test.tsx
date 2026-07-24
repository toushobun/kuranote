import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryForm } from "./CategoryForm";

const parentOptions = [
  { id: "expense-root", name: "🍽️ 餐饮", type: "expense" as const },
  { id: "income-root", name: "💰 工资", type: "income" as const },
];

function renderForm(options = parentOptions) {
  return render(
    <CategoryForm
      createCategoryAction={vi.fn(async () => {})}
      parentOptions={options}
    />,
  );
}

afterEach(() => {
  cleanup();
});

describe("CategoryForm", () => {
  it("通过顶部按钮打开新增分类表单", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));

    expect(
      screen.getByRole("heading", { name: "新增分类" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("例如：餐饮、工资、交通"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("当前分类图标：📁")).toBeInTheDocument();
  });

  it("说明大分类和小分类的创建方式", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));

    expect(
      screen.getByText(
        "留空时创建大分类；选择大分类时创建可用于记账的小分类。",
      ),
    ).toBeInTheDocument();
  });

  it("支出类型下只显示支出分类选项", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "上级分类" }));

    expect(screen.getByText("🍽️ 餐饮")).toBeInTheDocument();
    expect(screen.queryByText("💰 工资")).toBeNull();
  });

  it("切换为收入类型后只显示收入分类选项", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "分类类型" }));
    fireEvent.click(screen.getByRole("option", { name: "收入" }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "上级分类" }));

    expect(screen.getByText("💰 工资")).toBeInTheDocument();
    expect(screen.queryByText("🍽️ 餐饮")).toBeNull();
  });

  it("没有大分类候选时仍可创建大分类", () => {
    renderForm([]);
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "上级分类" }));

    expect(
      screen.getByRole("option", { name: "无上级分类" }),
    ).toBeInTheDocument();
  });
});
