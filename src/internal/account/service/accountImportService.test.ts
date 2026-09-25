import { describe, expect, it, vi } from "vitest";

import { createAccountImportService } from "internal/account/service/accountImportService";
import type { AccountService } from "internal/account/service/accountService";

function createService(overrides: Partial<AccountService> = {}) {
  const create = vi.fn(async () => ({ accountId: "account-1" }));
  const getView = vi.fn(async () => ({
    accounts: [
      {
        is_archived: false,
        currency: "JPY",
        holders: [{ kind: "member", user_id: "user-1" }],
        id: "account-1",
        name: "钱包",
      },
      {
        is_archived: false,
        currency: "JPY",
        holders: [],
        id: "account-2",
        name: "银行卡",
      },
    ],
    holderOptions: [
      { display_name: "淞文", email: "a@example.com", user_id: "user-1" },
    ],
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
      holder: { kind: "member", userId: "user-1" },
      ledgerId: "ledger-1",
      name: "钱包",
      userId: "user-1",
    });

    expect(create).toHaveBeenCalledWith({
      currency: "JPY",
      holderPlaceholderId: null,
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
      holder: null,
      ledgerId: "ledger-1",
      name: "钱包",
      userId: "user-1",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ holderPlaceholderId: null, holderUserIds: [] }),
    );
  });

  it("createAccount 在持有人是待邀请成员时透传占位 ID，不传成员", async () => {
    const { create, importService } = createService();

    await importService.createAccount({
      currency: "JPY",
      holder: { kind: "placeholder", placeholderId: "placeholder-1" },
      ledgerId: "ledger-1",
      name: "钱包",
      userId: "user-1",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        holderPlaceholderId: "placeholder-1",
        holderUserIds: [],
      }),
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
          isArchived: false,
          currency: "JPY",
          holder: { kind: "member", userId: "user-1" },
          id: "account-1",
          name: "钱包",
        },
        {
          isArchived: false,
          currency: "JPY",
          holder: null,
          id: "account-2",
          name: "银行卡",
        },
      ],
      holders: [
        { displayName: "淞文", email: "a@example.com", userId: "user-1" },
      ],
    });
  });

  it("占位持有的账户返回占位引用，不会被当成无持有人账户", async () => {
    const getView = vi.fn(async () => ({
      accounts: [
        {
          is_archived: false,
          currency: "JPY",
          holders: [
            {
              kind: "placeholder",
              placeholder_id: "placeholder-1",
              user_id: null,
            },
          ],
          id: "account-placeholder",
          name: "钱包",
        },
        {
          is_archived: false,
          currency: "JPY",
          holders: [],
          id: "account-none",
          name: "钱包",
        },
      ],
      holderOptions: [],
    })) as unknown as AccountService["getView"];
    const { importService } = createService({ getView });

    const context = await importService.loadContext({
      ledgerId: "ledger-1",
      userId: "user-1",
    });

    expect(context.accounts).toEqual([
      {
        isArchived: false,
        currency: "JPY",
        holder: { kind: "placeholder", placeholderId: "placeholder-1" },
        id: "account-placeholder",
        name: "钱包",
      },
      {
        isArchived: false,
        currency: "JPY",
        holder: null,
        id: "account-none",
        name: "钱包",
      },
    ]);
  });
});
