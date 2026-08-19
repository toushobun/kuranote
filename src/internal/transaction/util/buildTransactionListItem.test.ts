import { describe, expect, it } from "vitest";

import type { CategorySummaryDbRow } from "internal/db-types";

import { buildTransactionListItem as buildTransactionListItemBase } from "./buildTransactionListItem";

type BuildTransactionListItemInput = Parameters<
  typeof buildTransactionListItemBase
>[0];

function buildTransactionListItem(
  input: Omit<BuildTransactionListItemInput, "canEdit">,
) {
  return buildTransactionListItemBase({ ...input, canEdit: true });
}

const baseRecord = {
  created_at: "2026-06-22T10:00:00.000Z",
  id: "record-001",
  merchant_id: null,
  note: null,
  transaction_at: "2026-06-22T10:00:00.000Z",
  type: "transfer" as const,
};

const accountA = { currency: "JPY", id: "acct-a", name: "日元现金" };
const accountB = { currency: "JPY", id: "acct-b", name: "储蓄账户" };
const categoryA = {
  id: "cat-a",
  name: "餐饮",
  parent_id: null,
  type: "expense" as const,
};
const categoryB = {
  id: "cat-b",
  name: "工资",
  parent_id: null,
  type: "income" as const,
};
const accountById = new Map([
  [accountA.id, accountA],
  [accountB.id, accountB],
]);
const categoryById = new Map<string, CategorySummaryDbRow>([
  [categoryA.id, categoryA],
  [categoryB.id, categoryB],
]);

describe("buildTransactionListItem", () => {
  it("转账构建转出→转入账户名称", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: baseRecord,
      recordItems: [
        {
          account_id: accountA.id,
          amount: "5000",
          balance_delta: "-5000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountB.id,
          amount: "5000",
          balance_delta: "5000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.account_name).toBe("日元现金 → 储蓄账户");
    expect(item.type).toBe("transfer");
  });

  it("转账 categoryItems 为空数组", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: baseRecord,
      recordItems: [
        {
          account_id: accountA.id,
          amount: "5000",
          balance_delta: "-5000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountB.id,
          amount: "5000",
          balance_delta: "5000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.categoryItems).toEqual([]);
    expect(item.merchant_name).toBeNull();
    expect(item.merchant_icon_url).toBeNull();
  });

  it("转账金额取转出明细的 amount", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: baseRecord,
      recordItems: [
        {
          account_id: accountA.id,
          amount: "3000",
          balance_delta: "-3000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountB.id,
          amount: "3000",
          balance_delta: "3000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.amount).toBe("3000");
  });

  it("转账明细结构异常时不崩溃（无 balance_delta）", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: baseRecord,
      recordItems: [
        {
          account_id: accountA.id,
          amount: "2000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.type).toBe("transfer");
    expect(item.amount).toBe("2000");
  });

  it("普通支出记录按分类方向构建", () => {
    const merchantId = "merchant-001";
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map([
        [merchantId, { icon_url: null, id: merchantId, name: "便利店" }],
      ]),
      record: {
        ...baseRecord,
        merchant_id: merchantId,
        type: "normal" as const,
      },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          category_id: categoryA.id,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.type).toBe("expense");
    expect(item.merchant_name).toBe("便利店");
    expect(item.account_name).toBe("日元现金");
    expect(item.amount).toBe("1200");
  });

  it("部分退款后列表以业务净额为主并保留原始支出金额", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          business_net_amount: "800",
          category_id: categoryA.id,
          id: "item-refunded",
          refunded_amount: "400",
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.amount).toBe("800");
    expect(item.originalAmount).toBe("1200");
    expect(item.categoryItems[0]?.refundedAmount).toBe("400");
  });

  it("全额退款后列表显示零业务净额和原始支出金额", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          business_net_amount: "0",
          category_id: categoryA.id,
          id: "item-fully-refunded",
          refunded_amount: "1200",
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.amount).toBe("0");
    expect(item.originalAmount).toBe("1200");
  });

  it("纯退款超过原始支出后列表切为收入但不派生报销状态", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "100",
          business_net_amount: "-20",
          category_id: categoryA.id,
          id: "refund-only-surplus",
          refunded_amount: "120",
          transaction_record_id: baseRecord.id,
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
          refundAmount: "120",
          reimbursementAmount: "0",
        },
        settlementStatus: null,
      },
      remainingRefundableAmount: "-20",
    });
  });

  it("分类摘要独立表达结算状态和退款、报销核销构成", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          business_net_amount: "0",
          category_id: categoryA.id,
          id: "item-mixed-offset",
          refunded_amount: "400",
          reimbursement_amount: "800",
          special_status: "reimbursed",
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.categoryItems[0]?.businessStatus).toEqual({
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "400",
        reimbursementAmount: "800",
      },
      settlementStatus: "reimbursed",
    });
  });

  it("退款与报销共同推正后列表切为收入并透出倒赚状态", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "100",
          business_net_amount: "-20",
          category_id: categoryA.id,
          id: "expense-surplus",
          refunded_amount: "80",
          reimbursement_amount: "40",
          special_status: "reimbursement_surplus",
          transaction_record_id: baseRecord.id,
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

  describe("remaining offset", () => {
    function buildExpenseItem(input: {
      amount: string;
      refundedAmount: string;
      reimbursementAmount: string;
    }) {
      return buildTransactionListItem({
        accountById,
        categoryById,
        fallbackCurrency: "JPY",
        merchantById: new Map(),
        record: { ...baseRecord, type: "normal" as const },
        recordItems: [
          {
            account_id: accountA.id,
            amount: input.amount,
            business_net_amount: "0",
            category_id: categoryA.id,
            id: "expense-remaining-offset",
            refunded_amount: input.refundedAmount,
            reimbursement_amount: input.reimbursementAmount,
            transaction_record_id: baseRecord.id,
          },
        ],
      });
    }

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

  it("完全分配的退款收入在列表中显示零业务净额和原始收入", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          business_net_amount: "0",
          category_id: categoryB.id,
          is_refund_income: true,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.amount).toBe("0");
    expect(item.originalAmount).toBe("1200");
    expect(item.type).toBe("income");
  });

  it("部分分配的退款收入在列表中显示剩余业务净额", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "500",
          business_net_amount: "200",
          category_id: categoryB.id,
          is_refund_income: true,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.amount).toBe("200");
    expect(item.originalAmount).toBe("500");
    expect(item.type).toBe("income");
  });

  it("收支明细冲销量相抵时仍保留记录原金额", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "500",
          business_net_amount: "300",
          category_id: categoryA.id,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountA.id,
          amount: "200",
          business_net_amount: "0",
          category_id: categoryB.id,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.amount).toBe("300");
    expect(item.originalAmount).toBe("300");
  });

  it("原金额方向与业务净额相反时分别保留各自方向", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "400",
          business_net_amount: "400",
          category_id: categoryA.id,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountA.id,
          amount: "500",
          business_net_amount: "0",
          category_id: categoryB.id,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item).toMatchObject({
      amount: "400",
      originalAmount: "100",
      originalType: "income",
      type: "expense",
    });
  });

  it("分类摘要按 category.type 构建金额和展示方向", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: {
        ...baseRecord,
        type: "normal" as const,
      },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          category_id: categoryA.id,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountA.id,
          amount: "260000",
          category_id: categoryB.id,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.type).toBe("income");
    expect(item.amount).toBe("258800");
    expect(item.categoryItems).toEqual([
      {
        accountId: "acct-a",
        amount: "1200",
        categoryName: "餐饮",
        categoryType: "expense",
        parentCategoryName: null,
      },
      {
        accountId: "acct-a",
        amount: "260000",
        categoryName: "工资",
        categoryType: "income",
        parentCategoryName: null,
      },
    ]);
  });

  it("多人账本保留记录人的昵称和成员颜色", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, created_by: "user-a" },
      recorderById: new Map([
        [
          "user-a",
          {
            display_color: "amber" as const,
            display_name: "淞文",
            id: "user-a",
          },
        ],
      ]),
      recordItems: [],
    });

    expect(item.recorder_name).toBe("淞文");
    expect(item.recorder_color).toBe("amber");
  });

  it("单人账本保留记录人数据并通过展示标志隐藏", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, created_by: "user-a" },
      recorderById: new Map([
        [
          "user-a",
          {
            display_color: "amber" as const,
            display_name: "淞文",
            id: "user-a",
          },
        ],
      ]),
      recordItems: [],
      showRecorder: false,
    });

    expect(item.recorder_name).toBe("淞文");
    expect(item.recorder_color).toBe("amber");
    expect(item.show_recorder).toBe(false);
  });

  it("唯一持有人账户保留该成员的账本内颜色", () => {
    const item = buildTransactionListItem({
      accountById,
      accountColorById: new Map([[accountA.id, "sakura" as const]]),
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: { ...baseRecord, type: "normal" as const },
      recordItems: [
        {
          account_id: accountA.id,
          amount: "1200",
          category_id: categoryA.id,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.account_color).toBe("sakura");
  });

  it("转账两端账户颜色不一致时使用默认账户颜色", () => {
    const item = buildTransactionListItem({
      accountById,
      accountColorById: new Map([
        [accountA.id, "sakura" as const],
        [accountB.id, "amber" as const],
      ]),
      categoryById: new Map(),
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: baseRecord,
      recordItems: [
        {
          account_id: accountA.id,
          amount: "5000",
          balance_delta: "-5000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
        {
          account_id: accountB.id,
          amount: "5000",
          balance_delta: "5000",
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
      ],
    });

    expect(item.account_color).toBeNull();
  });
});