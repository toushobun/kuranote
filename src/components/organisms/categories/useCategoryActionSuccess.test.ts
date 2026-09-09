import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CategoryActionState } from "types/categories";

import { useCategoryActionSuccess } from "./useCategoryActionSuccess";

describe("useCategoryActionSuccess", () => {
  it("忽略历史成功与失败，只处理新返回的成功状态", () => {
    const onSuccess = vi.fn();
    const initialState: CategoryActionState = { success: "保存成功" };
    const { rerender } = renderHook(
      ({ state }: { state: CategoryActionState | undefined }) =>
        useCategoryActionSuccess(state, onSuccess),
      {
        initialProps: {
          state: initialState as CategoryActionState | undefined,
        },
      },
    );
    rerender({ state: initialState });
    rerender({ state: { error: "保存失败" } });
    rerender({ state: undefined });
    expect(onSuccess).not.toHaveBeenCalled();

    const success = { success: "保存成功" };
    rerender({ state: success });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    rerender({ state: success });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    rerender({ state: { success: "保存成功" } });
    expect(onSuccess).toHaveBeenCalledTimes(2);
  });
});
