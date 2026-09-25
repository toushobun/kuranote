import { describe, expect, it } from "vitest";
import { makeBalanceAdjustmentTable } from "test/mocks/dataImport";
import { parseBalanceAdjustmentSheet } from "./parseBalanceAdjustmentSheet";
import { parseImportAmount } from "./parseImportAmount";

describe("parseBalanceAdjustmentSheet", () => {
  it.each(["123.45", "-67.89"])("解析带符号差值 %s 且忽略记账人", (amount) => {
    const result = parseBalanceAdjustmentSheet(
      makeBalanceAdjustmentTable([{ 金额: amount }]),
    );
    expect(result.issues).toEqual([]);
    expect(result.rows).toMatchObject([
      {
        amount: Number(amount),
        accountName: "现金",
        rowNumber: 2,
        note: "初始余额",
      },
    ]);
    expect(result.rows[0]).not.toHaveProperty("recorder");
  });
  it.each([
    "0",
    "-0",
    "abc",
    "1.234",
    "1000000000000",
    "-1000000000000",
    "Infinity",
    "1e3",
  ])("拒绝无效金额 %s", (金额) => {
    expect(
      parseBalanceAdjustmentSheet(makeBalanceAdjustmentTable([{ 金额 }])),
    ).toMatchObject({ rows: [], issues: [{ column: "金额" }] });
  });
  it.each([
    ["日期", "2026-02-30 12:00:00"],
    ["交易类型", "转账"],
    ["账户", ""],
    ["账户币种", "日元"],
    ["备注", "字".repeat(2001)],
  ])("拒绝无效的 %s", (column, value) => {
    expect(
      parseBalanceAdjustmentSheet(
        makeBalanceAdjustmentTable([{ [column]: value }]),
      ),
    ).toMatchObject({ rows: [], issues: [{ column }] });
  });
  it("解析账户类型，空值或无法识别时报告「账户类型」列的行错误", () => {
    const result = parseBalanceAdjustmentSheet(
      makeBalanceAdjustmentTable([
        { 账户类型: " 银行卡 " },
        { 账户类型: "" },
        { 账户类型: "储蓄" },
      ]),
    );
    expect(result.rows).toMatchObject([{ accountType: "bank", rowNumber: 2 }]);
    expect(
      result.issues.map((issue) =>
        issue.kind === "row"
          ? [issue.sheet, issue.rowNumber, issue.column]
          : null,
      ),
    ).toEqual([
      ["balanceAdjustment", 3, "账户类型"],
      ["balanceAdjustment", 4, "账户类型"],
    ]);
  });

  it("缺少必填列时不解析行", () => {
    const table = makeBalanceAdjustmentTable();
    table.headerRow = ["账户"];
    expect(parseBalanceAdjustmentSheet(table)).toMatchObject({
      rows: [],
      issues: [{ kind: "structural" }],
    });
  });
  it("负数选项不改变收支和转账的默认校验", () => {
    expect(parseImportAmount("-1")).toEqual({ ok: false });
    expect(parseImportAmount("-1", { allowZero: false })).toEqual({
      ok: false,
    });
    expect(parseImportAmount("-1", { allowNegative: true })).toEqual({
      ok: true,
      value: -1,
    });
  });
});
