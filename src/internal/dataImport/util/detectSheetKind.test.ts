import { describe, expect, it } from "vitest";

import { detectSheetKind } from "internal/dataImport/util/detectSheetKind";

describe("detectSheetKind", () => {
  it("按 sheet 名精确识别「收支」", () => {
    expect(detectSheetKind("收支")).toBe("incomeExpense");
  });

  it("按 sheet 名精确识别「转账」", () => {
    expect(detectSheetKind("转账")).toBe("transfer");
  });

  it("按 sheet 名精确识别「余额变更」", () => {
    expect(detectSheetKind("余额变更")).toBe("balanceAdjustment");
  });

  it("不匹配任何已知 sheet 名时返回 null", () => {
    expect(detectSheetKind("汇总")).toBeNull();
  });

  it("忽略 sheet 名首尾空白", () => {
    expect(detectSheetKind(" 收支 ")).toBe("incomeExpense");
  });
});
