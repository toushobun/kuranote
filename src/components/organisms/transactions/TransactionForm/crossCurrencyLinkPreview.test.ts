import { describe, expect, it } from "vitest";
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";
import {
  formatCrossCurrencyRate,
  previewCrossCurrencyLink,
} from "./crossCurrencyLinkPreview";

describe("Issue #1147 跨币种退款与报销预览", () => {
  it.each([
    ["JPY", 0],
    ["KRW", 0],
    ["CNY", 2],
    ["KWD", 3],
    ["ZZZ", 0],
  ])("小数位与数据库 transaction_currency_decimal_places 一致：%s", (currency, digits) => {
    expect(getAmountDecimalPlaces(currency)).toBe(digits);
  });

  it.each([
    ["84.00", "2000", "0.01", "83.99"],
    ["83.99", "2000", "0", "83.99"],
    ["80.00", "1905", "0", "80.00"],
  ])("按 11/20 汇率转换 %s CNY", (amount, converted, surplus, folded) => {
    expect(previewCrossCurrencyLink({
      amount,
      incomeCurrency: "CNY",
      targetCurrency: "JPY",
      remainingAmount: "2000",
      rate: 23.8124,
    })).toMatchObject({
      convertedAmount: converted,
      businessNetAmount: surplus,
      foldedBackAmount: folded,
    });
  });

  it("后一笔 40 CNY 抵消剩余 809 JPY，倒赚 5.57 CNY", () => {
    expect(previewCrossCurrencyLink({
      amount: "40.00",
      incomeCurrency: "CNY",
      targetCurrency: "JPY",
      remainingAmount: "809",
      rate: 23.5,
    })).toMatchObject({
      convertedAmount: "940",
      actualTargetAmount: "809",
      foldedBackAmount: "34.43",
      businessNetAmount: "5.57",
    });
  });

  it("缺失或无效汇率时不给出虚假的换算", () => {
    expect(previewCrossCurrencyLink({
      amount: "84.00", incomeCurrency: "CNY", targetCurrency: "JPY",
      remainingAmount: "2000", rate: Number.NaN,
    })).toBeNull();
  });

  it("汇率文案沿用转账的 4 位有效数字，显示实际汇率日期", () => {
    expect(formatCrossCurrencyRate(23.8124, "CNY", "JPY", "2026-11-20")).toEqual({
      base: "CNY",
      quote: "JPY",
      value: "23.81",
      date: "11/20",
    });
  });
});
