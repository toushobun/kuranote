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
const otherLedgerId = "00000000-0000-4000-8000-000000000002";

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

  it("账户、分类、商家、标签和成员候选不会混入其他账本数据", async () => {
    const fakeDb = createFakeSupabase({
      account: [
        {
          created_at: "2026-07-01T00:00:00Z",
          currency: "JPY",
          id: "account-current",
          is_archived: false,
          ledger_id: ledgerId,
          name: "当前账户",
          sort_order: 0,
        },
        {
          created_at: "2026-07-01T00:00:00Z",
          currency: "JPY",
          id: "account-other",
          is_archived: false,
          ledger_id: otherLedgerId,
          name: "其他账户",
          sort_order: 0,
        },
      ],
      app_user: [
        { display_name: "当前成员", id: "member-current" },
        { display_name: "其他成员", id: "member-other" },
      ],
      category: [
        {
          id: "category-current",
          is_archived: false,
          ledger_id: ledgerId,
          name: "当前分类",
          parent_id: null,
          sort_order: 0,
          type: "expense",
        },
        {
          id: "category-other",
          is_archived: false,
          ledger_id: otherLedgerId,
          name: "其他分类",
          parent_id: null,
          sort_order: 0,
          type: "expense",
        },
      ],
      ledger_member: [
        {
          ledger_id: ledgerId,
          status: "active",
          user_id: "member-current",
        },
        {
          ledger_id: otherLedgerId,
          status: "active",
          user_id: "member-other",
        },
      ],
      ledger_member_display_setting: [],
      merchant: [
        {
          created_at: "2026-07-01T00:00:00Z",
          icon_url: null,
          id: "merchant-current",
          is_archived: false,
          ledger_id: ledgerId,
          name: "当前商家",
          sort_order: 0,
        },
        {
          created_at: "2026-07-01T00:00:00Z",
          icon_url: null,
          id: "merchant-other",
          is_archived: false,
          ledger_id: otherLedgerId,
          name: "其他商家",
          sort_order: 0,
        },
      ],
      transaction_tag: [
        {
          color: null,
          created_at: "2026-07-01T00:00:00Z",
          id: "tag-current",
          is_archived: false,
          ledger_id: ledgerId,
          name: "当前标签",
        },
        {
          color: null,
          created_at: "2026-07-01T00:00:00Z",
          id: "tag-other",
          is_archived: false,
          ledger_id: otherLedgerId,
          name: "其他标签",
        },
      ],
    });
    mocks.createClient.mockResolvedValue(fakeDb);

    const options = await loadTransactionFilterOptions();

    expect(options.accounts.map((option) => option.id)).toEqual([
      "account-current",
    ]);
    expect(options.categories.map((option) => option.id)).toEqual([
      "category-current",
    ]);
    expect(options.merchants.map((option) => option.id)).toEqual([
      "merchant-current",
    ]);
    expect(options.tags.map((option) => option.id)).toEqual(["tag-current"]);
    expect(options.members.map((option) => option.id)).toEqual([
      "member-current",
    ]);
  });
});
