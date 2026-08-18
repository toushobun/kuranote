import { describe, expect, it } from "vitest";

import {
  calculateRemainingOffsetMinorUnits,
  formatRefundMinorUnits,
  summarizeRefundAllocationAmounts,
  summarizeReimbursementAllocationAmounts,
  toRefundMinorUnits,
} from "./refundAllocation";

describe("refund amount minor units", () => {
  it("小数金额不经过浮点运算即可精确转换", () => {
    expect(toRefundMinorUnits(0.1)).toBe(BigInt(10));
    expect(toRefundMinorUnits("0.20")).toBe(BigInt(20));
    expect(formatRefundMinorUnits(BigInt(30))).toBe("0.3");
  });
});

describe("calculateRemainingOffsetMinorUnits", () => {
  it("按原金额减去退款与报销金额计算组合剩余额度", () => {
    expect(calculateRemainingOffsetMinorUnits("100", "20", "30")).toBe(
      BigInt(5000),
    );
    expect(calculateRemainingOffsetMinorUnits("0.07", "0.01", "0.06")).toBe(
      BigInt(0),
    );
  });

  it("组合核销超过原金额时将剩余额度收敛为 0", () => {
    expect(calculateRemainingOffsetMinorUnits("100", "70", "40")).toBe(
      BigInt(0),
    );
  });

  it("金额精度无效时返回 null", () => {
    expect(calculateRemainingOffsetMinorUnits("1.001", "0", "0")).toBeNull();
    expect(calculateRemainingOffsetMinorUnits("1", "0.001", "0")).toBeNull();
    expect(calculateRemainingOffsetMinorUnits("1", "0", "0.001")).toBeNull();
  });
});

describe("summarizeRefundAllocationAmounts", () => {
  it("按收入金额与单目标剩余额度较小值计算核销金额和净收益", () => {
    expect(summarizeRefundAllocationAmounts("600", "1000")).toEqual({
      allocatedAmount: "600",
      incomeAmount: "600",
      netIncomeAmount: "0",
    });
    expect(summarizeRefundAllocationAmounts("1000", "1000")).toEqual({
      allocatedAmount: "1000",
      incomeAmount: "1000",
      netIncomeAmount: "0",
    });
    expect(summarizeRefundAllocationAmounts("1500", "1000")).toEqual({
      allocatedAmount: "1000",
      incomeAmount: "1500",
      netIncomeAmount: "500",
    });
  });

  it("金额精度无效时拒绝计算退款核销金额", () => {
    expect(summarizeRefundAllocationAmounts("1.001", "1000")).toBeNull();
    expect(summarizeRefundAllocationAmounts("1000", "1.001")).toBeNull();
  });
});

describe("summarizeReimbursementAllocationAmounts", () => {
  it("按收入金额与剩余额度较小值计算核销金额和净收益", () => {
    expect(summarizeReimbursementAllocationAmounts("600", "1000")).toEqual({
      allocatedAmount: "600",
      incomeAmount: "600",
      netIncomeAmount: "0",
    });
    expect(summarizeReimbursementAllocationAmounts("1000", "1000")).toEqual({
      allocatedAmount: "1000",
      incomeAmount: "1000",
      netIncomeAmount: "0",
    });
    expect(summarizeReimbursementAllocationAmounts("1500", "1000")).toEqual({
      allocatedAmount: "1000",
      incomeAmount: "1500",
      netIncomeAmount: "500",
    });
  });

  it("金额精度无效时拒绝计算报销核销金额", () => {
    expect(summarizeReimbursementAllocationAmounts("1.001", "1000")).toBeNull();
    expect(summarizeReimbursementAllocationAmounts("1000", "1.001")).toBeNull();
  });
});
