import { describe, expect, it } from "vitest";

import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import { ledgerPlaceholderMemberErrorCodes } from "internal/ledger/errors/ledgerPlaceholderMember";
import {
  parseInviteMemberForm,
  parseRegenerateLedgerInviteForm,
} from "internal/ledger/schema/ledgerInviteForm";

const placeholderId = "00000000-0000-4000-8000-000000000051";

function formDataWith(values: Record<string, string | undefined>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) formData.set(key, value);
  }
  return formData;
}

describe("parseInviteMemberForm", () => {
  it("去除名字首尾空白并读取角色", () => {
    expect(
      parseInviteMemberForm(
        formDataWith({ displayName: "  小明 ", role: "viewer" }),
      ),
    ).toEqual({ ok: true, value: { displayName: "小明", role: "viewer" } });
  });

  it("未提交角色时默认为 member", () => {
    expect(
      parseInviteMemberForm(formDataWith({ displayName: "小明" })),
    ).toEqual({ ok: true, value: { displayName: "小明", role: "member" } });
  });

  it.each([{}, { displayName: "" }, { displayName: "   " }])(
    "名字为空 %j 时返回 placeholder_name_invalid",
    (values) => {
      expect(parseInviteMemberForm(formDataWith(values))).toEqual({
        error: ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid,
        ok: false,
      });
    },
  );

  it("名字超过 100 个字符时返回 placeholder_name_too_long", () => {
    expect(
      parseInviteMemberForm(formDataWith({ displayName: "a".repeat(101) })),
    ).toEqual({
      error: ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong,
      ok: false,
    });
  });

  it("名字恰好 100 个字符时通过", () => {
    expect(
      parseInviteMemberForm(formDataWith({ displayName: "a".repeat(100) })).ok,
    ).toBe(true);
  });

  it.each(["owner", "unknown"])(
    "角色 %s 非法时返回 invite_role_invalid",
    (role) => {
      expect(
        parseInviteMemberForm(formDataWith({ displayName: "小明", role })),
      ).toEqual({ error: ledgerInviteErrorCodes.inviteRoleInvalid, ok: false });
    },
  );
});

describe("parseRegenerateLedgerInviteForm", () => {
  it("去除首尾空白后接受 UUID", () => {
    expect(
      parseRegenerateLedgerInviteForm(
        formDataWith({ placeholderId: ` ${placeholderId} `, role: "admin" }),
      ),
    ).toEqual({ ok: true, value: { placeholderId, role: "admin" } });
  });

  it.each([{}, { placeholderId: "" }, { placeholderId: "   " }])(
    "缺少 placeholderId %j 时返回 placeholder_required",
    (values) => {
      expect(parseRegenerateLedgerInviteForm(formDataWith(values))).toEqual({
        error: ledgerInviteErrorCodes.placeholderRequired,
        ok: false,
      });
    },
  );

  it.each(["not-a-uuid", "00000000-0000-4000-8000-00000000005"])(
    "非法 UUID %s 返回 placeholder_not_found",
    (value) => {
      expect(
        parseRegenerateLedgerInviteForm(formDataWith({ placeholderId: value })),
      ).toEqual({
        error: ledgerInviteErrorCodes.placeholderNotFound,
        ok: false,
      });
    },
  );

  it("角色非法时返回 invite_role_invalid", () => {
    expect(
      parseRegenerateLedgerInviteForm(
        formDataWith({ placeholderId, role: "owner" }),
      ),
    ).toEqual({ error: ledgerInviteErrorCodes.inviteRoleInvalid, ok: false });
  });
});
