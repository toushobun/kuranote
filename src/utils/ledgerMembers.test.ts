import { describe, expect, it } from "vitest";

import { groupLedgerPendingPeople } from "utils/ledgerMembers";

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

describe("groupLedgerPendingPeople", () => {
  it("绑定邀请合并进对应占位行，不再作为匿名邀请重复出现", () => {
    const bound = invite("invite-bound", grandma.id);
    const anonymous = invite("invite-anonymous", null);

    expect(
      groupLedgerPendingPeople({
        pendingInvites: [bound, anonymous],
        placeholders: [grandma, grandpa],
      }),
    ).toEqual({
      anonymousInvites: [anonymous],
      placeholderRows: [
        { invite: bound, placeholder: grandma },
        { invite: null, placeholder: grandpa },
      ],
    });
  });

  it("只按 placeholderId 合并，不按显示名匹配", () => {
    const anonymous = invite("invite-anonymous", null);

    const result = groupLedgerPendingPeople({
      pendingInvites: [anonymous],
      placeholders: [{ displayName: "invite-anonymous", id: "placeholder-x" }],
    });

    expect(result.placeholderRows[0]?.invite).toBeNull();
    expect(result.anonymousInvites).toEqual([anonymous]);
  });

  it("撤销后（列表不再含绑定邀请）占位行保留为待邀请", () => {
    expect(
      groupLedgerPendingPeople({ pendingInvites: [], placeholders: [grandma] }),
    ).toEqual({
      anonymousInvites: [],
      placeholderRows: [{ invite: null, placeholder: grandma }],
    });
  });

  it("占位不在当前列表的绑定邀请仍作为待接受邀请保留", () => {
    const orphan = invite("invite-orphan", "placeholder-missing");

    expect(
      groupLedgerPendingPeople({
        pendingInvites: [orphan],
        placeholders: [grandma],
      }).anonymousInvites,
    ).toEqual([orphan]);
  });
});
