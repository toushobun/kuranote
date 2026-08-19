import { describe, expect, it } from "vitest";

import type { CategorySummaryDbRow } from "internal/db-types";

import { buildTransactionListItem } from "./buildTransactionListItem";

const accountId = "account-jpy";
const expenseCategoryId = "category-expense";

const accountById = new Map([
  [accountId, { currency: "JPY", id: accountId, name: "日元现金" }],
]);
const categoryById = new Map<string, CategorySummaryDbRow>([
  [
    expenseCategoryId,
    {
      id: expenseCategoryId,
      name: "购物",
      parent_id: null,
      type: "expense",
    },
  ],
]);

const record = {
  created_at: "2026-08-19T00:00:00.000Z",
  id: "record-surplus",
  merchant_id: null,
  note: null,
  transaction_at: "2026-08-19T00:00:00.000Z",
  type: "normal" as const,
};

describe("Issue #605 列表展示联动", () => {
  it("退款与报销共同推正后列表切为收入并透出倒赚状态", () => {
    const item = buildTransactionListItem({
      accountById,
      canEdit: false,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record,
      recordItems: [
        {
          account_id: accountId,
          amount: "100",
          business_net_amount: "-20",
          category_id: expenseCategoryId,
          id: "expense-surplus",
          refunded_amount: "80",
          reimbursement_amount: "40",
          special_status: "reimbursement_surplus",
          transaction_record_id: record.id,
        },
      ],
    });

    expect(item).toMatchObject({
      amount: "20",
      originalAmount: "100",
      originalType: "expense",
      type: "income",
    });
    expect(item.categoryItems[0]).toMatchObject({
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "80",
          reimbursementAmount: "40",
        },
        settlementStatus: "reimbursementSurplus",
      },
      remainingRefundableAmount: "-20",
    });
  });
});
