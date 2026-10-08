import { describe, expect, it } from "vitest";

import { getLedgerSetupProgressSummary } from "./ledgerSetupProgressSummary";

describe("getLedgerSetupProgressSummary", () => {
  it.each([
    [1, "进行到第 1 步 · 基本信息", 0, "第 1 / 6 步"],
    [2, "进行到第 2 步 · 账户", 1 / 6, "第 2 / 6 步"],
    [3, "进行到第 3 步 · 商家", 2 / 6, "第 3 / 6 步"],
    [4, "进行到第 4 步 · 功能", 3 / 6, "第 4 / 6 步"],
    [5, "进行到第 5 步 · 确认", 4 / 6, "第 5 / 6 步"],
    [6, "进行到第 6 步 · 邀请", 5 / 6, "第 6 / 6 步"],
  ])("第 %i 步的文字与进度值", (step, description, ratio, stepCountText) => {
    expect(getLedgerSetupProgressSummary(step)).toEqual({
      description,
      ratio,
      stepCountText,
    });
  });

  it("超出范围的步骤按第 1 步或最后一步显示", () => {
    expect(getLedgerSetupProgressSummary(0).description).toBe(
      "进行到第 1 步 · 基本信息",
    );
    expect(getLedgerSetupProgressSummary(9).stepCountText).toBe("第 6 / 6 步");
  });
});
