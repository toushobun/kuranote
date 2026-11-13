import { describe, expect, it } from "vitest";
import { getLinkedIncomeDisplayAmounts } from "./transactionLinkedIncomeDisplay";

const target = {
  id: "expense-1",
  remainingRefundableAmount: "980",
} as const;

describe("getLinkedIncomeDisplayAmounts", () => {
  it("按当前明细净额区分抵消 980 和倒赚 1000", () => {
    expect(
      getLinkedIncomeDisplayAmounts({
        amount: "1980",
        businessNetAmount: "1000",
        refundCandidate: target,
      }),
    ).toEqual({ kind: "refund", offsetAmount: 980, surplusAmount: 1000 });
  });

  it("原支出已抵完时整笔退款计入收入", () => {
    expect(
      getLinkedIncomeDisplayAmounts({
        amount: "1000",
        businessNetAmount: "1000",
        reimbursementCandidate: target,
      }),
    ).toEqual({ kind: "reimbursement", offsetAmount: 0, surplusAmount: 1000 });
  });

  it("完全抵消和零金额链接不产生倒赚", () => {
    expect(
      getLinkedIncomeDisplayAmounts({
        amount: "980",
        businessNetAmount: "0",
        refundCandidate: target,
      }),
    ).toEqual({ kind: "refund", offsetAmount: 980, surplusAmount: 0 });
    expect(
      getLinkedIncomeDisplayAmounts({
        amount: "0",
        businessNetAmount: "0",
        refundCandidate: target,
      }),
    ).toEqual({ kind: "refund", offsetAmount: 0, surplusAmount: 0 });
  });

  it("已保存明细可从业务状态读取倒赚，非关联收入不误认", () => {
    expect(
      getLinkedIncomeDisplayAmounts({
        amount: "1000",
        businessStatus: {
          incomeLinkRole: "refund",
          offsetComposition: { refundAmount: "0", reimbursementAmount: "0" },
          settlementStatus: null,
          surplusAmount: "1000",
        },
      }),
    ).toEqual({ kind: "refund", offsetAmount: 0, surplusAmount: 1000 });
    expect(
      getLinkedIncomeDisplayAmounts({
        amount: "500",
        businessNetAmount: "500",
      }),
    ).toEqual({ kind: null, offsetAmount: 0, surplusAmount: 0 });
  });
});
