import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentLedgerOrRedirect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerOrRedirect: mocks.getCurrentLedgerOrRedirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { loadEditTransactionView } from "./transactionForm";

const ledgerId = "00000000-0000-4000-8000-000000000001";
const transactionRecordId = "00000000-0000-4000-8000-000000009001";
const accountId = "00000000-0000-4000-8000-000000000041";
const categoryId = "00000000-0000-4000-8000-000000005072";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLedgerOrRedirect.mockResolvedValue({
    currentUserId: "00000000-0000-4000-8000-000000000031",
    currentUserRole: "owner",
    id: ledgerId,
    name: "家庭账本",
  });
});

describe("记账编辑 current ledger 边界", () => {
  it("表单候选、目标记录、明细和标签关联都限定服务端 current ledger", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] },
        {
          data: [
            {
              created_at: "2026-06-04T01:00:00.000Z",
              created_by: "00000000-0000-4000-8000-000000000031",
              id: transactionRecordId,
              merchant_id: null,
              note: null,
              transaction_at: "2026-06-04T10:30:05.000Z",
              type: "normal",
            },
          ],
        },
        {
          data: [
            {
              account_id: accountId,
              amount: "1200.00",
              category_id: categoryId,
              note: null,
              transaction_record_id: transactionRecordId,
            },
          ],
        },
        { data: [] },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await loadEditTransactionView(transactionRecordId);

    expect(supabase.queries.map((query) => query.table)).toEqual([
      "account",
      "category",
      "merchant",
      "transaction_tag",
      "transaction_record",
      "transaction_item",
      "transaction_record_tag",
    ]);

    for (const query of supabase.queries) {
      expect(query.calls).toContainEqual({
        args: ["ledger_id", ledgerId],
        method: "eq",
      });
    }
  });
});
