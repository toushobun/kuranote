import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
} from "internal/db-types";

import {
  calculateTransactionRecordDisplayAmount,
  calculateTransactionRecordNetAmount,
  getTransactionRecordCategoryType,
} from "./transactionAmountHelpers";

const categoryById = new Map<string, CategorySummaryDbRow>([
  [
    "expense-category",
    {
      id: "expense-category",
      name: "支出分类",
      parent_id: null,
      type: "expense",
    },
  ],
  [
    "income-category",
    {
      id: "income-category",
      name: "收入分类",
      parent_id: null,
      type: "income",
    },
  ],
]);

function item(categoryId: string | null, amount: string): TransactionItemDbRow {
  return {
    account_id: "account-1",
    amount,
    category_id: categoryId,
    transaction_record_id: "record-1",
  };
}

describe("getTransactionRecordCategoryType", () => {
  it("净额为正时归为收入", () => {
    expect(
      getTransactionRecordCategoryType(
        [item("income-category", "1200"), item("expense-category", "200")],
        categoryById,
      ),
    ).toBe("income");
  });

  it("净额为负时归为支出", () => {
    expect(
      getTransactionRecordCategoryType(
        [item("income-category", "200"), item("expense-category", "1200")],
        categoryById,
      ),
    ).toBe("expense");
  });

  it("净额为零且包含支出分类时归为支出", () => {
    expect(
      getTransactionRecordCategoryType(
        [item("income-category", "500"), item("expense-category", "500")],
        categoryById,
      ),
    ).toBe("expense");
  });

  it("只有支出分类且金额为零时也归为支出", () => {
    expect(
      getTransactionRecordCategoryType(
        [item("expense-category", "0")],
        categoryById,
      ),
    ).toBe("expense");
  });

  it("只有收入分类且金额为零时归为收入", () => {
    expect(
      getTransactionRecordCategoryType(
        [item("income-category", "0")],
        categoryById,
      ),
    ).toBe("income");
  });

  it("退款后的剩余支出参与净额计算", () => {
    expect(
      getTransactionRecordCategoryType(
        [
          item("income-category", "200"),
          {
            ...item("expense-category", "1200"),
            business_net_amount: "100",
            refunded_amount: "1100",
          },
        ],
        categoryById,
      ),
    ).toBe("income");
  });
});

describe("transaction record amount", () => {
  it("统计金额扣除退款但列表金额保留原始支出", () => {
    const refundedExpense = {
      ...item("expense-category", "1200"),
      business_net_amount: "800",
      refunded_amount: "400",
    };

    expect(
      calculateTransactionRecordNetAmount([refundedExpense], categoryById),
    ).toBe(-800);
    expect(
      calculateTransactionRecordDisplayAmount([refundedExpense], categoryById),
    ).toBe(-1200);
  });

  it("退款收入按已分配金额计算业务净额并保留原始收入", () => {
    const refundIncome = {
      ...item("income-category", "1200"),
      business_net_amount: "0",
      is_refund_income: true,
    };

    expect(
      calculateTransactionRecordNetAmount([refundIncome], categoryById),
    ).toBe(0);
    expect(
      calculateTransactionRecordDisplayAmount([refundIncome], categoryById),
    ).toBe(1200);
  });

  it("部分分配的退款收入保留未冲抵金额", () => {
    expect(
      calculateTransactionRecordNetAmount(
        [
          {
            ...item("income-category", "500"),
            business_net_amount: "200",
          },
        ],
        categoryById,
      ),
    ).toBe(200);
  });

  it("混合收支记录按各明细业务净额汇总", () => {
    expect(
      calculateTransactionRecordNetAmount(
        [
          { ...item("expense-category", "500"), business_net_amount: "200" },
          { ...item("income-category", "300"), business_net_amount: "0" },
          item("income-category", "80"),
        ],
        categoryById,
      ),
    ).toBe(-120);
  });
});

describe("reimbursement amount", () => {
  it("已报销支出和对应收入都从统计净额中排除", () => {
    const reimbursedExpense = {
      ...item("expense-category", "10000"),
      business_net_amount: "0",
    };
    const reimbursementIncome = {
      ...item("income-category", "10000"),
      business_net_amount: "0",
    };

    expect(
      calculateTransactionRecordNetAmount(
        [reimbursedExpense, reimbursementIncome],
        categoryById,
      ),
    ).toBe(0);
    expect(
      calculateTransactionRecordDisplayAmount(
        [reimbursedExpense, reimbursementIncome],
        categoryById,
      ),
    ).toBe(0);
  });

  it("跨交易读取到报销收入业务净额时从统计中排除", () => {
    expect(
      calculateTransactionRecordNetAmount(
        [
          {
            ...item("income-category", "10000"),
            business_net_amount: "0",
          },
        ],
        categoryById,
      ),
    ).toBe(0);
  });
});
