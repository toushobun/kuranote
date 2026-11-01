import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  receiptCreationData,
  createdMerchant,
  createdAccount,
} from "test/mocks/receiptCreation";
import {
  useReceiptCreationState,
  mergeReceiptOptions,
} from "./useReceiptCreationState";

describe("useReceiptCreationState", () => {
  it("无权限时不提供新增入口", () => {
    const { result } = renderHook(() => useReceiptCreationState(null));
    expect(result.current.addMerchant).toBeUndefined();
    expect(result.current.addAccount).toBeUndefined();
  });
  it("关键词预填与取消只改变弹层", () => {
    const selected = vi.fn();
    const { result } = renderHook(() =>
      useReceiptCreationState(receiptCreationData()),
    );
    act(() => result.current.addMerchant?.(selected, "全家"));
    expect(result.current.editor).toMatchObject({
      type: "merchant",
      name: "全家",
    });
    act(() => result.current.close());
    expect(result.current.editor).toBeNull();
    expect(result.current.merchants).toEqual([]);
    expect(selected).not.toHaveBeenCalled();
  });
  it("保存商家追加选项并只调用发起的选择回调", async () => {
    const selected = vi.fn();
    const { result } = renderHook(() =>
      useReceiptCreationState(receiptCreationData()),
    );
    act(() => result.current.addMerchant?.(selected));
    await act(() => result.current.merchantCreated(createdMerchant));
    expect(result.current.merchants).toEqual([createdMerchant]);
    expect(result.current.editor).toBeNull();
    expect(selected).toHaveBeenCalledExactlyOnceWith(createdMerchant);
  });
  it("取消换币种时新增账户保留在选项中但不提示已选中", async () => {
    const { result } = renderHook(() =>
      useReceiptCreationState(receiptCreationData()),
    );
    act(() => result.current.addAccount?.(async () => false));
    await act(() => result.current.accountCreated(createdAccount));
    expect(result.current.accounts).toEqual([createdAccount]);
    expect(result.current.message).toBe("");
  });
  it("提交期间禁止关闭，请求结束后允许取消", async () => {
    let finish!: () => void;
    const { result } = renderHook(() =>
      useReceiptCreationState(receiptCreationData()),
    );
    act(() => result.current.addMerchant?.(vi.fn()));
    let request!: Promise<void>;
    act(() => {
      request = result.current.trackAction(
        async () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      )(undefined, new FormData());
    });
    act(() => result.current.close());
    expect(result.current.editor).not.toBeNull();
    await act(async () => {
      finish();
      await request;
    });
    act(() => result.current.close());
    expect(result.current.editor).toBeNull();
  });
  it("服务端数据更新后合并同 ID 选项不重复", () => {
    expect(mergeReceiptOptions([createdAccount], [createdAccount])).toEqual([
      createdAccount,
    ]);
  });
});
