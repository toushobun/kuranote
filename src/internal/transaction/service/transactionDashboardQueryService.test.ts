// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { dashboardRecentTransactionCount } from "@/constants/dashboard";
import { NotFoundError } from "internal/shared/errors/appError";
import { createTransactionDashboardQueryService } from "internal/transaction/service/transactionDashboardQueryService";

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

function createRecord(
  id: string,
  transactionAt: string,
  type: "normal" | "transfer" = "normal",
) {
  return {
    created_at: transactionAt,
    created_by: otherUserId,
    id,
    merchant_id: type === "transfer" ? null : "merchant-1",
    note: null,
    transaction_at: transactionAt,
    type,
  };
}

describe("TransactionDashboardQueryService", () => {
  it("混合展示普通交易与转账并保持本月汇总口径", async () => {
    const recentRecords = [
      createRecord("recent-1", "2026-07-05T01:00:00.000Z"),
      createRecord("recent-2", "2026-07-04T01:00:00.000Z", "transfer"),
      createRecord("recent-3", "2026-05-04T01:00:00.000Z"),
      createRecord("recent-4", "2026-04-04T01:00:00.000Z", "transfer"),
      createRecord("recent-5", "2026-03-04T01:00:00.000Z"),
    ];
    const recentDisplayItems = [
      {
        account_id: "account-1",
        amount: "100",
        balance_delta: "-100",
        category_id: "recent-category",
        note: null,
        transaction_record_id: "recent-1",
      },
      {
        account_id: "account-1",
        amount: "250",
        balance_delta: "-250",
        category_id: null,
        note: null,
        transaction_record_id: "recent-2",
      },
      {
        account_id: "account-2",
        amount: "250",
        balance_delta: "250",
        category_id: null,
        note: null,
        transaction_record_id: "recent-2",
      },
      {
        account_id: "account-1",
        amount: "100",
        balance_delta: "-100",
        category_id: "recent-category",
        note: null,
        transaction_record_id: "recent-3",
      },
      {
        account_id: "account-2",
        amount: "300",
        balance_delta: "-300",
        category_id: null,
        note: null,
        transaction_record_id: "recent-4",
      },
      {
        account_id: "account-1",
        amount: "300",
        balance_delta: "300",
        category_id: null,
        note: null,
        transaction_record_id: "recent-4",
      },
      {
        account_id: "account-1",
        amount: "100",
        balance_delta: "-100",
        category_id: "recent-category",
        note: null,
        transaction_record_id: "recent-5",
      },
    ];
    const listRecords = vi.fn().mockResolvedValue(recentRecords);
    const listItems = vi.fn().mockResolvedValue(recentDisplayItems);
    const findSummariesByIds = vi.fn().mockResolvedValue([
      {
        id: "recent-category",
        name: "餐饮",
        parent_id: null,
        type: "expense",
      },
    ]);
    const transactionRepository = {
      findUserSummaries: vi.fn().mockResolvedValue([
        {
          display_color: "amber",
          display_name: "其他成员",
          id: otherUserId,
        },
      ]),
      loadDashboardRecentlyUsedAccountIds: vi
        .fn()
        .mockResolvedValue(["account-2"]),
      loadDashboardMonthSource: vi.fn().mockResolvedValue({
        categories: [
          { id: "month-income", type: "income" },
          { id: "month-expense", type: "expense" },
        ],
        items: [
          {
            amount: "1500",
            category_id: "month-income",
            transaction_record_id: "month-mixed",
          },
          {
            amount: "300",
            category_id: "month-expense",
            transaction_record_id: "month-mixed",
          },
          {
            amount: "500",
            category_id: "month-expense",
            transaction_record_id: "month-expense-record",
          },
        ],
      }),
      listItems,
      listRecords,
      listTagAssignments: vi.fn().mockResolvedValue([]),
      listTagsByIds: vi.fn().mockResolvedValue([]),
    };
    const service = createTransactionDashboardQueryService({
      accountQueryService: {
        getTransactionContext: vi.fn().mockResolvedValue({
          accountColorById: new Map([
            ["account-1", "amber"],
            ["account-2", "jade"],
          ]),
          accounts: [
            { currency: "JPY", id: "account-1", name: "现金" },
            { currency: "JPY", id: "account-2", name: "银行卡" },
          ],
          showRecorder: true,
        }),
      } as never,
      categoryQueryService: { findSummariesByIds } as never,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("member"),
      },
      merchantQueryService: {
        findSummariesByIds: vi
          .fn()
          .mockResolvedValue([
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
      balance: "700",
      currency: "JPY",
      expense: "500",
      income: "1200",
    });
    expect(transactionRepository.loadDashboardMonthSource).toHaveBeenCalledWith(
      {
        dateEnd: "2026-06-30T15:00:00.000Z",
        dateStart: "2026-05-31T15:00:00.000Z",
        ledgerId,
      },
    );
    expect(listRecords).toHaveBeenCalledOnce();
    expect(listRecords).toHaveBeenCalledWith({
      ledgerId,
      limit: dashboardRecentTransactionCount,
      recordType: "all",
    });
    expect(listRecords.mock.calls[0]?.[0]).not.toHaveProperty("dateStart");
    expect(listRecords.mock.calls[0]?.[0]).not.toHaveProperty("dateEnd");
    expect(listItems).toHaveBeenCalledWith(ledgerId, [
      "recent-1",
      "recent-2",
      "recent-3",
      "recent-4",
      "recent-5",
    ]);
    expect(findSummariesByIds).toHaveBeenCalledWith({
      categoryIds: ["recent-category"],
      ledgerId,
      userId,
    });
    expect(
      transactionRepository.loadDashboardRecentlyUsedAccountIds,
    ).toHaveBeenCalledWith({ ledgerId, limit: 100 });
    expect(result.recentTransactions).toHaveLength(
      dashboardRecentTransactionCount,
    );
    expect(result.recentTransactions.map((item) => item.id)).toEqual([
      "recent-1",
      "recent-2",
      "recent-3",
      "recent-4",
      "recent-5",
    ]);
    expect(result.recentTransactions.map((item) => item.type)).toEqual([
      "expense",
      "transfer",
      "expense",
      "transfer",
      "expense",
    ]);
    expect(result.recentTransactions[0]).toMatchObject({
      account_color: null,
      canEdit: false,
      merchant_name: "超市",
      recorder_color: null,
      recorder_name: null,
      show_recorder: true,
    });
    expect(result.recentTransactions[1]).toMatchObject({
      account_color: null,
      account_name: "现金 → 银行卡",
      categoryItems: [],
      merchant_name: null,
      recorder_color: null,
      recorder_name: null,
      show_recorder: true,
      type: "transfer",
    });
    expect(result.recentTransactions[2]).toMatchObject({
      account_color: null,
      account_name: "现金",
      categoryItems: [
        {
          amount: "100",
          categoryName: "餐饮",
          categoryType: "expense",
          parentCategoryName: null,
        },
      ],
      merchant_name: "超市",
      recorder_color: null,
      recorder_name: null,
      show_recorder: true,
      type: "expense",
    });
    expect(result.recentTransactions[3]).toMatchObject({
      account_color: null,
      account_name: "银行卡 → 现金",
      categoryItems: [],
      merchant_name: null,
      recorder_color: null,
      recorder_name: null,
      show_recorder: true,
      type: "transfer",
    });
    expect(result.recentTransactions[4]).toMatchObject({
      account_color: null,
      account_name: "现金",
      categoryItems: [
        {
          amount: "100",
          categoryName: "餐饮",
          categoryType: "expense",
          parentCategoryName: null,
        },
      ],
      merchant_name: "超市",
      recorder_color: null,
      recorder_name: null,
      show_recorder: true,
      type: "expense",
    });
    expect(result.recentlyUsedAccountIds).toEqual(["account-2"]);
  });

  it("非账本成员不能读取 Dashboard 交易数据", async () => {
    const loadDashboardMonthSource = vi.fn();
    const loadDashboardRecentlyUsedAccountIds = vi.fn();
    const listRecords = vi.fn();
    const service = createTransactionDashboardQueryService({
      accountQueryService: {} as never,
      categoryQueryService: {} as never,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue(null),
      },
      merchantQueryService: {} as never,
      transactionRepository: {
        loadDashboardMonthSource,
        loadDashboardRecentlyUsedAccountIds,
        listRecords,
      } as never,
    });

    await expect(
      service.getDashboardData({
        currentLedger,
        dateEnd: "2026-06-30T15:00:00.000Z",
        dateStart: "2026-05-31T15:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(loadDashboardMonthSource).not.toHaveBeenCalled();
    expect(loadDashboardRecentlyUsedAccountIds).not.toHaveBeenCalled();
    expect(listRecords).not.toHaveBeenCalled();
  });
});
