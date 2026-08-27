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
    expect(toRefundMinorUnits(0.1)).toBe(BigInt(100));
    expect(toRefundMinorUnits("0.20")).toBe(BigInt(200));
    expect(toRefundMinorUnits("0.123")).toBe(BigInt(123));
    expect(formatRefundMinorUnits(BigInt(300))).toBe("0.3");
    expect(formatRefundMinorUnits(BigInt(123))).toBe("0.123");
  });
});

describe("calculateRemainingOffsetMinorUnits", () => {
  it("按原金额减去退款与报销金额计算有符号组合剩余额度", () => {
    expect(calculateRemainingOffsetMinorUnits("100", "20", "30")).toBe(
      BigInt(50000),
    );
    expect(calculateRemainingOffsetMinorUnits("0.07", "0.01", "0.06")).toBe(
      BigInt(0),
    );
  });

  it("组合核销超过原金额时保留负数而不再封顶为 0", () => {
    expect(calculateRemainingOffsetMinorUnits("100", "70", "40")).toBe(
      BigInt(-10000),
    );
  });

  it("金额精度无效时返回 null", () => {
    expect(calculateRemainingOffsetMinorUnits("1.0001", "0", "0")).toBeNull();
    expect(calculateRemainingOffsetMinorUnits("1", "0.0001", "0")).toBeNull();
    expect(calculateRemainingOffsetMinorUnits("1", "0", "0.0001")).toBeNull();
  });
});

describe("summarizeRefundAllocationAmounts", () => {
  it("解除封顶后始终以完整收入金额作为单目标核销金额", () => {
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
      allocatedAmount: "1500",
      incomeAmount: "1500",
      netIncomeAmount: "0",
    });
  });

  it("只校验收入金额，剩余额度参数不再参与核销计算", () => {
    expect(summarizeRefundAllocationAmounts("1.001", "1000")).toEqual({
      allocatedAmount: "1.001",
      incomeAmount: "1.001",
      netIncomeAmount: "0",
    });
    expect(summarizeRefundAllocationAmounts("1.0001", "1000")).toBeNull();
    expect(summarizeRefundAllocationAmounts("1000", "1.001")).toEqual({
      allocatedAmount: "1000",
      incomeAmount: "1000",
      netIncomeAmount: "0",
    });
  });
});

describe("summarizeReimbursementAllocationAmounts", () => {
  it("解除封顶后始终以完整收入金额作为单目标核销金额", () => {
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
      allocatedAmount: "1500",
      incomeAmount: "1500",
      netIncomeAmount: "0",
    });
  });

  it("只校验收入金额，剩余额度参数不再参与核销计算", () => {
    expect(summarizeReimbursementAllocationAmounts("1.001", "1000")).toEqual({
      allocatedAmount: "1.001",
      incomeAmount: "1.001",
      netIncomeAmount: "0",
    });
    expect(
      summarizeReimbursementAllocationAmounts("1.0001", "1000"),
    ).toBeNull();
    expect(summarizeReimbursementAllocationAmounts("1000", "1.001")).toEqual({
      allocatedAmount: "1000",
      incomeAmount: "1000",
      netIncomeAmount: "0",
    });
  });
});
