import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { loadAccountsView } from "./accounts";
import { loadCategoriesView } from "./categories";
import { loadMerchantsView } from "./merchants";

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
  mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
    baseCurrency: "JPY",
    currentUserId: "00000000-0000-4000-8000-000000000031",
    currentUserRole: "owner",
    id: ledgerId,
    name: "家庭账本",
  });
});

function expectCurrentLedgerQuery(query: {
  calls: { args: unknown[]; method: string }[];
}) {
  expect(query.calls).toContainEqual({
    args: ["ledger_id", ledgerId],
    method: "eq",
  });
  expect(query.calls).not.toContainEqual({
    args: ["ledger_id", otherLedgerId],
    method: "eq",
  });
}

describe("基础数据 current ledger 边界", () => {
  it("账户、成员和成员显示设置都只查询 current ledger", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }, { data: [] }, { data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadAccountsView()).resolves.toEqual(
      expect.objectContaining({
        accounts: [],
        holderOptions: [],
        ledgerName: "家庭账本",
      }),
    );

    expect(supabase.queries.map((query) => query.table)).toEqual([
      "account",
      "ledger_member",
      "ledger_member_display_setting",
    ]);
    supabase.queries.forEach(expectCurrentLedgerQuery);
  });

  it("分类树只查询 current ledger", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadCategoriesView()).resolves.toEqual(
      expect.objectContaining({
        categories: [],
        ledgerName: "家庭账本",
        parentOptions: [],
      }),
    );

    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].table).toBe("category");
    expectCurrentLedgerQuery(supabase.queries[0]);
  });

  it("商家列表只查询 current ledger，并且空列表时不读取别名", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadMerchantsView("")).resolves.toEqual(
      expect.objectContaining({
        ledgerName: "家庭账本",
        merchants: [],
      }),
    );

    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].table).toBe("merchant");
    expectCurrentLedgerQuery(supabase.queries[0]);
  });
});
