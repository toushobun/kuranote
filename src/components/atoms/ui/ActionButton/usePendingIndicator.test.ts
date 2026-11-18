import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePendingIndicator } from "./usePendingIndicator";

afterEach(() => vi.useRealTimers());

describe("usePendingIndicator", () => {
  it("150ms 内结束的请求不显示处理状态", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ pending }) => usePendingIndicator(pending),
      { initialProps: { pending: false } },
    );
    rerender({ pending: true });
    act(() => vi.advanceTimersByTime(100));
    rerender({ pending: false });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(false);
  });

  it("150ms 后显示并至少维持 400ms", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ pending }) => usePendingIndicator(pending),
      { initialProps: { pending: false } },
    );
    rerender({ pending: true });
    act(() => vi.advanceTimersByTime(149));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
    rerender({ pending: false });
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it("处理超过最短展示时间后立即结束，重复请求不闪烁", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ pending }) => usePendingIndicator(pending),
      { initialProps: { pending: true } },
    );
    act(() => vi.advanceTimersByTime(150));
    rerender({ pending: false });
    act(() => vi.advanceTimersByTime(50));
    rerender({ pending: true });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(true);
    rerender({ pending: false });
    act(() => vi.runOnlyPendingTimers());
    expect(result.current).toBe(false);
  });
});
