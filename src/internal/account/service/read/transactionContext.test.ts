// @vitest-environment node

import { describe, expect, it } from "vitest";

import { buildTransactionAccountContext } from "./transactionContext";

const accountId = "00000000-0000-4000-8000-000000000045";
const userId = "00000000-0000-4000-8000-000000000031";

describe("transactionContext", () => {
  it("单成员账本为单持有人账户分配颜色且不显示记录人", () => {
    const context = buildTransactionAccountContext({
      accounts: [
        { currency: "JPY", id: accountId, name: "现金", type: "cash" },
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
      members: [
        {
          created_at: "2026-07-01T00:00:00.000Z",
          joined_at: null,
          role: "owner",
          user_id: userId,
        },
      ],
      settings: [
        {
          display_color: "sky",
          display_name: null,
          user_id: userId,
        },
      ],
    });

    expect(context).toEqual({
      accountColorById: new Map([[accountId, "sky"]]),
      accounts: [{ currency: "JPY", id: accountId, name: "现金" }],
      showRecorder: false,
    });
  });

  it("多成员账本显示记录人且多持有人账户不分配单一颜色", () => {
    const secondUserId = "00000000-0000-4000-8000-000000000041";
    const context = buildTransactionAccountContext({
      accounts: [
        { currency: "JPY", id: accountId, name: "共同账户", type: "cash" },
      ],
      holders: [
        {
          account_id: accountId,
          id: "00000000-0000-4000-8000-000000000051",
          role: "co_owner",
          placeholder_id: null,
          share_ratio: null,
          user_id: userId,
        },
        {
          account_id: accountId,
          id: "00000000-0000-4000-8000-000000000052",
          role: "co_owner",
          placeholder_id: null,
          share_ratio: null,
          user_id: secondUserId,
        },
      ],
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
          user_id: secondUserId,
        },
      ],
      settings: [
        { display_color: "sky", display_name: null, user_id: userId },
        {
          display_color: "sakura",
          display_name: null,
          user_id: secondUserId,
        },
      ],
    });

    expect(context.accountColorById).toEqual(new Map());
    expect(context.showRecorder).toBe(true);
  });

  it("占位持有的账户不取任何成员颜色", () => {
    const placeholderId = "00000000-0000-4000-8000-000000000061";
    const context = buildTransactionAccountContext({
      accounts: [
        { currency: "JPY", id: accountId, name: "奶奶的钱包", type: "cash" },
      ],
      holders: [
        {
          account_id: accountId,
          id: "00000000-0000-4000-8000-000000000051",
          placeholder_id: placeholderId,
          role: "owner",
          share_ratio: null,
          user_id: null,
        },
      ],
      members: [
        {
          created_at: "2026-07-01T00:00:00.000Z",
          joined_at: null,
          role: "owner",
          user_id: userId,
        },
      ],
      settings: [{ display_color: "sky", display_name: null, user_id: userId }],
    });

    expect(context.accountColorById).toEqual(new Map());
  });
});
