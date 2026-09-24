// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  acceptLedgerInviteRequestSchema,
  createdLedgerInviteResponseSchema,
  createLedgerInviteRequestSchema,
  pendingLedgerInvitesResponseSchema,
} from "internal/ledger/schema";

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

describe("createLedgerInviteRequestSchema", () => {
  const placeholderId = "00000000-0000-4000-8000-000000000051";

  it("placeholderId 可以省略", () => {
    expect(createLedgerInviteRequestSchema.parse({ role: "member" })).toEqual({
      role: "member",
    });
  });

  it("接受 UUID 格式的 placeholderId", () => {
    expect(
      createLedgerInviteRequestSchema.parse({ placeholderId, role: "viewer" }),
    ).toEqual({ placeholderId, role: "viewer" });
  });

  it.each(["not-a-uuid", "", null, 1])("拒绝非法 placeholderId %j", (value) => {
    expect(
      createLedgerInviteRequestSchema.safeParse({
        placeholderId: value,
        role: "member",
      }).success,
    ).toBe(false);
  });
});

describe("ledger invite response schemas", () => {
  const inviteId = "00000000-0000-4000-8000-000000000041";
  const placeholderId = "00000000-0000-4000-8000-000000000051";

  it.each([placeholderId, null])(
    "生成邀请响应的 placeholderId 可以是 %j",
    (value) => {
      expect(
        createdLedgerInviteResponseSchema.safeParse({
          inviteId,
          placeholderId: value,
          role: "member",
          token: "a".repeat(64),
        }).success,
      ).toBe(true);
    },
  );

  it("生成邀请响应必须包含 placeholderId", () => {
    expect(
      createdLedgerInviteResponseSchema.safeParse({
        inviteId,
        role: "member",
        token: "a".repeat(64),
      }).success,
    ).toBe(false);
  });

  it("待接受邀请响应包含可空 placeholderId", () => {
    const invite = {
      createdAt: "2026-09-24T00:00:00.000Z",
      id: inviteId,
      role: "member",
      token: null,
    };

    expect(
      pendingLedgerInvitesResponseSchema.safeParse({
        invites: [
          { ...invite, placeholderId },
          { ...invite, placeholderId: null },
        ],
      }).success,
    ).toBe(true);
    expect(
      pendingLedgerInvitesResponseSchema.safeParse({ invites: [invite] })
        .success,
    ).toBe(false);
  });
});
