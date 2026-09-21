// @vitest-environment node

import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseExecuteDataImportBatchForm } from "internal/dataImport/adapter/next/formParser";
import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";
import { dataImportErrorCodes } from "internal/dataImport/errors";
import { importBatchSize } from "internal/dataImport/schema";
import { analyzeImportFile } from "internal/dataImport/util/analyzeImportFile";

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

const balanceAdjustmentUnit: ImportExecutionUnit = {
  kind: "balanceAdjustment",
  row: {
    accountCurrency: "JPY",
    accountHolder: "淞文",
    accountName: "现金",
    amount: -20.5,
    note: null,
    rowNumber: 4,
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

  it("余额变更单元保留带符号差值", () => {
    expect(
      parseExecuteDataImportBatchForm(
        buildFormData([balanceAdjustmentUnit], "-540"),
      ),
    ).toEqual({
      ok: true,
      value: { timeZoneOffsetMinutes: -540, units: [balanceAdjustmentUnit] },
    });
  });

  it.each([0, 1e12, -1e12, 1.234])("拒绝非法的余额变更金额 %s", (amount) => {
    const unit = {
      ...balanceAdjustmentUnit,
      row: { ...balanceAdjustmentUnit.row, amount },
    };
    expect(parseExecuteDataImportBatchForm(buildFormData([unit], "0"))).toEqual(
      executionInvalid,
    );
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
      "同组明细的账户不一致",
      [
        {
          ...incomeExpenseUnit,
          group: {
            items: [
              incomeExpenseUnit.group.items[0],
              {
                ...incomeExpenseUnit.group.items[0],
                accountName: "银行卡",
                rowNumber: 3,
              },
            ],
            rowNumbers: [2, 3],
          },
        },
      ],
    ],
    [
      "同组明细的交易类型不一致",
      [
        {
          ...incomeExpenseUnit,
          group: {
            items: [
              incomeExpenseUnit.group.items[0],
              {
                ...incomeExpenseUnit.group.items[0],
                rowNumber: 3,
                transactionType: "income",
              },
            ],
            rowNumbers: [2, 3],
          },
        },
      ],
    ],
    [
      "rowNumbers 与明细不对应",
      [
        {
          ...incomeExpenseUnit,
          group: { ...incomeExpenseUnit.group, rowNumbers: [9] },
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

  it("浏览器端由「账单关联」合并出的真实分组能通过服务端复核", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("收支");
    sheet.addRows([
      [
        "账单关联",
        "日期",
        "记账人",
        "商家分类",
        "商家",
        "交易类型",
        "一级分类",
        "二级分类",
        "账户",
        "账户持有人",
        "账户币种",
        "金额",
        "备注",
      ],
      [
        "A",
        "2026-09-17 10:00:00",
        "",
        "",
        "超市",
        "支出",
        "餐饮",
        "食材",
        "现金",
        "",
        "jpy",
        "100",
        "备注",
      ],
      [
        "A",
        "-",
        "",
        "-",
        "-",
        "支出",
        "日用",
        "纸巾",
        "-",
        "-",
        "-",
        "50",
        "-",
      ],
      [
        "A",
        "-",
        "",
        "-",
        "-",
        "收入",
        "其他",
        "退款",
        "-",
        "-",
        "-",
        "20",
        "-",
      ],
    ]);
    const buffer = await workbook.xlsx.writeBuffer();

    const { units } = await analyzeImportFile(new File([buffer], "bill.xlsx"));
    const result = parseExecuteDataImportBatchForm(
      buildFormData(units, "-540"),
    );

    expect(units).toHaveLength(2);
    expect(result.ok).toBe(true);
  });
});
