import { describe, expect, it } from "vitest";

import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import { parseLedgerInvitePlaceholderIdForm } from "internal/ledger/schema/ledgerInviteForm";

function formDataWith(placeholderId?: string) {
  const formData = new FormData();
  if (placeholderId !== undefined) {
    formData.set("placeholderId", placeholderId);
  }
  return formData;
}

describe("parseLedgerInvitePlaceholderIdForm", () => {
  it.each([undefined, "", "   "])("值为 %j 时解析为匿名邀请", (value) => {
    expect(parseLedgerInvitePlaceholderIdForm(formDataWith(value))).toEqual({
      ok: true,
      value: null,
    });
  });

  it("去除首尾空白后接受 UUID", () => {
    const placeholderId = "00000000-0000-4000-8000-000000000051";

    expect(
      parseLedgerInvitePlaceholderIdForm(formDataWith(` ${placeholderId} `)),
    ).toEqual({ ok: true, value: placeholderId });
  });

  it.each(["not-a-uuid", "00000000-0000-4000-8000-00000000005"])(
    "非法 UUID %s 返回 placeholder_not_found",
    (value) => {
      expect(parseLedgerInvitePlaceholderIdForm(formDataWith(value))).toEqual({
        error: ledgerInviteErrorCodes.placeholderNotFound,
        ok: false,
      });
    },
  );
});
