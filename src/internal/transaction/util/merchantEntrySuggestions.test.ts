import { describe, expect, it } from "vitest";
import type { MerchantEntryHistoryRecord } from "internal/transaction/entity/merchantEntryHistory";
import {
  buildMerchantEntrySuggestions,
  selectFrequentMerchants,
} from "./merchantEntrySuggestions";

function record(
  index: number,
  overrides: Partial<MerchantEntryHistoryRecord> = {},
): MerchantEntryHistoryRecord {
  return {
    id: String(index),
    payments: [{ accountId: "b", currency: "JPY", isArchived: false }],
    items: [{ categoryId: "food", amount: "100" }],
    ...overrides,
  };
}
function history(count: number) {
  return Array.from({ length: count }, (_, index) => record(index));
}

describe("merchantEntrySuggestions", () => {
  it("无历史时返回三个空列表", () => {
    expect(buildMerchantEntrySuggestions([])).toEqual({
      recommendedAccountIds: [],
      automaticCategoryIds: [],
      quickAmounts: [],
    });
  });
  it.each([9, 10])(
    "小分类累计 %i 笔时按阈值决定是否自动添加，重复明细每笔只算一次",
    (count) => {
      const records = history(count).map((r) => ({
        ...r,
        items: [...r.items, ...r.items],
      }));
      expect(
        buildMerchantEntrySuggestions(records).automaticCategoryIds,
      ).toEqual(count === 10 ? ["food"] : []);
    },
  );
  it("小分类按记录数降序，同次数保留首次出现顺序", () => {
    const records = history(12).map((r, i) => ({
      ...r,
      items: [
        { categoryId: "b", amount: "1" },
        { categoryId: "a", amount: "1" },
        ...(i < 11 ? [{ categoryId: "c", amount: "1" }] : []),
      ],
    }));
    expect(buildMerchantEntrySuggestions(records).automaticCategoryIds).toEqual(
      ["b", "a", "c"],
    );
  });
  it("达到阈值的小分类全部返回，不套用常用分类数量上限", () => {
    const items = Array.from({ length: 7 }, (_, i) => ({
      categoryId: String(i),
      amount: "10",
    }));
    expect(
      buildMerchantEntrySuggestions(history(10).map((r) => ({ ...r, items })))
        .automaticCategoryIds,
    ).toEqual(items.map((item) => item.categoryId));
  });
  it("多账户每笔各计一次，去重并排除归档账户，不按金额加权，同次数不额外排序且最多推荐三个", () => {
    const payment = (accountId: string, isArchived = false) => ({
      accountId,
      currency: "JPY",
      isArchived,
    });
    const records = [
      record(0, {
        payments: [
          payment("b"),
          payment("b"),
          payment("a"),
          payment("archived", true),
          payment("d"),
          payment("e"),
        ],
      }),
      record(1, { payments: [payment("c"), payment("archived", true)] }),
      record(2, { payments: [payment("c")] }),
    ];
    expect(
      buildMerchantEntrySuggestions(records).recommendedAccountIds,
    ).toEqual(["c", "b", "a"]);
  });
  it("最近明细作为上次，按金额及币种计数，排除单次金额并去除与上次重复的金额", () => {
    const values = [
      "100.00",
      "200",
      "100",
      "300",
      "200.00",
      "400",
      "300",
      "300",
    ];
    const records = values.map((amount, i) =>
      record(i, { items: [{ categoryId: "food", amount }] }),
    );
    records.push(
      record(8, {
        payments: [{ accountId: "usd", currency: "USD", isArchived: true }],
        items: [
          { categoryId: "food", amount: "100" },
          { categoryId: "food", amount: "100" },
        ],
      }),
    );
    expect(buildMerchantEntrySuggestions(records).quickAmounts).toEqual([
      {
        categoryId: "food",
        lastAmount: { amount: "100", currency: "JPY" },
        frequentAmounts: [
          { amount: "300", currency: "JPY" },
          { amount: "200", currency: "JPY" },
          { amount: "100", currency: "USD" },
        ],
      },
    ]);
  });
  it("常用金额同次数不额外排序，最多返回四个，每个小分类独立统计", () => {
    const records = [
      record(0, {
        items: [
          { categoryId: "food", amount: "999" },
          { categoryId: "other", amount: "1" },
        ],
      }),
    ];
    for (const amount of ["6", "5", "4", "3", "2"])
      records.push(
        record(records.length, {
          items: [
            { categoryId: "food", amount },
            { categoryId: "food", amount },
          ],
        }),
      );
    const result = buildMerchantEntrySuggestions(records).quickAmounts;
    expect(result[0].frequentAmounts.map((a) => a.amount)).toEqual([
      "6",
      "5",
      "4",
      "3",
    ]);
    expect(result[1]).toEqual({
      categoryId: "other",
      lastAmount: { amount: "1", currency: "JPY" },
      frequentAmounts: [],
    });
  });
  it("常用商家按记录数排序且最多返回八个，无历史则为空", () => {
    const counts = Array.from({ length: 10 }, (_, i) => ({
      merchantId: String(i),
      recordCount: i,
    }));
    expect(selectFrequentMerchants(counts).map((r) => r.recordCount)).toEqual([
      9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    expect(counts[0].recordCount).toBe(0);
    expect(selectFrequentMerchants([])).toEqual([]);
  });
});
