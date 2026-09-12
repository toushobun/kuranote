import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createMerchantRow } from "test/mocks/merchants";
import type { MerchantActionState } from "types/merchants";

import { useMerchantList } from "./useMerchantList";

const merchants = [
  createMerchantRow({ id: "a" }),
  createMerchantRow({ id: "b" }),
];

describe("useMerchantList", () => {
  it("旧请求失败不会覆盖刷新后的服务端列表", async () => {
    let finish!: (state: MerchantActionState) => void;
    const reorderAction = vi.fn(
      () =>
        new Promise<MerchantActionState>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, rerender } = renderHook(
      ({ source }) =>
        useMerchantList({ merchants: source, disabled: false, reorderAction }),
      { initialProps: { source: merchants } },
    );
    act(() => result.current.submitOrder(["b", "a"]));
    expect(result.current.orderedMerchants.map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
    act(() => result.current.submitOrder(["a", "b"]));
    expect(reorderAction).toHaveBeenCalledOnce();
    const refreshed = [createMerchantRow({ id: "c" }), ...merchants];
    rerender({ source: refreshed });
    await act(async () => finish({ error: "失败" }));
    await waitFor(() => expect(result.current.disabled).toBe(false));
    expect(result.current.orderedMerchants).toBe(refreshed);
  });
});
