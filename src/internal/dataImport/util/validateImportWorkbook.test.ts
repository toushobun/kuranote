import { describe, expect, it } from "vitest";

import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import {
  incomeExpenseColumns,
  transferColumns,
} from "internal/dataImport/schema";
import { validateImportWorkbook } from "internal/dataImport/util/validateImportWorkbook";

const incomeExpenseHeader = incomeExpenseColumns.map((column) => column.name);
const transferHeader = transferColumns.map((column) => column.name);

function incomeExpenseRowCells(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    一级分类: "餐饮",
    二级分类: "",
    交易类型: "支出",
    备注: "",
    商家: "便利店",
    商家分类: "",
    日期: "2026-01-05",
    账单关联: "",
    账户: "现金",
    账户币种: "CNY",
    账户持有人: "",
    金额: "35.5",
    记账人: "",
    ...overrides,
  };
  return incomeExpenseHeader.map((name) => values[name]);
}

function transferRowCells(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    交易类型: "转账",
    备注: "",
    日期: "2026-01-05",
    转出账户: "现金",
    转出账户币种: "CNY",
    转出账户持有人: "",
    转入账户: "招行储蓄卡",
    转入账户币种: "CNY",
    转入账户持有人: "",
    金额: "500",
    记账人: "",
    ...overrides,
  };
  return transferHeader.map((name) => values[name]);
}

function table(
  sourceName: string,
  headerRow: string[],
  rows: string[][],
): ParsedTable {
  return {
    headerRow,
    rows: rows.map((cells, index) => ({ cells, rowNumber: index + 2 })),
    sourceName,
  };
}

describe("validateImportWorkbook", () => {
  it("空表格数组返回结构性错误", () => {
    const result = validateImportWorkbook([]);
    expect(result.ok).toBe(false);
  });

  it("同时包含收支与转账表时正确统计条数", () => {
    const result = validateImportWorkbook([
      table("收支", incomeExpenseHeader, [
        incomeExpenseRowCells(),
        incomeExpenseRowCells({ 账单关联: "BILL-1" }),
        incomeExpenseRowCells({ 账单关联: "BILL-1" }),
      ]),
      table("转账", transferHeader, [transferRowCells()]),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.incomeExpenseCount).toBe(2);
      expect(result.summary.transferCount).toBe(1);
      expect(result.summary.balanceAdjustmentDetected).toBe(false);
    }
  });

  it("识别到余额变更表时标记 balanceAdjustmentDetected 且不视为失败", () => {
    const result = validateImportWorkbook([
      table("收支", incomeExpenseHeader, [incomeExpenseRowCells()]),
      table(
        "余额变更",
        [
          "交易类型",
          "日期",
          "记账人",
          "账户",
          "账户币种",
          "账户持有人",
          "金额",
          "备注",
        ],
        [["余额变更", "2026-01-05", "", "现金", "CNY", "", "100", ""]],
      ),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.balanceAdjustmentDetected).toBe(true);
      expect(result.summary.transferCount).toBe(0);
    }
  });

  it("无法识别的表头返回结构性错误", () => {
    const result = validateImportWorkbook([
      table("未知表", ["姓名", "电话"], [["张三", "123"]]),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({ kind: "structural" }),
      ]);
    }
  });

  it("只有余额变更表、没有收支或转账时仍算校验通过（数量为 0）", () => {
    const result = validateImportWorkbook([
      table(
        "余额变更",
        [
          "交易类型",
          "日期",
          "记账人",
          "账户",
          "账户币种",
          "账户持有人",
          "金额",
          "备注",
        ],
        [["余额变更", "2026-01-05", "", "现金", "CNY", "", "100", ""]],
      ),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.incomeExpenseCount).toBe(0);
      expect(result.summary.transferCount).toBe(0);
      expect(result.summary.balanceAdjustmentDetected).toBe(true);
    }
  });

  it("行内容错误与账单关联合并错误会一并汇总为失败", () => {
    const result = validateImportWorkbook([
      table("收支", incomeExpenseHeader, [
        incomeExpenseRowCells({ 金额: "abc" }),
      ]),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({ column: "金额", kind: "row" }),
      ]);
    }
  });
});
