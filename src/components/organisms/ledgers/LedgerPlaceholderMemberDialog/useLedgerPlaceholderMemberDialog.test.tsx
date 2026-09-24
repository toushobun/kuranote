import { act, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import type { LedgerPlaceholderMemberActionState } from "types/ledgers";

import { useLedgerPlaceholderMemberDialog } from "./useLedgerPlaceholderMemberDialog";

function wrapper({ children }: { children: ReactNode }) {
  return <ConfirmDialogTestProviders>{children}</ConfirmDialogTestProviders>;
}

const placeholder = { displayName: "奶奶", id: "placeholder-1" };

describe("useLedgerPlaceholderMemberDialog", () => {
  it("取消删除确认时不调用删除 Action", async () => {
    const remove = vi.fn(
      async (state: LedgerPlaceholderMemberActionState) => state,
    );
    const keep = vi.fn(
      async (state: LedgerPlaceholderMemberActionState) => state,
    );
    const { result } = renderHook(
      () =>
        useLedgerPlaceholderMemberDialog({
          actions: { delete: remove, rename: keep },
          ledgerId: "ledger-1",
          onClose: vi.fn(),
        }),
      { wrapper },
    );

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.requestDelete(placeholder);
    });
    act(() => {
      screen.getByRole("button", { name: "取消" }).click();
    });
    await act(async () => {
      await pending;
    });

    expect(remove).not.toHaveBeenCalled();
    expect(result.current.feedback).toBeNull();
  });

  it("同一个成功结果只处理一次，关闭反馈后不会重复出现", async () => {
    const onClose = vi.fn();
    const rename = vi.fn(async () => ({
      operation: "rename" as const,
      successKey: "success-1",
    }));
    const keep = vi.fn(
      async (state: LedgerPlaceholderMemberActionState) => state,
    );
    const { result, rerender } = renderHook(
      () =>
        useLedgerPlaceholderMemberDialog({
          actions: { delete: keep, rename },
          ledgerId: "ledger-1",
          onClose,
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.renameAction(new FormData());
    });
    await waitFor(() =>
      expect(result.current.feedback).toEqual({
        kind: "success",
        title: "名字已更新",
      }),
    );
    // 改名成功后保持弹框。
    expect(onClose).not.toHaveBeenCalled();

    act(() => result.current.closeFeedback());
    rerender();
    expect(result.current.feedback).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("没有写 Action（只读）时仍可安全调用", () => {
    const { result } = renderHook(
      () =>
        useLedgerPlaceholderMemberDialog({
          actions: null,
          ledgerId: "ledger-1",
          onClose: vi.fn(),
        }),
      { wrapper },
    );

    expect(result.current.feedback).toBeNull();
    expect(result.current.renaming).toBe(false);
    expect(result.current.deleting).toBe(false);
  });
});
