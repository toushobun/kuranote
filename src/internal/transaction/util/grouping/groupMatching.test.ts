// @vitest-environment node

import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import {
  isExcludedFromCategoryGroups,
  isItemLevelGroupBy,
  itemMatchesGroup,
  matchesParentCategory,
  recordMatchesGroup,
} from "internal/transaction/util/grouping/groupMatching";
import { hospitalPayments } from "internal/transaction/util/grouping/splitPayment.testUtils";

const record: TransactionRecordDbRow = {
  created_at: "2026-07-20T01:00:00.000Z",
  created_by: "member-1",
  id: "record-1",
  merchant_id: "merchant-1",
  note: null,
  transaction_at: "2026-07-20T01:00:00.000Z",
  type: "normal",
};

const categories: CategorySummaryDbRow[] = [
  {
    id: "parent-category",
    name: "餐饮",
    parent_id: null,
    type: "expense",
  },
  {
    id: "child-category",
    name: "午餐",
    parent_id: "parent-category",
    type: "expense",
  },
];
const categoryById = new Map(
  categories.map((category) => [category.id, category]),
);

const item: TransactionItemDbRow = {
  account_id: "account-1",
  amount: "1200",
  category_id: "child-category",
  transaction_record_id: record.id,
};

function matches(
  groupBy: Parameters<typeof recordMatchesGroup>[0]["groupBy"],
  groupKey: string,
  overrides: Partial<Parameters<typeof recordMatchesGroup>[0]> = {},
) {
  return recordMatchesGroup({
    categoryById,
    groupBy,
    groupKey,
    holderIdsByAccountId: new Map([["account-1", ["holder-me"]]]),
    items: [item],
    payments: [
      {
        account_id: "account-1",
        amount: "1200",
        balance_delta: "-1200",
        sort_order: 0,
        transaction_record_id: record.id,
      },
    ],
    record,
    ...overrides,
  });
}

describe("recordMatchesGroup", () => {
  it("按时间分组时比较交易时间对应的分组键", () => {
    expect(matches("month", "2026-07")).toBe(true);
    expect(matches("month", "2026-06")).toBe(false);
  });

  it("按商家分组时把空商家归入 unknown", () => {
    expect(matches("merchant", "merchant-1")).toBe(true);
    expect(
      matches("merchant", "unknown", {
        record: { ...record, merchant_id: null },
      }),
    ).toBe(true);
  });

  it("按成员分组时把空创建人归入 unknown", () => {
    expect(matches("member", "member-1")).toBe(true);
    expect(
      matches("member", "unknown", {
        record: { ...record, created_by: null },
      }),
    ).toBe(true);
  });

  it("按账户分组时普通记录匹配任意一个付款账户，不看明细账户", () => {
    expect(matches("account", "account-1")).toBe(true);
    expect(matches("account", "account-2")).toBe(false);
    expect(
      matches("account", "account-wife", {
        payments: hospitalPayments.map((payment) => ({
          ...payment,
          transaction_record_id: record.id,
        })),
      }),
    ).toBe(true);
    expect(
      matches("account", "account-1", {
        payments: hospitalPayments,
      }),
    ).toBe(false);
  });

  it("按账户分组时转账匹配明细账户", () => {
    expect(
      matches("account", "account-1", {
        payments: [],
        record: { ...record, type: "transfer" },
      }),
    ).toBe(true);
  });

  it("按持有人分组时匹配任意一个付款账户的持有人，无持有人的账户归入 none", () => {
    expect(matches("holder", "holder-me")).toBe(true);
    expect(matches("holder", "holder-wife")).toBe(false);
    expect(matches("holder", "none", { holderIdsByAccountId: new Map() })).toBe(
      true,
    );
    expect(
      matches("holder", "holder-me", {
        payments: [],
        record: { ...record, type: "transfer" },
      }),
    ).toBe(true);
  });

  it("按父分类分组时匹配子分类所属的顶层分类", () => {
    expect(matches("parentCategory", "parent-category")).toBe(true);
    expect(matches("parentCategory", "child-category")).toBe(false);
  });

  it("按分类分组时把分类缺失的明细归入 unknown", () => {
    expect(matches("category", "child-category")).toBe(true);
    expect(
      matches("category", "unknown", {
        items: [{ ...item, category_id: "missing-category" }],
      }),
    ).toBe(true);
  });

  it("按大分类 / 小分类分组时转账、余额调整不进入任何组（包括 unknown）", () => {
    const uncategorizedItems = [{ ...item, category_id: null }];
    for (const type of ["transfer", "balance_adjustment"] as const) {
      for (const groupBy of ["parentCategory", "category"] as const) {
        expect(
          matches(groupBy, "unknown", {
            items: uncategorizedItems,
            payments: [],
            record: { ...record, type },
          }),
        ).toBe(false);
      }
      // 其他维度不受影响。
      expect(
        matches("month", "2026-07", {
          items: uncategorizedItems,
          payments: [],
          record: { ...record, type },
        }),
      ).toBe(true);
    }
  });

  it("按大分类 / 小分类分组时普通记录的明细缺分类仍归入 unknown", () => {
    const uncategorizedItems = [{ ...item, category_id: null }];
    expect(
      matches("parentCategory", "unknown", { items: uncategorizedItems }),
    ).toBe(true);
    expect(matches("category", "unknown", { items: uncategorizedItems })).toBe(
      true,
    );
  });

  it("按特殊状态分组时匹配明细状态和无状态组", () => {
    expect(
      matches("specialStatus", "pending_reimbursement", {
        items: [{ ...item, special_status: "pending_reimbursement" }],
      }),
    ).toBe(true);
    expect(matches("specialStatus", "none")).toBe(true);
  });

  it("未知分组方式不会匹配记录", () => {
    expect(matches("month", "invalid")).toBe(false);
  });
});

describe("itemMatchesGroup", () => {
  it("明细级维度按单条明细判断所属组", () => {
    expect(
      itemMatchesGroup({
        categoryById,
        groupBy: "parentCategory",
        groupKey: "parent-category",
        item,
      }),
    ).toBe(true);
    expect(
      itemMatchesGroup({
        categoryById,
        groupBy: "category",
        groupKey: "child-category",
        item,
      }),
    ).toBe(true);
    expect(
      itemMatchesGroup({
        categoryById,
        groupBy: "category",
        groupKey: "parent-category",
        item,
      }),
    ).toBe(false);
    expect(
      itemMatchesGroup({
        categoryById,
        groupBy: "specialStatus",
        groupKey: "none",
        item,
      }),
    ).toBe(true);
  });

  it("记录级维度不按明细划分，不匹配", () => {
    expect(
      itemMatchesGroup({
        categoryById,
        groupBy: "account",
        groupKey: "account-1",
        item,
      }),
    ).toBe(false);
  });
});

describe("isItemLevelGroupBy", () => {
  it("大分类 / 小分类 / 特殊状态为明细级维度", () => {
    expect(isItemLevelGroupBy("parentCategory")).toBe(true);
    expect(isItemLevelGroupBy("category")).toBe(true);
    expect(isItemLevelGroupBy("specialStatus")).toBe(true);
    expect(isItemLevelGroupBy("account")).toBe(false);
    expect(isItemLevelGroupBy("month")).toBe(false);
  });
});

describe("isExcludedFromCategoryGroups", () => {
  it("只在按大分类 / 小分类分组时排除转账与余额调整", () => {
    for (const groupBy of ["parentCategory", "category"] as const) {
      expect(isExcludedFromCategoryGroups(groupBy, { type: "transfer" })).toBe(
        true,
      );
      expect(
        isExcludedFromCategoryGroups(groupBy, { type: "balance_adjustment" }),
      ).toBe(true);
      expect(isExcludedFromCategoryGroups(groupBy, { type: "normal" })).toBe(
        false,
      );
    }
    for (const groupBy of [
      "month",
      "merchant",
      "member",
      "account",
      "holder",
      "specialStatus",
    ] as const) {
      expect(isExcludedFromCategoryGroups(groupBy, { type: "transfer" })).toBe(
        false,
      );
    }
  });
});

describe("matchesParentCategory", () => {
  it("父分类键为空时不匹配", () => {
    expect(matchesParentCategory(item, categoryById, undefined)).toBe(false);
  });

  it("分类缺失时可归入 unknown", () => {
    expect(
      matchesParentCategory(
        { ...item, category_id: "missing-category" },
        categoryById,
        "unknown",
      ),
    ).toBe(true);
  });
});
