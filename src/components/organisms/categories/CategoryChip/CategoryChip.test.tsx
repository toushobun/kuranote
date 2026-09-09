import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultCategoryEmoji } from "config/categoryEmojis";
import type { Category } from "types/categories";

import { CategoryChip } from "./CategoryChip";

const category: Category = {
  created_at: "2026-01-01T00:00:00.000Z",
  icon_name: "🍜",
  id: "00000000-0000-4000-8000-000000000103",
  name: "🍜 外食",
  parent_id: "00000000-0000-4000-8000-000000000101",
  sort_order: 10,
  type: "expense",
};

describe("CategoryChip", () => {
  it("显示拖拽手柄时保持原有排序行为", async () => {
    const onEdit = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = render(
      <CategoryChip
        canManageCategories
        category={category}
        handleProps={{
          "aria-keyshortcuts": "ArrowUp ArrowDown",
          onKeyDown,
        }}
        onEdit={onEdit}
        showDragHandle
      />,
    );

    expect(screen.getByText("🍜")).toBeInTheDocument();
    expect(screen.getByText("外食")).toBeInTheDocument();
    expect(
      container.querySelector(`[data-category-chip-id="${category.id}"]`),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "编辑外食" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(category);

    const handle = screen.getByRole("button", { name: "调整外食排序" });
    expect(handle).toHaveAttribute("aria-keyshortcuts", "ArrowUp ArrowDown");
    fireEvent.mouseOver(handle);
    expect(
      await screen.findByText(
        "拖动外食调整排序，键盘可使用上下方向键按顺序移动",
      ),
    ).toBeInTheDocument();
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it("隐藏拖拽手柄时仍保留编辑操作", () => {
    render(
      <CategoryChip
        canManageCategories
        category={category}
        handleProps={{}}
        onEdit={vi.fn()}
        showDragHandle={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "编辑外食" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "调整外食排序" })).toBeNull();
  });

  it("只读时隐藏编辑与拖动操作", () => {
    render(
      <CategoryChip
        canManageCategories={false}
        category={category}
        handleProps={{}}
        onEdit={vi.fn()}
        showDragHandle
      />,
    );

    expect(screen.queryByRole("button", { name: "编辑外食" })).toBeNull();
    expect(screen.queryByRole("button", { name: "调整外食排序" })).toBeNull();
  });

  it("没有图标时使用默认分类图标", () => {
    render(
      <CategoryChip
        canManageCategories={false}
        category={{ ...category, icon_name: null, name: "其他" }}
        handleProps={{}}
        onEdit={vi.fn()}
        showDragHandle={false}
      />,
    );

    expect(screen.getByText(defaultCategoryEmoji)).toBeInTheDocument();
    expect(screen.getByText("其他")).toBeInTheDocument();
  });
});
