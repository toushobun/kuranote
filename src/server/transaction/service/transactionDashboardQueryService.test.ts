// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "server/shared/errors/appError";
import { createTransactionDashboardQueryService } from "server/transaction/service/transactionDashboardQueryService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000099";

const currentLedger = {
  baseCurrency: "JPY",
  currentUserId: userId,
  currentUserRole: "member" as const,
  id: ledgerId,
  name: "家庭账本",
};

describe("TransactionDashboardQueryService", () => {
  it("通过 Transaction 统一上下文生成汇总和编辑权限", async () => {
    const monthlyRecord = {
      created_at: "2026-06-04T01:00:00.000Z",
      created_by: otherUserId,
      id: "record-1",
      merchant_id: "merchant-1",
      note: null,
      transaction_at: "2026-06-04T01:00:00.000Z",
      type: "normal" as const,
    };
    const monthlyItem = {
      account_id: "account-1",
      amount: "1200",
      balance_delta: "-1200",
      category_id: "category-1",
      note: null,
      transaction_record_id: "record-1",
    };
    const transactionRepository = {
      findUserSummaries: vi.fn().mockResolvedValue([]),
      listItems: vi
        .fn()
        .mockResolvedValueOnce([monthlyItem])
        .mockResolvedValueOnce([monthlyItem]),
      listRecords: vi
        .fn()
        .mockResolvedValueOnce([monthlyRecord])
        .mockResolvedValueOnce([monthlyRecord]),
      listTagAssignments: vi.fn().mockResolvedValue([]),
      listTagsByIds: vi.fn().mockResolvedValue([]),
    };
    const service = createTransactionDashboardQueryService({
      accountQueryService: {
        getTransactionContext: vi.fn().mockResolvedValue({
          accountColorById: new Map(),
          accounts: [{ currency: "JPY", id: "account-1", name: "现金" }],
          showRecorder: false,
        }),
      } as never,
      categoryQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue([
          {
            id: "category-1",
            name: "餐饮",
            parent_id: null,
            type: "expense",
          },
        ]),
      } as never,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("member"),
      },
      merchantQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue([
          { icon_url: null, id: "merchant-1", name: "超市" },
        ]),
      } as never,
      transactionRepository: transactionRepository as never,
    });

    const result = await service.getDashboardData({
      currentLedger,
      dateEnd: "2026-06-30T15:00:00.000Z",
      dateStart: "2026-05-31T15:00:00.000Z",
    });

    expect(result.monthSummary).toEqual({
      balance: "-1200",
      currency: "JPY",
      expense: "1200",
      income: "0",
    });
    expect(result.recentTransactions[0]).toMatchObject({
      canEdit: false,
      merchant_name: "超市",
    });
    expect(result.recentlyUsedAccountIds).toEqual(["account-1"]);
  });

  it("非账本成员不能读取 Dashboard 交易数据", async () => {
    const listRecords = vi.fn();
    const service = createTransactionDashboardQueryService({
      accountQueryService: {} as never,
      categoryQueryService: {} as never,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue(null),
      },
      merchantQueryService: {} as never,
      transactionRepository: { listRecords } as never,
    });

    await expect(
      service.getDashboardData({
        currentLedger,
        dateEnd: "2026-06-30T15:00:00.000Z",
        dateStart: "2026-05-31T15:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(listRecords).not.toHaveBeenCalled();
  });
});
