import { describe, expect, it, vi } from "vitest";

import { createAccountImportService } from "internal/account/service/accountImportService";
import type { AccountService } from "internal/account/service/accountService";

function createService(overrides: Partial<AccountService> = {}) {
  const create = vi.fn(async () => ({ accountId: "account-1" }));
  const getView = vi.fn(async () => ({
    accounts: [
      {
        currency: "JPY",
        holders: [{ user_id: "user-1" }],
        id: "account-1",
        name: "钱包",
      },
      {
        currency: "JPY",
        holders: [],
        id: "account-2",
        name: "银行卡",
      },
    ],
    holderOptions: [{ display_name: "淞文", user_id: "user-1" }],
  })) as unknown as AccountService["getView"];
  const service = {
    create,
    getView,
    ...overrides,
  } as unknown as AccountService;

  return {
    create,
    getView,
    importService: createAccountImportService(service),
  };
}

describe("AccountImportService", () => {
  it("createAccount 使用其他类型和 0 初始余额，并透传 Service 返回的 accountId", async () => {
    const { create, importService } = createService();

    const result = await importService.createAccount({
      currency: "JPY",
      holderUserId: "user-1",
      ledgerId: "ledger-1",
      name: "钱包",
      userId: "user-1",
    });

    expect(create).toHaveBeenCalledWith({
      currency: "JPY",
      holderUserIds: ["user-1"],
      initialBalance: 0,
      ledgerId: "ledger-1",
      name: "钱包",
      type: "other",
      userId: "user-1",
    });
    expect(result).toEqual({ accountId: "account-1" });
  });

  it("createAccount 在未指定持有人时传空数组", async () => {
    const { create, importService } = createService();

    await importService.createAccount({
      currency: "JPY",
      holderUserId: null,
      ledgerId: "ledger-1",
      name: "钱包",
      userId: "user-1",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ holderUserIds: [] }),
    );
  });

  it("loadContext 取每个账户的首个持有人并映射账本成员为持有人选项", async () => {
    const { importService } = createService();

    const context = await importService.loadContext({
      ledgerId: "ledger-1",
      userId: "user-1",
    });

    expect(context).toEqual({
      accounts: [
        {
          currency: "JPY",
          holderUserId: "user-1",
          id: "account-1",
          name: "钱包",
        },
        {
          currency: "JPY",
          holderUserId: null,
          id: "account-2",
          name: "银行卡",
        },
      ],
      holders: [{ displayName: "淞文", userId: "user-1" }],
    });
  });
});
