import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  UnsavedChangesGuardProvider,
  useUnsavedChangesCoordinator,
} from "./UnsavedChangesGuardProvider";

describe("UnsavedChangesGuardProvider", () => {
  it("不同 Provider 的协调器和守卫实例互不共享", () => {
    const first = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    const second = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    expect(first.result.current).not.toBe(second.result.current);
    expect(first.result.current.createGuard()).not.toBe(
      second.result.current.createGuard(),
    );
  });
  it("没有登记表单或弹层时不拦截后退", () => {
    const { result } = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    const event = new PopStateEvent("popstate");
    const stop = vi.spyOn(event, "stopImmediatePropagation");
    result.current.handlePopState(event);
    expect(stop).not.toHaveBeenCalled();
  });
});
