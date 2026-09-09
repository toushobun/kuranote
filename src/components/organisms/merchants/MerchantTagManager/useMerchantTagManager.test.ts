import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MerchantTagReorderAction } from "types/merchants";

import { useMerchantTagManager } from "./useMerchantTagManager";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
  { icon: "📦", id: "tag-2", merchant_count: 1, name: "电商", sort_order: 1 },
];
const threeTags = [
  ...tags,
  { icon: "🍽️", id: "tag-3", merchant_count: 3, name: "餐饮", sort_order: 2 },
];

describe("useMerchantTagManager", () => {
  it("排序时先乐观更新并提交完整标签顺序", async () => {
    const reorderAction = vi.fn<MerchantTagReorderAction>(async () => ({}));
    const { result } = renderHook(() =>
      useMerchantTagManager({ onReorderError: vi.fn(), reorderAction, tags }),
    );
    act(() => result.current.submitOrder(["tag-2", "tag-1"]));
    expect(result.current.orderedTags.map((tag) => tag.id)).toEqual([
      "tag-2",
      "tag-1",
    ]);
    await waitFor(() => expect(reorderAction).toHaveBeenCalledOnce());
    const formData = reorderAction.mock.calls[0]?.[0];
    if (!formData) throw new Error("排序表单未提交");
    expect(JSON.parse(String(formData.get("tagIds")))).toEqual([
      "tag-2",
      "tag-1",
    ]);
  });

  it("按拖动结果提交三个标签的新顺序", async () => {
    const reorderAction = vi.fn<MerchantTagReorderAction>(async () => ({}));
    const { result } = renderHook(() =>
      useMerchantTagManager({
        onReorderError: vi.fn(),
        reorderAction,
        tags: threeTags,
      }),
    );
    act(() => result.current.submitOrder(["tag-2", "tag-1", "tag-3"]));

    expect(result.current.orderedTags.map((tag) => tag.id)).toEqual([
      "tag-2",
      "tag-1",
      "tag-3",
    ]);
    await waitFor(() => expect(reorderAction).toHaveBeenCalledOnce());
    const formData = reorderAction.mock.calls[0]?.[0];
    if (!formData) throw new Error("排序表单未提交");
    expect(JSON.parse(String(formData.get("tagIds")))).toEqual([
      "tag-2",
      "tag-1",
      "tag-3",
    ]);
  });

  it("排序请求处理中忽略再次提交", async () => {
    let resolveReorder: (() => void) | undefined;
    const reorderAction = vi.fn<MerchantTagReorderAction>(
      () =>
        new Promise((resolve) => {
          resolveReorder = () => resolve({});
        }),
    );
    const { result } = renderHook(() =>
      useMerchantTagManager({ onReorderError: vi.fn(), reorderAction, tags }),
    );
    act(() => result.current.submitOrder(["tag-2", "tag-1"]));
    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => result.current.submitOrder(["tag-1", "tag-2"]));

    expect(reorderAction).toHaveBeenCalledOnce();
    await act(async () => resolveReorder?.());
  });
  it.each([false, true])(
    "保存失败时回滚并反馈错误（抛异常：%s）",
    async (throws) => {
      const error = { error: "排序保存失败", errorKey: "failure" };
      const onReorderError = vi.fn();
      const { result } = renderHook(() =>
        useMerchantTagManager({
          tags,
          onReorderError,
          reorderAction: async () => {
            if (throws) throw new Error("network");
            return error;
          },
        }),
      );
      act(() => result.current.submitOrder(["tag-2", "tag-1"]));
      await waitFor(() => expect(onReorderError).toHaveBeenCalledOnce());
      expect(result.current.orderedTags).toEqual(tags);
      if (!throws) expect(onReorderError).toHaveBeenCalledWith(error);
    },
  );
});
