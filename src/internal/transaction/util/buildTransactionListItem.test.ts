import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionPaymentDbRow,
} from "internal/db-types";
import {
  defaultTransactionFilters,
  type TransactionFilters,
} from "internal/transaction/entity/transactionGrouping";

import { buildTransactionListItem as buildTransactionListItemBase } from "./buildTransactionListItem";
import {
  hospitalAccountList,
  hospitalAccounts,
  hospitalCategories,
  hospitalCategoryById,
  hospitalItems,
  hospitalPayments,
  hospitalRecord,
} from "./grouping/splitPayment.testUtils";

type BuildTransactionListItemInput = Parameters<
  typeof buildTransactionListItemBase
>[0];

/**
 * 未指定付款明细时，普通记录补一行单账户付款明细（账户取首条明细上给出的测试账户），
 * 金额为 Σ收入 − Σ支出；未指定筛选条件时使用默认筛选。
 */
function buildTransactionListItem(
  input: Omit<
    BuildTransactionListItemInput,
    "canEdit" | "filters" | "payments"
  > &
    Partial<Pick<BuildTransactionListItemInput, "filters" | "payments">>,
) {
  const firstItem = input.recordItems[0];
  const balanceDelta = input.recordItems.reduce((sum, item) => {
    const type = item.category_id
      ? input.categoryById.get(item.category_id)?.type
      : undefined;
    const amount = Number(item.amount);
    return type === "income" ? sum + amount : sum - amount;
  }, 0);
  const defaultPayments: TransactionPaymentDbRow[] =
    input.record.type === "normal" && firstItem?.account_id
      ? [
          {
            account_id: firstItem.account_id,
            amount: String(Math.abs(balanceDelta)),
            balance_delta: String(balanceDelta),
            sort_order: 0,
            transaction_record_id: input.record.id,
          },
        ]
      : [];

  return buildTransactionListItemBase({
    filters: defaultTransactionFilters,
    payments: defaultPayments,
    ...input,
    canEdit: true,
  });
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
    expect(item.categoryItems[0]?.businessNetAmount).toBe("800");
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
    expect(item.categoryItems[0]?.businessNetAmount).toBe("0");
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
        amount: "1200",
        categoryName: "餐饮",
        categoryType: "expense",
        parentCategoryName: null,
      },
      {
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

it.each(["2500", "-2500"])(
  "余额调整保留差值 %s 和记账人，不生成分类商家消费者",
  (delta) => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      record: {
        ...baseRecord,
        type: "balance_adjustment",
        created_by: "recorder",
        note: "余额盘点",
      },
      recorderById: new Map([
        ["recorder", { id: "recorder", display_name: "记账人" }],
      ]),
      recordItems: [
        {
          account_id: accountA.id,
          amount: "2500",
          balance_delta: delta,
          category_id: null,
          transaction_record_id: baseRecord.id,
        },
      ],
    });
    expect(item).toMatchObject({
      type: "balance_adjustment",
      amount: delta,
      account_name: accountA.name,
      note: "余额盘点",
      recorder_name: "记账人",
      merchant_name: null,
      categoryItems: [],
    });
  },
);

describe("buildTransactionListItem 多账户记录", () => {
  const mineFilters: TransactionFilters = {
    accountId: hospitalAccounts.mine.id,
    recordType: "all",
  };

  function buildHospitalItem(
    overrides: Partial<Pick<BuildTransactionListItemInput, "filters">> & {
      recordItems?: BuildTransactionListItemInput["recordItems"];
    } = {},
  ) {
    return buildTransactionListItem({
      accountById: new Map(
        hospitalAccountList.map((account) => [account.id, account] as const),
      ),
      categoryById: hospitalCategoryById,
      fallbackCurrency: "JPY",
      merchantById: new Map(),
      payments: hospitalPayments,
      record: hospitalRecord,
      recordItems: hospitalItems,
      ...overrides,
    });
  }

  it("单账户记录的账户显示与金额不变，不给出共同支付字段", () => {
    const item = buildTransactionListItem({
      accountById,
      categoryById,
      fallbackCurrency: "JPY",
      filters: { accountId: accountA.id, recordType: "all" },
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

    expect(item.account_name).toBe(accountA.name);
    expect(item.amount).toBe("1200");
    expect(item).not.toHaveProperty("record_total_amount");
    expect(item).not.toHaveProperty("account_share_amount");
  });

  it("无筛选时显示「首个账户 等 N 个账户」，主金额为整笔", () => {
    const item = buildHospitalItem();

    expect(item.account_name).toBe("我的账户 等 2 个账户");
    expect(item.account_currency).toBe("JPY");
    expect(item.amount).toBe("120000");
    expect(item).not.toHaveProperty("record_total_amount");
  });

  it("筛选我的账户时主金额为份额 5 万，并给出整笔金额", () => {
    const item = buildHospitalItem({ filters: mineFilters });

    expect(item.account_name).toBe("我的账户 等 2 个账户");
    expect(item.amount).toBe("50000");
    expect(item.type).toBe("expense");
    expect(item.record_total_amount).toBe("120000");
    expect(item).not.toHaveProperty("account_share_amount");
  });

  it("筛选我的账户 + 住院费时主金额为命中明细全额，并给出本账户份额与整笔", () => {
    const item = buildHospitalItem({
      filters: { ...mineFilters, categoryId: hospitalCategories.inpatient.id },
      recordItems: hospitalItems.filter(
        (item) => item.category_id === hospitalCategories.inpatient.id,
      ),
    });

    expect(item.amount).toBe("80000");
    expect(item.account_share_amount).toBe("50000");
    expect(item.record_total_amount).toBe("120000");
  });

  it("主金额为份额时不显示原金额；为命中明细时原金额与共同支付同时给出", () => {
    const refundedItems = hospitalItems.map((item) =>
      item.category_id === hospitalCategories.inpatient.id
        ? { ...item, business_net_amount: "60000", refunded_amount: "20000" }
        : item,
    );

    const shareItem = buildHospitalItem({
      filters: mineFilters,
      recordItems: refundedItems,
    });
    expect(shareItem.amount).toBe("50000");
    expect(shareItem).not.toHaveProperty("originalAmount");

    const matchedItem = buildHospitalItem({
      filters: { ...mineFilters, categoryId: hospitalCategories.inpatient.id },
      recordItems: refundedItems.filter(
        (item) => item.category_id === hospitalCategories.inpatient.id,
      ),
    });
    expect(matchedItem).toMatchObject({
      account_share_amount: "50000",
      amount: "60000",
      originalAmount: "80000",
      record_total_amount: "120000",
    });
  });
});
