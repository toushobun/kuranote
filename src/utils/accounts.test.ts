import { describe, expect, it } from "vitest";

import type {
  AccountHolderRecord,
  AccountRow,
  AppUserRecord,
  LedgerMemberRecord,
} from "types/accounts";
import {
  buildAccountsWithHolders,
  buildHolderOptions,
  formatAmount,
} from "utils/accounts";

describe("formatAmount", () => {
  it("可以按指定货币格式化 number 输入", () => {
    expect(formatAmount(1200, "JPY")).toBe("¥1,200");
  });

  it("可以按指定货币格式化数字字符串输入", () => {
    expect(formatAmount("1234.5", "USD")).toBe("$1,234.50");
  });

  it("金额输入无效时使用 fallback 文案", () => {
    expect(formatAmount("not-a-number", "JPY")).toBe("not-a-number JPY");
  });

  it("金额输入为 null 时使用 fallback 文案", () => {
    expect(formatAmount(null, "JPY")).toBe("-- JPY");
  });

  it("Intl 无法格式化货币时使用 fallback 文案", () => {
    expect(formatAmount(1200, "INVALID")).toBe("1200 INVALID");
  });

  it("人民币金额格式化为「金额元」而非「元 金额」", () => {
    expect(formatAmount(1234.5, "CNY")).toBe("1,234.50元");
  });

  it("人民币负数金额保留负号在数字前", () => {
    expect(formatAmount(-1234.5, "CNY")).toBe("-1,234.50元");
  });

  it("泰铢金额使用泰铢符号而非货币代码前缀", () => {
    expect(formatAmount(1234.5, "THB")).toBe("฿1,234.50");
  });
});

describe("account member display names", () => {
  it("账户持有人使用已合并的当前账本内昵称", () => {
    const accounts = buildAccountsWithHolders({
      accounts: [createAccount("account-a")],
      appUserById: new Map([
        [
          "user-a",
          createAppUser({ displayName: "家庭账本淞文", userId: "user-a" }),
        ],
        [
          "user-b",
          createAppUser({ displayName: "全局成员", userId: "user-b" }),
        ],
      ]),
      displayColorByUserId: new Map(),
      holders: [
        createHolder({
          accountId: "account-a",
          holderId: "holder-a",
          userId: "user-a",
        }),
        createHolder({
          accountId: "account-a",
          holderId: "holder-b",
          userId: "user-b",
        }),
      ],
    });

    expect(accounts[0].holders.map((holder) => holder.display_name)).toEqual([
      "家庭账本淞文",
      "全局成员",
    ]);
  });

  it("账户持有人选项使用已合并的当前账本内昵称并按最终显示名排序", () => {
    const members: LedgerMemberRecord[] = [
      createMember("user-a"),
      createMember("user-b"),
    ];

    const holderOptions = buildHolderOptions({
      appUserById: new Map([
        [
          "user-a",
          createAppUser({ displayName: "家庭账本淞文", userId: "user-a" }),
        ],
        [
          "user-b",
          createAppUser({ displayName: "全局成员", userId: "user-b" }),
        ],
      ]),
      members,
    });

    expect(holderOptions).toEqual([
      {
        display_name: "全局成员",
        email: "user-b@example.com",
        user_id: "user-b",
      },
      {
        display_name: "家庭账本淞文",
        email: "user-a@example.com",
        user_id: "user-a",
      },
    ]);
  });
});

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
  userId,
}: {
  displayName: string;
  userId: string;
}): AppUserRecord {
  return {
    display_name: displayName,
    email: `${userId}@example.com`,
    id: userId,
    status: "active",
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

function createMember(userId: string): LedgerMemberRecord {
  return {
    created_at: "2026-07-01T00:00:00.000Z",
    joined_at: null,
    user_id: userId,
  };
}
