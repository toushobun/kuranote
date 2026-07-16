import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { loadDashboardView } from "./dashboard";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const otherLedgerId = "00000000-0000-4000-8000-000000000099";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard current ledger 边界", () => {
  it("交易、最近使用记录和账户摘要都只查询服务端 current ledger", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserId: "00000000-0000-4000-8000-000000000031",
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
      email: "user@example.com",
      ledgers: [],
      userId: "00000000-0000-4000-8000-000000000031",
    });
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }, { data: [] }, { data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadDashboardView()).resolves.toEqual(
      expect.objectContaining({
        accountSummaries: [],
        hasLedger: true,
        recentTransactions: [],
      }),
    );

    expect(supabase.queries).toHaveLength(3);
    expect(supabase.queries.map((query) => query.table)).toEqual([
      "transaction_record",
      "transaction_record",
      "account",
    ]);

    for (const query of supabase.queries) {
      expect(query.calls).toContainEqual({
        args: ["ledger_id", ledgerId],
        method: "eq",
      });
      expect(query.calls).not.toContainEqual({
        args: ["ledger_id", otherLedgerId],
        method: "eq",
      });
    }
  });

  it("没有可访问账本时不发起业务数据查询", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      email: "user@example.com",
      ledgers: [],
      userId: "00000000-0000-4000-8000-000000000031",
    });

    await expect(loadDashboardView()).resolves.toEqual(
      expect.objectContaining({
        accountSummaries: [],
        hasLedger: false,
        recentTransactions: [],
      }),
    );

    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
