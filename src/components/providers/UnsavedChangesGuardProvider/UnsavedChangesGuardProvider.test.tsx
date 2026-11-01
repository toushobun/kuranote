import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  UnsavedChangesGuardProvider,
  useUnsavedChangesCoordinator,
} from "./UnsavedChangesGuardProvider";

describe("UnsavedChangesGuardProvider", () => {
  it("不同 Provider 的实例和保存入口互不共享，不按地址缓存守卫", async () => {
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
    const runA = vi
      .spyOn(historyA, "runAction")
      .mockImplementation((action) => action());
    const runB = vi
      .spyOn(historyB, "runAction")
      .mockImplementation((action) => action());
    await first.result.current.runAction(async () => "A");
    expect(runA).toHaveBeenCalledOnce();
    expect(runB).not.toHaveBeenCalled();
    releaseA();
    first.unmount();
    await second.result.current.runAction(async () => "B");
    expect(runB).toHaveBeenCalledOnce();
    releaseB();
  });

  it("没有注册表单时直接执行保存，不创建隐式全局守卫", async () => {
    const { result } = renderHook(useUnsavedChangesCoordinator, {
      wrapper: UnsavedChangesGuardProvider,
    });
    await expect(result.current.runAction(async () => "完成")).resolves.toBe(
      "完成",
    );
  });
});
