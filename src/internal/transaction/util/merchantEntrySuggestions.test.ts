import { describe, expect, it } from "vitest";
import type { MerchantEntryHistoryRecord } from "internal/transaction/entity/merchantEntryHistory";
import { buildMerchantEntrySuggestions } from "./merchantEntrySuggestions";

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
  it.each([
    [20, 10],
    [19, 10],
    [4, 2],
    [3, 2],
    [2, 2],
  ])(
    "样本 %i 笔时阈值为 %i 笔，少 1 笔不自动添加，重复明细每笔只算一次",
    (sampleCount, threshold) => {
      const records = history(sampleCount).map((r, i) => ({
        ...r,
        items: [
          ...(i < threshold ? [...r.items, ...r.items] : []),
          ...(i < threshold - 1
            ? [
                { categoryId: "drink", amount: "100" },
                { categoryId: "drink", amount: "100" },
              ]
            : []),
        ],
      }));
      expect(
        buildMerchantEntrySuggestions(records).automaticCategoryIds,
      ).toEqual(["food"]);
    },
  );
  it("只有 1 笔记录时不自动添加", () => {
    expect(
      buildMerchantEntrySuggestions(history(1)).automaticCategoryIds,
    ).toEqual([]);
  });
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
  it("同一小分类按币种分别保留上次及常用金额，直接使用 RPC 金额字符串", () => {
    const samples = [
      ["JPY", "100.00"],
      ["CNY", "200.00"],
      ["JPY", "300.00"],
      ["CNY", "100.00"],
      ["JPY", "100.00"],
      ["CNY", "200.00"],
      ["JPY", "300.00"],
      ["CNY", "100.00"],
      ["JPY", "300.00"],
      ["JPY", "400.00"],
      ["JPY", "400.00"],
      ["JPY", "500.00"],
    ];
    const records = samples.map(([currency, amount], i) =>
      record(i, {
        payments: [
          { accountId: currency, currency, isArchived: currency === "CNY" },
        ],
        items: [{ categoryId: "food", amount }],
      }),
    );
    expect(buildMerchantEntrySuggestions(records).quickAmounts).toEqual([
      {
        categoryId: "food",
        currency: "JPY",
        lastAmount: "100.00",
        frequentAmounts: ["300.00", "400.00"],
      },
      {
        categoryId: "food",
        currency: "CNY",
        lastAmount: "200.00",
        frequentAmounts: ["100.00"],
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
    expect(result[0].frequentAmounts).toEqual(["6", "5", "4", "3"]);
    expect(result[1]).toEqual({
      categoryId: "other",
      currency: "JPY",
      lastAmount: "1",
      frequentAmounts: [],
    });
  });
});
