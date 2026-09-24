// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildAccountsWithHolders,
  buildDisplayColorByUserId,
  buildHolderOptions,
  buildPlaceholderHolderOptions,
  unknownPlaceholderHolderName,
} from "internal/account/util/accountView";
import type {
  AccountData,
  AccountHolderData,
  AccountLedgerMember,
  AccountMemberDisplaySetting,
  AccountUser,
} from "internal/account/repository/accountRepository";

function createAccount(id: string): AccountData {
  return {
    created_at: "2026-07-01T00:00:00.000Z",
    currency: "JPY",
    current_balance: "1000",
    id,
    is_archived: false,
    initial_balance: "1000",
    name: "现金",
    sort_order: 1,
    type: "cash",
  };
}

function createAppUser({
  displayName,
  status = "active",
  userId,
}: {
  displayName: string;
  status?: AccountUser["status"];
  userId: string;
}): AccountUser {
  return {
    display_name: displayName,
    email: `${userId}@example.com`,
    id: userId,
    status,
  };
}

function createHolder({
  accountId,
  holderId,
  userId,
}: {
  accountId: string;
  holderId: string;
  userId: string;
}): AccountHolderData {
  return {
    account_id: accountId,
    id: holderId,
    role: "owner",
    placeholder_id: null,
    share_ratio: null,
    user_id: userId,
  };
}

function createMember(
  userId: string,
  joinedAt: string | null = null,
): AccountLedgerMember {
  return {
    created_at: "2026-07-01T00:00:00.000Z",
    joined_at: joinedAt,
    role: "member",
    user_id: userId,
  };
}

describe("Account view builders", () => {
  it("按账户聚合持有人并跳过不存在的用户", () => {
    const accounts = buildAccountsWithHolders({
      accounts: [createAccount("account-a")],
      appUserById: new Map([
        [
          "user-a",
          createAppUser({ displayName: "家庭账本淞文", userId: "user-a" }),
        ],
      ]),
      displayColorByUserId: new Map([["user-a", "sky"]]),
      holders: [
        createHolder({
          accountId: "account-a",
          holderId: "holder-a",
          userId: "user-a",
        }),
        createHolder({
          accountId: "account-a",
          holderId: "holder-missing",
          userId: "user-missing",
        }),
      ],
      placeholderById: new Map(),
    });

    expect(accounts[0].holders).toEqual([
      expect.objectContaining({
        display_color: "sky",
        display_name: "家庭账本淞文",
        user_id: "user-a",
      }),
    ]);
  });

  it("占位持有人显示占位名字，不查询用户资料也不计为无持有人", () => {
    const placeholderId = "placeholder-a";
    const accounts = buildAccountsWithHolders({
      accounts: [createAccount("account-a"), createAccount("account-b")],
      // 即使 appUserById 恰好有同 ID 的用户，也不能拿占位 ID 去匹配。
      appUserById: new Map([
        [
          placeholderId,
          createAppUser({ displayName: "伪装用户", userId: placeholderId }),
        ],
      ]),
      displayColorByUserId: new Map([[placeholderId, "sky"]]),
      holders: [
        {
          account_id: "account-a",
          id: "holder-a",
          placeholder_id: placeholderId,
          role: "owner",
          share_ratio: null,
          user_id: null,
        },
        {
          account_id: "account-b",
          id: "holder-b",
          placeholder_id: "placeholder-missing",
          role: "owner",
          share_ratio: null,
          user_id: null,
        },
      ],
      placeholderById: new Map([
        [placeholderId, { displayName: "奶奶", id: placeholderId }],
      ]),
    });

    expect(accounts[0].holders).toEqual([
      {
        display_color: null,
        display_name: "奶奶",
        email: null,
        id: "holder-a",
        kind: "placeholder",
        placeholder_id: placeholderId,
        role: "owner",
        share_ratio: null,
        user_id: null,
      },
    ]);
    // 读取竞态导致摘要缺失时仍按占位展示，而不是无持有人。
    expect(accounts[1].holders).toEqual([
      expect.objectContaining({
        display_name: unknownPlaceholderHolderName,
        kind: "placeholder",
      }),
    ]);
  });

  it("占位候选与成员候选分开并按名字排序", () => {
    expect(
      buildPlaceholderHolderOptions([
        { displayName: "爷爷", id: "p-2" },
        { displayName: "奶奶", id: "p-1" },
      ]),
    ).toEqual([
      { display_name: "奶奶", placeholder_id: "p-1" },
      { display_name: "爷爷", placeholder_id: "p-2" },
    ]);
  });

  it("持有人候选只包含有效用户并按最终显示名排序", () => {
    const holderOptions = buildHolderOptions({
      appUserById: new Map([
        ["user-a", createAppUser({ displayName: "Alpha", userId: "user-a" })],
        ["user-b", createAppUser({ displayName: "Beta", userId: "user-b" })],
        [
          "user-c",
          createAppUser({
            displayName: "停用成员",
            status: "inactive",
            userId: "user-c",
          }),
        ],
      ]),
      members: [
        createMember("user-a"),
        createMember("user-b"),
        createMember("user-c"),
      ],
    });

    expect(holderOptions.map((option) => option.user_id)).toEqual([
      "user-a",
      "user-b",
    ]);
  });

  it("显示颜色先按成员稳定顺序分配，再由合法设置覆盖", () => {
    const settings: AccountMemberDisplaySetting[] = [
      {
        display_color: "sky",
        display_name: null,
        user_id: "user-b",
      },
      {
        display_color: "not-a-color",
        display_name: null,
        user_id: "user-a",
      },
    ];

    const colors = buildDisplayColorByUserId({
      members: [
        createMember("user-b", "2026-07-02T00:00:00.000Z"),
        createMember("user-a", "2026-07-01T00:00:00.000Z"),
      ],
      settings,
    });

    expect(colors.get("user-b")).toBe("sky");
    expect(colors.get("user-a")).toBeDefined();
    expect(colors.get("user-a")).not.toBe("not-a-color");
  });
});
