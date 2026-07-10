import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { loadLedgerCreateView } from "./ledgerCreate";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadLedgerCreateView", () => {
  it("无账本用户使用个人显示名并返回首页", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { display_name: "淞文" } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      email: "songwen@example.com",
      ledgers: [],
      userId: "00000000-0000-4000-8000-000000000031",
    });

    await expect(loadLedgerCreateView()).resolves.toEqual({
      backHref: "/dashboard",
      defaults: {
        baseCurrency: "JPY",
        displayColor: "amber",
        displayName: "淞文",
        ledgerName: "家庭账本",
      },
    });
  });

  it("已有账本时继承当前货币并返回账本管理页", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { display_name: "DENG SONGWEN" } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "CNY",
        currentUserRole: "owner",
        id: "00000000-0000-4000-8000-000000000032",
        name: "家庭账本",
      },
      email: "songwen@example.com",
      ledgers: [],
      userId: "00000000-0000-4000-8000-000000000031",
    });

    const view = await loadLedgerCreateView();

    expect(view.backHref).toBe("/ledgers");
    expect(view.defaults.baseCurrency).toBe("CNY");
  });

  it("当前账本货币不在创建页选项中时回退日元", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { display_name: "DENG SONGWEN" } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "AUD",
        currentUserRole: "owner",
        id: "00000000-0000-4000-8000-000000000032",
        name: "家庭账本",
      },
      email: "songwen@example.com",
      ledgers: [],
      userId: "00000000-0000-4000-8000-000000000031",
    });

    const view = await loadLedgerCreateView();

    expect(view.backHref).toBe("/ledgers");
    expect(view.defaults.baseCurrency).toBe("JPY");
  });

  it("没有个人显示名时回退邮箱前缀", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { display_name: " " } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      email: "songwen@example.com",
      ledgers: [],
      userId: "00000000-0000-4000-8000-000000000031",
    });

    const view = await loadLedgerCreateView();

    expect(view.defaults.displayName).toBe("songwen");
  });
});
