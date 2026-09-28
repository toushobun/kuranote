import { describe, expect, it } from "vitest";

import { parseAccountType } from "internal/dataImport/util/parseAccountType";

describe("parseAccountType", () => {
  it.each([
    ["现金", "cash"],
    ["银行卡", "bank"],
    ["信用卡", "credit_card"],
    ["电子钱包", "e_money"],
    ["其他", "other"],
  ])("「%s」映射为 %s", (label, value) => {
    expect(parseAccountType(label, "账户类型")).toEqual({ ok: true, value });
  });

  it("去掉首尾空格后再映射", () => {
    expect(parseAccountType("  电子钱包\t", "账户类型")).toEqual({
      ok: true,
      value: "e_money",
    });
  });

  it("空值报错，不兜底为「其他」，报错文案包含列名和可填值", () => {
    expect(parseAccountType("   ", "转出账户类型")).toEqual({
      message:
        "转出账户类型不能为空，请填写：现金、银行卡、信用卡、电子钱包、其他。",
      ok: false,
    });
  });

  it("无法识别的值报错，报错文案包含列名、原值和可填值", () => {
    expect(parseAccountType(" cash ", "账户类型")).toEqual({
      message:
        "账户类型「cash」无法识别，请填写：现金、银行卡、信用卡、电子钱包、其他。",
      ok: false,
    });
  });
});
