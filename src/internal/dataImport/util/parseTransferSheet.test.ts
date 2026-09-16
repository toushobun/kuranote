import { describe, expect, it } from "vitest";

import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import { transferColumns } from "internal/dataImport/schema";
import { parseTransferSheet } from "internal/dataImport/util/parseTransferSheet";

const header = transferColumns.map((column) => column.name);

function buildTable(rows: string[][]): ParsedTable {
  return {
    headerRow: header,
    rows: rows.map((cells, index) => ({ cells, rowNumber: index + 2 })),
    sourceName: "转账",
  };
}

function validRowCells(overrides: Partial<Record<string, string>> = {}) {
  const values: Record<string, string> = {
    交易类型: "转账",
    备注: "",
    日期: "2026-01-05 12:00:00",
    转出账户: "现金",
    转出账户币种: "CNY",
    转出账户持有人: "鄧",
    转入账户: "招行储蓄卡",
    转入账户币种: "CNY",
    转入账户持有人: "鄧",
    金额: "500",
    记账人: "忽略此列",
  };
  Object.assign(values, overrides);
  return header.map((name) => values[name]);
}

describe("parseTransferSheet", () => {
  it("缺少必填列时返回结构性错误", () => {
    const table: ParsedTable = {
      headerRow: ["转出账户", "转入账户"],
      rows: [],
      sourceName: "转账",
    };
    const result = parseTransferSheet(table);
    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: "structural", sheet: "transfer" }),
    ]);
  });

  it("表头存在无法识别的列时返回结构性错误，不解析任何行", () => {
    const table: ParsedTable = {
      headerRow: [...header, "备注1"],
      rows: [
        {
          cells: [...validRowCells(), "多出来的列"],
          rowNumber: 2,
        },
      ],
      sourceName: "转账",
    };

    const result = parseTransferSheet(table);

    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: "structural",
        message: expect.stringContaining("备注1"),
        sheet: "transfer",
      }),
    ]);
  });

  it("转出/转入两侧共用不带前缀的列名（如只写「账户币种」）时，既报缺列也报无法识别的列", () => {
    const table: ParsedTable = {
      headerRow: [
        "交易类型",
        "转出账户",
        "账户币种",
        "账户持有人",
        "转入账户",
        "账户币种",
        "账户持有人",
        "金额",
        "日期",
        "记账人",
        "备注",
      ],
      rows: [
        {
          cells: [
            "转账",
            "Debit",
            "JPY",
            "鄧",
            "现金",
            "JPY",
            "鄧",
            "500",
            "2026-01-05 12:00:00",
            "鄧",
            "",
          ],
          rowNumber: 2,
        },
      ],
      sourceName: "转账",
    };

    const result = parseTransferSheet(table);

    expect(result.rows).toEqual([]);
    expect(
      result.issues.some(
        (issue) =>
          issue.message.includes("缺少必填列") &&
          issue.message.includes("转出账户币种") &&
          issue.message.includes("转入账户币种"),
      ),
    ).toBe(true);
    expect(
      result.issues.some(
        (issue) =>
          issue.message.includes("无法识别的列") &&
          issue.message.includes("账户币种") &&
          issue.message.includes("账户持有人"),
      ),
    ).toBe(true);
  });

  it("解析格式正确的一行", () => {
    const result = parseTransferSheet(buildTable([validRowCells()]));
    expect(result.issues).toEqual([]);
    expect(result.rows).toEqual([
      {
        amount: 500,
        fromAccountCurrency: "CNY",
        fromAccountHolder: "鄧",
        fromAccountName: "现金",
        note: null,
        rowNumber: 2,
        toAccountCurrency: "CNY",
        toAccountHolder: "鄧",
        toAccountName: "招行储蓄卡",
        transactionAt: "2026-01-05 12:00:00",
      },
    ]);
  });

  it("持有人列留空时解析为 null（0 个持有人）", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 转出账户持有人: "", 转入账户持有人: "" })]),
    );
    expect(result.issues).toEqual([]);
    expect(result.rows[0].fromAccountHolder).toBeNull();
    expect(result.rows[0].toAccountHolder).toBeNull();
  });

  it("交易类型必须严格等于「转账」", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 交易类型: "支出" })]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "交易类型", kind: "row" }),
    ]);
  });

  it("日期格式不正确（缺少时间部分）时报告错误", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 日期: "2026-01-05" })]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "日期", kind: "row" }),
    ]);
  });

  it("金额为 0 时报告错误（转账金额必须大于 0）", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 金额: "0" })]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "金额", kind: "row" }),
    ]);
  });

  it("转出账户与转入账户完全相同（含币种、持有人）时报告错误", () => {
    const result = parseTransferSheet(
      buildTable([
        validRowCells({
          转出账户: "现金",
          转出账户持有人: "鄧",
          转入账户: "现金",
          转入账户持有人: "鄧",
        }),
      ]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "转入账户", kind: "row" }),
    ]);
  });

  it("账户名相同但持有人不同时视为不同账户，允许转账", () => {
    const result = parseTransferSheet(
      buildTable([
        validRowCells({
          转出账户: "Debit",
          转出账户持有人: "鄧",
          转入账户: "Debit",
          转入账户持有人: "聶",
        }),
      ]),
    );
    expect(result.issues).toEqual([]);
  });

  it("转出/转入账户均为空时，不会因为两者都是空字符串而误报「账户相同」", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 转出账户: "", 转入账户: "" })]),
    );
    expect(
      result.issues.map((issue) => issue.kind === "row" && issue.column),
    ).toEqual(["转出账户", "转入账户"]);
  });

  it("转出账户持有人填多个持有人（分号分隔）时报告格式错误", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 转出账户持有人: "鄧;聶" })]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "转出账户持有人", kind: "row" }),
    ]);
  });

  it("转入账户持有人填多个持有人（分号分隔）时报告格式错误", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 转入账户持有人: "鄧；聶" })]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "转入账户持有人", kind: "row" }),
    ]);
  });

  it("同一行内其它字段（如金额）已报错时，仍会一并报告转出/转入账户相同的错误", () => {
    const result = parseTransferSheet(
      buildTable([
        validRowCells({
          金额: "0",
          转出账户: "现金",
          转出账户持有人: "鄧",
          转入账户: "现金",
          转入账户持有人: "鄧",
        }),
      ]),
    );
    expect(
      result.issues.map((issue) => issue.kind === "row" && issue.column),
    ).toEqual(["金额", "转入账户"]);
  });
});
