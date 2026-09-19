import { describe, expect, it } from "vitest";

import { parseExecuteDataImportBatchForm } from "internal/dataImport/adapter/next/formParser";
import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";
import { dataImportErrorCodes } from "internal/dataImport/errors";
import { importBatchSize } from "internal/dataImport/schema";

const incomeExpenseUnit: ImportExecutionUnit = {
  group: {
    items: [
      {
        accountCurrency: "JPY",
        accountHolder: null,
        accountName: "钱包",
        amount: 1200,
        billRef: null,
        childCategoryName: "食材",
        merchantName: "超市",
        merchantTag: null,
        note: null,
        parentCategoryName: "餐饮",
        rowNumber: 2,
        transactionAt: "2026-09-17 10:00:00",
        transactionType: "expense",
      },
    ],
    rowNumbers: [2],
  },
  kind: "incomeExpense",
};

const transferUnit: ImportExecutionUnit = {
  kind: "transfer",
  row: {
    amount: 100,
    fromAccountCurrency: "JPY",
    fromAccountHolder: "淞文",
    fromAccountName: "钱包",
    note: "备注",
    rowNumber: 3,
    toAccountCurrency: "JPY",
    toAccountHolder: null,
    toAccountName: "银行卡",
    transactionAt: "2026-09-17 10:00:00",
  },
};

function buildFormData(units?: unknown, timeZoneOffsetMinutes?: string) {
  const formData = new FormData();
  if (units !== undefined) {
    formData.set(
      "units",
      typeof units === "string" ? units : JSON.stringify(units),
    );
  }
  if (timeZoneOffsetMinutes !== undefined) {
    formData.set("timeZoneOffsetMinutes", timeZoneOffsetMinutes);
  }
  return formData;
}

const executionInvalid = {
  error: dataImportErrorCodes.executionInvalid,
  ok: false,
};

describe("parseExecuteDataImportBatchForm", () => {
  it("合法的收支与转账单元连同时区偏移一起解析", () => {
    const result = parseExecuteDataImportBatchForm(
      buildFormData([incomeExpenseUnit, transferUnit], "-540"),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        timeZoneOffsetMinutes: -540,
        units: [incomeExpenseUnit, transferUnit],
      },
    });
  });

  it.each([
    ["缺少 units", undefined],
    ["units 不是合法 JSON", "{not json"],
    ["units 不是数组", { kind: "transfer" }],
    ["units 为空数组", []],
    [
      "units 超过单批上限",
      Array.from({ length: importBatchSize + 1 }, () => transferUnit),
    ],
    ["未知的单元类型", [{ kind: "other" }]],
    [
      "日期格式不正确",
      [
        {
          ...transferUnit,
          row: { ...transferUnit.row, transactionAt: "2026-09-17" },
        },
      ],
    ],
    [
      "金额为负数",
      [{ ...transferUnit, row: { ...transferUnit.row, amount: -1 } }],
    ],
    [
      "币种格式不正确",
      [
        {
          ...transferUnit,
          row: { ...transferUnit.row, fromAccountCurrency: "JPYY" },
        },
      ],
    ],
    [
      "收支组没有任何明细",
      [{ group: { items: [], rowNumbers: [2] }, kind: "incomeExpense" }],
    ],
  ])("%s时返回 executionInvalid", (_name, units) => {
    expect(
      parseExecuteDataImportBatchForm(buildFormData(units, "-540")),
    ).toEqual(executionInvalid);
  });

  it.each([undefined, "abc", "1.5", "841", "-841"])(
    "非法时区偏移 %s 返回 executionInvalid",
    (timeZoneOffsetMinutes) => {
      expect(
        parseExecuteDataImportBatchForm(
          buildFormData([transferUnit], timeZoneOffsetMinutes),
        ),
      ).toEqual(executionInvalid);
    },
  );
});
