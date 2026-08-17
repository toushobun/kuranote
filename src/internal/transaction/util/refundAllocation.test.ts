import { describe, expect, it } from "vitest";

import {
  allocateRefundAmount,
  calculateRemainingOffsetMinorUnits,
  formatRefundMinorUnits,
  hasUniqueRefundAllocationTargets,
  isRefundAllocationTotalWithinAmount,
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

describe("isRefundAllocationTotalWithinAmount", () => {
  it("接受分摊合计小于或等于收入金额", () => {
    expect(isRefundAllocationTotalWithinAmount(10, [{ refundAmount: 9 }])).toBe(
      true,
    );
    expect(
      isRefundAllocationTotalWithinAmount(10, [{ refundAmount: 10 }]),
    ).toBe(true);
  });

  it("拒绝分摊合计超过收入金额", () => {
    expect(
      isRefundAllocationTotalWithinAmount(10, [{ refundAmount: 10.01 }]),
    ).toBe(false);
  });

  it("以最小货币单位精确比较小数合计", () => {
    expect(
      isRefundAllocationTotalWithinAmount(0.3, [
        { refundAmount: 0.1 },
        { refundAmount: 0.2 },
      ]),
    ).toBe(true);
  });

  it("拒绝非正数或精度无效的分摊金额", () => {
    expect(isRefundAllocationTotalWithinAmount(10, [{ refundAmount: 0 }])).toBe(
      false,
    );
    expect(
      isRefundAllocationTotalWithinAmount(10, [{ refundAmount: 1.001 }]),
    ).toBe(false);
  });
});

describe("hasUniqueRefundAllocationTargets", () => {
  it("接受退款目标唯一的分摊", () => {
    expect(
      hasUniqueRefundAllocationTargets([
        { refundedItemId: "expense-1" },
        { refundedItemId: "expense-2" },
      ]),
    ).toBe(true);
  });

  it("拒绝重复退款目标", () => {
    expect(
      hasUniqueRefundAllocationTargets([
        { refundedItemId: "expense-1" },
        { refundedItemId: "expense-1" },
      ]),
    ).toBe(false);
  });
});

describe("allocateRefundAmount", () => {
  it("按剩余可退金额比例分摊", () => {
    expect(
      allocateRefundAmount("25", [
        { id: "b", remainingRefundableAmount: "30" },
        { id: "a", remainingRefundableAmount: "20" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 10 },
      { refundedItemId: "b", refundAmount: 15 },
    ]);
  });

  it("按稳定顺序处理最小货币单位尾差", () => {
    expect(
      allocateRefundAmount("100", [
        { id: "c", remainingRefundableAmount: "100" },
        { id: "a", remainingRefundableAmount: "100" },
        { id: "b", remainingRefundableAmount: "100" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 33.34 },
      { refundedItemId: "b", refundAmount: 33.33 },
      { refundedItemId: "c", refundAmount: 33.33 },
    ]);
  });

  it("退款金额等于剩余可退合计时分摊全部金额", () => {
    expect(
      allocateRefundAmount("10", [
        { id: "a", remainingRefundableAmount: "5" },
        { id: "b", remainingRefundableAmount: "5" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 5 },
      { refundedItemId: "b", refundAmount: 5 },
    ]);
  });

  it("退款金额小于剩余可退合计时按退款金额分摊", () => {
    expect(
      allocateRefundAmount("6", [
        { id: "a", remainingRefundableAmount: "5" },
        { id: "b", remainingRefundableAmount: "5" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 3 },
      { refundedItemId: "b", refundAmount: 3 },
    ]);
  });

  it("退款金额大于剩余可退合计时只分摊可退合计", () => {
    expect(
      allocateRefundAmount("10.01", [
        { id: "a", remainingRefundableAmount: "5" },
        { id: "b", remainingRefundableAmount: "5" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 5 },
      { refundedItemId: "b", refundAmount: 5 },
    ]);
  });

  it("拒绝会产生零金额分摊的选择", () => {
    expect(
      allocateRefundAmount("0.01", [
        { id: "a", remainingRefundableAmount: "1" },
        { id: "b", remainingRefundableAmount: "1" },
      ]),
    ).toBeNull();
  });

  it("拒绝重复目标明细", () => {
    expect(
      allocateRefundAmount("1", [
        { id: "a", remainingRefundableAmount: "1" },
        { id: "a", remainingRefundableAmount: "1" },
      ]),
    ).toBeNull();
  });
});

describe("summarizeRefundAllocationAmounts", () => {
  it("返回实际分摊金额与退款收入净收益", () => {
    expect(
      summarizeRefundAllocationAmounts("1500", [{ refundAmount: 1000 }]),
    ).toEqual({ allocatedAmount: "1000", netIncomeAmount: "500" });
    expect(
      summarizeRefundAllocationAmounts("1500", [{ refundAmount: 1500 }]),
    ).toEqual({ allocatedAmount: "1500", netIncomeAmount: "0" });
  });

  it("拒绝超过收入金额或精度无效的分摊", () => {
    expect(
      summarizeRefundAllocationAmounts("1500", [{ refundAmount: 1500.01 }]),
    ).toBeNull();
    expect(
      summarizeRefundAllocationAmounts("1500", [{ refundAmount: 1.001 }]),
    ).toBeNull();
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
