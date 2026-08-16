import { describe, expect, it } from "vitest";

import {
  fromTransactionSpecialStatusStorageValue,
  resolveTransactionBusinessStatus,
  toTransactionSpecialStatusStorageValue,
  transactionSpecialStatuses,
} from "./transactionSpecialStatus";

describe("transactionSpecialStatus", () => {
  it("在领域值和数据库值之间集中双向映射", () => {
    expect(
      transactionSpecialStatuses.map((status) => [
        status,
        toTransactionSpecialStatusStorageValue(status),
      ]),
    ).toEqual([
      ["pendingReimbursement", "pending_reimbursement"],
      ["reimbursed", "reimbursed"],
    ]);
    expect(fromTransactionSpecialStatusStorageValue(null)).toBeNull();
    expect(
      fromTransactionSpecialStatusStorageValue("pending_reimbursement"),
    ).toBe("pendingReimbursement");
  });

  it("分别派生结算状态、核销来源构成和收入关联角色", () => {
    expect(
      resolveTransactionBusinessStatus({
        amount: "100",
        businessNetAmount: "0",
        isRefundIncome: true,
        isReimbursementIncome: true,
        refundedAmount: "40",
        specialStatus: "reimbursed",
      }),
    ).toEqual({
      incomeLinkRole: "refund",
      offsetComposition: {
        refundAmount: "40",
        reimbursementAmount: "60",
      },
      settlementStatus: "reimbursed",
    });
    expect(
      resolveTransactionBusinessStatus({ isReimbursementIncome: true }),
    ).toEqual({
      incomeLinkRole: "reimbursement",
      offsetComposition: {
        refundAmount: "0",
        reimbursementAmount: "0",
      },
      settlementStatus: null,
    });
    expect(
      resolveTransactionBusinessStatus({
        specialStatus: "pending_reimbursement",
      }),
    ).toEqual({
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "0",
        reimbursementAmount: "0",
      },
      settlementStatus: "pendingReimbursement",
    });
    expect(resolveTransactionBusinessStatus({})).toBeNull();
  });

  it("普通支出无论退款多少都不进入报销结算状态", () => {
    expect(
      resolveTransactionBusinessStatus({
        amount: "100",
        businessNetAmount: "0",
        refundedAmount: "100",
        specialStatus: null,
      }),
    ).toEqual({
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "100",
        reimbursementAmount: "0",
      },
      settlementStatus: null,
    });
  });
});
