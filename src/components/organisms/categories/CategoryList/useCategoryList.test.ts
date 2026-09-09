import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CategoryReorderAction, CategoryTreeItem } from "types/categories";

import { useCategoryList } from "./useCategoryList";

const categories: CategoryTreeItem[] = [
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🍽️",
    id: "00000000-0000-4000-8000-000000000101",
    name: "🍽️ 餐饮",
    parent_id: null,
    sort_order: 10,
    type: "expense",
  },
  {
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🚃",
    id: "00000000-0000-4000-8000-000000000102",
    name: "🚃 出行",
    parent_id: null,
    sort_order: 20,
    type: "expense",
  },
];

function renderCategoryListHook(
  reorderCategoryAction: CategoryReorderAction,
  initialCategories = categories,
  onReorderError = vi.fn(),
) {
  return {
    ...renderHook(
      ({ categoryItems }: { categoryItems: CategoryTreeItem[] }) =>
        useCategoryList({
          categories: categoryItems,
          onReorderError,
          reorderCategoryAction,
        }),
      { initialProps: { categoryItems: initialCategories } },
    ),
    onReorderError,
  };
}

describe("useCategoryList", () => {
  it("管理模式默认关闭并可切换开关", () => {
    const { result } = renderCategoryListHook(vi.fn(async () => ({})));

    expect(result.current.isManaging).toBe(false);

    act(() => result.current.toggleManaging());
    expect(result.current.isManaging).toBe(true);

    act(() => result.current.toggleManaging());
    expect(result.current.isManaging).toBe(false);
  });

  it("编辑分类时使用去除 Emoji 前缀后的名称", () => {
    const { result } = renderCategoryListHook(vi.fn(async () => ({})));

    act(() => result.current.openEditor(categories[0]));

    expect(result.current.editingName).toBe("餐饮");
    expect(result.current.editingIconName).toBe("🍽️");
  });

  it("移动分类时先更新当前列表并提交完整同级顺序", async () => {
    const reorderCategoryAction = vi.fn(async (formData: FormData) => {
      void formData;
      return {};
    });
    const { result } = renderCategoryListHook(reorderCategoryAction);

    act(() =>
      result.current.submitCategoryOrder(
        [categories[1].id, categories[0].id],
        null,
        "expense",
      ),
    );

    expect(
      result.current.visibleCategories.map((category) => category.id),
    ).toEqual([categories[1].id, categories[0].id]);
    await waitFor(() => expect(reorderCategoryAction).toHaveBeenCalledTimes(1));
    const formData = reorderCategoryAction.mock.calls.at(0)?.[0];
    expect(formData).toBeInstanceOf(FormData);
    if (!formData) throw new Error("排序表单未提交");
    expect(JSON.parse(String(formData.get("categoryIds")))).toEqual([
      categories[1].id,
      categories[0].id,
    ]);
    expect(formData.get("parentId")).toBe("");
    expect(formData.get("type")).toBe("expense");
  });

  it("排序保存失败时恢复原顺序并上抛 Service message", async () => {
    const reorderCategoryAction = vi.fn(async () => ({
      error: "分类排序保存失败，请稍后重试。",
      errorKey: "reorder-error-1",
    }));
    const { onReorderError, result } = renderCategoryListHook(
      reorderCategoryAction,
    );

    act(() =>
      result.current.submitCategoryOrder(
        [categories[1].id, categories[0].id],
        null,
        "expense",
      ),
    );

    await waitFor(() =>
      expect(onReorderError).toHaveBeenCalledWith({
        error: "分类排序保存失败，请稍后重试。",
        errorKey: "reorder-error-1",
      }),
    );
    expect(
      result.current.visibleCategories.map((category) => category.id),
    ).toEqual([categories[0].id, categories[1].id]);
  });

  it("排序集合过期时恢复原顺序并上抛刷新提示", async () => {
    const reorderCategoryAction = vi.fn(async () => ({
      error: "分类列表已发生变化，请刷新页面后重试。",
      errorKey: "reorder-error-2",
    }));
    const { onReorderError, result } = renderCategoryListHook(
      reorderCategoryAction,
    );

    act(() =>
      result.current.submitCategoryOrder(
        [categories[1].id, categories[0].id],
        null,
        "expense",
      ),
    );

    await waitFor(() =>
      expect(onReorderError).toHaveBeenCalledWith({
        error: "分类列表已发生变化，请刷新页面后重试。",
        errorKey: "reorder-error-2",
      }),
    );
    expect(
      result.current.visibleCategories.map((category) => category.id),
    ).toEqual([categories[0].id, categories[1].id]);
  });

  it("排序 Action 抛出异常时恢复原顺序并上抛通用错误", async () => {
    const reorderCategoryAction = vi.fn(async () => {
      throw new Error("network error");
    });
    const { onReorderError, result } = renderCategoryListHook(
      reorderCategoryAction,
    );

    act(() =>
      result.current.submitCategoryOrder(
        [categories[1].id, categories[0].id],
        null,
        "expense",
      ),
    );

    await waitFor(() =>
      expect(onReorderError).toHaveBeenCalledWith({
        error: "分类排序保存失败，请稍后重试。",
        errorKey: expect.any(String),
      }),
    );
    expect(
      result.current.visibleCategories.map((category) => category.id),
    ).toEqual([categories[0].id, categories[1].id]);
  });

  it("分类 props 更新时同步列表并保留当前交互状态", () => {
    const incomeCategory: CategoryTreeItem = {
      children: [],
      created_at: "2026-01-01T00:00:00.000Z",
      icon_name: "💰",
      id: "00000000-0000-4000-8000-000000000103",
      name: "💰 工资",
      parent_id: null,
      sort_order: 10,
      type: "income",
    };
    const reorderCategoryAction = vi.fn(async () => ({}));
    const { result, rerender } = renderCategoryListHook(reorderCategoryAction);

    act(() => {
      result.current.setSelectedType("income");
      result.current.toggleCategory(categories[1].id);
      result.current.toggleManaging();
    });
    rerender({ categoryItems: [...categories, incomeCategory] });

    expect(result.current.selectedType).toBe("income");
    expect(result.current.expandedIds).toEqual(
      new Set([categories[0].id, categories[1].id]),
    );
    expect(result.current.isManaging).toBe(true);
    expect(
      result.current.visibleCategories.map((category) => category.id),
    ).toEqual([incomeCategory.id]);
  });

  it("提交期间忽略再次排序", async () => {
    let finish: (() => void) | undefined;
    const action = vi.fn<CategoryReorderAction>(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({});
        }),
    );
    const { result } = renderCategoryListHook(action);
    act(() =>
      result.current.submitCategoryOrder(
        [categories[1].id, categories[0].id],
        null,
        "expense",
      ),
    );
    await waitFor(() => expect(result.current.isPending).toBe(true));
    act(() =>
      result.current.submitCategoryOrder(
        [categories[0].id, categories[1].id],
        null,
        "expense",
      ),
    );
    expect(action).toHaveBeenCalledOnce();
    await act(async () => finish?.());
  });
});
