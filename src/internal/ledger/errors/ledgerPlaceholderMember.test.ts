import { describe, expect, it } from "vitest";

import {
  ledgerInviteErrorCodes,
  ledgerInviteErrorMessages,
} from "internal/ledger/errors/ledgerInvite";
import {
  ledgerPlaceholderMemberErrorCodes,
  ledgerPlaceholderMemberErrorMessages,
} from "internal/ledger/errors/ledgerPlaceholderMember";

describe("ledgerPlaceholderMemberErrorMessages", () => {
  it("所有错误码都定义了安全文案", () => {
    for (const code of Object.values(ledgerPlaceholderMemberErrorCodes)) {
      expect(ledgerPlaceholderMemberErrorMessages[code]).toEqual(
        expect.any(String),
      );
    }
  });

  it.each([
    ledgerInviteErrorCodes.placeholderNotFound,
    ledgerInviteErrorCodes.placeholderAlreadyClaimed,
    ledgerInviteErrorCodes.authRequired,
    ledgerInviteErrorCodes.ledgerNotFound,
  ])("%s 引用邀请流程的权威文案，不重复定义", (code) => {
    expect(ledgerPlaceholderMemberErrorMessages[code]).toBe(
      ledgerInviteErrorMessages[code],
    );
  });

  it("引用冲突提示先更换账户持有人", () => {
    expect(
      ledgerPlaceholderMemberErrorMessages[
        ledgerPlaceholderMemberErrorCodes.placeholderInUse
      ],
    ).toContain("持有人改为其他人或无持有人");
  });
});
