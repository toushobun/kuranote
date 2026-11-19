import { describe, expect, it } from "vitest";

import {
  calculateTransferRate,
  transferAmountsAfterAccountChange,
} from "./transferCurrency";

describe("calculateTransferRate", () => {
  it("JPY→CNY 与 CNY→JPY 都以 1 CNY 为基准并保留四位有效数字", () => {
    expect(calculateTransferRate("100000", "4850", "JPY", "CNY")).toEqual({
      base: "CNY",
      quote: "JPY",
      value: "20.62",
    });
    expect(calculateTransferRate("4850", "100000", "CNY", "JPY")).toEqual({
      base: "CNY",
      quote: "JPY",
      value: "20.62",
    });
  });

  it("两边金额一样时比值为 1", () => {
    expect(calculateTransferRate("100", "100", "JPY", "CNY")).toEqual({
      base: "CNY",
      quote: "JPY",
      value: "1",
    });
  });

  it("极小极大、缺值与非法精度均不会展示无效汇率", () => {
    expect(
      calculateTransferRate("999999999999", "0.01", "JPY", "CNY")?.base,
    ).toBe("CNY");
    expect(calculateTransferRate("1", "999999999999", "JPY", "JPY")?.base).toBe(
      "JPY",
    );
    expect(calculateTransferRate("0", "100", "JPY", "CNY")).toBeNull();
    expect(calculateTransferRate("100", "", "JPY", "CNY")).toBeNull();
    expect(calculateTransferRate("100.5", "50", "JPY", "CNY")).toBeNull();
  });
});

describe("transferAmountsAfterAccountChange", () => {
  it("跨币种转为同币种，保留没改币种的一边", () => {
    const base = {
      sourceCurrency: "JPY",
      targetCurrency: "CNY",
      amount: "100000",
      targetAmount: "4850",
    };
    expect(
      transferAmountsAfterAccountChange({
        ...base,
        changedSide: "source",
        nextCurrency: "CNY",
      }),
    ).toEqual({ amount: "4850", targetAmount: "" });
    expect(
      transferAmountsAfterAccountChange({
        ...base,
        changedSide: "target",
        nextCurrency: "JPY",
      }),
    ).toEqual({ amount: "100000", targetAmount: "" });
  });
  it("只清空币种改变的一边，原币种未变可保留", () => {
    const base = {
      sourceCurrency: "JPY",
      targetCurrency: "CNY",
      amount: "100000",
      targetAmount: "4850",
    };
    expect(
      transferAmountsAfterAccountChange({
        ...base,
        changedSide: "source",
        nextCurrency: "USD",
      }),
    ).toEqual({ amount: "", targetAmount: "4850" });
    expect(
      transferAmountsAfterAccountChange({
        ...base,
        changedSide: "target",
        nextCurrency: "USD",
      }),
    ).toEqual({ amount: "100000", targetAmount: "" });
    expect(
      transferAmountsAfterAccountChange({
        ...base,
        changedSide: "source",
        nextCurrency: "JPY",
      }),
    ).toEqual({ amount: "100000", targetAmount: "4850" });
  });
  it("同币种转跨币种时留下原币种金额，并清空新币种金额", () => {
    expect(
      transferAmountsAfterAccountChange({
        changedSide: "source",
        sourceCurrency: "JPY",
        targetCurrency: "JPY",
        nextCurrency: "CNY",
        amount: "5000",
        targetAmount: "",
      }),
    ).toEqual({ amount: "", targetAmount: "5000" });
    expect(
      transferAmountsAfterAccountChange({
        changedSide: "target",
        sourceCurrency: "JPY",
        targetCurrency: "JPY",
        nextCurrency: "CNY",
        amount: "5000",
        targetAmount: "",
      }),
    ).toEqual({ amount: "5000", targetAmount: "" });
  });
});
