import { describe, expect, it } from "vitest";

import {
  allocateRefundAmount,
  formatRefundMinorUnits,
  toRefundMinorUnits,
} from "./refundAllocation";

describe("refund amount minor units", () => {
  it("小数金额不经过浮点运算即可精确转换", () => {
    expect(toRefundMinorUnits(0.1)).toBe(BigInt(10));
    expect(toRefundMinorUnits("0.20")).toBe(BigInt(20));
    expect(formatRefundMinorUnits(BigInt(30))).toBe("0.3");
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
