import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CategoryActionState,
  CategoryStateAction,
} from "types/categories";

import { CategoriesActionStateTemplate } from "./CategoriesActionState";

const rootId = "00000000-0000-4000-8000-000000000101";
const secondRootId = "00000000-0000-4000-8000-000000000102";

const categories = [
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🍽️",
    id: rootId,
    name: "餐饮",
    parent_id: null,
    sort_order: 10,
    type: "expense" as const,
  },
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🛒",
    id: secondRootId,
    name: "日常购物",
    parent_id: null,
    sort_order: 20,
    type: "expense" as const,
  },
];

const successAction: CategoryStateAction = async () => ({});

function renderTemplate({
  archiveCategoryAction = successAction,
  createCategoryAction = successAction,
  reorderCategoryAction = async () => ({}),
  updateCategoryAction = successAction,
}: {
  archiveCategoryAction?: CategoryStateAction;
  createCategoryAction?: CategoryStateAction;
  reorderCategoryAction?: (formData: FormData) => Promise<CategoryActionState>;
  updateCategoryAction?: CategoryStateAction;
} = {}) {
  return render(
    <CategoriesActionStateTemplate
      archiveCategoryAction={archiveCategoryAction}
      canManageCategories
      categories={categories}
      createCategoryAction={createCategoryAction}
      ledgerName="家庭账本"
      parentOptions={categories.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
      }))}
      reorderCategoryAction={reorderCategoryAction}
      updateCategoryAction={updateCategoryAction}
    />,
  );
}

beforeEach(() => {
  window.history.replaceState(null, "", "/categories");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CategoriesActionStateTemplate", () => {
  it("新增失败时显示弹框、保留输入且 URL 保持干净", async () => {
    const createCategoryAction = vi.fn(
      async (
        _previousState: CategoryActionState,
        _formData: FormData,
      ): Promise<CategoryActionState> => {
        void _previousState;
        void _formData;
        return {
          error: "分类新增失败。请确认分类名称是否重复，或稍后重试。",
          errorKey: "create-error-1",
        };
      },
    );
    renderTemplate({ createCategoryAction });

    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    const dialog = screen.getByRole("dialog", { name: "新增分类" });
    const nameInput = within(dialog).getByRole("textbox", { name: "分类名称" });
    fireEvent.change(nameInput, { target: { value: "晚餐" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "新增分类" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("分类新增失败");
    expect(alert).toHaveTextContent(
      "分类新增失败。请确认分类名称是否重复，或稍后重试。",
    );
    expect(nameInput).toHaveValue("晚餐");
    expect(window.location.pathname).toBe("/categories");
    expect(window.location.search).toBe("");
  });

  it("编辑失败时保持编辑弹窗和用户输入", async () => {
    const updateCategoryAction = vi.fn(
      async (
        _previousState: CategoryActionState,
        _formData: FormData,
      ): Promise<CategoryActionState> => {
        void _previousState;
        void _formData;
        return {
          error: "分类更新失败。请确认分类名称是否重复，或稍后重试。",
          errorKey: "update-error-1",
        };
      },
    );
    renderTemplate({ updateCategoryAction });

    fireEvent.click(screen.getByRole("button", { name: "编辑餐饮" }));
    const dialog = screen.getByRole("dialog", { name: "编辑分类" });
    const nameInput = within(dialog).getByRole("textbox", { name: "分类名称" });
    fireEvent.change(nameInput, { target: { value: "外食" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "分类更新失败。请确认分类名称是否重复，或稍后重试。",
    );
    expect(
      screen.getByRole("dialog", { name: "编辑分类" }),
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue("外食");
  });

  it("排序失败时回滚并通过统一弹框反馈", async () => {
    const reorderCategoryAction = vi.fn(async () => ({
      error: "分类列表已发生变化，请刷新页面后重试。",
      errorKey: "reorder-error-1",
    }));
    renderTemplate({ reorderCategoryAction });
    const handle = screen.getByRole("button", { name: "调整餐饮排序" });

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("分类排序保存失败");
    expect(alert).toHaveTextContent("分类列表已发生变化，请刷新页面后重试。");
    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledOnce());
    expect(screen.getByText("餐饮")).toBeInTheDocument();
  });
});
