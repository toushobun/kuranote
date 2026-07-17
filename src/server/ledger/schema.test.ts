// @vitest-environment node

import { describe, expect, it } from "vitest";

import { acceptLedgerInviteRequestSchema } from "server/ledger/schema";

describe("acceptLedgerInviteRequestSchema", () => {
  it("接受合法的 64 位十六进制 token", () => {
    const result = acceptLedgerInviteRequestSchema.safeParse({
      token: "a".repeat(64),
    });

    expect(result.success).toBe(true);
  });

  it.each(["valid-token", "not-hex-format", "a".repeat(63), "a".repeat(65)])(
    "拒绝格式不合法的 token: %s",
    (token) => {
      const result = acceptLedgerInviteRequestSchema.safeParse({ token });

      expect(result.success).toBe(false);
    },
  );

  it("拒绝空字符串", () => {
    const result = acceptLedgerInviteRequestSchema.safeParse({ token: "" });

    expect(result.success).toBe(false);
  });
});
