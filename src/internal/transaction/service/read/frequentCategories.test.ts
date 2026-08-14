import { describe, expect, it, vi } from "vitest";

import {
  loadFrequentCategoryHistory,
  selectFrequentCategoryIds,
} from "./frequentCategories";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const augustStart = "2026-07-31T15:00:00.000Z";
const julyStart = "2026-06-30T15:00:00.000Z";
const juneStart = "2026-05-31T15:00:00.000Z";

function repeated(categoryId: string, count: number) {
  return Array.from({ length: count }, () => categoryId);
}

function createRepository({
  categoryIdsByStart,
  previousTransactionAtByEnd,
}: {
  categoryIdsByStart: Record<string, string[]>;
  previousTransactionAtByEnd?: Record<string, string | null>;
}) {
  return {
    findLatestActiveNormalTransactionAtBefore: vi.fn(
      async (_ledgerId: string, dateEnd: string) =>
        previousTransactionAtByEnd?.[dateEnd] ?? null,
    ),
    listActiveNormalCategoryIdsByMonth: vi.fn(
      async ({ dateStart }: { dateStart: string }) =>
        categoryIdsByStart[dateStart] ?? [],
    ),
  };
}

describe("loadFrequentCategoryHistory", () => {
  it("当前月达到阈值时使用该月全部明细且不查询更早月份", async () => {
    const repository = createRepository({
      categoryIdsByStart: {
        [augustStart]: [...repeated("food", 12), ...repeated("daily", 14)],
      },
    });

    const history = await loadFrequentCategoryHistory({
      currentMonth: "2026-08",
      ledgerId,
      transactionRepository: repository,
    });

    expect(history).toHaveLength(26);
    expect(selectFrequentCategoryIds(history, ["food", "daily"])).toEqual([
      "daily",
      "food",
    ]);
    expect(
      repository.listActiveNormalCategoryIdsByMonth,
    ).toHaveBeenCalledOnce();
    expect(
      repository.findLatestActiveNormalTransactionAtBefore,
    ).not.toHaveBeenCalled();
  });

  it("当前月不足时纳入上一个完整月份的全部明细", async () => {
    const repository = createRepository({
      categoryIdsByStart: {
        [augustStart]: repeated("food", 12),
        [julyStart]: repeated("daily", 15),
      },
      previousTransactionAtByEnd: {
        [augustStart]: "2026-07-15T03:00:00.000Z",
      },
    });

    const history = await loadFrequentCategoryHistory({
      currentMonth: "2026-08",
      ledgerId,
      transactionRepository: repository,
    });

    expect(history).toHaveLength(27);
    expect(selectFrequentCategoryIds(history, ["food", "daily"])).toEqual([
      "daily",
      "food",
    ]);
    expect(repository.listActiveNormalCategoryIdsByMonth).toHaveBeenCalledTimes(
      2,
    );
  });

  it("跨多个完整月份累计达到阈值后停止", async () => {
    const repository = createRepository({
      categoryIdsByStart: {
        [augustStart]: repeated("food", 5),
        [julyStart]: repeated("daily", 6),
        [juneStart]: repeated("traffic", 14),
      },
      previousTransactionAtByEnd: {
        [augustStart]: "2026-07-15T03:00:00.000Z",
        [julyStart]: "2026-06-15T03:00:00.000Z",
      },
    });

    const history = await loadFrequentCategoryHistory({
      currentMonth: "2026-08",
      ledgerId,
      transactionRepository: repository,
    });

    expect(history).toHaveLength(25);
    expect(
      selectFrequentCategoryIds(history, ["food", "daily", "traffic"]),
    ).toEqual(["traffic", "daily", "food"]);
    expect(repository.listActiveNormalCategoryIdsByMonth).toHaveBeenCalledTimes(
      3,
    );
    expect(
      repository.findLatestActiveNormalTransactionAtBefore,
    ).toHaveBeenCalledTimes(2);
  });

  it("全部历史不足阈值时返回 fallback 信号", async () => {
    const repository = createRepository({
      categoryIdsByStart: {
        [augustStart]: repeated("food", 10),
        [julyStart]: repeated("daily", 8),
      },
      previousTransactionAtByEnd: {
        [augustStart]: "2026-07-15T03:00:00.000Z",
      },
    });

    const history = await loadFrequentCategoryHistory({
      currentMonth: "2026-08",
      ledgerId,
      transactionRepository: repository,
    });

    expect(history).toBeNull();
    expect(
      selectFrequentCategoryIds(history, [
        "manual-1",
        "manual-2",
        "manual-3",
        "manual-4",
        "manual-5",
        "manual-6",
      ]),
    ).toEqual(["manual-1", "manual-2", "manual-3", "manual-4", "manual-5"]);
  });

  it("完全没有历史记录时使用手动排序前五项", async () => {
    const repository = createRepository({ categoryIdsByStart: {} });

    const history = await loadFrequentCategoryHistory({
      currentMonth: "2026-08",
      ledgerId,
      transactionRepository: repository,
    });

    expect(history).toBeNull();
    expect(
      selectFrequentCategoryIds(history, [
        "one",
        "two",
        "three",
        "four",
        "five",
      ]),
    ).toEqual(["one", "two", "three", "four", "five"]);
  });
});

describe("selectFrequentCategoryIds", () => {
  it("同频时按现有分类手动顺序稳定排序", () => {
    const firstResult = selectFrequentCategoryIds(
      ["third", "second", "first", "third", "first", "second"],
      ["first", "second", "third"],
    );
    const secondResult = selectFrequentCategoryIds(
      ["second", "first", "third", "first", "second", "third"],
      ["first", "second", "third"],
    );

    expect(firstResult).toEqual(["first", "second", "third"]);
    expect(secondResult).toEqual(firstResult);
  });
});
