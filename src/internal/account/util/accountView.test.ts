// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildAccountsWithHolders,
  buildDisplayColorByUserId,
  buildHolderOptions,
} from "internal/account/util/accountView";
import type {
  AccountHolderRecord,
  AccountRow,
  AppUserRecord,
  LedgerMemberDisplaySettingRecord,
  LedgerMemberRecord,
} from "types/accounts";

function createAccount(id: string): Omit<AccountRow, "holders"> {
  return {
    created_at: "2026-07-01T00:00:00.000Z",
    currency: "JPY",
    current_balance: "1000",
    id,
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
  status?: AppUserRecord["status"];
  userId: string;
}): AppUserRecord {
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
}): AccountHolderRecord {
  return {
    account_id: accountId,
    id: holderId,
    role: "owner",
    share_ratio: null,
    user_id: userId,
  };
}

function createMember(
  userId: string,
  joinedAt: string | null = null,
): LedgerMemberRecord {
  return {
    created_at: "2026-07-01T00:00:00.000Z",
    joined_at: joinedAt,
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
    });

    expect(accounts[0].holders).toEqual([
      expect.objectContaining({
        display_color: "sky",
        display_name: "家庭账本淞文",
        user_id: "user-a",
      }),
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
    const settings: LedgerMemberDisplaySettingRecord[] = [
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
