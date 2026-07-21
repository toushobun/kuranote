import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTransaction,
  updateTransaction,
} from "server/actions/transactions";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  maybeSingle: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
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

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000099";
const accountId = "00000000-0000-4000-8000-000000000045";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";

function mockCurrentLedger(role: "owner" | "admin" | "member" | "viewer") {
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: {
      id: ledgerId,
      name: "家庭账本",
      baseCurrency: "JPY",
      currentUserRole: role,
    },
    userId,
  });
}

function createValidTransactionFormData({
  includeRecordId = false,
}: {
  includeRecordId?: boolean;
} = {}) {
  const formData = new FormData();

  formData.set("type", "expense");
  formData.set("transactionAt", "2026-06-04T10:30:05");
  formData.set("timeZoneOffsetMinutes", "-540");
  formData.set("accountId", accountId);
  formData.append("itemCategoryId", categoryId);
  formData.append("itemAmount", "1234");
  formData.set("merchantId", merchantId);
  formData.set("note", "测试记录");

  if (includeRecordId) {
    formData.set("transactionRecordId", transactionRecordId);
  }

  return formData;
}

describe("账本角色 Action 权限", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const query = {
      eq: mocks.eq,
      maybeSingle: mocks.maybeSingle,
      select: mocks.select,
    };

    mocks.createClient.mockResolvedValue({
      from: mocks.from,
      rpc: mocks.rpc,
    });
    mocks.from.mockReturnValue(query);
    mocks.select.mockReturnValue(query);
    mocks.eq.mockReturnValue(query);
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("viewer 新增记账时返回权限错误且不调用数据库", async () => {
    mockCurrentLedger("viewer");

    await expect(
      createTransaction(createValidTransactionFormData()),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/transactions/new?error=permission_denied",
    );

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("member 修改他人创建的记账时返回权限错误", async () => {
    mockCurrentLedger("member");
    mocks.maybeSingle.mockResolvedValue({
      data: { created_by: otherUserId },
      error: null,
    });

    await expect(
      updateTransaction(
        createValidTransactionFormData({ includeRecordId: true }),
      ),
    ).rejects.toThrow(
      `NEXT_REDIRECT:/transactions/${transactionRecordId}/edit?error=permission_denied`,
    );

    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
