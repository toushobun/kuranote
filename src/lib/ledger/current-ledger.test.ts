import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";

type Claims = {
  email?: string;
  sub?: string;
};

type QueryError = {
  message: string;
};

type QueryResponse = {
  data?: unknown;
  error?: QueryError | null;
};

type QueryCall =
  | { method: "select"; args: [string] }
  | { method: "eq"; args: [string, string] }
  | { method: "in"; args: [string, string[]] };

type QueryRecord = {
  table: string;
  calls: QueryCall[];
};

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  getCurrentLedgerContext,
  getCurrentLedgerOrRedirect,
} from "./current-ledger";

function createSupabaseMock({
  claims = { email: "test@example.com", sub: "user-1" },
  claimsError = null,
  queryResponses = [],
}: {
  claims?: Claims | null;
  claimsError?: QueryError | null;
  queryResponses?: QueryResponse[];
}) {
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
      in(column: string, values: string[]) {
        record.calls.push({ args: [column, values], method: "in" });
        return query;
      },
      select(columns: string) {
        record.calls.push({ args: [columns], method: "select" });
        return query;
      },
      then<TResult1 = QueryResponse, TResult2 = never>(
        onfulfilled?:
          | ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null,
      ) {
        const response = queryResponses[responseIndex] ?? { data: [] };
        responseIndex += 1;

        return Promise.resolve(response).then(onfulfilled, onrejected);
      },
    };

    return query;
  }

  const client = {
    auth: {
      getClaims: vi.fn(async () => ({
        data: claims ? { claims } : null,
        error: claimsError,
      })),
    },
    from: vi.fn((table: string) => createQuery(table)),
  };

  return { client, queries };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentLedgerContext", () => {
  it("未登录时跳转登录页", async () => {
    const supabase = createSupabaseMock({ claims: null });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).rejects.toThrow(
      `redirect:${routePaths.login}`,
    );

    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.login);
  });

  it("读取 claims 失败时跳转登录页", async () => {
    const supabase = createSupabaseMock({
      claimsError: { message: "claims load failed" },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).rejects.toThrow(
      `redirect:${routePaths.login}`,
    );

    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.login);
    expect(supabase.client.auth.getClaims).toHaveBeenCalledTimes(1);
    expect(supabase.client.from).not.toHaveBeenCalled();
  });

  it("用户 ID 为空时跳转登录页", async () => {
    const supabase = createSupabaseMock({
      claims: { email: "test@example.com", sub: "" },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).rejects.toThrow(
      `redirect:${routePaths.login}`,
    );

    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.login);
    expect(supabase.client.auth.getClaims).toHaveBeenCalledTimes(1);
    expect(supabase.client.from).not.toHaveBeenCalled();
  });

  it("没有 active 账本时返回空上下文", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).resolves.toEqual({
      currentLedger: null,
      email: "test@example.com",
      ledgers: [],
      userId: "user-1",
    });

    expect(supabase.queries).toEqual([
      {
        calls: [
          { args: ["ledger_id"], method: "select" },
          { args: ["user_id", "user-1"], method: "eq" },
          { args: ["status", "active"], method: "eq" },
        ],
        table: "ledger_member",
      },
    ]);
  });

  it("根据 active 成员关系读取当前账本", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [{ ledger_id: "ledger-2" }, { ledger_id: "ledger-1" }],
        },
        {
          data: [
            { base_currency: "JPY", id: "ledger-1", name: "备用账本" },
            { base_currency: "USD", id: "ledger-2", name: "家庭账本" },
          ],
        },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).resolves.toEqual({
      currentLedger: {
        baseCurrency: "USD",
        id: "ledger-2",
        name: "家庭账本",
      },
      email: "test@example.com",
      ledgers: [
        { baseCurrency: "USD", id: "ledger-2", name: "家庭账本" },
        { baseCurrency: "JPY", id: "ledger-1", name: "备用账本" },
      ],
      userId: "user-1",
    });

    expect(supabase.queries[1]).toEqual({
      calls: [
        { args: ["id, name, base_currency"], method: "select" },
        { args: ["id", ["ledger-2", "ledger-1"]], method: "in" },
      ],
      table: "ledger",
    });
  });

  it("读取成员关系失败时抛出可定位错误", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { message: "db down" } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).rejects.toThrow(
      "Failed to load current ledger members: db down",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load current ledger members.",
      expect.objectContaining({ message: "db down" }),
    );

    consoleError.mockRestore();
  });

  it("读取账本失败时抛出可定位错误", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [{ ledger_id: "ledger-1" }] },
        { error: { message: "relation missing" } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerContext()).rejects.toThrow(
      "Failed to load current ledgers: relation missing",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load current ledgers.",
      expect.objectContaining({ message: "relation missing" }),
    );

    consoleError.mockRestore();
  });
});

describe("getCurrentLedgerOrRedirect", () => {
  it("有当前账本时返回当前账本", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [{ ledger_id: "ledger-1" }] },
        {
          data: [{ base_currency: "JPY", id: "ledger-1", name: "家庭账本" }],
        },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerOrRedirect()).resolves.toEqual({
      baseCurrency: "JPY",
      id: "ledger-1",
      name: "家庭账本",
    });

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("没有当前账本时跳转账本初始化页", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(getCurrentLedgerOrRedirect()).rejects.toThrow(
      `redirect:${routePaths.ledgerSetup}`,
    );

    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.ledgerSetup);
  });
});
