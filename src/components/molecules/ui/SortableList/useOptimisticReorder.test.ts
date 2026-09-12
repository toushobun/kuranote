import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { orderItemsByIds, useOptimisticReorder } from "./useOptimisticReorder";

type Item = { id: string; name: string };
const items: Item[] = [
  { id: "a", name: "甲" },
  { id: "b", name: "乙" },
];
function setup() {
  let finish!: (state: { error?: string }) => void;
  const action = vi.fn(
    () =>
      new Promise<{ error?: string }>((resolve) => {
        finish = resolve;
      }),
  );
  const onError = vi.fn();
  const hook = renderHook(
    ({ source }) =>
      useOptimisticReorder({
        items: source,
        action,
        onError,
        fallbackMessage: "保存失败",
      }),
    { initialProps: { source: items } },
  );
  function submit(ids: string[]) {
    act(() =>
      hook.result.current.submitOrder(new FormData(), (source) =>
        orderItemsByIds(source, ids),
      ),
    );
  }
  return {
    ...hook,
    action,
    onError,
    submit,
    finish: (state: { error?: string }) => act(async () => finish(state)),
  };
}

describe("useOptimisticReorder", () => {
  it("并发刷新更新字段但保留待保存顺序，成功后接受后续服务端顺序", async () => {
    const hook = setup();
    hook.submit(["b", "a"]);
    hook.rerender({ source: [{ id: "a", name: "新展示名" }, items[1]] });
    expect(hook.result.current.orderedItems).toEqual([
      items[1],
      { id: "a", name: "新展示名" },
    ]);
    await hook.finish({});
    expect(hook.result.current.orderedItems.map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
    const refreshed = [...items];
    hook.rerender({ source: refreshed });
    expect(hook.result.current.orderedItems).toBe(refreshed);
  });
  it("失败回滚到刷新后的列表，保留新增项与最新字段", async () => {
    const hook = setup();
    hook.submit(["b", "a"]);
    const refreshed = [{ id: "c", name: "丙" }, ...items];
    hook.rerender({ source: refreshed });
    expect(hook.result.current.orderedItems).toEqual([
      items[1],
      items[0],
      refreshed[0],
    ]);
    await hook.finish({ error: "集合已变化" });
    expect(hook.result.current.orderedItems).toBe(refreshed);
    expect(hook.onError).toHaveBeenCalledWith({ error: "集合已变化" });
  });
  it("保存中归档的条目不会被旧排序重新带回", async () => {
    const hook = setup();
    hook.submit(["b", "a"]);
    const refreshed = [items[0], { id: "c", name: "丙" }];
    hook.rerender({ source: refreshed });
    expect(hook.result.current.orderedItems).toEqual(refreshed);
    await hook.finish({ error: "集合已变化" });
    expect(hook.result.current.orderedItems).toBe(refreshed);
  });
  it("连续排序失败时恢复上次成功顺序", async () => {
    const hook = setup();
    hook.submit(["b", "a"]);
    await hook.finish({});
    hook.submit(["a", "b"]);
    await hook.finish({ error: "失败" });
    expect(hook.result.current.orderedItems.map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
  });
  it("同一次渲染内重复提交只执行一次", async () => {
    const hook = setup();
    act(() => {
      const submit = hook.result.current.submitOrder;
      submit(new FormData(), (source) => orderItemsByIds(source, ["b", "a"]));
      submit(new FormData(), (source) => source);
    });
    expect(hook.action).toHaveBeenCalledOnce();
    await hook.finish({});
  });
});

describe("orderItemsByIds", () => {
  it("按指定顺序排列现有项，新增项保持相对顺序追加且不修改源数组", () => {
    const added = [
      { id: "c", name: "丙" },
      { id: "d", name: "丁" },
    ];
    const source = [added[0], ...items, added[1]];
    expect(orderItemsByIds(source, ["missing", "b", "a"])).toEqual([
      items[1],
      items[0],
      ...added,
    ]);
    expect(source).toEqual([added[0], ...items, added[1]]);
  });
});
