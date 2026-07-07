import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "server/actions/accounts";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
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
  createClient: vi.fn().mockResolvedValue({ from: mocks.from, rpc: mocks.rpc }),
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const holderUserId = "00000000-0000-4000-8000-000000000041";
const accountId = "00000000-0000-4000-8000-000000000045";

function createValidFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("name", "现金");
  formData.set("type", "cash");
  formData.set("currency", "jpy");
  formData.append("holderUserIds", holderUserId);

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function setupActionMocks() {
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: { id: ledgerId, name: "家庭账本", base_currency: "JPY" },
    userId,
  });

  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.from.mockReturnValue({
    update: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 1, error: null }),
        }),
      }),
    }),
  });
}

describe("createAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupActionMocks();
  });

  it("不填写初始余额时默认按 0 创建账户", async () => {
    await expect(
      createAccount(createValidFormData({ initialBalance: "" })),
    ).rejects.toThrow("NEXT_REDIRECT:/accounts?result=created");

    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_account_with_holders",
      expect.objectContaining({ p_initial_balance: 0 }),
    );
  });

  it("创建成功后带 created 结果参数跳回账户列表页", async () => {
    await expect(
      createAccount(createValidFormData({ initialBalance: "1000" })),
    ).rejects.toThrow("NEXT_REDIRECT:/accounts?result=created");

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/accounts");
  });
});

describe("updateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupActionMocks();
  });

  it("保存成功后带 updated 结果参数跳回账户列表页", async () => {
    const formData = createValidFormData({ accountId });
    formData.delete("initialBalance");

    await expect(updateAccount(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/accounts?result=updated",
    );
  });
});

describe("archiveAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupActionMocks();
  });

  it("删除成功后带 archived 结果参数跳回账户列表页", async () => {
    const formData = new FormData();
    formData.set("accountId", accountId);

    await expect(archiveAccount(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/accounts?result=archived",
    );

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/accounts");
  });
});
