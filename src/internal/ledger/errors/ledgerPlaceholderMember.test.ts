import { describe, expect, it } from "vitest";

import { getLedgerInviteErrorMessage } from "internal/ledger/errors/ledgerInvite";
import {
  getLedgerPlaceholderMemberErrorMessage,
  ledgerPlaceholderMemberErrorCodes,
} from "internal/ledger/errors/ledgerPlaceholderMember";

describe("getLedgerPlaceholderMemberErrorMessage", () => {
  it("所有错误码都定义了安全文案", () => {
    for (const code of Object.values(ledgerPlaceholderMemberErrorCodes)) {
      expect(getLedgerPlaceholderMemberErrorMessage(code)).toEqual(
        expect.any(String),
      );
    }
  });

  it.each([
    "placeholder_not_found",
    "placeholder_already_claimed",
    "auth_required",
    "ledger_not_found",
  ])("%s 引用邀请流程的权威文案，不重复定义", (code) => {
    expect(getLedgerPlaceholderMemberErrorMessage(code)).toBe(
      getLedgerInviteErrorMessage(code),
    );
  });

  it("引用冲突提示先更换账户持有人", () => {
    expect(
      getLedgerPlaceholderMemberErrorMessage(
        ledgerPlaceholderMemberErrorCodes.placeholderInUse,
      ),
    ).toContain("持有人改为其他人或无持有人");
  });

  it.each([undefined, "", "unknown_error", "invite_invalid"])(
    "未知或其他流程错误码 %s 不展示消息",
    (code) => {
      expect(getLedgerPlaceholderMemberErrorMessage(code)).toBeNull();
    },
  );
});
