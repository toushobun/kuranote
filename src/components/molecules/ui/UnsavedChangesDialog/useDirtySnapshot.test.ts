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
});
