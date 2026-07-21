import { describe, expect, it } from "vitest";

import type { TransactionListItem } from "types/transactions";

import {
  buildTransactionSearchPage,
  normalizeTransactionSearchQuery,
} from "./transactionSearchHelpers";

describe("transactionSearchHelpers", () => {
  it("空关键词返回空分页", () => {
    const page = buildTransactionSearchPage(
      [createItem({ idSuffix: "001" })],
      "  ",
    );

    expect(page).toEqual({ items: [], nextOffset: null, totalCount: 0 });
  });

  it("按商家名搜索且忽略大小写", () => {
    const page = buildTransactionSearchPage(
      [createItem({ idSuffix: "001", merchantName: "Starbucks" })],
      "star",
    );

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.merchant_name).toBe("Starbucks");
  });

  it("按备注搜索", () => {
    const page = buildTransactionSearchPage(
      [createItem({ idSuffix: "001", note: "海洋馆旁边买咖啡" })],
      "海洋馆",
    );

    expect(page.items).toHaveLength(1);
  });

  it("按金额搜索", () => {
    const page = buildTransactionSearchPage(
      [createItem({ amount: "8754", idSuffix: "001" })],
      "8,754",
    );

    expect(page.items).toHaveLength(1);
  });

  it("按成员名搜索", () => {
    const page = buildTransactionSearchPage(
      [createItem({ idSuffix: "001", recorderName: "淞文" })],
      "淞文",
    );

    expect(page.items).toHaveLength(1);
  });

  it("单人账本隐藏记录人时仍可按成员名搜索", () => {
    const item = createItem({ idSuffix: "001", recorderName: "淞文" });
    item.show_recorder = false;

    const page = buildTransactionSearchPage([item], "淞文");

    expect(page.items).toHaveLength(1);
  });

  it("按发生时间、创建时间、id 稳定倒序排列", () => {
    const older = createItem({
      idSuffix: "001",
      transactionAt: "2026-07-01T09:00:00.000Z",
    });
    const sameTimeOlderCreated = createItem({
      createdAt: "2026-07-02T09:00:00.000Z",
      idSuffix: "002",
      transactionAt: "2026-07-02T09:00:00.000Z",
    });
    const sameTimeNewerCreated = createItem({
      createdAt: "2026-07-02T10:00:00.000Z",
      idSuffix: "003",
      transactionAt: "2026-07-02T09:00:00.000Z",
    });

    const page = buildTransactionSearchPage(
      [older, sameTimeOlderCreated, sameTimeNewerCreated],
      "便利店",
    );

    expect(page.items.map((item) => item.id)).toEqual([
      sameTimeNewerCreated.id,
      sameTimeOlderCreated.id,
      older.id,
    ]);
  });

  it("按 20 条分页并保留总件数", () => {
    const items = Array.from({ length: 21 }, (_, index) =>
      createItem({ idSuffix: String(index + 1).padStart(3, "0") }),
    );

    const page = buildTransactionSearchPage(items, "便利店");

    expect(page.items).toHaveLength(20);
    expect(page.nextOffset).toBe(20);
    expect(page.totalCount).toBe(21);
  });

  it("规范化关键词时会 trim 并限制长度", () => {
    expect(normalizeTransactionSearchQuery(`  ${"A".repeat(90)}  `)).toBe(
      "A".repeat(80),
    );
  });
});

function createItem({
  amount = "980",
  createdAt = "2026-07-01T10:00:00.000Z",
  idSuffix,
  merchantName = "便利店",
  note = null,
  recorderName = "我",
  transactionAt = "2026-07-01T10:00:00.000Z",
}: {
  amount?: string;
  createdAt?: string;
  idSuffix: string;
  merchantName?: string;
  note?: string | null;
  recorderName?: string;
  transactionAt?: string;
}): TransactionListItem {
  return {
    account_currency: "JPY",
    account_name: "三井住友银行",
    amount,
    categoryItems: [
      {
        amount,
        categoryName: "午餐",
        categoryType: "expense",
        parentCategoryName: "饮食",
      },
    ],
    created_at: createdAt,
    id: `00000000-0000-4000-8000-${idSuffix.padStart(12, "0")}`,
    merchant_icon_url: null,
    merchant_name: merchantName,
    note,
    recorder_name: recorderName,
    tagNames: ["日常"],
    transaction_at: transactionAt,
    type: "expense",
  };
}
