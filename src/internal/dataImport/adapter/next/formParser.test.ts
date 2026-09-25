// @vitest-environment node

import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseExecuteDataImportBatchForm } from "internal/dataImport/adapter/next/formParser";
import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";
import { dataImportErrorCodes } from "internal/dataImport/errors";
import {
  importBatchSize,
  importHolderMappingMaxEntries,
} from "internal/dataImport/schema";
import { analyzeImportFile } from "internal/dataImport/util/analyzeImportFile";

const incomeExpenseUnit: ImportExecutionUnit = {
  group: {
    items: [
      {
        accountCurrency: "JPY",
        accountHolder: null,
        accountName: "钱包",
        accountType: "cash",
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
    fromAccountType: "cash",
    note: "备注",
    rowNumber: 3,
    toAccountCurrency: "JPY",
    toAccountHolder: null,
    toAccountName: "银行卡",
    toAccountType: "bank",
    transactionAt: "2026-09-17 10:00:00",
  },
};

const balanceAdjustmentUnit: ImportExecutionUnit = {
  kind: "balanceAdjustment",
  row: {
    accountCurrency: "JPY",
    accountHolder: "淞文",
    accountName: "现金",
    accountType: "cash",
    amount: -20.5,
    note: null,
    rowNumber: 4,
    transactionAt: "2026-09-17 10:00:00",
  },
};

function buildFormData(
  units?: unknown,
  timeZoneOffsetMinutes?: string,
  holderMapping?: unknown,
) {
  const formData = new FormData();
  if (holderMapping !== undefined) {
    formData.set(
      "holderMapping",
      typeof holderMapping === "string"
        ? holderMapping
        : JSON.stringify(holderMapping),
    );
  }
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
        holderMapping: {},
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
      value: {
        holderMapping: {},
        timeZoneOffsetMinutes: -540,
        units: [balanceAdjustmentUnit],
      },
    });
  });

  describe("持有人映射", () => {
    const userId = "00000000-0000-4000-8000-000000000031";
    const placeholderId = "00000000-0000-4000-8000-000000000051";

    it("解析四种互斥的映射取值", () => {
      const holderMapping = {
        小明: { kind: "member", userId },
        小红: { kind: "none" },
        奶奶: { kind: "placeholder", placeholderId },
        外婆: { displayName: "外婆", kind: "newPlaceholder" },
      };

      expect(
        parseExecuteDataImportBatchForm(
          buildFormData([transferUnit], "-540", holderMapping),
        ),
      ).toEqual({
        ok: true,
        value: {
          holderMapping,
          timeZoneOffsetMinutes: -540,
          units: [transferUnit],
        },
      });
    });

    it("映射条目数量不超过上限时可以通过", () => {
      const holderMapping = Object.fromEntries(
        Array.from({ length: importHolderMappingMaxEntries }, (_, index) => [
          `姓名${index}`,
          { kind: "none" },
        ]),
      );

      expect(
        parseExecuteDataImportBatchForm(
          buildFormData([transferUnit], "-540", holderMapping),
        ).ok,
      ).toBe(true);
    });

    it("新建待邀请成员的名字恰好 100 个字符时可以通过", () => {
      const name = "あ".repeat(100);
      expect(
        parseExecuteDataImportBatchForm(
          buildFormData([transferUnit], "-540", {
            [name]: { displayName: name, kind: "newPlaceholder" },
          }),
        ).ok,
      ).toBe(true);
    });

    it.each([
      ["不是合法 JSON", "{not json"],
      ["不是对象", ["小明"]],
      ["是旧格式的 userId 字符串", { 小明: userId }],
      ["是旧格式的 null", { 小明: null }],
      ["未知的 kind", { 小明: { kind: "guest" } }],
      ["缺少 kind", { 小明: { userId } }],
      ["member 的 userId 不是 UUID", { 小明: { kind: "member", userId: "u" } }],
      ["member 缺少 userId", { 小明: { kind: "member" } }],
      [
        "member 同时带有占位 ID",
        { 小明: { kind: "member", placeholderId, userId } },
      ],
      ["none 带有多余字段", { 小明: { kind: "none", userId } }],
      [
        "placeholder 的 ID 不是 UUID",
        { 奶奶: { kind: "placeholder", placeholderId: "p-1" } },
      ],
      [
        "placeholder 同时带有 userId",
        { 奶奶: { kind: "placeholder", placeholderId, userId } },
      ],
      [
        "newPlaceholder 名字为空",
        { " ": { displayName: " ", kind: "newPlaceholder" } },
      ],
      [
        "newPlaceholder 名字超过 100 个字符",
        {
          ["あ".repeat(101)]: {
            displayName: "あ".repeat(101),
            kind: "newPlaceholder",
          },
        },
      ],
      [
        "newPlaceholder 名字与文件里的姓名不同",
        { 奶奶: { displayName: "外婆", kind: "newPlaceholder" } },
      ],
      [
        "newPlaceholder 同时带有占位 ID",
        {
          奶奶: { displayName: "奶奶", kind: "newPlaceholder", placeholderId },
        },
      ],
      ["姓名为空", { "": { kind: "none" } }],
      ["姓名超过 200 个字符", { ["名".repeat(201)]: { kind: "none" } }],
      [
        "条目数量超过上限",
        Object.fromEntries(
          Array.from({ length: importHolderMappingMaxEntries + 1 }, (_, i) => [
            `姓名${i}`,
            { kind: "none" },
          ]),
        ),
      ],
    ])("%s时返回 executionInvalid", (_name, holderMapping) => {
      expect(
        parseExecuteDataImportBatchForm(
          buildFormData([transferUnit], "-540", holderMapping),
        ),
      ).toEqual(executionInvalid);
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
        "账户类型",
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
        "现金",
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
    // 「账户类型」填「-」时继承首行的值，服务端复核也要求同组类型一致。
    expect(
      units.flatMap((unit) =>
        unit.kind === "incomeExpense"
          ? unit.group.items.map((item) => item.accountType)
          : [],
      ),
    ).toEqual(["cash", "cash", "cash"]);
  });

  it("同一交易组内的账户类型不一致时拒绝", () => {
    const item = (
      incomeExpenseUnit as Extract<
        ImportExecutionUnit,
        { kind: "incomeExpense" }
      >
    ).group.items[0];
    const unit: ImportExecutionUnit = {
      group: {
        items: [
          { ...item, billRef: "A" },
          { ...item, accountType: "bank", billRef: "A", rowNumber: 3 },
        ],
        rowNumbers: [2, 3],
      },
      kind: "incomeExpense",
    };

    expect(
      parseExecuteDataImportBatchForm(buildFormData([unit], "-540")),
    ).toEqual(executionInvalid);
  });

  it("账户类型不是合法值时拒绝", () => {
    expect(
      parseExecuteDataImportBatchForm(
        buildFormData(
          [
            {
              ...balanceAdjustmentUnit,
              row: {
                ...(
                  balanceAdjustmentUnit as Extract<
                    ImportExecutionUnit,
                    { kind: "balanceAdjustment" }
                  >
                ).row,
                accountType: "savings",
              },
            },
          ],
          "-540",
        ),
      ),
    ).toEqual(executionInvalid);
  });
});
