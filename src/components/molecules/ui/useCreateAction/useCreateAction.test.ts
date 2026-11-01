import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCreateAction } from "./useCreateAction";
import { createdAccount } from "test/mocks/receiptCreation";
import type { AccountActionState } from "types/accounts";

describe("useCreateAction", () => {
  it.each([true, false])(
    "只有弹层指定返回模式并消费成功结果：%s",
    async (dialog) => {
      const action = vi.fn(
        async (): Promise<AccountActionState> => ({ createdAccount }),
      );
      const onCreated = vi.fn();
      const { result } = renderHook(() =>
        useCreateAction(
          action,
          {},
          (state) => state.createdAccount,
          dialog ? onCreated : undefined,
        ),
      );
      const data = new FormData();
      await act(async () => {
        startTransition(() => result.current[1](data));
      });
      expect(data.get("presentation")).toBe(dialog ? "dialog" : null);
      expect(onCreated).toHaveBeenCalledTimes(dialog ? 1 : 0);
    },
  );
  it("失败反馈保留且不触发选择", async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() =>
      useCreateAction(
        async (): Promise<AccountActionState> => ({ error: "新增失败" }),
        {},
        (state) => state.createdAccount,
        onCreated,
      ),
    );
    await act(async () => {
      startTransition(() => result.current[1](new FormData()));
    });
    expect(result.current[0].error).toBe("新增失败");
    expect(onCreated).not.toHaveBeenCalled();
  });
});
