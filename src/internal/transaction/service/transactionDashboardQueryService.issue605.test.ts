// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createTransactionDashboardQueryService } from "internal/transaction/service/transactionDashboardQueryService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

const currentLedger = {
  baseCurrency: "JPY",
  currentUserId: userId,
  currentUserRole: "member" as const,
  id: ledgerId,
  name: "家庭账本",
};

describe("Issue #605 Dashboard 核销结余统计", () => {
  it("超额核销后的支出按收入计入本月汇总", async () => {
    const service = createTransactionDashboardQueryService({
      accountQueryService: {} as never,
      categoryQueryService: {} as never,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("member"),
      },
      merchantQueryService: {} as never,
      transactionRepository: {
        findUserSummaries: vi.fn().mockResolvedValue([]),
        listItems: vi.fn().mockResolvedValue([]),
        listRecords: vi.fn().mockResolvedValue([]),
        loadDashboardMonthSource: vi.fn().mockResolvedValue({
          categories: [{ id: "expense-category", type: "expense" }],
          items: [
            {
              amount: "100",
              business_net_amount: "-50",
              category_id: "expense-category",
              transaction_record_id: "surplus-expense",
            },
          ],
        }),
        loadDashboardRecentlyUsedAccountIds: vi.fn().mockResolvedValue([]),
      } as never,
    });

    const result = await service.getDashboardData({
      currentLedger,
      dateEnd: "2026-09-01T00:00:00.000Z",
      dateStart: "2026-08-01T00:00:00.000Z",
    });

    expect(result.monthSummary).toEqual({
      balance: "50",
      currency: "JPY",
      expense: "0",
      income: "50",
    });
  });
});
