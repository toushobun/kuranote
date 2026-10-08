import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ledgerSetupWriteErrorMessages } from "internal/ledger";
import type { LedgerSetupAbandonAction } from "types/ledgers";
import { useAbandonLedgerSetup } from "./useAbandonLedgerSetup";
const confirm = vi.hoisted(() => vi.fn());
vi.mock("providers/ConfirmDialogProvider/ConfirmDialogProvider", () => ({
  useConfirmDialog: () => confirm,
}));
function setup(action: LedgerSetupAbandonAction = vi.fn(async () => ({}))) {
  const onSuccess = vi.fn();
  const hook = renderHook(() =>
    useAbandonLedgerSetup({
      action,
      ledgerId: "ledger",
      ledgerName: "我们家",
      onSuccess,
    }),
  );
  return { ...hook, action, onSuccess };
}
beforeEach(() => {
  confirm.mockReset();
  confirm.mockResolvedValue(true);
});
describe("useAbandonLedgerSetup", () => {
  it("危险二次确认后调用 action 并通知成功", async () => {
    const { result, action, onSuccess } = setup();
    await act(() => result.current.abandon());
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "放弃创建「我们家」？",
        tone: "delete",
        confirmColor: "error",
      }),
    );
    expect(action).toHaveBeenCalledWith({ ledgerId: "ledger" });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
  it("取消时不提交", async () => {
    confirm.mockResolvedValue(false);
    const { result, action } = setup();
    await act(() => result.current.abandon());
    expect(action).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
  });
  it("等待确认期间阻止重复操作", async () => {
    let resolve!: (value: boolean) => void;
    confirm.mockReturnValue(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    const { result } = setup();
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.abandon();
    });
    expect(result.current.pending).toBe(true);
    await act(() => result.current.abandon());
    expect(confirm).toHaveBeenCalledOnce();
    await act(async () => {
      resolve(false);
      await operation;
    });
  });
  it("失败保留服务端文案且可关闭反馈", async () => {
    const { result, onSuccess } = setup(async () => ({
      error: "安全错误",
      errorKey: "first",
    }));
    await act(() => result.current.abandon());
    expect(result.current.error).toBe("安全错误");
    expect(onSuccess).not.toHaveBeenCalled();
    act(() => result.current.dismissError());
    expect(result.current.error).toBeNull();
  });
  it("网络异常显示模块安全文案", async () => {
    const { result } = setup(async () => {
      throw new Error("private");
    });
    await act(() => result.current.abandon());
    expect(result.current.error).toBe(
      ledgerSetupWriteErrorMessages.abandonFailed,
    );
    expect(result.current.pending).toBe(false);
  });
});
