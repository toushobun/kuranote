import { describe, expect, it } from "vitest";

import { buildLedgerPlaceholderRows } from "utils/ledgerMembers";

const grandma = { displayName: "奶奶", id: "placeholder-1" };
const grandpa = { displayName: "爷爷", id: "placeholder-2" };

function invite(id: string, placeholderId: string | null) {
  return {
    createdAt: "2026-09-01T00:00:00.000Z",
    id,
    placeholderId,
    role: "member" as const,
    token: "a".repeat(64),
  };
}

describe("buildLedgerPlaceholderRows", () => {
  it("绑定邀请合并进对应占位行，没有邀请的占位行保留", () => {
    const bound = invite("invite-bound", grandma.id);

    expect(
      buildLedgerPlaceholderRows({
        pendingInvites: [bound],
        placeholders: [grandma, grandpa],
      }),
    ).toEqual([
      { invite: bound, placeholder: grandma },
      { invite: null, placeholder: grandpa },
    ]);
  });

  it("只按 placeholderId 合并，不按显示名匹配", () => {
    expect(
      buildLedgerPlaceholderRows({
        pendingInvites: [invite("invite-x", "placeholder-other")],
        placeholders: [{ displayName: "invite-x", id: "placeholder-x" }],
      })[0]?.invite,
    ).toBeNull();
  });

  it("撤销后（列表不再含绑定邀请）占位行保留为未生成链接", () => {
    expect(
      buildLedgerPlaceholderRows({
        pendingInvites: [],
        placeholders: [grandma],
      }),
    ).toEqual([{ invite: null, placeholder: grandma }]);
  });

  it("不再展示未绑定的历史邀请和找不到占位的绑定邀请", () => {
    expect(
      buildLedgerPlaceholderRows({
        pendingInvites: [
          invite("invite-anonymous", null),
          invite("invite-orphan", "placeholder-missing"),
        ],
        placeholders: [grandma],
      }),
    ).toEqual([{ invite: null, placeholder: grandma }]);
  });
});
