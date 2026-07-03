import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TransactionListItem } from "types/transactions";

import { loadTransactionSearchPage } from "./transactionSearch";

const { buildItemsMock, loadContextMock } = vi.hoisted(() => ({
  buildItemsMock: vi.fn(),
  loadContextMock: vi.fn(),
}));

vi.mock("server/loaders/transactionStep4Groups/context", () => ({
  buildTransactionListItemsFromContext: buildItemsMock,
  loadTransactionGroupLoaderContext: loadContextMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  loadContextMock.mockResolvedValue({ records: [] });
  buildItemsMock.mockReturnValue([]);
});

describe("loadTransactionSearchPage", () => {
  it("空关键词不读取流水上下文", async () => {
    const page = await loadTransactionSearchPage("  ");

    expect(page).toEqual({ items: [], nextOffset: null, totalCount: 0 });
    expect(loadContextMock).not.toHaveBeenCalled();
  });

  it("基于 active 流水上下文构建搜索结果", async () => {
    const item = createItem({ idSuffix: "001", merchantName: "星巴克" });
    const context = { records: [{ id: item.id }] };
    loadContextMock.mockResolvedValue(context);
    buildItemsMock.mockReturnValue([item]);

    const page = await loadTransactionSearchPage("星巴克");

    expect(loadContextMock).toHaveBeenCalledTimes(1);
    expect(buildItemsMock).toHaveBeenCalledWith(context.records, context);
    expect(page.items).toEqual([item]);
    expect(page.totalCount).toBe(1);
  });
});

function createItem({
  idSuffix,
  merchantName,
}: {
  idSuffix: string;
  merchantName: string;
}): TransactionListItem {
  const time = "2026-07-01T10:00:00.000Z";

  return {
    account_currency: "JPY",
    account_name: "三井住友银行",
    amount: "980",
    categoryItems: [
      {
        amount: "980",
        categoryName: "咖啡饮品",
        categoryType: "expense",
        parentCategoryName: "饮食",
      },
    ],
    created_at: time,
    id: `00000000-0000-4000-8000-${idSuffix.padStart(12, "0")}`,
    merchant_icon_url: null,
    merchant_name: merchantName,
    note: null,
    recorder_name: "我",
    tagNames: ["日常"],
    transaction_at: time,
    type: "expense",
  };
}
