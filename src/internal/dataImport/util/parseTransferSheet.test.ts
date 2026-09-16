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
    日期: "2026-01-05",
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

  it("解析格式正确的一行", () => {
    const result = parseTransferSheet(buildTable([validRowCells()]));
    expect(result.issues).toEqual([]);
    expect(result.rows).toEqual([
      {
        amount: 500,
        fromAccountCurrency: "CNY",
        fromAccountHolders: ["鄧"],
        fromAccountName: "现金",
        note: null,
        rowNumber: 2,
        toAccountCurrency: "CNY",
        toAccountHolders: ["鄧"],
        toAccountName: "招行储蓄卡",
        transactionAt: "2026-01-05",
      },
    ]);
  });

  it("交易类型必须严格等于「转账」", () => {
    const result = parseTransferSheet(
      buildTable([validRowCells({ 交易类型: "支出" })]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ column: "交易类型", kind: "row" }),
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

  it("转出账户与转入账户完全相同（含币种、持有人集合）时报告错误", () => {
    const result = parseTransferSheet(
      buildTable([
        validRowCells({
          转出账户: "现金",
          转出账户持有人: "鄧;聶",
          转入账户: "现金",
          转入账户持有人: "聶;鄧",
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
});
