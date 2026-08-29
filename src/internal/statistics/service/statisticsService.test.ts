// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedgerRole } from "internal/ledger";
import {
  AuthenticationError,
  NotFoundError,
} from "internal/shared/errors/appError";
import type { StatisticsRepository } from "internal/statistics/repository/statisticsRepository";
import { createStatisticsService } from "internal/statistics/service/statisticsService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

function createRepository(
  overrides: Partial<StatisticsRepository> = {},
): StatisticsRepository {
  return {
    findLedger: vi.fn().mockResolvedValue({
      baseCurrency: "JPY",
      id: ledgerId,
      name: "家庭账本",
    }),
    listDashboardAccounts: vi.fn().mockResolvedValue([]),
    loadMonthlySource: vi.fn().mockResolvedValue({
      categories: [],
      items: [],
      records: [],
    }),
    ...overrides,
  };
}

function createService({
  currentUserId = userId,
  repository = createRepository(),
  role = "member",
}: {
  currentUserId?: string | null;
  repository?: StatisticsRepository;
  role?: CurrentLedgerRole | null;
} = {}) {
  const transactionDashboardQueryService = {
    getDashboardData: vi.fn().mockResolvedValue({
      monthSummary: {
        balance: "-1200",
        currency: "JPY",
        expense: "1200",
        income: "0",
      },
      recentTransactions: [],
      recentlyUsedAccountIds: ["account-recent"],
    }),
  };
  const ledgerAccessService = {
    getActiveMemberRole: vi.fn().mockResolvedValue(role),
  };
  const merchantQueryService = {
    findSummariesByIds: vi.fn().mockResolvedValue([]),
    listActiveOptions: vi.fn().mockResolvedValue([]),
  };

  return {
    ledgerAccessService,
    merchantQueryService,
    repository,
    service: createStatisticsService({
      currentUserId,
      ledgerAccessService,
      merchantQueryService,
      now: () => new Date("2026-06-15T12:00:00.000Z"),
      statisticsRepository: repository,
      transactionDashboardQueryService,
    }),
    transactionDashboardQueryService,
  };
}

describe("StatisticsService", () => {
  it("未登录时拒绝读取统计数据", async () => {
    const { repository, service } = createService({ currentUserId: null });

    await expect(service.getDashboard({ ledgerId })).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(repository.findLedger).not.toHaveBeenCalled();
  });

  it("非账本成员读取统计数据时返回统一的账本无效错误", async () => {
    const { repository, service } = createService({ role: null });

    await expect(service.getDashboard({ ledgerId })).rejects.toMatchObject({
      code: "ledger_invalid",
      message: "账本不存在、已归档或您无法访问。",
      name: NotFoundError.name,
    });
    expect(repository.listDashboardAccounts).not.toHaveBeenCalled();
  });

  it("账本记录不存在时返回统一的账本无效错误", async () => {
    const repository = createRepository({
      findLedger: vi.fn().mockResolvedValue(null),
    });
    const { service, transactionDashboardQueryService } = createService({
      repository,
    });

    await expect(service.getDashboard({ ledgerId })).rejects.toMatchObject({
      code: "ledger_invalid",
      message: "账本不存在、已归档或您无法访问。",
      name: NotFoundError.name,
    });
    expect(repository.listDashboardAccounts).not.toHaveBeenCalled();
    expect(
      transactionDashboardQueryService.getDashboardData,
    ).not.toHaveBeenCalled();
  });

  it("Dashboard 账户优先按最近使用顺序排列", async () => {
    const repository = createRepository({
      listDashboardAccounts: vi.fn().mockResolvedValue([
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          currentBalance: "100",
          currency: "JPY",
          id: "account-old",
          name: "旧账户",
          sortOrder: 0,
          type: "cash",
        },
        {
          createdAt: "2026-02-01T00:00:00.000Z",
          currentBalance: "200",
          currency: "JPY",
          id: "account-recent",
          name: "最近账户",
          sortOrder: 10,
          type: "bank",
        },
      ]),
    });
    const { service } = createService({ repository });

    const view = await service.getDashboard({ ledgerId });

    expect(view.monthLabel).toBe("2026年6月");
    expect(view.accountSummaries.map((account) => account.id)).toEqual([
      "account-recent",
      "account-old",
    ]);
  });

  it("月度统计使用标准化月份边界读取数据", async () => {
    const repository = createRepository();
    const { service } = createService({ repository });

    const view = await service.getMonthly({ ledgerId, month: "2026-06" });

    expect(repository.loadMonthlySource).toHaveBeenCalledWith({
      dateEnd: "2026-06-30T15:00:00.000Z",
      dateStart: "2026-05-31T15:00:00.000Z",
      ledgerId,
    });
    expect(view).toMatchObject({
      ledgerName: "家庭账本",
      month: "2026-06",
      summary: { currency: "JPY" },
    });
  });

  it("月度统计通过商家窄接口使用展示名", async () => {
    const merchantId = "00000000-0000-4000-8000-000000000041";
    const recordId = "00000000-0000-4000-8000-000000000042";
    const categoryId = "00000000-0000-4000-8000-000000000043";
    const repository = createRepository({
      loadMonthlySource: vi.fn().mockResolvedValue({
        categories: [
          { id: categoryId, name: "餐饮", parent_id: null, type: "expense" },
        ],
        items: [
          {
            amount: "1200",
            category_id: categoryId,
            transaction_record_id: recordId,
          },
        ],
        records: [
          {
            created_at: "2026-06-15T01:00:00.000Z",
            id: recordId,
            merchant_id: merchantId,
            note: null,
            transaction_at: "2026-06-15T01:00:00.000Z",
            type: "normal",
          },
        ],
      }),
    });
    const { merchantQueryService, service } = createService({ repository });
    merchantQueryService.findSummariesByIds.mockResolvedValue([
      { icon_url: null, id: merchantId, name: "展示别名" },
    ]);

    const view = await service.getMonthly({ ledgerId, month: "2026-06" });

    expect(merchantQueryService.findSummariesByIds).toHaveBeenCalledWith({
      ledgerId,
      merchantIds: [merchantId],
    });
    expect(view.merchantExpenseRanking[0]?.name).toBe("展示别名");
  });
});
