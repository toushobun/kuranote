import { describe, expect, it, vi } from "vitest";
import { createGuardHistoryPort } from "test/guardHistory";
import { createUnsavedChangesCoordinator } from "./unsavedChangesCoordinator";

function setup() {
  const browser = createGuardHistoryPort();
  const coordinator = createUnsavedChangesCoordinator(browser.port, "测试");
  browser.onPop(() =>
    coordinator.handlePopState(new PopStateEvent("popstate")),
  );
  function register(dirty: boolean, level: number | null, close = vi.fn()) {
    const guard = coordinator.createGuard();
    const release = guard.register(close);
    void guard.update(dirty, level, true);
    return { guard, close, release };
  }
  const back = async () => {
    browser.port.go(-1);
    await browser.flush();
  };
  return { ...browser, coordinator, register, back };
}

describe("unsavedChangesCoordinator", () => {
  it("后退按全屏层、商家抽屉、页面逐层处理，整栈只有一个哨兵", async () => {
    const b = setup();
    const page = b.register(true, null);
    const drawer = b.register(false, 1);
    const editor = b.register(true, 2);
    await b.flush();
    expect(b.entries).toHaveLength(3);
    for (const layer of [editor, drawer]) {
      await b.back();
      expect(layer.close).toHaveBeenCalledOnce();
      layer.release();
      await b.flush();
    }
    await b.back();
    expect(page.close).toHaveBeenCalledOnce();
    expect(b.port.push).toHaveBeenCalledOnce();
  });
  it("最后一层关闭时内部遍历被消费，前进也不复活弹层", async () => {
    const b = setup();
    const page = b.register(false, null);
    const layer = b.register(false, 1);
    await b.flush();
    layer.release();
    await b.flush();
    expect(b.index()).toBe(1);
    expect(page.close).not.toHaveBeenCalled();
    b.port.go(1);
    await b.flush();
    expect(b.index()).toBe(1);
    expect(layer.close).not.toHaveBeenCalled();
    expect(page.close).not.toHaveBeenCalled();
  });
  it("连续快速后退只处理最上层，取消后复用哨兵，放弃后只关子层", async () => {
    const b = setup();
    const parent = b.register(true, 0);
    const child = b.register(true, 2);
    await b.flush();
    b.port.go(-1);
    b.port.go(-1);
    await b.flush();
    expect(child.close).toHaveBeenCalledOnce();
    expect(parent.close).not.toHaveBeenCalled();
    expect(b.index()).toBe(2);
    await b.back();
    expect(child.close).toHaveBeenCalledTimes(2);
    await child.guard.leave(child.release);
    await b.flush();
    expect(b.index()).toBe(2);
    expect(parent.close).not.toHaveBeenCalled();
    await b.back();
    expect(parent.close).toHaveBeenCalledOnce();
  });
  it("StrictMode 清理再连接不丢登记、不增加历史，最终卸载清理哨兵", async () => {
    const b = setup();
    const layer = b.register(true, 0);
    layer.release();
    const release = layer.guard.register(layer.close);
    await b.flush();
    await b.back();
    expect(layer.close).toHaveBeenCalledOnce();
    expect(b.port.push).toHaveBeenCalledOnce();
    release();
    await b.flush();
    expect(b.index()).toBe(1);
  });
  it("子层保存失败只恢复自己的保护，父层始终受保护", async () => {
    const b = setup();
    const parent = b.register(true, 0);
    const child = b.register(true, 2);
    await b.flush();
    await expect(
      child.guard.runAction(async () => {
        expect(parent.guard.shouldBlockUnload()).toBe(true);
        expect(child.guard.shouldBlockUnload()).toBe(false);
        expect(b.index()).toBe(2);
        throw new Error("保存失败");
      }),
    ).rejects.toThrow("保存失败");
    await b.back();
    expect(child.close).toHaveBeenCalledOnce();
    expect(parent.close).not.toHaveBeenCalled();
  });
  it("PR1 页面放弃只后退一次，滚动与 Next 状态保持，失效哨兵前进回基准", async () => {
    const b = setup();
    b.port.scrollTo({ x: 0, y: 2000 });
    const page = b.register(true, null);
    await b.flush();
    await b.back();
    expect(page.close).toHaveBeenCalledOnce();
    expect(b.port.scrollPosition()).toEqual({ x: 0, y: 2000 });
    expect(b.port.state()).toMatchObject({
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "表单" },
    });
    await page.guard.leave(() => b.port.go(-1));
    page.release();
    await b.flush();
    expect(b.index()).toBe(0);
    const nextNavigation = vi.fn();
    b.onPop(() => {
      const event = new PopStateEvent("popstate");
      const stop = vi.spyOn(event, "stopImmediatePropagation");
      b.coordinator.handlePopState(event);
      if (!stop.mock.calls.length) nextNavigation();
    });
    b.port.go(1);
    await b.flush();
    expect(nextNavigation).toHaveBeenCalledOnce();
    b.port.go(1);
    await b.flush();
    expect(b.index()).toBe(1);
    expect(nextNavigation).toHaveBeenCalledOnce();
    expect(page.close).toHaveBeenCalledOnce();
  });
  it("普通导航后的新页面重新连接 Provider 的状态机，保护不沿用旧 URL", async () => {
    const b = setup();
    const first = b.register(true, null);
    await b.flush();
    await first.guard.leave(() => {});
    first.release();
    await b.flush();
    const href = vi.spyOn(b.port, "href").mockReturnValue("/second-edit");
    b.port.replace({
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "新表单" },
    });
    const next = b.register(true, null);
    await b.flush();
    expect(b.port.state()?.kuranoteUnsavedChanges?.position).toBe("sentinel");
    await b.back();
    expect(next.close).toHaveBeenCalledOnce();
    expect(first.close).not.toHaveBeenCalled();
    href.mockRestore();
  });
});
