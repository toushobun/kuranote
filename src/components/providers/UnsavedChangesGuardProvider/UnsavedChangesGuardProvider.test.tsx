import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  UnsavedChangesGuardProvider,
  useUnsavedChangesCoordinator,
} from "./UnsavedChangesGuardProvider";

describe("UnsavedChangesGuardProvider", () => {
  it("不同 Provider 的实例和后退拦截互不共享，不按地址缓存守卫", () => {
    const first = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    const second = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    const historyA = first.result.current.createHistory();
    const historyB = second.result.current.createHistory();
    expect(historyA).not.toBe(historyB);
    const releaseA = first.result.current.register(historyA, () => {});
    const releaseB = second.result.current.register(historyB, () => {});
    const popA = vi.spyOn(historyA, "handlePopState").mockReturnValue(true);
    const popB = vi.spyOn(historyB, "handlePopState").mockReturnValue(true);
    const event = new PopStateEvent("popstate");
    const stop = vi.spyOn(event, "stopImmediatePropagation");
    first.result.current.handlePopState(event);
    expect(stop).toHaveBeenCalledOnce();
    expect(popA).toHaveBeenCalledOnce();
    expect(popB).not.toHaveBeenCalled();
    releaseA();
    releaseB();
  });

  it("没有注册表单时不拦截后退，不创建隐式全局守卫", () => {
    const { result } = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    const event = new PopStateEvent("popstate");
    const stop = vi.spyOn(event, "stopImmediatePropagation");
    result.current.handlePopState(event);
    expect(stop).not.toHaveBeenCalled();
  });
});
