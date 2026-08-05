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

  it("优先根据真实收入关联派生退款和报销标签", () => {
    expect(
      resolveTransactionBusinessStatus({
        isRefundIncome: true,
        isReimbursementIncome: true,
        specialStatus: "reimbursed",
      }),
    ).toBe("refund");
    expect(
      resolveTransactionBusinessStatus({ isReimbursementIncome: true }),
    ).toBe("reimbursement");
    expect(
      resolveTransactionBusinessStatus({
        specialStatus: "pending_reimbursement",
      }),
    ).toBe("pendingReimbursement");
    expect(resolveTransactionBusinessStatus({})).toBeNull();
  });
});
