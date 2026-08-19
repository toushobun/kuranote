import { describe, expect, it } from "vitest";

import { buildStatisticsViewData } from "internal/statistics/service/read/statisticsView";

describe("Issue #605 核销结余统计", () => {
  it("超额报销后的关联支出计入收入桶且普通支出仍计入支出桶", () => {
    const view = buildStatisticsViewData({
      categories: [
        {
          id: "expense-category",
          name: "餐饮",
          parent_id: null,
          type: "expense",
        },
        {
          id: "income-category",
          name: "报销收入",
          parent_id: null,
          type: "income",
        },
      ],
      currency: "JPY",
      items: [
        {
          amount: "100",
          business_net_amount: "-50",
          category_id: "expense-category",
          has_refund_link: false,
          has_reimbursement_link: true,
          transaction_record_id: "surplus-expense",
        },
        {
          amount: "30",
          category_id: "expense-category",
          has_refund_link: false,
          has_reimbursement_link: false,
          transaction_record_id: "regular-expense",
        },
        {
          amount: "150",
          business_net_amount: "0",
          category_id: "income-category",
          has_refund_link: false,
          has_reimbursement_link: true,
          transaction_record_id: "offset-income",
        },
      ],
      ledgerName: "家庭账本",
      merchants: [
        { id: "merchant-surplus", name: "返利商家" },
        { id: "merchant-regular", name: "普通商家" },
      ],
      month: "2026-08",
      records: [
        {
          id: "surplus-expense",
          merchant_id: "merchant-surplus",
          type: "normal",
        },
        {
          id: "regular-expense",
          merchant_id: "merchant-regular",
          type: "normal",
        },
        {
          id: "offset-income",
          merchant_id: null,
          type: "normal",
        },
      ],
    });

    expect(view.summary).toMatchObject({
      balance: "20",
      expense: "30",
      income: "50",
    });
    expect(view.merchantExpenseRanking).toEqual([
      {
        amount: "30",
        id: "merchant-regular",
        name: "普通商家",
        transactionCount: 1,
      },
    ]);
    expect(view.categoryExpenseRanking).toEqual([
      {
        amount: "30",
        id: "expense-category",
        name: "餐饮",
        transactionCount: 1,
      },
    ]);
  });

  it("超额退款后的关联支出同样计入收入桶", () => {
    const view = buildStatisticsViewData({
      categories: [
        {
          id: "expense-category",
          name: "购物",
          parent_id: null,
          type: "expense",
        },
      ],
      currency: "JPY",
      items: [
        {
          amount: "100",
          business_net_amount: "-25",
          category_id: "expense-category",
          has_refund_link: true,
          has_reimbursement_link: false,
          transaction_record_id: "refund-surplus-expense",
        },
      ],
      ledgerName: "家庭账本",
      merchants: [{ id: "merchant-refund", name: "退款商家" }],
      month: "2026-08",
      records: [
        {
          id: "refund-surplus-expense",
          merchant_id: "merchant-refund",
          type: "normal",
        },
      ],
    });

    expect(view.summary).toMatchObject({
      balance: "25",
      expense: "0",
      income: "25",
    });
    expect(view.merchantExpenseRanking).toEqual([]);
    expect(view.categoryExpenseRanking).toEqual([]);
  });
});
