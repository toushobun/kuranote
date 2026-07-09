import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { loadTransactionFilterOptions } from "./options";

const ledgerId = "00000000-0000-4000-8000-000000000001";

type Row = Record<string, unknown>;

function createFakeSupabase(tables: Record<string, Row[]>) {
  const from = vi.fn((table: string) => {
    let rows = [...(tables[table] ?? [])];
    const orderSpecs: { ascending: boolean; column: string }[] = [];

    function applyOrder() {
      if (orderSpecs.length === 0) return;
      rows = [...rows].sort((a, b) => {
        for (const spec of orderSpecs) {
          const left = String(a[spec.column] ?? "");
          const right = String(b[spec.column] ?? "");
          if (left === right) continue;
          const comparison = left > right ? 1 : -1;
          return spec.ascending ? comparison : -comparison;
        }
        return 0;
      });
    }

    const builder = {
      eq(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);
        return builder;
      },
      in(column: string, values: unknown[]) {
        rows = rows.filter((row) => values.includes(row[column]));
        return builder;
      },
      order(column: string, options: { ascending: boolean }) {
        orderSpecs.push({ ascending: options.ascending, column });
        return builder;
      },
      select() {
        return builder;
      },
      then(resolve: (value: { data: Row[]; error: null }) => unknown) {
        applyOrder();
        return Promise.resolve({ data: rows, error: null }).then(resolve);
      },
    };

    return builder;
  });

  return { from };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
    baseCurrency: "JPY",
    id: ledgerId,
    name: "家庭账本",
  });
});

describe("loadTransactionFilterOptions", () => {
  it("成员筛选选项优先显示当前账本内昵称", async () => {
    const fakeDb = createFakeSupabase({
      account: [],
      app_user: [
        { display_name: "全局淞文", id: "user-a" },
        { display_name: "全局成员", id: "user-b" },
      ],
      category: [],
      ledger_member: [
        { ledger_id: ledgerId, status: "active", user_id: "user-a" },
        { ledger_id: ledgerId, status: "active", user_id: "user-b" },
      ],
      ledger_member_display_setting: [
        {
          display_name: "家庭账本淞文",
          ledger_id: ledgerId,
          user_id: "user-a",
        },
        { display_name: "   ", ledger_id: ledgerId, user_id: "user-b" },
      ],
      merchant: [],
      transaction_tag: [],
    });
    mocks.createClient.mockResolvedValue(fakeDb);

    const options = await loadTransactionFilterOptions();

    expect(options.members).toEqual([
      { id: "user-b", name: "全局成员" },
      { id: "user-a", name: "家庭账本淞文" },
    ]);
  });
});
