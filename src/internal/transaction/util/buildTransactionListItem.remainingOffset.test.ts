import { describe, expect, it } from "vitest";

import type { CategorySummaryDbRow } from "internal/db-types";

import { buildTransactionListItem } from "./buildTransactionListItem";

describe("buildTransactionListItem remaining offset", () => {
  it("remainingRefundableAmount 同时扣除退款和报销金额", () => {
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

    const item = buildTransactionListItem({
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
          amount: "1000",
          business_net_amount: "100",
          category_id: category.id,
          id: "expense-1",
          refunded_amount: "200",
          reimbursement_amount: "700",
          transaction_record_id: "record-1",
        },
      ],
    });

    expect(item.categoryItems[0]?.remainingRefundableAmount).toBe("100");
  });
});
