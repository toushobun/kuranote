import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dragSortable, dropSortable, mockSortableRects } from "test/sortable";
import { SortableItem } from "../SortableItem";
import { SortableList } from "../SortableList";
import { SortableDragHandle } from "./SortableDragHandle";

function renderHandle(disabled = false) {
  const onReorder = vi.fn();
  render(
    <SortableList
      disabled={disabled}
      items={["餐饮", "日用"]}
      onReorder={onReorder}
    >
      {["餐饮", "日用"].map((name) => (
        <SortableItem id={name} key={name}>
          {(handleProps) => (
            <SortableDragHandle name={name} handleProps={handleProps} />
          )}
        </SortableItem>
      ))}
    </SortableList>,
  );
  mockSortableRects({ 餐饮: 0, 日用: 100 });
  return {
    handle: screen.getByRole("button", { name: "调整餐饮排序" }),
    onReorder,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("SortableDragHandle", () => {
  it.each(["mouse", "touch"])(
    "使用 %s 指针拖动，松手后提交排序",
    async (pointerType) => {
      const { handle, onReorder } = renderHandle();
      expect(handle).toHaveAccessibleDescription(/按住排序按钮拖动/);
      await dragSortable(handle, 20, 140, pointerType);
      expect(onReorder).not.toHaveBeenCalled();
      await dropSortable();
      expect(onReorder).toHaveBeenCalledExactlyOnceWith(["日用", "餐饮"]);
    },
  );

  it("透传禁用状态并阻止排序", async () => {
    const { handle, onReorder } = renderHandle(true);
    expect(handle).toBeDisabled();
    expect(handle).toHaveAttribute("aria-disabled", "true");
    fireEvent.pointerDown(handle, { button: 0, isPrimary: true, pointerId: 1 });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 140 });
    await dropSortable();
    expect(onReorder).not.toHaveBeenCalled();
  });
});
