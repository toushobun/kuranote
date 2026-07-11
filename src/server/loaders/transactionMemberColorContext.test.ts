import { describe, expect, it, vi } from "vitest";

import {
  buildTransactionMemberColorContext,
  loadTransactionMemberColorContext,
  type TransactionMemberColorContextSupabaseClient,
} from "./transactionMemberColorContext";

describe("buildTransactionMemberColorContext", () => {
  it("统一派生账户颜色与记录人显示状态", () => {
    const context = buildTransactionMemberColorContext({
      activeMembers: [{ user_id: "user-a" }, { user_id: "user-b" }],
      holders: [
        { account_id: "account-a", user_id: "user-a" },
        { account_id: "account-b", user_id: "user-a" },
        { account_id: "account-b", user_id: "user-b" },
        { account_id: "account-c", user_id: "removed-user" },
      ],
      settings: [
        { display_color: "sakura", user_id: "user-a" },
        { display_color: "amber", user_id: "user-b" },
        { display_color: "lime", user_id: "removed-user" },
      ],
    });

    expect(context.showRecorder).toBe(true);
    expect(context.accountColorById.get("account-a")).toBe("sakura");
    expect(context.accountColorById.has("account-b")).toBe(false);
    expect(context.accountColorById.has("account-c")).toBe(false);
  });

  it("重复成员行不会把单人账本误判为多人账本", () => {
    const context = buildTransactionMemberColorContext({
      activeMembers: [{ user_id: "user-a" }, { user_id: "user-a" }],
      holders: [],
      settings: [],
    });

    expect(context.showRecorder).toBe(false);
  });
});

describe("loadTransactionMemberColorContext", () => {
  it("统一加载账户持有人、成员颜色和 active 成员", async () => {
    const supabase = createFakeSupabase({
      account_holder: [
        {
          account_id: "account-a",
          ledger_id: ledgerId,
          user_id: "user-a",
        },
        {
          account_id: "account-b",
          ledger_id: ledgerId,
          user_id: "user-b",
        },
      ],
      ledger_member: [
        { ledger_id: ledgerId, status: "active", user_id: "user-a" },
        { ledger_id: ledgerId, status: "active", user_id: "user-b" },
        { ledger_id: ledgerId, status: "removed", user_id: "removed-user" },
      ],
      ledger_member_display_setting: [
        { display_color: "sakura", ledger_id: ledgerId, user_id: "user-a" },
        { display_color: "amber", ledger_id: ledgerId, user_id: "user-b" },
      ],
    });

    const context = await loadTransactionMemberColorContext({
      accountIds: ["account-a", "account-a"],
      ledgerId,
      supabase,
    });

    expect(context.showRecorder).toBe(true);
    expect(context.accountColorById.get("account-a")).toBe("sakura");
    expect(context.accountColorById.has("account-b")).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith("account_holder");
    expect(supabase.from).toHaveBeenCalledWith("ledger_member_display_setting");
    expect(supabase.from).toHaveBeenCalledWith("ledger_member");
  });

  it("无账户时跳过账户相关查询但仍判断是否显示记录人", async () => {
    const supabase = createFakeSupabase({
      ledger_member: [
        { ledger_id: ledgerId, status: "active", user_id: "user-a" },
        { ledger_id: ledgerId, status: "active", user_id: "user-b" },
      ],
    });

    const context = await loadTransactionMemberColorContext({
      accountIds: [],
      ledgerId,
      supabase,
    });

    expect(context.accountColorById.size).toBe(0);
    expect(context.showRecorder).toBe(true);
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith("ledger_member");
  });

  it("查询失败时保留既有错误边界", async () => {
    const supabase = createFakeSupabase(
      {
        ledger_member: [
          { ledger_id: ledgerId, status: "active", user_id: "user-a" },
        ],
      },
      { account_holder: new Error("holder failed") },
    );

    await expect(
      loadTransactionMemberColorContext({
        accountIds: ["account-a"],
        ledgerId,
        supabase,
      }),
    ).rejects.toThrow("Failed to load transaction account holders");
  });
});

const ledgerId = "ledger-a";

type Row = Record<string, unknown>;
type TableErrors = Partial<Record<string, Error>>;
type FakeQueryResult = { data: Row[]; error: Error | null };
type FakeQueryBuilder = PromiseLike<FakeQueryResult> & {
  eq(column: string, value: string): FakeQueryBuilder;
  in(column: string, values: string[]): FakeQueryBuilder;
  select(columns: string): FakeQueryBuilder;
};

function createFakeSupabase(
  tables: Record<string, Row[]>,
  errors: TableErrors = {},
) {
  const from = vi.fn((table: string) => {
    let rows = [...(tables[table] ?? [])];
    const error = errors[table] ?? null;

    const builder: FakeQueryBuilder = {
      eq(column: string, value: string) {
        rows = rows.filter((row) => row[column] === value);
        return builder;
      },
      in(column: string, values: string[]) {
        rows = rows.filter((row) => values.includes(String(row[column])));
        return builder;
      },
      select(_columns: string) {
        return builder;
      },
      then<TResult1 = FakeQueryResult, TResult2 = never>(
        onfulfilled?:
          ((value: FakeQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?:
          ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return Promise.resolve({ data: rows, error }).then(
          onfulfilled,
          onrejected,
        );
      },
    };

    return builder;
  });

  return { from } satisfies TransactionMemberColorContextSupabaseClient & {
    from: typeof from;
  };
}
