import { describe, expect, it } from "vitest";

import {
  resolveNewTransactionEntry,
  resolveOffsetEntry,
} from "./newTransactionEntry";

describe("resolveNewTransactionEntry", () => {
  it.each([
    [{}, "merchant"],
    [{ type: "expense" }, "merchant"],
    [{ type: "income" }, "merchant"],
    [{ type: "invalid" }, "merchant"],
    [{ type: "transfer" }, "transfer"],
    [{ method: "transfer" }, "transfer"],
    [{ method: "standard" }, "merchant"],
    [{ method: "standard", type: "income" }, "merchant"],
    [{ method: "standard", type: "transfer" }, "merchant"],
    [{ method: "merchant", type: "transfer" }, "merchant"],
    [{ method: "invalid", type: "transfer" }, "transfer"],
    [{ method: "invalid" }, "merchant"],
  ] as const)("参数 %j 进入 %s", (params, method) => {
    expect(resolveNewTransactionEntry(params)).toBe(method);
  });
});

describe("resolveOffsetEntry", () => {
  it("解析退款与报销来源", () => {
    const recordId = "00000000-0000-4000-8000-000000000945";
    expect(resolveOffsetEntry({ refundFrom: recordId })).toEqual({
      recordId,
      kind: "refund",
    });
    expect(resolveOffsetEntry({ reimbursementFrom: recordId })).toEqual({
      recordId,
      kind: "reimbursement",
    });
  });
  it.each([
    {},
    { refundFrom: "bad" },
    { refundFrom: ["00000000-0000-4000-8000-000000000945"] },
    { reimbursementFrom: "bad" },
    {
      refundFrom: "00000000-0000-4000-8000-000000000945",
      reimbursementFrom: "00000000-0000-4000-8000-000000000945",
    },
  ])("无效参数当普通新增", (params) => {
    expect(resolveOffsetEntry(params)).toBeNull();
  });
});
