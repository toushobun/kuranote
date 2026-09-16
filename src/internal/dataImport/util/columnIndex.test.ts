import { describe, expect, it } from "vitest";

import { findUnknownColumns } from "internal/dataImport/util/columnIndex";

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
