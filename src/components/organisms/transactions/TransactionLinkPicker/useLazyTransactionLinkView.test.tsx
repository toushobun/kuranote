import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLazyTransactionLinkView } from "./useLazyTransactionLinkView";

const emptyView = {
  groupBy: "month" as const,
  groups: [],
  initialDateGroupsByGroupId: {},
  initialExpandedGroupId: null,
  initialNextItemOffsetByGroupId: {},
  nextOffset: null,
};

describe("useLazyTransactionLinkView", () => {
  it("只在首次请求时取数据，重复打开复用已加载视图", async () => {
    const loadInitialViewAction = vi.fn(async () => emptyView);
    const { result } = renderHook(() =>
      useLazyTransactionLinkView(loadInitialViewAction),
    );
    expect(loadInitialViewAction).not.toHaveBeenCalled();

    act(() => result.current.load());
    await waitFor(() => expect(result.current.view).toEqual(emptyView));
    act(() => result.current.load());
    expect(loadInitialViewAction).toHaveBeenCalledOnce();
  });

  it("同一笔未完成请求不重复发送，失败后允许重试", async () => {
    let rejectFirst: ((error: Error) => void) | undefined;
    const loadInitialViewAction = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<typeof emptyView>((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValueOnce(emptyView);

    const { result } = renderHook(() =>
      useLazyTransactionLinkView(loadInitialViewAction),
    );
    act(() => {
      result.current.load();
      result.current.load();
    });
    expect(loadInitialViewAction).toHaveBeenCalledOnce();
    await act(async () => {
      rejectFirst?.(new Error("load failed"));
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.view).toBeNull();

    act(() => result.current.load());
    await waitFor(() => expect(result.current.view).toEqual(emptyView));
    expect(loadInitialViewAction).toHaveBeenCalledTimes(2);
  });
});
