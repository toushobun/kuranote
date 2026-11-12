import { describe, expect, it } from "vitest";
import { createTransactionListItem } from "test/mocks/transactions";
import {
  getLinkCandidateDefaultAmount,
  toTransactionLinkCandidates,
} from "./transactionLinkCandidates";

describe("transactionLinkCandidates", () => {
  const record = createTransactionListItem({
    categoryItems: [
      {
        id: "expense",
        categoryName: "午餐",
        categoryType: "expense",
        parentCategoryName: "餐饮",
        amount: "100",
        remainingRefundableAmount: "-20",
        refundedAmount: "50",
        businessStatus: {
          incomeLinkRole: null,
          settlementStatus: "reimbursementSurplus",
          offsetComposition: { refundAmount: "50", reimbursementAmount: "70" },
        },
      },
      {
        id: "income",
        categoryName: "收入",
        categoryType: "income",
        parentCategoryName: null,
        amount: "100",
        remainingRefundableAmount: "100",
      },
      {
        categoryName: "无明细ID",
        categoryType: "expense",
        parentCategoryName: null,
        amount: "100",
        remainingRefundableAmount: "100",
      },
    ],
  });
  it("只展开可识别的支出并保留核销金额和商家账户元数据", () => {
    expect(toTransactionLinkCandidates([record])).toEqual([
      expect.objectContaining({
        id: "expense",
        amount: "100",
        remainingRefundableAmount: "-20",
        refundedAmount: "50",
        reimbursementAmount: "70",
        merchantName: record.merchant_name,
        accountName: record.account_name,
      }),
    ]);
  });
  it.each([
    ["0", ""],
    ["-20", ""],
    ["12.345", "12.345"],
  ])("剩余金额 %s 的默认值为 %s", (remainingRefundableAmount, expected) => {
    const candidate = {
      ...toTransactionLinkCandidates([record])[0],
      remainingRefundableAmount,
    };
    expect(getLinkCandidateDefaultAmount(candidate)).toBe(expected);
  });
});
