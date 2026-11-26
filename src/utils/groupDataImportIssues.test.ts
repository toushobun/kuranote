import { describe, expect, it } from "vitest";
import {
  groupExecutionIssues,
  groupValidationIssues,
} from "./groupDataImportIssues";

describe("groupDataImportIssues", () => {
  it("按表、列及原因合并行号，结构问题独立保留", () => {
    const row = {
      kind: "row",
      sheet: "incomeExpense",
      column: "金额",
      message: "错误",
    } as const;
    const structural = { kind: "structural", message: "缺少列" } as const;
    expect(
      groupValidationIssues([
        { ...row, rowNumber: 5 },
        { ...row, rowNumber: 2 },
        { ...row, rowNumber: 5 },
        { ...row, rowNumber: 3, column: "账户" },
        structural,
        structural,
      ]),
    ).toMatchObject([
      { sheet: "incomeExpense", column: "金额", reason: "错误", rows: [2, 5] },
      { sheet: "incomeExpense", column: "账户", reason: "错误", rows: [3] },
      { reason: "缺少列", rows: [] },
      { reason: "缺少列", rows: [] },
    ]);
  });

  it("执行失败按表及原因合并，不跨表合并", () => {
    const detail = {
      sheet: "incomeExpense",
      status: "failed",
      reason: "错误",
    } as const;
    expect(
      groupExecutionIssues([
        { ...detail, rowNumbers: [3, 4] },
        { ...detail, rowNumbers: [2] },
        { ...detail, sheet: "transfer", rowNumbers: [2] },
      ]),
    ).toEqual([
      { sheet: "incomeExpense", reason: "错误", rows: [2, 3, 4] },
      { sheet: "transfer", reason: "错误", rows: [2] },
    ]);
  });
});
