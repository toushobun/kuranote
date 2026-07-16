import { describe, expect, it } from "vitest";

import { isValidLedgerInviteToken } from "./inviteToken";

describe("isValidLedgerInviteToken", () => {
  it("接受 64 位小写十六进制 token", () => {
    expect(isValidLedgerInviteToken("0123456789abcdef".repeat(4))).toBe(true);
  });

  it.each([
    "",
    "a".repeat(63),
    "a".repeat(65),
    "A".repeat(64),
    "g".repeat(64),
    "../".repeat(22),
  ])("拒绝畸形 token %s", (token) => {
    expect(isValidLedgerInviteToken(token)).toBe(false);
  });
});
