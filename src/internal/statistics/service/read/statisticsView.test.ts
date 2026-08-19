import { describe, expect, it } from "vitest";

import { buildStatisticsViewData } from "internal/statistics/service/read/statisticsView";

const records = [
  { id: "expense-1", merchant_id: "merchant-super", type: "normal" as const },
  { id: "expense-2", merchant_id: "merchant-cafe", type: "normal" as const },
  { id: "expense-3", merchant_id: "merchant-missing", type: "normal" as const },
  { id: "income-1", merchant_id: "merchant-company", type: "normal" as const },
];

const items = [
  {
    amount: "1000",
    category_id: "category-food",
    transaction_record_id: "expense-1",
  },
  {
    amount: "600",
    category_id: "category-daily",
    transaction_record_id: "expense-1",
  },
  {
    amount: "1500",
    category_id: "category-food",
    transaction_record_id: "expense-2",
  },
  { amount: "300", category_id: null, transaction_record_id: "expense-3" },
  {
    amount: "250000",
    category_id: "category-salary",
    transaction_record_id: "income-1",
  },
  {
    amount: "999",
    category_id: "category-food",
    transaction_record_id: "missing-record",
  },
  {
    amount: "invalid",
    category_id: "category-food",
    transaction_record_id: "expense-2",
  },
];

const merchants = [
  { id: "merchant-super", name: "超市" },
  { id: "merchant-cafe", name: "咖啡店" },
  { id: "merchant-company", name: "公司" },
];

const categories = [
  {
    id: "category-parent-food",
    name: "食费",
    parent_id: null,
    type: "expense" as const,
  },
  {
    id: "category-food",
    name: "外食",
    parent_id: "category-parent-food",
    type: "expense" as const,
  },
  {
    id: "category-daily",
    name: "日用品",
    parent_id: null,
    type: "expense" as const,
  },
  {
    id: "category-salary",
    name: "工资",
    parent_id: null,
    type: "income" as const,
  },
];

describe("buildStatisticsViewData", () => {
  it("按月份交易生成基础汇总和支出排行榜", () => {
    const view = buildStatisticsViewData({
      categories,
      currency: "JPY",
      items,
      ledgerName: "家庭账本",
      merchants,
      month: "2026-06",
      records,
    });

    expect(view).toMatchObject({
      ledgerName: "家庭账本",
      month: "2026-06",
      monthLabel: "2026年6月",
      nextMonth: "2026-07",
      previousMonth: "2026-05",
      summary: {
        balance: "246900",
        currency: "JPY",
        expense: "3100",
        income: "250000",
      },
    });
    expect(view.merchantExpenseRanking).toEqual([
      {
        amount: "1600",
        id: "merchant-super",
        name: "超市",
        transactionCount: 1,
      },
      {
        amount: "1500",
        id: "merchant-cafe",
        name: "咖啡店",
        transactionCount: 1,
      },
    ]);
    expect(view.categoryExpenseRanking).toEqual([
      {
        amount: "2500",
        id: "category-food",
        name: "食费 / 外食",
        transactionCount: 2,
      },
      {
        amount: "600",
        id: "category-daily",
        name: "日用品",
        transactionCount: 1,
      },
    ]);
  });

  it("没有交易数据时返回空汇总", () => {
    const view = buildStatisticsViewData({
      categories: [],
      currency: "JPY",
      items: [],
      ledgerName: "家庭账本",
      merchants: [],
      month: "2026-07",
      records: [],
    });

    expect(view.summary).toEqual({
      balance: "0",
      currency: "JPY",
      expense: "0",
      income: "0",
    });
    expect(view.merchantExpenseRanking).toEqual([]);
    expect(view.categoryExpenseRanking).toEqual([]);
  });

  it("退款金额从月度支出汇总和排行榜中扣除", () => {
    const view = buildStatisticsViewData({
      categories,
      currency: "JPY",
      items: [
        {
          amount: "1200",
          business_net_amount: "300",
          category_id: "category-food",
          transaction_record_id: "expense-1",
        },
        {
          amount: "300",
          category_id: "category-daily",
          transaction_record_id: "expense-1",
        },
      ],
      ledgerName: "家庭账本",
      merchants,
      month: "2026-06",
      records,
    });

    expect(view.summary).toMatchObject({
      balance: "-600",
      expense: "600",
      income: "0",
    });
    expect(view.merchantExpenseRanking).toEqual([
      {
        amount: "600",
        id: "merchant-super",
        name: "超市",
        transactionCount: 1,
      },
    ]);
    expect(view.categoryExpenseRanking).toHaveLength(2);
    expect(view.categoryExpenseRanking).toEqual(
      expect.arrayContaining([
        {
          amount: "300",
          id: "category-daily",
          name: categories[2].name,
          transactionCount: 1,
        },
        {
          amount: "300",
          id: "category-food",
          name: `${categories[0].name} / ${categories[1].name}`,
          transactionCount: 1,
        },
      ]),
    );
  });

  it("全额退款支出不生成零金额排行榜条目", () => {
    const view = buildStatisticsViewData({
      categories,
      currency: "JPY",
      items: [
        {
          amount: "1200",
          business_net_amount: "0",
          category_id: "category-food",
          transaction_record_id: "expense-1",
        },
      ],
      ledgerName: "家庭账本",
      merchants,
      month: "2026-06",
      records,
    });

    expect(view.summary).toMatchObject({
      balance: "0",
      expense: "0",
      income: "0",
    });
    expect(view.merchantExpenseRanking).toEqual([]);
    expect(view.categoryExpenseRanking).toEqual([]);
  });

  it("跨月报销不重复计入支出和收入", () => {
    const expenseMonth = buildStatisticsViewData({
      categories,
      currency: "JPY",
      items: [
        {
          amount: "1200",
          business_net_amount: "0",
          category_id: "category-food",
          transaction_record_id: "expense-1",
        },
      ],
      ledgerName: "家庭账本",
      merchants,
      month: "2026-06",
      records,
    });
    const reimbursementMonth = buildStatisticsViewData({
      categories,
      currency: "JPY",
      items: [
        {
          amount: "1200",
          business_net_amount: "0",
          category_id: "category-salary",
          transaction_record_id: "income-1",
        },
      ],
      ledgerName: "家庭账本",
      merchants,
      month: "2026-07",
      records,
    });

    expect(expenseMonth.summary).toMatchObject({
      balance: "0",
      expense: "0",
      income: "0",
    });
    expect(expenseMonth.merchantExpenseRanking).toEqual([]);
    expect(expenseMonth.categoryExpenseRanking).toEqual([]);
    expect(reimbursementMonth.summary).toMatchObject({
      balance: "0",
      expense: "0",
      income: "0",
    });
  });

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

    it("退款与报销共同推正时只按母项净额计入收入", () => {
      const view = buildStatisticsViewData({
        categories: [
          {
            id: "expense-category",
            name: "购物",
            parent_id: null,
            type: "expense",
          },
          {
            id: "income-category",
            name: "其他收入",
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
            has_refund_link: true,
            has_reimbursement_link: true,
            transaction_record_id: "combined-surplus-expense",
          },
          {
            amount: "80",
            business_net_amount: "0",
            category_id: "income-category",
            has_refund_link: true,
            has_reimbursement_link: false,
            transaction_record_id: "refund-income",
          },
          {
            amount: "70",
            business_net_amount: "0",
            category_id: "income-category",
            has_refund_link: false,
            has_reimbursement_link: true,
            transaction_record_id: "reimbursement-income",
          },
        ],
        ledgerName: "家庭账本",
        merchants: [{ id: "merchant-combined", name: "组合核销商家" }],
        month: "2026-08",
        records: [
          {
            id: "combined-surplus-expense",
            merchant_id: "merchant-combined",
            type: "normal",
          },
          {
            id: "refund-income",
            merchant_id: null,
            type: "normal",
          },
          {
            id: "reimbursement-income",
            merchant_id: null,
            type: "normal",
          },
        ],
      });

      expect(view.summary).toMatchObject({
        balance: "50",
        expense: "0",
        income: "50",
      });
      expect(view.merchantExpenseRanking).toEqual([]);
      expect(view.categoryExpenseRanking).toEqual([]);
    });
  });
});
