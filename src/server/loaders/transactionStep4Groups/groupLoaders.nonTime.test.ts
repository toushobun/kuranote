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

import { loadStep4TransactionGroupPage } from "./groupLoaders";

function createFakeSupabase() {
  return {
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
    baseCurrency: "JPY",
    id: "ledger-1",
    name: "家庭账本",
  });
});

describe("loadStep4TransactionGroupPage non-time groups", () => {
  it("非时间分组通过 RPC 聚合并保留分页", async () => {
    const db = createFakeSupabase();
    db.rpc.mockResolvedValueOnce({
      data: Array.from({ length: 22 }, (_, index) => ({
        balance: -100 - index,
        expense: 100 + index,
        group_id: `merchant:m${index}`,
        group_key: `m${index}`,
        group_label: `商家${index}`,
        income: 0,
        latest_transaction_at: `2026-06-${String(22 - index).padStart(
          2,
          "0",
        )}T00:00:00.000Z`,
        transaction_count: 1,
      })),
      error: null,
    });
    mocks.createClient.mockResolvedValue(db);

    const page = await loadStep4TransactionGroupPage("merchant", 0, {
      recordType: "all",
    });

    expect(db.from).not.toHaveBeenCalled();
    expect(db.rpc).toHaveBeenCalledWith(
      "load_transaction_group_summaries",
      expect.objectContaining({
        p_group_by: "merchant",
        p_ledger_id: "ledger-1",
        p_record_type: "all",
      }),
    );
    expect(page.groups).toHaveLength(20);
    expect(page.groups[0].summary).toEqual({
      balance: "-100",
      currency: "JPY",
      expense: "100",
      income: "0",
    });
    expect(page.nextOffset).toBe(20);
  });

  it("筛选条件会下推到 RPC 参数", async () => {
    const db = createFakeSupabase();
    mocks.createClient.mockResolvedValue(db);

    await loadStep4TransactionGroupPage("account", 0, {
      accountId: "account-1",
      categoryId: "category-1",
      memberId: "member-1",
      merchantId: "merchant-1",
      parentCategoryId: "parent-1",
      recordType: "expense",
      tagId: "tag-1",
    });

    expect(db.rpc).toHaveBeenCalledWith(
      "load_transaction_group_summaries",
      expect.objectContaining({
        p_account_id: "account-1",
        p_category_id: "category-1",
        p_group_by: "account",
        p_member_id: "member-1",
        p_merchant_id: "merchant-1",
        p_parent_category_id: "parent-1",
        p_record_type: "expense",
        p_tag_id: "tag-1",
      }),
    );
  });
});
