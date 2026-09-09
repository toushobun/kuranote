import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  rectSortingStrategy,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState, type ComponentProps } from "react";

import { dragSortable, dropSortable, mockSortableRects } from "test/sortable";
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
    dropSortable();
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
    dropSortable();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("方向键保留焦点并忽略首尾越界", () => {
    const onReorder = vi.fn();
    render(<Example onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "a" });
    handle.focus();
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(onReorder).not.toHaveBeenCalled();
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(["b", "a", "c"]);
    expect(handle).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: "c" }), {
      key: "ArrowDown",
    });
    expect(onReorder).toHaveBeenCalledOnce();
  });

  it("禁用时不允许指针或键盘调整顺序", () => {
    const onReorder = vi.fn();
    render(<Example disabled onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "a" });
    expect(handle).toBeDisabled();
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    fireEvent.pointerDown(handle, { button: 0, isPrimary: true, pointerId: 1 });
    fireEvent.pointerMove(document, { clientY: 140, pointerId: 1 });
    dropSortable();
    expect(onReorder).not.toHaveBeenCalled();
  });
});
