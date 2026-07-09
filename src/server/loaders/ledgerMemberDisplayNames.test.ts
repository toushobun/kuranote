import { describe, expect, it, vi } from "vitest";

import {
  loadUsersWithLedgerDisplayNames,
  mergeLedgerMemberDisplayNames,
  type LedgerMemberDisplayNameSupabaseClient,
} from "./ledgerMemberDisplayNames";

describe("mergeLedgerMemberDisplayNames", () => {
  it("账本成员昵称存在时优先使用当前账本内昵称", () => {
    const recorders = mergeLedgerMemberDisplayNames(
      [
        { display_name: "全局淞文", id: "user-a" },
        { display_name: "全局成员", id: "user-b" },
      ],
      [
        { display_name: "家庭账本淞文", user_id: "user-a" },
        { display_name: "旅行账本成员", user_id: "user-b" },
      ],
    );

    expect(recorders).toEqual([
      { display_name: "家庭账本淞文", id: "user-a" },
      { display_name: "旅行账本成员", id: "user-b" },
    ]);
  });

  it("账本成员昵称为空或不存在时回退到全局用户名", () => {
    const recorders = mergeLedgerMemberDisplayNames(
      [
        { display_name: "全局淞文", id: "user-a" },
        { display_name: "全局成员", id: "user-b" },
        { display_name: "全局只读", id: "user-c" },
      ],
      [
        { display_name: null, user_id: "user-a" },
        { display_name: "   ", user_id: "user-b" },
      ],
    );

    expect(recorders).toEqual([
      { display_name: "全局淞文", id: "user-a" },
      { display_name: "全局成员", id: "user-b" },
      { display_name: "全局只读", id: "user-c" },
    ]);
  });
});

describe("loadUsersWithLedgerDisplayNames", () => {
  it("统一加载用户和当前账本内昵称", async () => {
    const supabase = createFakeSupabase({
      app_user: [
        { display_name: "全局淞文", id: "user-a" },
        { display_name: "全局成员", id: "user-b" },
      ],
      ledger_member_display_setting: [
        {
          display_name: "家庭账本淞文",
          ledger_id: ledgerId,
          user_id: "user-a",
        },
        { display_name: "   ", ledger_id: ledgerId, user_id: "user-b" },
      ],
    });

    const users = await loadUsersWithLedgerDisplayNames({
      ledgerId,
      supabase: supabase as unknown as LedgerMemberDisplayNameSupabaseClient,
      userIds: ["user-a", "user-b"],
    });

    expect(users).toEqual([
      { display_name: "家庭账本淞文", id: "user-a" },
      { display_name: "全局成员", id: "user-b" },
    ]);
    expect(supabase.from).toHaveBeenCalledWith("app_user");
    expect(supabase.from).toHaveBeenCalledWith("ledger_member_display_setting");
  });

  it("userIds 为空时不查询数据库", async () => {
    const supabase = createFakeSupabase({});

    await expect(
      loadUsersWithLedgerDisplayNames({
        ledgerId,
        supabase: supabase as unknown as LedgerMemberDisplayNameSupabaseClient,
        userIds: [],
      }),
    ).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("可以复用已加载的账本成员设置，避免重复查询设置表", async () => {
    const supabase = createFakeSupabase({
      app_user: [
        { display_name: "全局淞文", email: "a@example.com", id: "user-a" },
      ],
    });

    const users = await loadUsersWithLedgerDisplayNames<{
      display_name: string;
      email: string;
      id: string;
    }>({
      ledgerId,
      memberDisplaySettings: [
        { display_name: "家庭账本淞文", user_id: "user-a" },
      ],
      select: "id, display_name, email",
      supabase: supabase as unknown as LedgerMemberDisplayNameSupabaseClient,
      userIds: ["user-a"],
    });

    expect(users).toEqual([
      {
        display_name: "家庭账本淞文",
        email: "a@example.com",
        id: "user-a",
      },
    ]);
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith("app_user");
  });

  it("用户查询失败时抛出调用侧指定错误", async () => {
    const supabase = createFakeSupabase(
      {},
      { app_user: new Error("app user failed") },
    );

    await expect(
      loadUsersWithLedgerDisplayNames({
        ledgerId,
        supabase: supabase as unknown as LedgerMemberDisplayNameSupabaseClient,
        userErrorMessage: "Failed to load test users",
        userIds: ["user-a"],
      }),
    ).rejects.toThrow("Failed to load test users");
  });
});

const ledgerId = "ledger-a";

type Row = Record<string, unknown>;

type TableErrors = Partial<Record<string, Error>>;

function createFakeSupabase(
  tables: Record<string, Row[]>,
  errors: TableErrors = {},
) {
  const from = vi.fn((table: string) => {
    let rows = [...(tables[table] ?? [])];
    const error = errors[table] ?? null;

    const builder = {
      eq(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);
        return builder;
      },
      in(column: string, values: unknown[]) {
        rows = rows.filter((row) => values.includes(row[column]));
        return builder;
      },
      select() {
        return builder;
      },
      then(resolve: (value: { data: Row[]; error: Error | null }) => unknown) {
        return Promise.resolve({ data: rows, error }).then(resolve);
      },
    };

    return builder;
  });

  return { from };
}
