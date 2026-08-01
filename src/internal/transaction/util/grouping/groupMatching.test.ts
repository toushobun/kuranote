// @vitest-environment node

import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import {
  matchesParentCategory,
  recordMatchesGroup,
} from "internal/transaction/util/grouping/groupMatching";

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
    items: [item],
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

  it("按账户分组时匹配任意一个交易明细账户", () => {
    expect(matches("account", "account-1")).toBe(true);
    expect(matches("account", "account-2")).toBe(false);
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
