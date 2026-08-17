import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

import { filterTransactionItems, filterTransactionRecords } from "./filters";

const recordId = "00000000-0000-4000-8000-000000000101";

const record: TransactionRecordDbRow = {
  created_at: "2026-08-03T01:00:00.000Z",
  created_by: null,
  id: recordId,
  merchant_id: null,
  note: null,
  transaction_at: "2026-08-03T01:00:00.000Z",
  type: "normal",
};

const categories: CategorySummaryDbRow[] = [
  {
    id: "expense-category",
    name: "支出分类",
    parent_id: null,
    type: "expense",
  },
  {
    id: "income-category",
    name: "收入分类",
    parent_id: null,
    type: "income",
  },
];

const expenseItem: TransactionItemDbRow = {
  account_id: "account-1",
  amount: "100",
  category_id: "expense-category",
  id: "expense-item",
  refunded_amount: "0",
  reimbursement_amount: "0",
  transaction_record_id: recordId,
};

const incomeItem: TransactionItemDbRow = {
  account_id: "account-1",
  amount: "200",
  category_id: "income-category",
  id: "income-item",
  refunded_amount: "0",
  reimbursement_amount: "0",
  transaction_record_id: recordId,
};

const context: TransactionGroupLoaderContext = {
  accountColorById: new Map(),
  accounts: [],
  categories,
  currentLedger: {
    baseCurrency: "JPY",
    currentUserRole: "owner",
    id: "00000000-0000-4000-8000-000000000001",
    name: "家庭账本",
  },
  items: [expenseItem, incomeItem],
  merchants: [],
  records: [record],
  recorders: [],
};

describe("refundableExpense filter", () => {
  it("整笔净收入时仍保留包含可退款支出明细的交易", () => {
    expect(
      filterTransactionRecords(context, {
        recordType: "refundableExpense",
      }),
    ).toEqual([record]);
  });

  it("退款候选只返回退款与报销后仍有剩余额度的支出明细", () => {
    const partialExpense = {
      ...expenseItem,
      refunded_amount: "20",
      reimbursement_amount: "70",
    };
    const fullyOffsetExpense = {
      ...expenseItem,
      id: "fully-offset-expense",
      refunded_amount: "20",
      reimbursement_amount: "80",
    };
    const combinedContext = {
      ...context,
      items: [partialExpense, fullyOffsetExpense, incomeItem],
    };

    expect(
      filterTransactionItems(combinedContext, {
        recordType: "refundableExpense",
      }),
    ).toEqual([partialExpense]);
  });

  it("组合剩余额度为零时交易不再属于退款候选", () => {
    const fullyOffsetContext = {
      ...context,
      items: [
        {
          ...expenseItem,
          refunded_amount: "20",
          reimbursement_amount: "80",
        },
        incomeItem,
      ],
    };

    expect(
      filterTransactionRecords(fullyOffsetContext, {
        recordType: "refundableExpense",
      }),
    ).toEqual([]);
  });

  it("小数金额完全核销时不会因浮点误差残留候选", () => {
    const fullyOffsetContext = {
      ...context,
      items: [
        {
          ...expenseItem,
          amount: "0.07",
          refunded_amount: "0.01",
          reimbursement_amount: "0.06",
        },
      ],
    };

    expect(
      filterTransactionItems(fullyOffsetContext, {
        recordType: "refundableExpense",
      }),
    ).toEqual([]);
  });

  it("报销候选只保留待报销且仍有组合剩余额度的支出", () => {
    const pendingExpense = {
      ...expenseItem,
      id: "pending-expense",
      refunded_amount: "20",
      reimbursement_amount: "70",
      special_status: "pending_reimbursement" as const,
    };
    const plainExpense = {
      ...expenseItem,
      id: "plain-expense",
      refunded_amount: "0",
      reimbursement_amount: "0",
      special_status: null,
    };
    const exhaustedPendingExpense = {
      ...expenseItem,
      id: "exhausted-pending-expense",
      refunded_amount: "20",
      reimbursement_amount: "80",
      special_status: "pending_reimbursement" as const,
    };
    const reimbursementContext = {
      ...context,
      items: [pendingExpense, plainExpense, exhaustedPendingExpense],
    };

    expect(
      filterTransactionItems(reimbursementContext, {
        recordType: "refundableExpense",
        specialStatuses: ["pendingReimbursement"],
      }),
    ).toEqual([pendingExpense]);
  });
});
