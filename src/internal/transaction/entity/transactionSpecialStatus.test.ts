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
      ["reimbursed", "reimbursed"],
    ]);
    expect(fromTransactionSpecialStatusStorageValue(null)).toBeNull();
    expect(
      fromTransactionSpecialStatusStorageValue("pending_reimbursement"),
    ).toBe("pendingReimbursement");
  });
});
