import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
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
  it("确认图标后提交名称与图标，成功关闭并重置新增表单", async () => {
    const createCategoryAction = vi.fn<(data: FormData) => Promise<void>>(
      async () => {},
    );
    const { rerender } = render(
      <CategoryForm
        createCategoryAction={createCategoryAction}
        parentOptions={parentOptions}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    fireEvent.change(screen.getByRole("textbox", { name: "分类名称" }), {
      target: { value: "验收分类" },
    });
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    const picker = screen.getByRole("dialog", { name: "选择图标" });
    fireEvent.click(
      within(picker).getByRole("button", { name: "选择面条图标" }),
    );
    fireEvent.click(within(picker).getByRole("button", { name: "确定" }));
    await waitFor(() => expect(picker).not.toBeInTheDocument());
    expect(createCategoryAction).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "新增分类",
      }),
    );
    await waitFor(() => expect(createCategoryAction).toHaveBeenCalledOnce());
    const data = createCategoryAction.mock.calls[0][0] as FormData;
    expect(data.get("name")).toBe("验收分类");
    expect(data.get("iconName")).toBe("🍜");
    expect(data.get("type")).toBe("expense");
    expect(data.get("parentId")).toBe("");
    rerender(
      <CategoryForm
        createCategoryAction={createCategoryAction}
        parentOptions={parentOptions}
        createState={{ success: "新增成功" }}
      />,
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    expect(screen.getByRole("textbox", { name: "分类名称" })).toHaveValue("");
    expect(screen.getByLabelText("当前分类图标：📁")).toBeInTheDocument();
  });

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

  it("新增弹窗的取消与提交按钮横向铺满并保持取消行为", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    const dialog = within(screen.getByRole("dialog"));
    const cancel = dialog.getByRole("button", { name: "取消" });
    const submit = dialog.getByRole("button", { name: "新增分类" });
    expect(cancel.parentElement).toBe(submit.parentElement);
    expect(getComputedStyle(cancel.parentElement!).flexDirection).toBe("row");
    expect(getComputedStyle(cancel).width).toBe("100%");
    expect(getComputedStyle(submit).width).toBe("100%");
    expect(submit).toHaveAttribute("type", "submit");
    fireEvent.click(cancel);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
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
