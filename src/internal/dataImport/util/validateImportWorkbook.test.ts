import { makeBalanceAdjustmentTable as balanceAdjustmentTable } from "test/mocks/dataImport";
import { describe, expect, it } from "vitest";

import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import {
  incomeExpenseColumns,
  transferColumns,
} from "internal/dataImport/schema";
import {
  analyzeImportWorkbook,
  validateImportWorkbook,
} from "internal/dataImport/util/validateImportWorkbook";

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
    日期: "2026-01-05 12:00:00",
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
    日期: "2026-01-05 12:00:00",
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

  it("按 sheet 名识别「收支」与「转账」表，正确统计条数", () => {
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
      expect(result.summary.balanceAdjustmentCount).toBe(0);
    }
  });

  it("识别到「余额变更」sheet 时统计余额变更数量 且不视为失败", () => {
    const result = validateImportWorkbook([
      table("收支", incomeExpenseHeader, [incomeExpenseRowCells()]),
      balanceAdjustmentTable(),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.balanceAdjustmentCount).toBe(1);
      expect(result.summary.transferCount).toBe(0);
    }
  });

  it("sheet 名不匹配「收支」「转账」「余额变更」时忽略、不算错误", () => {
    const result = validateImportWorkbook([
      table("收支", incomeExpenseHeader, [incomeExpenseRowCells()]),
      table("说明", ["姓名", "电话"], [["张三", "123"]]),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.incomeExpenseCount).toBe(1);
    }
  });

  it("只有余额变更表也能解析并产出执行单元", () => {
    const { result, units } = analyzeImportWorkbook([balanceAdjustmentTable()]);
    expect(result).toMatchObject({
      ok: true,
      summary: { balanceAdjustmentCount: 1 },
    });
    expect(units).toMatchObject([
      { kind: "balanceAdjustment", row: { amount: 100 } },
    ]);
  });

  it("只有无法识别的 sheet 时报结构性错误", () => {
    const result = validateImportWorkbook([
      table("说明", ["姓名", "电话"], [["张三", "123"]]),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({ kind: "structural" }),
      ]);
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

describe("analyzeImportWorkbook", () => {
  it("一次解析同时返回校验结果与按收支、转账、余额变更顺序展开的执行单元", () => {
    const { result, units } = analyzeImportWorkbook([
      balanceAdjustmentTable(),
      table("转账", transferHeader, [transferRowCells()]),
      table("收支", incomeExpenseHeader, [
        incomeExpenseRowCells({ 账单关联: "BILL-1" }),
        incomeExpenseRowCells({ 账单关联: "BILL-1" }),
        incomeExpenseRowCells(),
      ]),
    ]);

    expect(result.ok).toBe(true);
    expect(units.map((unit) => unit.kind)).toEqual([
      "incomeExpense",
      "incomeExpense",
      "transfer",
      "balanceAdjustment",
    ]);
    expect(units[0]).toMatchObject({ group: { rowNumbers: [2, 3] } });
  });

  it("校验未通过时不产出执行单元，结果与 validateImportWorkbook 一致", () => {
    const tables = [
      table("收支", incomeExpenseHeader, [
        incomeExpenseRowCells({ 金额: "abc" }),
      ]),
    ];

    const { result, units } = analyzeImportWorkbook(tables);

    expect(result.ok).toBe(false);
    expect(units).toEqual([]);
    expect(result).toEqual(validateImportWorkbook(tables));
  });
});
