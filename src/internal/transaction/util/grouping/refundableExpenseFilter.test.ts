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
  special_status: "pending_reimbursement",
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
  it("整笔净收入时仍保留包含支出明细的交易", () => {
    expect(
      filterTransactionRecords(context, {
        recordType: "refundableExpense",
      }),
    ).toEqual([record]);
  });

  it("退款候选包含普通支出与报销流程中的支出，不受剩余额度限制", () => {
    const pendingExpense = {
      ...expenseItem,
      refunded_amount: "20",
      reimbursement_amount: "70",
    };
    const reimbursedExpense = {
      ...expenseItem,
      id: "reimbursed-expense",
      refunded_amount: "20",
      reimbursement_amount: "80",
      special_status: "reimbursed" as const,
    };
    const surplusExpense = {
      ...expenseItem,
      id: "surplus-expense",
      refunded_amount: "20",
      reimbursement_amount: "100",
      special_status: "reimbursement_surplus" as const,
    };
    const plainExpense = {
      ...expenseItem,
      id: "plain-expense",
      special_status: null,
    };
    const combinedContext = {
      ...context,
      items: [
        pendingExpense,
        reimbursedExpense,
        surplusExpense,
        plainExpense,
        incomeItem,
      ],
    };

    expect(
      filterTransactionItems(combinedContext, {
        recordType: "refundableExpense",
      }),
    ).toEqual([
      pendingExpense,
      reimbursedExpense,
      surplusExpense,
      plainExpense,
    ]);
  });

  it("净额已转正的支出仍属于退款候选交易", () => {
    const surplusExpense = {
      ...expenseItem,
      refunded_amount: "20",
      reimbursement_amount: "100",
      special_status: "reimbursement_surplus" as const,
    };
    const surplusContext = {
      ...context,
      items: [surplusExpense, incomeItem],
    };

    expect(
      filterTransactionRecords(surplusContext, {
        recordType: "refundableExpense",
      }),
    ).toEqual([record]);
  });

  it("报销候选排除普通支出并保留三种报销流程状态", () => {
    const pendingExpense = {
      ...expenseItem,
      id: "pending-expense",
    };
    const reimbursedExpense = {
      ...expenseItem,
      id: "reimbursed-expense",
      special_status: "reimbursed" as const,
    };
    const surplusExpense = {
      ...expenseItem,
      id: "surplus-expense",
      special_status: "reimbursement_surplus" as const,
    };
    const plainExpense = {
      ...expenseItem,
      id: "plain-expense",
      special_status: null,
    };
    const reimbursementContext = {
      ...context,
      items: [
        pendingExpense,
        reimbursedExpense,
        surplusExpense,
        plainExpense,
        incomeItem,
      ],
    };

    expect(
      filterTransactionItems(reimbursementContext, {
        recordType: "refundableExpense",
        specialStatuses: [
          "pendingReimbursement",
          "reimbursed",
          "reimbursementSurplus",
        ],
      }),
    ).toEqual([pendingExpense, reimbursedExpense, surplusExpense]);
  });
});
