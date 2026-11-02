import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDirtySnapshot } from "./useDirtySnapshot";

describe("useDirtySnapshot", () => {
  it("等待初始化完成，修改后报告 dirty，改回初始快照恢复干净", () => {
    const report = vi.fn();
    const { rerender } = renderHook(
      ({ snapshot, ready }) => useDirtySnapshot(snapshot, report, ready),
      { initialProps: { snapshot: "初始化中", ready: false } },
    );
    expect(report).not.toHaveBeenCalled();
    rerender({ snapshot: "初始值", ready: true });
    expect(report).toHaveBeenLastCalledWith(false);
    rerender({ snapshot: "修改值", ready: true });
    expect(report).toHaveBeenLastCalledWith(true);
    rerender({ snapshot: "初始值", ready: true });
    expect(report).toHaveBeenLastCalledWith(false);
  });
  it("只有保存成功的表单更新基线，下一次输入仍与新基线比较", () => {
    const report = vi.fn();
    const { rerender } = renderHook(
      ({ snapshot, savedKey }) =>
        useDirtySnapshot(snapshot, report, true, savedKey),
      { initialProps: { snapshot: "初始", savedKey: "" } },
    );
    rerender({ snapshot: "修改", savedKey: "" });
    expect(report).toHaveBeenLastCalledWith(true);
    rerender({ snapshot: "修改", savedKey: "成功1" });
    expect(report).toHaveBeenLastCalledWith(false);
    rerender({ snapshot: "初始", savedKey: "成功1" });
    expect(report).toHaveBeenLastCalledWith(true);
  });
  it("再次提交时清空成功状态不更新基线，失败仍保留未保存修改", () => {
    const report = vi.fn();
    const { rerender } = renderHook(
      ({ snapshot, savedKey }) =>
        useDirtySnapshot(snapshot, report, true, savedKey),
      { initialProps: { snapshot: "初始", savedKey: "" } },
    );
    rerender({ snapshot: "已保存", savedKey: "成功1" });
    expect(report).toHaveBeenLastCalledWith(false);
    rerender({ snapshot: "下一次修改", savedKey: "" });
    expect(report).toHaveBeenLastCalledWith(true);
    rerender({ snapshot: "已保存", savedKey: "" });
    expect(report).toHaveBeenLastCalledWith(false);
  });
});
