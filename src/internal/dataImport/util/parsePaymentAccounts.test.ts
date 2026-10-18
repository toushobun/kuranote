import { describe, expect, it } from "vitest";
import { parsePaymentAccounts, splitPaymentCell } from "./parsePaymentAccounts";

const texts = {
  账户: "礼品卡；信用卡",
  账户持有人: "；小明",
  账户币种: "jpy",
  账户类型: "其他；信用卡",
  付款金额: "2000；1500",
};

describe("parsePaymentAccounts", () => {
  it("拆分中英文分号并保留首尾空位置", () => {
    expect(splitPaymentCell(" ; 小明； ")).toEqual(["", "小明", ""]);
  });
  it.each(["；", ";"])("支持分隔符 %s、空格及持有人部分留空", (separator) => {
    const input = Object.fromEntries(
      Object.entries(texts).map(([key, value]) => [
        key,
        value.replaceAll("；", ` ${separator} `),
      ]),
    ) as typeof texts;
    expect(parsePaymentAccounts(input)).toEqual({
      ok: true,
      payments: [
        {
          accountName: "礼品卡",
          accountHolder: null,
          accountType: "other",
          accountCurrency: "JPY",
          amount: "2000",
        },
        {
          accountName: "信用卡",
          accountHolder: "小明",
          accountType: "credit_card",
          accountCurrency: "JPY",
          amount: "1500",
        },
      ],
    });
  });
  it("持有人整格留空表示全部无持有人", () => {
    const result = parsePaymentAccounts({ ...texts, 账户持有人: "" });
    expect(
      result.ok && result.payments.map((payment) => payment.accountHolder),
    ).toEqual([null, null]);
  });
  it.each([
    { 账户持有人: "小明" },
    { 账户类型: "其他" },
    { 付款金额: "3500" },
    { 付款金额: "2000；-1" },
    { 付款金额: "2000；1.234" },
    { 付款金额: "2000；" },
    { 账户: "；信用卡" },
    { 账户: "卡；带分号；信用卡" },
  ])("拒绝个数不齐或非法金额、账户：%j", (overrides) => {
    expect(parsePaymentAccounts({ ...texts, ...overrides }).ok).toBe(false);
  });
  it("多账户允许零金额并保留顺序", () => {
    const result = parsePaymentAccounts({ ...texts, 付款金额: "0；3500" });
    expect(
      result.ok && result.payments.map((payment) => payment.amount),
    ).toEqual(["0", "3500"]);
  });
  it("单账户必须留空付款金额", () => {
    const single = {
      ...texts,
      账户: "现金",
      账户持有人: "",
      账户类型: "现金",
      付款金额: "",
    };
    expect(parsePaymentAccounts(single)).toMatchObject({
      ok: true,
      payments: [{ amount: null }],
    });
    expect(parsePaymentAccounts({ ...single, 付款金额: "3500" })).toMatchObject(
      { ok: false, column: "付款金额" },
    );
  });
});
