import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOtpCooldown } from "./useOtpCooldown";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useOtpCooldown", () => {
  it("设置秒数后每秒递减，到 0 停止", () => {
    const { result } = renderHook(() => useOtpCooldown());

    expect(result.current[0]).toBe(0);
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe(0);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current[0]).toBe(0);
  });
});
