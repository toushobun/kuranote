import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dragSortable, dropSortable, mockSortableRects } from "test/sortable";
import { designTokens, theme } from "theme/theme";

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
      onReorderError={vi.fn()}
      reorderCategoryAction={vi.fn(async () => ({}))}
      updateCategoryAction={vi.fn(async () => {})}
      {...overrides}
    />,
  );
}

function renderListWithTheme(
  overrides: Partial<Parameters<typeof CategoryList>[0]> = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <CategoryList
        archiveCategoryAction={vi.fn(async () => {})}
        categories={categories}
        onReorderError={vi.fn()}
        reorderCategoryAction={vi.fn(async () => ({}))}
        updateCategoryAction={vi.fn(async () => {})}
        {...overrides}
      />
    </ThemeProvider>,
  );
}

function enterManagingMode() {
  fireEvent.click(screen.getByRole("button", { name: "管理排序" }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CategoryList", () => {
  it("大分类图标使用方圆角而不是被裸数字放大成整圆", () => {
    const { container } = renderListWithTheme();

    const icons = within(container).getAllByTestId("category-list-icon");
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(getComputedStyle(icon).borderRadius).toBe(
        `${designTokens.radius.sm}px`,
      );
    }
  });

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

  it("移除分类统计文字并把展开的小分类渲染为可换行胶囊", () => {
    const { container } = renderListWithTheme();

    expect(screen.queryByText("2 个大分类 · 1 个小分类")).toBeNull();
    expect(
      container.querySelector(`[data-category-chip-id="${expenseChildId}"]`),
    ).not.toBeNull();
    expect(
      container.querySelector(`[data-category-row-id="${expenseChildId}"]`),
    ).toBeNull();

    const chipList = screen.getByTestId("category-chip-list");
    expect(getComputedStyle(chipList).display).toBe("flex");
    expect(getComputedStyle(chipList).flexWrap).toBe("wrap");

    const sortableItem = container.querySelector(
      `[data-sortable-id="${expenseChildId}"]`,
    );
    expect(sortableItem).not.toBeNull();
    expect(getComputedStyle(sortableItem!).display).toBe("inline-flex");
    expect(getComputedStyle(sortableItem!).width).toBe("auto");
  });

  it("展开空的大分类时保留没有小分类提示", () => {
    renderList();

    expect(
      screen.queryByText("还没有小分类。记账时只能选择小分类。"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "展开日常购物" }));
    expect(
      screen.getByText("还没有小分类。记账时只能选择小分类。"),
    ).toBeInTheDocument();
  });

  it("切换收入分类后显示收入列表", () => {
    renderList();

    fireEvent.click(screen.getByRole("tab", { name: "收入分类" }));

    expect(screen.getByText("工资")).toBeInTheDocument();
    expect(screen.queryByText("餐饮")).toBeNull();
  });

  it("点击管理排序后显示拖拽手柄并在完成后隐藏，编辑按钮保持可见", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: "编辑餐饮" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "编辑外食" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "调整餐饮排序" })).toBeNull();
    expect(screen.queryByRole("button", { name: "调整外食排序" })).toBeNull();

    enterManagingMode();

    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "调整餐饮排序" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "调整外食排序" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "完成" }));

    expect(
      screen.getByRole("button", { name: "管理排序" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "调整餐饮排序" })).toBeNull();
    expect(screen.queryByRole("button", { name: "调整外食排序" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "编辑餐饮" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "编辑外食" }),
    ).toBeInTheDocument();
  });

  it("只读用户看不到管理排序按钮", () => {
    renderList({ canManageCategories: false });

    expect(screen.queryByRole("button", { name: "管理排序" })).toBeNull();
    expect(screen.queryByRole("button", { name: "完成" })).toBeNull();
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

  it("归档操作单独位于等宽取消和保存按钮上方并提交分类 ID", async () => {
    const archiveCategoryAction = vi.fn(async (data: FormData) => {
      void data;
    });
    renderListWithTheme({ archiveCategoryAction });
    expect(screen.getByText("已归档分类")).toBeInTheDocument();
    expect(
      screen.getByText("归档的分类不会在记账选择中显示。"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "编辑餐饮" }));
    const dialog = within(screen.getByRole("dialog"));
    const archive = dialog.getByRole("button", { name: "归档该分类" });
    const cancel = dialog.getByRole("button", { name: "取消" });
    const save = dialog.getByRole("button", { name: "保存" });
    expect(cancel.parentElement).toBe(save.parentElement);
    expect(getComputedStyle(cancel.parentElement!).flexDirection).toBe("row");
    expect(getComputedStyle(cancel).width).toBe("100%");
    expect(getComputedStyle(save).width).toBe("100%");
    expect(archive.closest("form")?.nextElementSibling).toBe(
      cancel.parentElement,
    );
    expect(archive).toHaveClass("MuiButton-colorError");
    expect(archive.querySelector("svg")).not.toBeNull();
    expect(save).toHaveAttribute("form", "category-edit-form");
    fireEvent.click(archive);
    await waitFor(() => expect(archiveCategoryAction).toHaveBeenCalledOnce());
    expect(archiveCategoryAction.mock.calls[0][0].get("categoryId")).toBe(
      expenseRootId,
    );
  });

  it("拖动大分类时提交同级分类顺序", async () => {
    const reorderCategoryAction = vi.fn(async (formData: FormData) => {
      void formData;
      return {};
    });
    const { container } = renderList({ reorderCategoryAction });
    enterManagingMode();
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });
    mockSortableRects({ [expenseRootId]: 0, [expenseSecondRootId]: 100 });
    await dragSortable(handle, 20, 140);
    expect(screen.queryByText("外食")).not.toBeInTheDocument();
    expect(reorderCategoryAction).not.toHaveBeenCalled();
    expect(
      container
        .querySelector(`[data-sortable-id="${expenseSecondRootId}"]`)
        ?.getAttribute("style"),
    ).toContain("translate3d");
    dropSortable();
    expect(screen.getByText("外食")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "展开日常购物" }),
    ).toBeInTheDocument();

    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledOnce());
    const formData = reorderCategoryAction.mock.calls[0]?.[0];

    expect(formData?.get("categoryIds")).toBe(
      JSON.stringify([expenseSecondRootId, expenseRootId]),
    );
    expect(formData?.get("parentId")).toBe("");
    expect(formData?.get("type")).toBe("expense");
  });

  it.each(["Escape", "pointercancel"])(
    "取消大分类拖动（%s）后恢复展开状态且不提交",
    async (cancel) => {
      const reorderCategoryAction = vi.fn(async () => ({}));
      renderList({ reorderCategoryAction });
      enterManagingMode();
      mockSortableRects({ [expenseRootId]: 0, [expenseSecondRootId]: 100 });
      await dragSortable(
        screen.getByRole("button", { name: "调整餐饮排序" }),
        20,
        140,
      );
      expect(screen.queryByText("外食")).not.toBeInTheDocument();
      if (cancel === "Escape")
        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      else fireEvent.pointerCancel(document, { pointerId: 1 });
      expect(screen.getByText("外食")).toBeInTheDocument();
      expect(reorderCategoryAction).not.toHaveBeenCalled();
    },
  );

  it("触屏拖动小分类只提交同一大分类下的新顺序", async () => {
    const reorderCategoryAction = vi.fn(async (data: FormData) => {
      void data;
      return {};
    });
    const secondChildId = "child-2";
    renderList({
      reorderCategoryAction,
      categories: [
        {
          ...categories[0],
          children: [
            ...categories[0].children,
            { ...categories[0].children[0], id: secondChildId, name: "早餐" },
          ],
        },
        ...categories.slice(1),
      ],
    });
    enterManagingMode();
    mockSortableRects({
      [expenseRootId]: 0,
      [expenseChildId]: 100,
      [secondChildId]: 200,
      [expenseSecondRootId]: 300,
    });
    await dragSortable(
      screen.getByRole("button", { name: "调整外食排序" }),
      120,
      240,
      "touch",
    );
    expect(screen.getByText("早餐")).toBeInTheDocument();
    expect(reorderCategoryAction).not.toHaveBeenCalled();
    dropSortable();
    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledOnce());
    const data = reorderCategoryAction.mock.calls[0][0];
    expect(data.get("categoryIds")).toBe(
      JSON.stringify([secondChildId, expenseChildId]),
    );
    expect(data.get("parentId")).toBe(expenseRootId);
    expect(data.get("type")).toBe("expense");
  });

  it("小分类拖到其他大分类时不提交且不触发父级收起", async () => {
    const reorderCategoryAction = vi.fn(async () => ({}));
    renderList({ reorderCategoryAction });
    enterManagingMode();
    mockSortableRects({
      [expenseRootId]: 0,
      [expenseChildId]: 100,
      [expenseSecondRootId]: 300,
    });
    await dragSortable(
      screen.getByRole("button", { name: "调整外食排序" }),
      120,
      340,
    );
    expect(screen.getByText("外食")).toBeInTheDocument();
    dropSortable();
    expect(reorderCategoryAction).not.toHaveBeenCalled();
  });

  it("非主键按下排序按钮时不启动拖动", () => {
    const reorderCategoryAction = vi.fn(async () => ({}));
    renderList({ reorderCategoryAction });
    enterManagingMode();
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });

    fireEvent.pointerDown(handle, { button: 2, pointerId: 1 });
    fireEvent.pointerUp(handle, { button: 2, pointerId: 1 });

    expect(reorderCategoryAction).not.toHaveBeenCalled();
  });

  it("使用方向键调整顺序时不重置展开状态或焦点", async () => {
    const reorderCategoryAction = vi.fn(async (formData: FormData) => {
      void formData;
      return {};
    });
    renderList({ reorderCategoryAction });
    enterManagingMode();
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });
    handle.focus();

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledOnce());
    expect(screen.getByText("外食")).toBeInTheDocument();
    expect(handle).toHaveFocus();
    expect(handle).toHaveAttribute("aria-keyshortcuts", "ArrowUp ArrowDown");
  });

  it("排序失败时恢复页面状态并上抛统一错误状态", async () => {
    const onReorderError = vi.fn();
    const reorderCategoryAction = vi.fn(async () => ({
      error: "分类排序保存失败，请稍后重试。",
      errorKey: "reorder-error-1",
    }));
    renderList({ onReorderError, reorderCategoryAction });
    enterManagingMode();
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    await waitFor(() =>
      expect(onReorderError).toHaveBeenCalledWith({
        error: "分类排序保存失败，请稍后重试。",
        errorKey: "reorder-error-1",
      }),
    );
    expect(screen.getByText("外食")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("没有分类时显示空状态", () => {
    const { container } = renderList({ categories: [] });

    expect(within(container).getByText("还没有分类")).toBeInTheDocument();
  });
});
