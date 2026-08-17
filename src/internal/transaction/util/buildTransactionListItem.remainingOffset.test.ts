import { describe, expect, it } from "vitest";

import type { CategorySummaryDbRow } from "internal/db-types";

import { buildTransactionListItem } from "./buildTransactionListItem";

const account = { currency: "JPY", id: "account-1", name: "现金" };
const category = {
  id: "category-1",
  name: "差旅",
  parent_id: null,
  type: "expense" as const,
};
const categoryById = new Map<string, CategorySummaryDbRow>([
  [category.id, category],
]);

function buildExpenseItem(input: {
  amount: string;
  refundedAmount: string;
  reimbursementAmount: string;
}) {
  return buildTransactionListItem({
    accountById: new Map([[account.id, account]]),
    canEdit: true,
    categoryById,
    fallbackCurrency: "JPY",
    merchantById: new Map(),
    record: {
      created_at: "2026-08-17T00:00:00.000Z",
      created_by: null,
      id: "record-1",
      merchant_id: null,
      note: null,
      transaction_at: "2026-08-17T00:00:00.000Z",
      type: "normal",
    },
    recordItems: [
      {
        account_id: account.id,
        amount: input.amount,
        business_net_amount: "0",
        category_id: category.id,
        id: "expense-1",
        refunded_amount: input.refundedAmount,
        reimbursement_amount: input.reimbursementAmount,
        transaction_record_id: "record-1",
      },
    ],
  });
}

describe("buildTransactionListItem remaining offset", () => {
  it("remainingRefundableAmount 同时扣除退款和报销金额", () => {
    const item = buildExpenseItem({
      amount: "1000",
      refundedAmount: "200",
      reimbursementAmount: "700",
    });

    expect(item.categoryItems[0]?.remainingRefundableAmount).toBe("100");
  });

  it("小数组合剩余额度按最小货币单位精确计算", () => {
    const item = buildExpenseItem({
      amount: "0.30",
      refundedAmount: "0.10",
      reimbursementAmount: "0.10",
    });

    expect(item.categoryItems[0]?.remainingRefundableAmount).toBe("0.1");
  });
});
