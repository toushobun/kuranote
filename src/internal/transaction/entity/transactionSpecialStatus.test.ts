import { describe, expect, it } from "vitest";

import {
  fromTransactionSpecialStatusStorageValue,
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
      ["pendingRefund", "pending_refund"],
      ["reimbursed", "reimbursed"],
      ["refunded", "refunded"],
      ["excluded", "excluded"],
    ]);
    expect(fromTransactionSpecialStatusStorageValue(null)).toBeNull();
    expect(fromTransactionSpecialStatusStorageValue("pending_refund")).toBe(
      "pendingRefund",
    );
  });
});
