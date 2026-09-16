import { describe, expect, it } from "vitest";

import type { IncomeExpenseImportRow } from "internal/dataImport/entity/importRow";
import { groupIncomeExpenseRows } from "internal/dataImport/util/groupIncomeExpenseRows";

function row(
  overrides: Partial<IncomeExpenseImportRow>,
): IncomeExpenseImportRow {
  return {
    accountCurrency: "CNY",
    accountHolders: [],
    accountName: "现金",
    amount: 10,
    billRef: null,
    childCategoryName: null,
    merchantName: "便利店",
    merchantTag: null,
    note: null,
    parentCategoryName: "餐饮",
    rowNumber: 2,
    transactionAt: "2026-01-05",
    transactionType: "expense",
    ...overrides,
  };
}

describe("groupIncomeExpenseRows", () => {
  it("账单关联为空的行各自独立成组", () => {
    const result = groupIncomeExpenseRows([
      row({ rowNumber: 2 }),
      row({ rowNumber: 3 }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].items).toHaveLength(1);
    expect(result.groups[1].items).toHaveLength(1);
  });

  it("同一账单关联、同一交易类型的行合并为一组多 items", () => {
    const result = groupIncomeExpenseRows([
      row({ amount: 10, billRef: "BILL-1", rowNumber: 2 }),
      row({ amount: 20, billRef: "BILL-1", rowNumber: 3 }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].items).toHaveLength(2);
    expect(result.groups[0].rowNumbers).toEqual([2, 3]);
  });

  it("同一账单关联但交易类型不同时拆分为独立的交易组", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-1", rowNumber: 2, transactionType: "expense" }),
      row({ billRef: "BILL-1", rowNumber: 3, transactionType: "income" }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups).toHaveLength(2);
    expect(result.groups.map((g) => g.items.length)).toEqual([1, 1]);
  });

  it("同一账单关联同类型但账户不一致时报告错误、且该行不参与合并", () => {
    const result = groupIncomeExpenseRows([
      row({ accountName: "现金", billRef: "BILL-1", rowNumber: 2 }),
      row({ accountName: "招行储蓄卡", billRef: "BILL-1", rowNumber: 3 }),
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "账单关联",
        kind: "row",
        rowNumber: 3,
        sheet: "incomeExpense",
      }),
    ]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].items).toHaveLength(1);
  });

  it("同一账单关联同类型但日期不一致时报告错误", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-1", rowNumber: 2, transactionAt: "2026-01-05" }),
      row({ billRef: "BILL-1", rowNumber: 3, transactionAt: "2026-01-06" }),
    ]);
    expect(result.issues[0]).toEqual(
      expect.objectContaining({ column: "账单关联" }),
    );
  });

  it("持有人集合顺序不同但成员相同时允许合并", () => {
    const result = groupIncomeExpenseRows([
      row({ accountHolders: ["鄧", "聶"], billRef: "BILL-1", rowNumber: 2 }),
      row({ accountHolders: ["聶", "鄧"], billRef: "BILL-1", rowNumber: 3 }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups[0].items).toHaveLength(2);
  });

  it("备注不一致不影响合并", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-1", note: "note-a", rowNumber: 2 }),
      row({ billRef: "BILL-1", note: "note-b", rowNumber: 3 }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups[0].items).toHaveLength(2);
  });

  it("不同账单关联值各自独立成组", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-1", rowNumber: 2 }),
      row({ billRef: "BILL-2", rowNumber: 3 }),
    ]);
    expect(result.groups).toHaveLength(2);
  });
});
