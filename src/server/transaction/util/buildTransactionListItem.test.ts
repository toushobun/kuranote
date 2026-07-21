import { describe, expect, it } from "vitest";

import type { CategorySummaryDbRow } from "server/db-types";

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
