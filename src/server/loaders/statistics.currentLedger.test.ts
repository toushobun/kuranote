import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { loadStatisticsView } from "./statistics";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const otherLedgerId = "00000000-0000-4000-8000-000000000099";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("统计 current ledger 边界", () => {
  it("月度统计记录只查询服务端 current ledger", async () => {
    mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
      baseCurrency: "JPY",
      currentUserId: "00000000-0000-4000-8000-000000000031",
      currentUserRole: "owner",
      id: ledgerId,
      name: "家庭账本",
    });
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadStatisticsView("2026-07")).resolves.toEqual(
      expect.objectContaining({
        ledgerName: "家庭账本",
        month: "2026-07",
      }),
    );

    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].table).toBe("transaction_record");
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["ledger_id", ledgerId],
      method: "eq",
    });
    expect(supabase.queries[0].calls).not.toContainEqual({
      args: ["ledger_id", otherLedgerId],
      method: "eq",
    });
  });
});
