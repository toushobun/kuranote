import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MerchantTagReorderAction } from "types/merchants";

import { useMerchantTagManager } from "./useMerchantTagManager";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
  { icon: "📦", id: "tag-2", merchant_count: 1, name: "电商", sort_order: 1 },
];

describe("useMerchantTagManager", () => {
  it("键盘移动先乐观更新并提交完整标签顺序", async () => {
    const reorderAction = vi.fn<MerchantTagReorderAction>(async () => ({}));
    const { result } = renderHook(() =>
      useMerchantTagManager({ onReorderError: vi.fn(), reorderAction, tags }),
    );
    act(() => result.current.moveTag("tag-1", 1));
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
});
