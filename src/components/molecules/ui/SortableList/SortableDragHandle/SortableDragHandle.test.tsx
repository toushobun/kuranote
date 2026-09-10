import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dragSortable,
  dropSortable,
  dropSortableWithTooltip,
  mockSortableRects,
  showSortableTooltip,
} from "test/sortable";
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
  it("鼠标悬停显示说明，拖动松手移开后不会因焦点重新显示", async () => {
    const { handle, onReorder } = renderHandle();
    expect(handle).toHaveAccessibleDescription(/按住排序按钮拖动/);
    await showSortableTooltip(handle);
    expect(screen.getByRole("tooltip")).toHaveTextContent("拖动餐饮调整排序");
    await dragSortable(handle, 20, 140);
    await dropSortableWithTooltip(handle);
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(["日用", "餐饮"]);
    await showSortableTooltip(handle);
  });

  it("触屏长按显示说明，拖动结束松手后提示消失", async () => {
    const { handle, onReorder } = renderHandle();
    fireEvent.touchStart(handle);
    expect(
      await screen.findByRole("tooltip", {}, { timeout: 1500 }),
    ).toHaveTextContent("拖动餐饮调整排序");
    await dragSortable(handle, 20, 140, "touch");
    fireEvent.touchEnd(handle);
    await dropSortable();
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull(), {
      timeout: 2500,
    });
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(["日用", "餐饮"]);
  });

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
