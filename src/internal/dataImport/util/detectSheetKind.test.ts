import { describe, expect, it } from "vitest";

import { detectSheetKind } from "internal/dataImport/util/detectSheetKind";

describe("detectSheetKind", () => {
  it("识别「收支」表头", () => {
    expect(
      detectSheetKind([
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
      ]),
    ).toBe("incomeExpense");
  });

  it("识别「转账」表头", () => {
    expect(
      detectSheetKind([
        "交易类型",
        "日期",
        "记账人",
        "转出账户",
        "转出账户币种",
        "转出账户持有人",
        "转入账户",
        "转入账户币种",
        "转入账户持有人",
        "金额",
        "备注",
      ]),
    ).toBe("transfer");
  });

  it("识别「余额变更」表头", () => {
    expect(
      detectSheetKind([
        "交易类型",
        "日期",
        "记账人",
        "账户",
        "账户币种",
        "账户持有人",
        "金额",
        "备注",
      ]),
    ).toBe("balanceAdjustment");
  });

  it("无法识别的表头返回 null", () => {
    expect(detectSheetKind(["姓名", "电话"])).toBeNull();
  });

  it("忽略列名首尾空白", () => {
    expect(detectSheetKind([" 商家 ", " 一级分类 "])).toBe("incomeExpense");
  });
});
