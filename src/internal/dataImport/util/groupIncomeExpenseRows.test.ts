import { describe, expect, it } from "vitest";

import type { IncomeExpenseSharedColumn } from "internal/dataImport/schema";
import { groupIncomeExpenseRows } from "internal/dataImport/util/groupIncomeExpenseRows";
import type { IncomeExpenseSheetRow } from "internal/dataImport/util/parseIncomeExpenseSheet";

function row(
  overrides: Partial<Omit<IncomeExpenseSheetRow, "sharedTexts">> & {
    sharedTexts?: Partial<Record<IncomeExpenseSharedColumn, string>>;
  } = {},
): IncomeExpenseSheetRow {
  const { sharedTexts, ...rest } = overrides;
  return {
    amount: 10,
    billRef: null,
    childCategoryName: null,
    parentCategoryName: "餐饮",
    rowNumber: 2,
    transactionType: "expense",
    ...rest,
    sharedTexts: {
      商家: "便利店",
      商家分类: "",
      日期: "2026-01-05 12:00:00",
      账户: "现金",
      账户币种: "CNY",
      账户持有人: "",
      账户类型: "现金",
      备注: "",
      ...sharedTexts,
    },
  };
}

/** 组内后续行沿用首行共享字段的最简写法：所有共享字段填字面 `-`。 */
function continuationSharedTexts(): Record<IncomeExpenseSharedColumn, string> {
  return {
    商家: "-",
    商家分类: "-",
    日期: "-",
    账户: "-",
    账户币种: "-",
    账户持有人: "-",
    账户类型: "-",
    备注: "-",
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

  it("同一账单关联、同一交易类型的行合并为一组多 items，后续行用「-」继承首行共享字段", () => {
    const result = groupIncomeExpenseRows([
      row({ amount: 10, billRef: "BILL-1", rowNumber: 2 }),
      row({
        amount: 20,
        billRef: "BILL-1",
        rowNumber: 3,
        sharedTexts: continuationSharedTexts(),
      }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].items).toHaveLength(2);
    expect(result.groups[0].rowNumbers).toEqual([2, 3]);
    expect(result.groups[0].items[1].accountName).toBe("现金");
    expect(result.groups[0].items[1].merchantName).toBe("便利店");
  });

  it("后续行的「账户类型」填「-」时继承首行的账户类型，填其他值时报告不一致", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "BILL-1",
        rowNumber: 2,
        sharedTexts: { 账户类型: "银行卡" },
      }),
      row({
        billRef: "BILL-1",
        rowNumber: 3,
        sharedTexts: continuationSharedTexts(),
      }),
      row({
        billRef: "BILL-1",
        rowNumber: 4,
        sharedTexts: { ...continuationSharedTexts(), 账户类型: "现金" },
      }),
    ]);
    expect(result.groups[0].items.map((item) => item.accountType)).toEqual([
      "bank",
      "bank",
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        message: expect.stringContaining("账户类型 不一致"),
        rowNumber: 4,
      }),
    ]);
  });

  it("后续行原样复述首行内容（而非「-」）也允许合并", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-1", rowNumber: 2 }),
      row({ billRef: "BILL-1", rowNumber: 3 }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups[0].items).toHaveLength(2);
  });

  it("案例：账单关联相同、交易类型不同的行共享字段取自该账单关联首次出现的行", () => {
    const result = groupIncomeExpenseRows([
      row({
        amount: 300000,
        billRef: "11",
        childCategoryName: null,
        parentCategoryName: "工资收入",
        rowNumber: 2,
        sharedTexts: {
          商家: "株式会社",
          商家分类: "",
          日期: "2026-08-29 00:46:21",
          账户: "现金",
          账户币种: "CNY",
          账户持有人: "",
          备注: "",
        },
        transactionType: "income",
      }),
      row({
        amount: 20000,
        billRef: "11",
        parentCategoryName: "个税",
        rowNumber: 3,
        sharedTexts: continuationSharedTexts(),
        transactionType: "expense",
      }),
      row({
        amount: 17000,
        billRef: "11",
        parentCategoryName: "社保",
        rowNumber: 4,
        sharedTexts: continuationSharedTexts(),
        transactionType: "expense",
      }),
    ]);

    expect(result.issues).toEqual([]);
    expect(result.groups).toHaveLength(2);

    const incomeGroup = result.groups.find(
      (group) => group.items[0].transactionType === "income",
    )!;
    const expenseGroup = result.groups.find(
      (group) => group.items[0].transactionType === "expense",
    )!;

    expect(incomeGroup.items).toHaveLength(1);
    expect(incomeGroup.items[0].parentCategoryName).toBe("工资收入");

    expect(expenseGroup.items).toHaveLength(2);
    expect(expenseGroup.items.map((item) => item.parentCategoryName)).toEqual([
      "个税",
      "社保",
    ]);
    expect(expenseGroup.items[0].merchantName).toBe("株式会社");
    expect(expenseGroup.items[0].transactionAt).toBe("2026-08-29 00:46:21");
    expect(expenseGroup.items[1].merchantName).toBe("株式会社");
  });

  it("案例：后续行日期与首行不一致、也不是「-」时报告内容错误", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "7",
        rowNumber: 2,
        sharedTexts: { 日期: "2026-08-29 23:34:10", 账户: "ICOCA" },
      }),
      row({
        billRef: "7",
        rowNumber: 3,
        sharedTexts: {
          ...continuationSharedTexts(),
          日期: "2026-08-30 00:00:00",
          账户: "ICOCA",
        },
      }),
    ]);

    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "账单关联",
        kind: "row",
        message: expect.stringContaining(
          "账单关联「7」下第 2 行与第 3 行的 日期 不一致",
        ),
        rowNumber: 3,
        sheet: "incomeExpense",
      }),
    ]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].items).toHaveLength(1);
  });

  it("同一账单关联下第一次出现的行不允许填「-」，报告错误且该行不参与合并", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "BILL-2",
        rowNumber: 2,
        sharedTexts: continuationSharedTexts(),
      }),
    ]);

    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "账单关联",
        kind: "row",
        rowNumber: 2,
        sheet: "incomeExpense",
      }),
    ]);
    expect(result.groups).toHaveLength(0);
  });

  it("首次出现的行无效时，下一行成为该账单关联新的首行", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "BILL-3",
        rowNumber: 2,
        sharedTexts: continuationSharedTexts(),
      }),
      row({ billRef: "BILL-3", rowNumber: 3 }),
    ]);

    expect(result.issues).toHaveLength(1);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].items).toHaveLength(1);
    expect(result.groups[0].rowNumbers).toEqual([3]);
  });

  it("账户持有人不一致时报告错误", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "BILL-4",
        rowNumber: 2,
        sharedTexts: { 账户持有人: "鄧" },
      }),
      row({
        billRef: "BILL-4",
        rowNumber: 3,
        sharedTexts: { ...continuationSharedTexts(), 账户持有人: "聶" },
      }),
    ]);

    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "账单关联",
        kind: "row",
        message: expect.stringContaining("账户持有人"),
      }),
    ]);
  });

  it("首行持有人被正确解析为单个持有人并继承给后续行", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "BILL-5",
        rowNumber: 2,
        sharedTexts: { 账户持有人: "鄧" },
      }),
      row({
        billRef: "BILL-5",
        rowNumber: 3,
        sharedTexts: continuationSharedTexts(),
      }),
    ]);

    expect(result.issues).toEqual([]);
    expect(result.groups[0].items[1].accountHolder).toBe("鄧");
  });

  it("备注不一致时报告错误（备注属于共享字段）", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-6", rowNumber: 2, sharedTexts: { 备注: "note-a" } }),
      row({
        billRef: "BILL-6",
        rowNumber: 3,
        sharedTexts: { ...continuationSharedTexts(), 备注: "note-b" },
      }),
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "账单关联",
        message: expect.stringContaining("备注"),
      }),
    ]);
  });

  it("账户币种大小写不同但语义相同时允许合并（按大写比较）", () => {
    const result = groupIncomeExpenseRows([
      row({
        billRef: "BILL-7",
        rowNumber: 2,
        sharedTexts: { 账户币种: "CNY" },
      }),
      row({
        billRef: "BILL-7",
        rowNumber: 3,
        sharedTexts: { ...continuationSharedTexts(), 账户币种: "cny" },
      }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups[0].items).toHaveLength(2);
  });

  it("「记账人」不参与共享字段一致性校验（列内容本就不会被读取）", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-8", rowNumber: 2 }),
      row({
        billRef: "BILL-8",
        rowNumber: 3,
        sharedTexts: continuationSharedTexts(),
      }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.groups[0].items).toHaveLength(2);
  });

  it("不同账单关联值各自独立分组", () => {
    const result = groupIncomeExpenseRows([
      row({ billRef: "BILL-1", rowNumber: 2 }),
      row({ billRef: "BILL-2", rowNumber: 3 }),
    ]);
    expect(result.groups).toHaveLength(2);
    expect(result.issues).toEqual([]);
  });
});
