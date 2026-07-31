// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentLedger } from "internal/ledger";
import type { TransactionRecordDbRow } from "internal/db-types";
import { defaultTransactionFilters } from "internal/transaction/entity/transactionGrouping";
import type { TransactionGroupRepository } from "internal/transaction/repository/transactionRepository";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

const mocks = vi.hoisted(() => ({
  buildTransactionListItemsFromContext: vi.fn(),
  getTransactionGroupContextLookups: vi.fn(),
  loadTransactionGroupLoaderContextForRecords: vi.fn(),
}));

vi.mock("internal/transaction/service/read/transactionContext", () => ({
  buildTransactionListItemsFromContext:
    mocks.buildTransactionListItemsFromContext,
  loadTransactionGroupLoaderContextForRecords:
    mocks.loadTransactionGroupLoaderContextForRecords,
}));

vi.mock("internal/transaction/util/grouping/contextLookups", () => ({
  getTransactionGroupContextLookups: mocks.getTransactionGroupContextLookups,
}));

import {
  loadStep4TransactionGroupItems,
  loadStep4TransactionGroupPage,
} from "internal/transaction/service/read/groupLoaders";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserId: "user-1",
  currentUserRole: "owner",
  id: "ledger-1",
  name: "家庭账本",
};

function createRecord(
  id: string,
  transactionAt: string,
): TransactionRecordDbRow {
  return {
    created_at: transactionAt,
    created_by: "user-1",
    id,
    merchant_id: null,
    note: null,
    transaction_at: transactionAt,
    type: "normal",
  };
}

function createContext(
  records: TransactionRecordDbRow[],
): TransactionGroupLoaderContext {
  return {
    accountColorById: new Map(),
    accounts: [],
    categories: [],
    currentLedger,
    currentUserId: "user-1",
    items: [],
    merchants: [],
    recorders: [],
    records,
  };
}

function createDependencies(listRecords: ReturnType<typeof vi.fn>) {
  return {
    transactionRepository: {
      listRecords,
      loadGroupSummaries: vi.fn(),
    },
  } as unknown as TransactionReadDependencies<TransactionGroupRepository>;
}

function createMonthIso(offset: number) {
  return new Date(Date.UTC(2026, 6 - offset, 15, 1)).toISOString();
}

describe("groupLoaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadTransactionGroupLoaderContextForRecords.mockImplementation(
      async (
        _dependencies: TransactionReadDependencies,
        _ledger: CurrentLedger,
        records: TransactionRecordDbRow[],
      ) => createContext(records),
    );
    mocks.getTransactionGroupContextLookups.mockReturnValue({
      categoryById: new Map(),
      itemsByRecordId: new Map(),
      tagsByRecordId: new Map(),
    });
    mocks.buildTransactionListItemsFromContext.mockReturnValue([]);
  });

  it("扫描到足够的时间分组后不再读取下一窗口", async () => {
    const monthDates = Array.from({ length: 21 }, (_, index) =>
      createMonthIso(index),
    );
    const records = Array.from({ length: 100 }, (_, index) =>
      createRecord(`record-${index}`, monthDates[index % monthDates.length]),
    );
    const listRecords = vi.fn().mockResolvedValue(records);

    const result = await loadStep4TransactionGroupPage(
      createDependencies(listRecords),
      currentLedger,
      "month",
      0,
      defaultTransactionFilters,
    );

    expect(listRecords).toHaveBeenCalledOnce();
    expect(listRecords).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, offset: 0 }),
    );
    expect(result.groups).toHaveLength(20);
    expect(result.nextOffset).toBe(20);
  });

  it("完整窗口不足时继续扫描并在短窗口后停止", async () => {
    const firstWindow = Array.from({ length: 100 }, (_, index) =>
      createRecord(`record-${index}`, createMonthIso(0)),
    );
    const secondWindow = [createRecord("record-100", createMonthIso(1))];
    const listRecords = vi
      .fn()
      .mockResolvedValueOnce(firstWindow)
      .mockResolvedValueOnce(secondWindow);

    const result = await loadStep4TransactionGroupPage(
      createDependencies(listRecords),
      currentLedger,
      "month",
      0,
      defaultTransactionFilters,
    );

    expect(listRecords).toHaveBeenCalledTimes(2);
    expect(listRecords).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ offset: 100 }),
    );
    expect(result.groups).toHaveLength(2);
    expect(result.nextOffset).toBeNull();
  });

  it("分组日期边界与筛选日期边界取交集", async () => {
    const listRecords = vi.fn().mockResolvedValue([]);

    await loadStep4TransactionGroupItems(
      createDependencies(listRecords),
      currentLedger,
      "month",
      "2026-07",
      0,
      {
        ...defaultTransactionFilters,
        dateFrom: "2026-07-10",
        dateTo: "2026-07-20",
      },
    );

    expect(listRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        dateEnd: "2026-07-20T15:00:00.000Z",
        dateStart: "2026-07-09T15:00:00.000Z",
        groupKeyPushDown: { groupBy: "month", groupKey: "2026-07" },
      }),
    );
  });

  it("日期边界没有交集时直接返回空页", async () => {
    const listRecords = vi.fn();

    await expect(
      loadStep4TransactionGroupItems(
        createDependencies(listRecords),
        currentLedger,
        "month",
        "2026-07",
        0,
        {
          ...defaultTransactionFilters,
          dateFrom: "2026-08-01",
        },
      ),
    ).resolves.toEqual({ groups: [], nextOffset: null });
    expect(listRecords).not.toHaveBeenCalled();
  });

  it.each([
    ["merchant", "merchant-1", { merchantId: "merchant-2" }],
    ["member", "member-1", { memberId: "member-2" }],
  ] as const)(
    "%s 分组键与记录级筛选冲突时不扫描记录",
    async (groupBy, groupKey, filterOverride) => {
      const listRecords = vi.fn();

      await expect(
        loadStep4TransactionGroupItems(
          createDependencies(listRecords),
          currentLedger,
          groupBy,
          groupKey,
          0,
          { ...defaultTransactionFilters, ...filterOverride },
        ),
      ).resolves.toEqual({ groups: [], nextOffset: null });
      expect(listRecords).not.toHaveBeenCalled();
    },
  );
});
