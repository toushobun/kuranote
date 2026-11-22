import { describe, expect, it } from "vitest";

import {
  calculateTransferDifference,
  divideAmountByExchangeRate,
  calculateTransferRate,
  formatTransferRate,
  prefillTransferTargetAmount,
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
    expect(calculateTransferRate("1.2345", "2", "BHD", "CNY")).toBeNull();
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
  it("先选转入账户并填写金额后，补选转出账户时按币种保留金额", () => {
    const input = {
      changedSide: "source" as const,
      sourceCurrency: "",
      targetCurrency: "JPY",
      amount: "5000",
      targetAmount: "",
    };
    expect(
      transferAmountsAfterAccountChange({ ...input, nextCurrency: "CNY" }),
    ).toEqual({ amount: "", targetAmount: "5000" });
    expect(
      transferAmountsAfterAccountChange({ ...input, nextCurrency: "JPY" }),
    ).toEqual({ amount: "5000", targetAmount: "" });
  });

  it("只有转入账户时，切换币种清空单行金额，同币种更换账户则保留", () => {
    const input = {
      changedSide: "target" as const,
      sourceCurrency: "",
      targetCurrency: "JPY",
      amount: "5000",
      targetAmount: "",
    };
    expect(
      transferAmountsAfterAccountChange({ ...input, nextCurrency: "CNY" }),
    ).toEqual({ amount: "", targetAmount: "" });
    expect(
      transferAmountsAfterAccountChange({ ...input, nextCurrency: "JPY" }),
    ).toEqual({ amount: "5000", targetAmount: "" });
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

describe("按当天汇率预填与差额", () => {
  it("JPY/KRW 四舍五入到整数，CNY 保留两位小数", () => {
    expect(prefillTransferTargetAmount("10", "CNY", "JPY", 21.05)).toBe("211");
    expect(prefillTransferTargetAmount("10", "CNY", "KRW", 208.57)).toBe(
      "2086",
    );
    expect(prefillTransferTargetAmount("100", "JPY", "CNY", 0.047505)).toBe(
      "4.75",
    );
    expect(prefillTransferTargetAmount("1", "USD", "EUR", 1.005)).toBe("1.01");
    expect(prefillTransferTargetAmount("1", "USD", "EUR", 1.015)).toBe("1.02");
    expect(prefillTransferTargetAmount("1", "USD", "JPY", 1.5)).toBe("2");
    expect(prefillTransferTargetAmount("100", "JPY", "CNY", 1e-7)).toBe("");
  });

  it("来源金额为空、精度无效或缺少汇率时不预填", () => {
    expect(prefillTransferTargetAmount("", "JPY", "CNY", 0.05)).toBe("");
    expect(prefillTransferTargetAmount("10.5", "JPY", "CNY", 0.05)).toBe("");
    expect(prefillTransferTargetAmount("100", "JPY", "CNY", null)).toBe("");
    expect(prefillTransferTargetAmount("100", "JPY", "CNY", 0)).toBe("");
  });

  it("多到账、少到账与零差额按实际预填的币种精度计算", () => {
    expect(
      calculateTransferDifference("100", "2150", "CNY", "JPY", 21),
    ).toEqual({
      diff: 50,
      sourceEquivalent: 50 / 21,
      percent: (50 / 2100) * 100,
    });
    expect(
      calculateTransferDifference("100", "2050", "CNY", "JPY", 21)?.diff,
    ).toBe(-50);
    expect(
      calculateTransferDifference("100", "2100", "CNY", "JPY", 21)?.diff,
    ).toBe(0);
    expect(
      calculateTransferDifference("100", "211", "CNY", "JPY", 2.105)?.diff,
    ).toBe(0);
  });

  it("实际汇率与当天汇率共用大于一的方向和四位有效数字", () => {
    expect(formatTransferRate(21.052631, "CNY", "JPY")).toEqual({
      base: "CNY",
      quote: "JPY",
      value: "21.05",
    });
    expect(formatTransferRate(1 / 21.052631, "JPY", "CNY")).toEqual({
      base: "CNY",
      quote: "JPY",
      value: "21.05",
    });
    expect(formatTransferRate(0, "JPY", "CNY")).toBeNull();
  });
});

describe("divideAmountByExchangeRate", () => {
  it.each([
    ["2000", "JPY", "CNY", 23.8124, "83.99"],
    ["1", "JPY", "CNY", 1e-7, "10000000.00"],
    ["100000", "JPY", "CNY", 1e7, "0.01"],
  ])(
    "直接除法支持普通及指数形式汇率：%s %s → %s，汇率 %s",
    (amount, source, target, rate, expected) => {
      expect(divideAmountByExchangeRate(amount, source, target, rate)).toBe(
        expected,
      );
    },
  );

  it("刚好卡在半分时按 SQL round 正数四舍五入，不先求浮点倒数", () => {
    expect(divideAmountByExchangeRate("1", "JPY", "CNY", 8)).toBe("0.13");
    expect(divideAmountByExchangeRate("1", "JPY", "CNY", 40)).toBe("0.03");
  });

  it("三位小数币种保留精度并在第四位为 5 时进位", () => {
    expect(divideAmountByExchangeRate("1", "JPY", "KWD", 16)).toBe("0.063");
    expect(divideAmountByExchangeRate("1", "JPY", "KWD", 8)).toBe("0.125");
  });

  it("无效来源金额、汇率以及超出输入上限时不生成默认金额", () => {
    expect(divideAmountByExchangeRate("1.5", "JPY", "CNY", 8)).toBe("");
    expect(divideAmountByExchangeRate("0", "JPY", "CNY", 8)).toBe("");
    expect(divideAmountByExchangeRate("1", "JPY", "CNY", null)).toBe("");
    expect(divideAmountByExchangeRate("1", "JPY", "CNY", 0)).toBe("");
    expect(divideAmountByExchangeRate("1", "JPY", "CNY", Number.NaN)).toBe("");
    expect(divideAmountByExchangeRate("1", "JPY", "CNY", Infinity)).toBe("");
    expect(divideAmountByExchangeRate("999999999999", "JPY", "CNY", 1e-7)).toBe(
      "",
    );
  });
});
