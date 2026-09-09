import { fireEvent, waitFor } from "@testing-library/react";
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

export function dropSortable() {
  fireEvent.pointerUp(document, { pointerId: 1 });
}
