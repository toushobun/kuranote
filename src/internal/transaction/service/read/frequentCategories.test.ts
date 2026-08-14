import { describe, expect, it, vi } from "vitest";

import { RepositoryError } from "internal/shared/errors/appError";

import {
  loadFrequentCategoryHistory,
  selectFrequentCategoryIds,
} from "./frequentCategories";

const ledgerId = "00000000-0000-4000-8000-000000000032";

describe("loadFrequentCategoryHistory", () => {
  it("只通过一次 Repository 读取入口加载完整月份累计后的聚合结果", async () => {
    const counts = [
      { categoryId: "daily", count: 15 },
      { categoryId: "food", count: 12 },
    ];
    const loadFrequentCategoryCounts = vi.fn().mockResolvedValue(counts);

    await expect(
      loadFrequentCategoryHistory({
        currentMonth: "2026-08",
        ledgerId,
        transactionRepository: { loadFrequentCategoryCounts },
      }),
    ).resolves.toEqual(counts);

    expect(loadFrequentCategoryCounts).toHaveBeenCalledOnce();
    expect(loadFrequentCategoryCounts).toHaveBeenCalledWith({
      dateEnd: "2026-08-31T15:00:00.000Z",
      dateStart: "2026-07-31T15:00:00.000Z",
      ledgerId,
      minimumItemCount: 20,
    });
  });

  it("历史不足阈值时使用 Repository 的空结果作为 fallback 信号", async () => {
    const loadFrequentCategoryCounts = vi.fn().mockResolvedValue([]);

    await expect(
      loadFrequentCategoryHistory({
        currentMonth: "2026-08",
        ledgerId,
        transactionRepository: { loadFrequentCategoryCounts },
      }),
    ).resolves.toBeNull();
  });

  it("辅助查询失败时降级为手动排序，不阻止记账表单加载", async () => {
    const loadFrequentCategoryCounts = vi
      .fn()
      .mockRejectedValue(
        new RepositoryError("frequent_categories_failed", "加载失败"),
      );

    const history = await loadFrequentCategoryHistory({
      currentMonth: "2026-08",
      ledgerId,
      transactionRepository: { loadFrequentCategoryCounts },
    });

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

  it("非 Repository 异常继续向上抛出", async () => {
    const unexpectedError = new Error("unexpected");
    const loadFrequentCategoryCounts = vi
      .fn()
      .mockRejectedValue(unexpectedError);

    await expect(
      loadFrequentCategoryHistory({
        currentMonth: "2026-08",
        ledgerId,
        transactionRepository: { loadFrequentCategoryCounts },
      }),
    ).rejects.toBe(unexpectedError);
  });
});

describe("selectFrequentCategoryIds", () => {
  it("按出现次数降序取前五个，并忽略已不在当前手动排序中的分类", () => {
    expect(
      selectFrequentCategoryIds(
        [
          { categoryId: "sixth", count: 1 },
          { categoryId: "missing", count: 99 },
          { categoryId: "first", count: 6 },
          { categoryId: "second", count: 5 },
          { categoryId: "third", count: 4 },
          { categoryId: "fourth", count: 3 },
          { categoryId: "fifth", count: 2 },
        ],
        ["first", "second", "third", "fourth", "fifth", "sixth"],
      ),
    ).toEqual(["first", "second", "third", "fourth", "fifth"]);
  });

  it("同频时按现有分类手动顺序稳定排序", () => {
    const firstResult = selectFrequentCategoryIds(
      [
        { categoryId: "third", count: 2 },
        { categoryId: "second", count: 2 },
        { categoryId: "first", count: 2 },
      ],
      ["first", "second", "third"],
    );
    const secondResult = selectFrequentCategoryIds(
      [
        { categoryId: "second", count: 2 },
        { categoryId: "first", count: 2 },
        { categoryId: "third", count: 2 },
      ],
      ["first", "second", "third"],
    );

    expect(firstResult).toEqual(["first", "second", "third"]);
    expect(secondResult).toEqual(firstResult);
  });
});
