import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "internal/category/categoryErrors";

import { CategoryList } from "./CategoryList";

const expenseRootId = "00000000-0000-4000-8000-000000000101";
const expenseSecondRootId = "00000000-0000-4000-8000-000000000102";
const expenseChildId = "00000000-0000-4000-8000-000000000103";
const incomeRootId = "00000000-0000-4000-8000-000000000104";

const categories = [
  {
    children: [
      {
        created_at: "2026-01-01T00:00:00.000Z",
        icon_name: "🍜",
        id: expenseChildId,
        name: "🍜 外食",
        parent_id: expenseRootId,
        sort_order: 10,
        type: "expense" as const,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🍽️",
    id: expenseRootId,
    name: "🍽️ 餐饮",
    parent_id: null,
    sort_order: 10,
    type: "expense" as const,
  },
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🛒",
    id: expenseSecondRootId,
    name: "日常购物",
    parent_id: null,
    sort_order: 20,
    type: "expense" as const,
  },
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "💰",
    id: incomeRootId,
    name: "💰 工资",
    parent_id: null,
    sort_order: 10,
    type: "income" as const,
  },
];

function renderList(
  overrides: Partial<Parameters<typeof CategoryList>[0]> = {},
) {
  return render(
    <CategoryList
      archiveCategoryAction={vi.fn(async () => {})}
      categories={categories}
      errorCategoryId={null}
      errorMessage={null}
      reorderCategoryAction={vi.fn(async () => ({ ok: true as const }))}
      updateCategoryAction={vi.fn(async () => {})}
      {...overrides}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CategoryList", () => {
  it("默认显示支出分类并展开第一个大分类", () => {
    renderList();

    expect(screen.getByRole("tab", { name: "支出分类" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("餐饮")).toBeInTheDocument();
    expect(screen.getByText("外食")).toBeInTheDocument();
    expect(screen.queryByText("工资")).toBeNull();
  });

  it("切换收入分类后显示收入列表", () => {
    renderList();

    fireEvent.click(screen.getByRole("tab", { name: "收入分类" }));

    expect(screen.getByText("工资")).toBeInTheDocument();
    expect(screen.queryByText("餐饮")).toBeNull();
  });

  it("大分类和小分类都显示编辑与排序按钮", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: "编辑餐饮" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "调整餐饮排序" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "编辑外食" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "调整外食排序" }),
    ).toBeInTheDocument();
  });

  it("编辑分类时显示名称与当前 Emoji", () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "编辑餐饮" }));

    expect(
      screen.getByRole("heading", { name: "编辑分类" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "分类名称" })).toHaveValue(
      "餐饮",
    );
    expect(screen.getByLabelText("当前分类图标：🍽️")).toBeInTheDocument();
  });

  it("显示指定分类的错误信息", () => {
    renderList({
      errorCategoryId: expenseChildId,
      errorMessage: "分类更新失败。",
    });

    expect(screen.getByRole("alert")).toHaveTextContent("分类更新失败。");
  });

  it("拖动大分类时提交同级分类顺序", async () => {
    const reorderCategoryAction = vi.fn(async (formData: FormData) => {
      void formData;
      return { ok: true as const };
    });
    const { container } = renderList({ reorderCategoryAction });
    const handle = screen.getByRole("button", {
      name: "调整餐饮排序",
    });
    const targetRow = container.querySelector<HTMLElement>(
      `[data-category-row-id="${expenseSecondRootId}"]`,
    );

    expect(targetRow).not.toBeNull();
    Object.defineProperties(handle, {
      hasPointerCapture: { value: vi.fn(() => false) },
      setPointerCapture: { value: vi.fn() },
    });
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: vi.fn(() => targetRow),
    });
    vi.spyOn(targetRow as HTMLElement, "getBoundingClientRect").mockReturnValue(
      {
        bottom: 100,
        height: 40,
        left: 0,
        right: 320,
        toJSON: () => ({}),
        top: 60,
        width: 320,
        x: 0,
        y: 60,
      },
    );

    fireEvent.pointerDown(handle, {
      button: 0,
      clientX: 20,
      clientY: 20,
      pointerId: 1,
    });
    fireEvent.pointerUp(handle, { clientX: 20, clientY: 95, pointerId: 1 });

    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledOnce());
    const formData = reorderCategoryAction.mock.calls[0]?.[0];

    expect(formData?.get("categoryIds")).toBe(
      JSON.stringify([expenseSecondRootId, expenseRootId]),
    );
    expect(formData?.get("parentId")).toBe("");
    expect(formData?.get("type")).toBe("expense");
  });

  it("非主键按下排序按钮时不启动拖动", () => {
    const reorderCategoryAction = vi.fn(async () => ({ ok: true as const }));
    renderList({ reorderCategoryAction });
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });

    fireEvent.pointerDown(handle, { button: 2, pointerId: 1 });
    fireEvent.pointerUp(handle, { button: 2, pointerId: 1 });

    expect(reorderCategoryAction).not.toHaveBeenCalled();
  });

  it("使用方向键调整顺序时不重置展开状态或焦点", async () => {
    const reorderCategoryAction = vi.fn(async (formData: FormData) => {
      void formData;
      return { ok: true as const };
    });
    renderList({ reorderCategoryAction });
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });
    handle.focus();

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledOnce());
    expect(screen.getByText("外食")).toBeInTheDocument();
    expect(handle).toHaveFocus();
    expect(handle).toHaveAttribute("aria-keyshortcuts", "ArrowUp ArrowDown");
  });

  it("排序失败时显示错误并恢复当前页面状态", async () => {
    const reorderCategoryAction = vi.fn(async () => ({
      error: categoryErrorCodes.reorderFailed,
      ok: false as const,
    }));
    renderList({ reorderCategoryAction });
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "分类排序保存失败，请稍后重试。",
      ),
    );
    expect(screen.getByText("外食")).toBeInTheDocument();
  });

  it("没有分类时显示空状态", () => {
    const { container } = renderList({ categories: [] });

    expect(within(container).getByText("还没有分类")).toBeInTheDocument();
  });
});
