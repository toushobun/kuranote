import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { setupGuardHistoryMock } from "test/mockGuardHistory";
import { useUnsavedChangesForm } from "./useUnsavedChangesForm";

setupGuardHistoryMock();
vi.mock("next/navigation", () => import("test/mocks/navigation"));

describe("useUnsavedChangesForm", () => {
  it("提交失败后恢复同一表单的保护，复用既有哨兵", async () => {
    const action = vi.fn(async () => ({ error: "失败" }));
    const { result } = renderHook(() => useUnsavedChangesForm("form", action), {
      wrapper: ConfirmDialogTestProviders,
    });
    act(() => result.current.onDirtyChange(true));
    await waitFor(() =>
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "sentinel",
      ),
    );
    await act(async () => {
      await result.current.action({ error: "" }, new FormData());
    });
    expect(action).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "sentinel",
      ),
    );
    expect(window.history.pushState).toHaveBeenCalledOnce();
  });
  it("动作返回后 Next 在提交阶段抹掉标记，页面重新渲染也会恢复守卫", async () => {
    const { result, rerender } = renderHook(
      () => useUnsavedChangesForm("form", async () => ({})),
      { wrapper: ConfirmDialogTestProviders },
    );
    act(() => result.current.onDirtyChange(true));
    await waitFor(() =>
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "sentinel",
      ),
    );
    const state = { ...window.history.state };
    delete state.kuranoteUnsavedChanges;
    window.history.replaceState(state, "");
    rerender();
    await waitFor(() =>
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "sentinel",
      ),
    );
    expect(window.history.pushState).toHaveBeenCalledOnce();
  });
});
