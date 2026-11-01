import { describe, expect, it, vi } from "vitest";

import { createGuardHistoryPort } from "test/guardHistory";

import {
  activateUnsavedChangesHistory,
  runWithUnsavedChangesGuard,
  UnsavedChangesHistory,
} from "./unsavedChangesHistory";

function setup() {
  const browser = createGuardHistoryPort();
  const blocked = vi.fn();
  const guard = new UnsavedChangesHistory(browser.port, blocked);
  guard.connect();
  browser.onPop(() => guard.handlePopState());
  return { ...browser, guard, blocked };
}

describe("UnsavedChangesHistory", () => {
  it("未修改不添加历史；保护只追加一条并保留 Next 状态", async () => {
    const { guard, entries, port } = setup();
    await guard.setDirty(false);
    expect(entries).toHaveLength(2);
    await guard.setDirty(true);
    await guard.setDirty(true);
    expect(entries).toHaveLength(3);
    expect(port.state()).toMatchObject({
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "表单" },
    });
  });

  it("重复后退先恢复原哨兵再确认，继续编辑不新增记录", async () => {
    const { guard, port, flush, blocked, index, entries } = setup();
    await guard.setDirty(true);
    for (let i = 0; i < 3; i++) {
      port.go(-1);
      await flush();
      expect(index()).toBe(2);
      expect(blocked).toHaveBeenCalledTimes(i + 1);
      expect(entries).toHaveLength(3);
    }
  });

  it("放弃后只离开一次，重复确认不会重复后退", async () => {
    const { guard, port, flush, index } = setup();
    await guard.setDirty(true);
    const leave = () => port.go(-1);
    await Promise.all([guard.leave(leave), guard.leave(leave)]);
    await flush();
    expect(index()).toBe(0);
    expect(port.go).toHaveBeenCalledTimes(2);
    expect(guard.shouldBlockUnload()).toBe(false);
  });

  it("连续两次后退越过基准时恢复到哨兵，不把离开交给路由器", async () => {
    const { guard, port, flush, index, blocked, entries } = setup();
    await guard.setDirty(true);
    port.go(-1);
    port.go(-1);
    await flush();
    expect(index()).toBe(2);
    expect(blocked).toHaveBeenCalledOnce();
    expect(entries).toHaveLength(3);
  });

  it("改回原值清理哨兵，重新修改复用原条目", async () => {
    const { guard, entries, index } = setup();
    await guard.setDirty(true);
    await guard.setDirty(false);
    expect(index()).toBe(1);
    await guard.setDirty(true);
    expect(index()).toBe(2);
    expect(entries).toHaveLength(3);
  });

  it("已干净时前进进入旧哨兵，自动返回基准且不确认", async () => {
    const { guard, port, flush, blocked, index } = setup();
    await guard.setDirty(true);
    await guard.setDirty(false);
    port.go(1);
    await flush();
    expect(index()).toBe(1);
    expect(blocked).not.toHaveBeenCalled();
  });

  it("保存前清理哨兵，失败返回后重新保护且不累积历史", async () => {
    const { guard, index, entries } = setup();
    await guard.setDirty(true);
    const action = vi.fn(async () => {
      expect(index()).toBe(1);
      expect(guard.shouldBlockUnload()).toBe(true);
      return { error: "保存失败" };
    });
    const deactivate = activateUnsavedChangesHistory(guard);
    try {
      await expect(runWithUnsavedChangesGuard(action)).resolves.toEqual({
        error: "保存失败",
      });
      expect(index()).toBe(2);
      expect(entries).toHaveLength(3);
    } finally {
      deactivate();
    }
  });

  it("服务端成功跳转信号不重新保护；普通异常仍恢复", async () => {
    const { guard, index } = setup();
    await guard.setDirty(true);
    const failure = new Error("网络错误");
    await expect(
      guard.runAction(async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(index()).toBe(2);
    const redirect = { digest: "NEXT_REDIRECT;push;/transactions;307;" };
    await expect(
      guard.runAction(async () => {
        throw redirect;
      }),
    ).rejects.toBe(redirect);
    expect(index()).toBe(1);
  });

  it("Strict Mode 重新连接使旧连接失效，重复初始化不压历史", async () => {
    const { guard, entries } = setup();
    const isOld = guard.connect();
    await guard.setDirty(true);
    guard.connect();
    await guard.setDirty(true);
    expect(isOld()).toBe(false);
    expect(entries).toHaveLength(3);
  });

  it("未注册守卫的 action 原样运行", async () => {
    await expect(runWithUnsavedChangesGuard(async () => "完成")).resolves.toBe(
      "完成",
    );
  });

  it("保存期间后退先回到提交页，失败后仍可正常确认离开", async () => {
    const { guard, port, flush, index, blocked } = setup();
    await guard.setDirty(true);
    let finish: () => void = () => {};
    const saving = guard.runAction(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await flush();
    expect(index()).toBe(1);
    port.go(-1);
    await flush();
    expect(index()).toBe(1);
    expect(blocked).not.toHaveBeenCalled();
    finish();
    await saving;
    expect(index()).toBe(2);
    port.go(-1);
    await flush();
    expect(blocked).toHaveBeenCalledOnce();
  });

  it("成功保存后再次进入新记录，不沿用旧会话的哨兵位置", async () => {
    const { guard, port, index, entries } = setup();
    await guard.setDirty(true);
    await expect(
      guard.runAction(async () => {
        throw { digest: "NEXT_REDIRECT;push;/;307;" };
      }),
    ).rejects.toBeDefined();
    port.replace({ __NA: true });
    guard.connect();
    await guard.setDirty(false);
    expect(index()).toBe(1);
    await guard.setDirty(true);
    expect(index()).toBe(2);
    expect(entries).toHaveLength(3);
  });
});
