import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTransaction } from "server/actions/transactions";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
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

const currentLedgerId = "00000000-0000-4000-8000-000000000032";
const forgedLedgerId = "00000000-0000-4000-8000-000000000099";
const userId = "00000000-0000-4000-8000-000000000031";
const accountId = "00000000-0000-4000-8000-000000000045";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";

function createTransactionFormData() {
  const formData = new FormData();

  formData.set("ledgerId", forgedLedgerId);
  formData.set("type", "expense");
  formData.set("transactionAt", "2026-06-04T10:30:05");
  formData.set("timeZoneOffsetMinutes", "-540");
  formData.set("accountId", accountId);
  formData.append("itemCategoryId", categoryId);
  formData.append("itemAmount", "1234");
  formData.set("merchantId", merchantId);
  formData.set("note", "边界测试");

  return formData;
}

describe("Server Action current ledger 边界", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: {
        base_currency: "JPY",
        currentUserRole: "owner",
        id: currentLedgerId,
        name: "家庭账本",
      },
      userId,
    });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("创建记账时忽略客户端伪造的 ledgerId", async () => {
    await expect(
      createTransaction(createTransactionFormData()),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/transactions?month=2026-06&result=created",
    );

    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_transaction",
      expect.objectContaining({
        p_ledger_id: currentLedgerId,
      }),
    );
  });
});
