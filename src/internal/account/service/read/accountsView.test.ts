// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildAccountFormHolderOptions,
  buildAccountsView,
  mergeLedgerDisplayNames,
} from "./accountsView";

const accountId = "00000000-0000-4000-8000-000000000045";
const userId = "00000000-0000-4000-8000-000000000031";

describe("accountsView", () => {
  it("使用账本自定义显示名覆盖用户显示名", () => {
    const users = [
      {
        display_name: "用户名称",
        email: "member@example.com",
        id: userId,
        status: "active",
      },
    ];

    expect(
      mergeLedgerDisplayNames(users, [
        {
          display_color: "sky",
          display_name: "家庭称呼",
          user_id: userId,
        },
      ]),
    ).toEqual([{ ...users[0], display_name: "家庭称呼" }]);
  });

  it("没有有效的账本自定义显示名时回退到用户显示名", () => {
    const users = [
      {
        display_name: "用户名称",
        email: "member@example.com",
        id: userId,
        status: "active",
      },
    ];

    expect(
      mergeLedgerDisplayNames(users, [
        {
          display_color: "sky",
          display_name: "   ",
          user_id: userId,
        },
      ]),
    ).toEqual(users);
    expect(mergeLedgerDisplayNames(users, [])).toEqual(users);
  });

  it("共用持有人选项组装规则：显示名、颜色、有效成员与占位排序一致", () => {
    const inactiveUserId = "00000000-0000-4000-8000-000000000032";
    const result = buildAccountFormHolderOptions({
      members: [
        {
          created_at: "2026-07-01T00:00:00.000Z",
          joined_at: null,
          role: "owner",
          user_id: userId,
        },
        {
          created_at: "2026-07-02T00:00:00.000Z",
          joined_at: null,
          role: "member",
          user_id: inactiveUserId,
        },
      ],
      users: [
        {
          display_name: "用户名称",
          email: "member@example.com",
          id: userId,
          status: "active",
        },
        {
          display_name: "已停用",
          email: "inactive@example.com",
          id: inactiveUserId,
          status: "inactive",
        },
      ],
      displaySettings: [
        {
          display_color: "sky",
          display_name: "家庭称呼",
          user_id: userId,
        },
      ],
      placeholders: [
        { displayName: "奶奶", id: "placeholder-2" },
        { displayName: "外婆", id: "placeholder-1" },
      ],
    });

    expect(result.holderOptions).toEqual([
      {
        display_color: "sky",
        display_name: "家庭称呼",
        email: "member@example.com",
        user_id: userId,
      },
    ]);
    expect(result.placeholderHolderOptions).toEqual([
      { display_name: "外婆", placeholder_id: "placeholder-1" },
      { display_name: "奶奶", placeholder_id: "placeholder-2" },
    ]);
    expect(result.appUserById.get(userId)?.display_name).toBe("家庭称呼");
    expect(result.displayColorByUserId.get(userId)).toBe("sky");
  });

  it("组装账户、持有人选项和账本权限", () => {
    const view = buildAccountsView({
      accountIdsWithTransactions: [accountId],
      accounts: [
        {
          created_at: "2026-07-01T00:00:00.000Z",
          currency: "JPY",
          current_balance: "1200",
          id: accountId,
          is_archived: false,
          website_url: null,
          icon_url: null,
          initial_balance: "1000",
          name: "现金",
          sort_order: 10,
          type: "cash",
        },
      ],
      displaySettings: [
        {
          display_color: "sky",
          display_name: "家庭称呼",
          user_id: userId,
        },
      ],
      holders: [
        {
          account_id: accountId,
          id: "00000000-0000-4000-8000-000000000051",
          role: "owner",
          placeholder_id: null,
          share_ratio: null,
          user_id: userId,
        },
      ],
      ledger: {
        baseCurrency: "JPY",
        id: "00000000-0000-4000-8000-000000000032",
        name: "家庭账本",
      },
      members: [
        {
          created_at: "2026-07-01T00:00:00.000Z",
          joined_at: null,
          role: "member",
          user_id: userId,
        },
      ],
      placeholders: [{ displayName: "奶奶", id: "placeholder-1" }],
      role: "member",
      users: [
        {
          display_name: "用户名称",
          email: "member@example.com",
          id: userId,
          status: "active",
        },
      ],
    });

    expect(view).toEqual({
      accounts: [
        expect.objectContaining({
          has_transactions: true,
          holders: [
            expect.objectContaining({
              display_color: "sky",
              display_name: "家庭称呼",
              user_id: userId,
            }),
          ],
          id: accountId,
        }),
      ],
      baseCurrency: "JPY",
      canManageAccounts: false,
      canWriteTransactions: true,
      holderOptions: [
        {
          // 与账户卡片上的持有人胶囊同一个个性色。
          display_color: "sky",
          display_name: "家庭称呼",
          email: "member@example.com",
          user_id: userId,
        },
      ],
      ledgerName: "家庭账本",
      placeholderHolderOptions: [
        { display_name: "奶奶", placeholder_id: "placeholder-1" },
      ],
    });
  });
});
