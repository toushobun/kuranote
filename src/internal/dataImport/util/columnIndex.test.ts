import { describe, expect, it } from "vitest";

import type { ParsedTable } from "internal/dataImport/entity/parsedTable";
import {
  findColumnStructuralIssues,
  findUnknownColumns,
} from "internal/dataImport/util/columnIndex";

const columns = [{ name: "账户" }, { name: "账户币种" }];

describe("findUnknownColumns", () => {
  it("表头全部是已知列名时返回空数组", () => {
    expect(findUnknownColumns(["账户", "账户币种"], columns)).toEqual([]);
  });

  it("找出不属于已知列名的列，按出现顺序返回", () => {
    expect(
      findUnknownColumns(["账户", "币种", "账户币种", "备注"], columns),
    ).toEqual(["币种", "备注"]);
  });

  it("同一个未知列名重复出现时只返回一次", () => {
    expect(findUnknownColumns(["账户持有人", "账户持有人"], columns)).toEqual([
      "账户持有人",
    ]);
  });

  it("忽略空白列名和首尾空白", () => {
    expect(findUnknownColumns(["  ", " 账户 ", "备注"], columns)).toEqual([
      "备注",
    ]);
  });
});

describe("findColumnStructuralIssues", () => {
  const structuralColumns = [
    { name: "账户", required: true },
    { name: "账户币种", required: true },
    { name: "备注", required: false },
  ];

  function table(headerRow: string[]): ParsedTable {
    return { headerRow, rows: [], sourceName: "收支" };
  }

  it("表头合法时返回空数组", () => {
    const issues = findColumnStructuralIssues(
      table(["账户", "账户币种", "备注"]),
      structuralColumns,
      "incomeExpense",
    );
    expect(issues).toEqual([]);
  });

  it("缺少必填列时报告结构性错误", () => {
    const issues = findColumnStructuralIssues(
      table(["账户"]),
      structuralColumns,
      "incomeExpense",
    );
    expect(issues).toEqual([
      expect.objectContaining({
        kind: "structural",
        message: "「收支」表缺少必填列：账户币种。",
        sheet: "incomeExpense",
      }),
    ]);
  });

  it("存在无法识别的列时报告结构性错误", () => {
    const issues = findColumnStructuralIssues(
      table(["账户", "账户币种", "多余列"]),
      structuralColumns,
      "transfer",
    );
    expect(issues).toEqual([
      expect.objectContaining({
        kind: "structural",
        message: "「转账」表存在无法识别的列：多余列，请确认列名是否正确。",
        sheet: "transfer",
      }),
    ]);
  });

  it("同时缺少必填列与存在无法识别的列时，两条错误都返回", () => {
    const issues = findColumnStructuralIssues(
      table(["账户", "多余列"]),
      structuralColumns,
      "incomeExpense",
    );
    expect(issues).toHaveLength(2);
  });
});
