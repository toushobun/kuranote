import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

// jsdom 没有布局；保留真实 dnd-kit 传感器，只提供列表项的测量值。
export function mockSortableRects(positions: Record<string, number>) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const top = positions[this.dataset.sortableId ?? ""] ?? 0;
      return {
        x: 0,
        y: top,
        left: 0,
        right: 320,
        top,
        bottom: top + 80,
        width: 320,
        height: 80,
        toJSON: () => ({}),
      };
    },
  );
}

export async function dragSortable(
  handle: HTMLElement,
  fromY: number,
  toY: number,
  pointerType = "mouse",
) {
  fireEvent.pointerDown(handle, {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType,
    clientX: 280,
    clientY: fromY,
  });
  fireEvent.pointerMove(document, {
    pointerId: 1,
    pointerType,
    clientX: 280,
    clientY: fromY + 6,
  });
  await waitFor(() =>
    expect(handle.closest("[data-sortable-id]")).toHaveAttribute(
      "data-dragging",
      "true",
    ),
  );
  fireEvent.pointerMove(document, {
    pointerId: 1,
    pointerType,
    clientX: 280,
    clientY: toY,
  });
}

async function finishSortable(dispatch: () => void) {
  await act(async () => {
    dispatch();
    // dnd-kit 的 detach 在 50ms 后才移除 document 上拦截 click 的监听器。
    // 等待完整清理，避免同一用例的后续点击或下一个用例被上一轮拖动拦截。
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

export function dropSortable() {
  return finishSortable(() => fireEvent.pointerUp(document, { pointerId: 1 }));
}

export function cancelSortable(cancel: "Escape" | "pointercancel") {
  return finishSortable(() => {
    if (cancel === "Escape")
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    else fireEvent.pointerCancel(document, { pointerId: 1 });
  });
}

export async function showSortableTooltip(handle: HTMLElement) {
  fireEvent.mouseOver(handle);
  expect(await screen.findByRole("tooltip")).toBeVisible();
}

export async function dropSortableWithTooltip(handle: HTMLElement) {
  fireEvent.mouseLeave(handle);
  await dropSortable();
  await waitFor(() => expect(handle).toBeEnabled());
  // jsdom 不可靠地实现 :focus-visible，仅补足浏览器的焦点可见性判断。
  const matches = handle.matches.bind(handle);
  vi.spyOn(handle, "matches").mockImplementation(
    (selector) => selector === ":focus-visible" || matches(selector),
  );
  // 指针已离开；覆盖松手后焦点回到手柄的路径，不假设 dnd-kit 会替指针恢复焦点。
  await act(async () => {
    handle.focus();
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  expect(handle).toHaveFocus();
  await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
}
