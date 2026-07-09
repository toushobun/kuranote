import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";

type QueryError = {
  message: string;
};

type CountResponse = {
  count?: number | null;
  error?: QueryError | null;
};

type SelectOptions = {
  count?: "exact";
  head?: boolean;
};

type QueryCall =
  | { method: "select"; args: [string, SelectOptions] }
  | { method: "eq"; args: [string, string] };

type QueryRecord = {
  table: string;
  calls: QueryCall[];
};

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { loadLedgersView } from "./ledgers";

function createSupabaseMock(responses: CountResponse[]) {
  const queries: QueryRecord[] = [];
  let responseIndex = 0;

  function createQuery(table: string) {
    const record: QueryRecord = { calls: [], table };
    queries.push(record);

    const query = {
      eq(column: string, value: string) {
        record.calls.push({ args: [column, value], method: "eq" });
        return query;
      },
      select(columns: string, options: SelectOptions) {
        record.calls.push({ args: [columns, options], method: "select" });
        return query;
      },
      then<TResult1 = CountResponse, TResult2 = never>(
        onfulfilled?:
          | ((value: CountResponse) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null,
      ) {
        const response = responses[responseIndex] ?? { count: 0 };
        responseIndex += 1;

        return Promise.resolve(response).then(onfulfilled, onrejected);
      },
    };

    return query;
  }

  const client = {
    from: vi.fn((table: string) => createQuery(table)),
  };

  return { client, queries };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadLedgersView", () => {
  it("没有当前账本时跳转首页", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      email: "test@example.com",
      ledgers: [],
      userId: "user-1",
    });

    await expect(loadLedgersView()).rejects.toThrow(
      `redirect:${routePaths.dashboard}`,
    );
    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.dashboard);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("只在账本管理页用 DB 端 count 统计成员数", async () => {
    const supabase = createSupabaseMock([{ count: 2 }, { count: 1 }]);
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: "ledger-1",
        name: "家庭账本",
      },
      email: "test@example.com",
      ledgers: [
        {
          baseCurrency: "JPY",
          currentUserRole: "owner",
          id: "ledger-1",
          name: "家庭账本",
        },
        {
          baseCurrency: "JPY",
          currentUserRole: "admin",
          id: "ledger-2",
          name: "旅行账本",
        },
      ],
      userId: "user-1",
    });

    await expect(loadLedgersView()).resolves.toEqual({
      currentLedgerId: "ledger-1",
      ledgers: [
        {
          baseCurrency: "JPY",
          currentUserRole: "owner",
          id: "ledger-1",
          memberCount: 2,
          name: "家庭账本",
        },
        {
          baseCurrency: "JPY",
          currentUserRole: "admin",
          id: "ledger-2",
          memberCount: 1,
          name: "旅行账本",
        },
      ],
    });
    expect(supabase.queries).toEqual([
      {
        calls: [
          {
            args: ["ledger_id", { count: "exact", head: true }],
            method: "select",
          },
          { args: ["ledger_id", "ledger-1"], method: "eq" },
          { args: ["status", "active"], method: "eq" },
        ],
        table: "ledger_member",
      },
      {
        calls: [
          {
            args: ["ledger_id", { count: "exact", head: true }],
            method: "select",
          },
          { args: ["ledger_id", "ledger-2"], method: "eq" },
          { args: ["status", "active"], method: "eq" },
        ],
        table: "ledger_member",
      },
    ]);
  });

  it("成员数为 0 时按 count 结果返回", async () => {
    const supabase = createSupabaseMock([{ count: 0 }]);
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: "ledger-1",
        name: "家庭账本",
      },
      email: "test@example.com",
      ledgers: [
        {
          baseCurrency: "JPY",
          currentUserRole: "owner",
          id: "ledger-1",
          name: "家庭账本",
        },
      ],
      userId: "user-1",
    });

    await expect(loadLedgersView()).resolves.toEqual({
      currentLedgerId: "ledger-1",
      ledgers: [
        {
          baseCurrency: "JPY",
          currentUserRole: "owner",
          id: "ledger-1",
          memberCount: 0,
          name: "家庭账本",
        },
      ],
    });
  });

  it("成员数统计失败时抛出可定位错误", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const supabase = createSupabaseMock([
      { error: { message: "count failed" } },
    ]);
    mocks.createClient.mockResolvedValue(supabase.client);
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        baseCurrency: "JPY",
        currentUserRole: "owner",
        id: "ledger-1",
        name: "家庭账本",
      },
      email: "test@example.com",
      ledgers: [
        {
          baseCurrency: "JPY",
          currentUserRole: "owner",
          id: "ledger-1",
          name: "家庭账本",
        },
      ],
      userId: "user-1",
    });

    await expect(loadLedgersView()).rejects.toThrow(
      "Failed to load ledger member count: count failed",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load ledger member count.",
      expect.objectContaining({ message: "count failed" }),
    );

    consoleError.mockRestore();
  });
});
