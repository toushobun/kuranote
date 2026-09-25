import { describe, expect, it } from "vitest";

import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { incomeExpenseColumns } from "internal/dataImport/schema";
import { parseIncomeExpenseSheet } from "internal/dataImport/util/parseIncomeExpenseSheet";

const header = incomeExpenseColumns.map((column) => column.name);

function buildTable(rows: string[][]): ParsedTable {
  return {
    headerRow: header,
    rows: rows.map((cells, index) => ({ cells, rowNumber: index + 2 })),
    sourceName: "收支",
  };
}

function validRowCells(overrides: Partial<Record<string, string>> = {}) {
  const values: Record<string, string> = {
    一级分类: "餐饮",
    二级分类: "午餐",
    交易类型: "支出",
    备注: "",
    商家: "便利店",
    商家分类: "",
    日期: "2026-01-05 12:00:00",
    账单关联: "",
    账户: "现金",
    账户币种: "CNY",
    账户持有人: "",
    账户类型: "现金",
    金额: "35.5",
    记账人: "忽略此列",
  };
  Object.assign(values, overrides);
  return header.map((name) => values[name]);
}

describe("parseIncomeExpenseSheet", () => {
  it("缺少必填列时返回结构性错误，不解析任何行", () => {
    const table: ParsedTable = {
      headerRow: ["日期", "金额"],
      rows: [{ cells: ["2026-01-01 00:00:00", "100"], rowNumber: 2 }],
      sourceName: "收支",
    };

    const result = parseIncomeExpenseSheet(table);

    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: "structural", sheet: "incomeExpense" }),
    ]);
  });

  it("表头存在无法识别的列时返回结构性错误，不解析任何行", () => {
    const table = buildTable([validRowCells()]);
    table.headerRow = [...header, "关联"];
    table.rows = table.rows.map((row) => ({
      ...row,
      cells: [...row.cells, "1"],
    }));

    const result = parseIncomeExpenseSheet(table);

    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: "structural",
        message: expect.stringContaining("关联"),
        sheet: "incomeExpense",
      }),
    ]);
  });

  it("既缺少必填列又存在无法识别的列时，两条结构性错误都返回", () => {
    const table: ParsedTable = {
      headerRow: ["日期", "金额", "关联"],
      rows: [{ cells: ["2026-01-01 00:00:00", "100", "1"], rowNumber: 2 }],
      sourceName: "收支",
    };

    const result = parseIncomeExpenseSheet(table);

    expect(result.issues).toHaveLength(2);
    expect(
      result.issues.some((issue) => issue.message.includes("缺少必填列")),
    ).toBe(true);
    expect(
      result.issues.some((issue) => issue.message.includes("无法识别的列")),
    ).toBe(true);
  });

  it("解析格式正确的一行", () => {
    const table = buildTable([validRowCells()]);

    const result = parseIncomeExpenseSheet(table);

    expect(result.issues).toEqual([]);
    expect(result.rows).toEqual([
      {
        amount: 35.5,
        billRef: null,
        childCategoryName: "午餐",
        parentCategoryName: "餐饮",
        rowNumber: 2,
        sharedTexts: {
          商家: "便利店",
          商家分类: "",
          日期: "2026-01-05 12:00:00",
          账户: "现金",
          账户币种: "CNY",
          账户持有人: "",
          账户类型: "现金",
          备注: "",
        },
        transactionType: "expense",
      },
    ]);
  });

  it.each(["现金", "银行卡", "信用卡", "电子钱包", "其他", "  信用卡  "])(
    "账户类型「%s」是合法值，不报错",
    (accountType) => {
      const result = parseIncomeExpenseSheet(
        buildTable([validRowCells({ 账户类型: accountType })]),
      );
      expect(result.issues).toEqual([]);
      expect(result.rows).toHaveLength(1);
    },
  );

  it("账户类型为空或无法识别时报告带工作表、行号和列名的行错误", () => {
    const result = parseIncomeExpenseSheet(
      buildTable([
        validRowCells({ 账户类型: "" }),
        validRowCells({ 账户类型: "  储蓄卡 " }),
      ]),
    );
    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      {
        column: "账户类型",
        kind: "row",
        message:
          "账户类型不能为空，请填写：现金、银行卡、信用卡、电子钱包、其他。",
        rowNumber: 2,
        sheet: "incomeExpense",
      },
      {
        column: "账户类型",
        kind: "row",
        message:
          "账户类型「储蓄卡」无法识别，请填写：现金、银行卡、信用卡、电子钱包、其他。",
        rowNumber: 3,
        sheet: "incomeExpense",
      },
    ]);
  });

  it("缺少「账户类型」列时返回结构性错误，不解析任何行", () => {
    const position = header.indexOf("账户类型");
    const table = buildTable([validRowCells()]);
    table.headerRow = header.filter((_, index) => index !== position);
    table.rows = table.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, index) => index !== position),
    }));

    const result = parseIncomeExpenseSheet(table);

    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: "structural",
        message: "「收支」表缺少必填列：账户类型。",
        sheet: "incomeExpense",
      }),
    ]);
  });

  it("不读取「记账人」列内容对结果的影响（仅要求列存在）", () => {
    const table = buildTable([validRowCells({ 记账人: "任意值" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.issues).toEqual([]);
  });

  it("「账户持有人」只保留原始文本，留给分组阶段解析为单个持有人", () => {
    const table = buildTable([validRowCells({ 账户持有人: "鄧" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.rows[0].sharedTexts["账户持有人"]).toBe("鄧");
  });

  it("「账户持有人」填多个持有人（分号分隔）时报告格式错误", () => {
    const table = buildTable([validRowCells({ 账户持有人: "鄧;聶" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "账户持有人", kind: "row" }),
    ]);
  });

  it("日期格式不正确时报告行错误并跳过该行", () => {
    const table = buildTable([validRowCells({ 日期: "2026-01-05" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "日期",
        kind: "row",
        rowNumber: 2,
        sheet: "incomeExpense",
      }),
    ]);
  });

  it("交易类型不是「支出」或「收入」时报告错误", () => {
    const table = buildTable([validRowCells({ 交易类型: "转账" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "交易类型", kind: "row" }),
    ]);
  });

  it("金额超过两位小数时报告错误", () => {
    const table = buildTable([validRowCells({ 金额: "35.555" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "金额", kind: "row" }),
    ]);
  });

  it("账户币种格式不正确时报告错误", () => {
    const table = buildTable([validRowCells({ 账户币种: "人民币" })]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "账户币种", kind: "row" }),
    ]);
  });

  it("商家 / 一级分类 / 账户为空时分别报告错误", () => {
    const table = buildTable([
      validRowCells({ 商家: "" }),
      validRowCells({ 一级分类: "" }),
      validRowCells({ 账户: "" }),
    ]);
    const result = parseIncomeExpenseSheet(table);
    expect(
      result.issues.map((issue) => issue.kind === "row" && issue.column),
    ).toEqual(["商家", "一级分类", "账户"]);
  });

  it("一行出现多个错误时全部报告", () => {
    const table = buildTable([
      validRowCells({ 商家: "", 一级分类: "", 金额: "abc" }),
    ]);
    const result = parseIncomeExpenseSheet(table);
    expect(result.issues).toHaveLength(3);
  });

  describe("账单关联占位符「-」", () => {
    it("账单关联非空时，共享字段填「-」视为合法占位，不报错", () => {
      const table = buildTable([
        validRowCells({
          账单关联: "BILL-1",
          账户: "-",
          账户币种: "-",
          商家: "-",
          日期: "-",
          备注: "-",
        }),
      ]);
      const result = parseIncomeExpenseSheet(table);
      expect(result.issues).toEqual([]);
      expect(result.rows[0].sharedTexts["日期"]).toBe("-");
      expect(result.rows[0].sharedTexts["账户"]).toBe("-");
    });

    it("账单关联为空时，「-」按普通值校验，格式不合法的字段仍报错", () => {
      const table = buildTable([
        validRowCells({ 账单关联: "", 日期: "-", 账户币种: "-" }),
      ]);
      const result = parseIncomeExpenseSheet(table);
      expect(
        result.issues.map((issue) => issue.kind === "row" && issue.column),
      ).toEqual(["日期", "账户币种"]);
    });

    it("账单关联为空时，「-」作为无格式约束的账户名/ 商家名可以直接通过", () => {
      const table = buildTable([
        validRowCells({ 账单关联: "", 账户: "-", 商家: "-" }),
      ]);
      const result = parseIncomeExpenseSheet(table);
      expect(result.issues).toEqual([]);
      expect(result.rows[0].sharedTexts["账户"]).toBe("-");
    });
  });
});
