import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  rectSortingStrategy,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState, type ComponentProps } from "react";

import {
  cancelSortable,
  dragSortable,
  dropSortable,
  mockSortableRects,
} from "test/sortable";
import { SortableList } from "./SortableList";
import { SortableItem } from "./SortableItem";

const { sortableContextStrategySpy } = vi.hoisted(() => ({
  sortableContextStrategySpy: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>();
  const { createElement } = await import("react");

  return {
    ...actual,
    SortableContext: (props: ComponentProps<typeof actual.SortableContext>) => {
      sortableContextStrategySpy(props.strategy);
      return createElement(actual.SortableContext, props);
    },
  };
});

function Example({
  onReorder,
  disabled = false,
  strategy,
}: {
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
  strategy?: SortingStrategy;
}) {
  const [items, setItems] = useState(["a", "b", "c"]);
  return (
    <SortableList
      disabled={disabled}
      items={items}
      onReorder={(ids) => {
        setItems(ids);
        onReorder(ids);
      }}
      strategy={strategy}
    >
      {items.map((id) => (
        <SortableItem id={id} key={id}>
          {(handle) => <button {...handle}>{id}</button>}
        </SortableItem>
      ))}
    </SortableList>
  );
}

afterEach(() => {
  sortableContextStrategySpy.mockClear();
  vi.restoreAllMocks();
});

describe("SortableList", () => {
  it("未指定排序策略时保持纵向列表策略", () => {
    render(<Example onReorder={vi.fn()} />);

    expect(sortableContextStrategySpy).toHaveBeenLastCalledWith(
      verticalListSortingStrategy,
    );
  });

  it("传入矩形排序策略时交给 SortableContext 使用", () => {
    render(<Example onReorder={vi.fn()} strategy={rectSortingStrategy} />);

    expect(sortableContextStrategySpy).toHaveBeenLastCalledWith(
      rectSortingStrategy,
    );
  });

  it("拖动时跟随指针并挤开其他项，仅在松手后提交最终顺序", async () => {
    const onReorder = vi.fn();
    const { container } = render(<Example onReorder={onReorder} />);
    mockSortableRects({ a: 0, b: 100, c: 200 });
    await dragSortable(screen.getByRole("button", { name: "a" }), 20, 240);
    expect(
      container.querySelector('[data-sortable-id="a"]')?.getAttribute("style"),
    ).toContain("scale(1.01)");
    expect(
      container.querySelector('[data-sortable-id="b"]')?.getAttribute("style"),
    ).toContain("-100px");
    expect(onReorder).not.toHaveBeenCalled();
    await dropSortable();
    await waitFor(() =>
      expect(onReorder).toHaveBeenCalledExactlyOnceWith(["b", "c", "a"]),
    );
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["b", "c", "a"]);
  });

  it.each([20, 400])("原地松手或移出列表不提交排序（%s）", async (targetY) => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} />);
    mockSortableRects({ a: 0, b: 100, c: 200 });
    await dragSortable(screen.getByRole("button", { name: "a" }), 20, targetY);
    await dropSortable();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it.each(["pointerup", "pointercancel", "Escape"] as const)(
    "结束拖动（%s）并卸载后不拦截新组件的点击",
    async (ending) => {
      const originalRect = HTMLElement.prototype.getBoundingClientRect;
      const onReorder = vi.fn();
      const { unmount } = render(<Example onReorder={onReorder} />);
      mockSortableRects({ a: 0, b: 100, c: 200 });
      await dragSortable(screen.getByRole("button", { name: "a" }), 20, 240);

      if (ending === "pointerup") await dropSortable();
      else await cancelSortable(ending);
      if (ending === "pointerup")
        expect(onReorder).toHaveBeenCalledExactlyOnceWith(["b", "c", "a"]);
      else expect(onReorder).not.toHaveBeenCalled();
      unmount();
      vi.restoreAllMocks();
      expect(HTMLElement.prototype.getBoundingClientRect).toBe(originalRect);

      const onClick = vi.fn();
      render(<button onClick={onClick}>新操作</button>);
      fireEvent.click(screen.getByRole("button", { name: "新操作" }));
      expect(onClick).toHaveBeenCalledOnce();
    },
  );

  it("方向键和空格不会启动或提交排序，也不声明快捷键", () => {
    const onReorder = vi.fn();
    const { container } = render(<Example onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "a" });
    handle.focus();
    for (const key of ["ArrowUp", "ArrowDown", " "]) {
      fireEvent.keyDown(handle, { key, code: key === " " ? "Space" : key });
      fireEvent.keyUp(handle, { key, code: key === " " ? "Space" : key });
    }
    expect(onReorder).not.toHaveBeenCalled();
    expect(container.querySelector("[data-dragging]")).toBeNull();
    expect(handle).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("禁用时不允许指针调整顺序", async () => {
    const onReorder = vi.fn();
    render(<Example disabled onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "a" });
    expect(handle).toBeDisabled();
    fireEvent.pointerDown(handle, { button: 0, isPrimary: true, pointerId: 1 });
    fireEvent.pointerMove(document, { clientY: 140, pointerId: 1 });
    await dropSortable();
    expect(onReorder).not.toHaveBeenCalled();
  });
});
