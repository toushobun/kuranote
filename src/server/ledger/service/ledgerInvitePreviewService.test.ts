// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createLedgerInvitePreviewService } from "server/ledger/service/ledgerInvitePreviewService";

describe("LedgerInvitePreviewService", () => {
  it("将有效邀请预览映射为页面模型", async () => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue({
        invite_role: "member",
        invite_status: "valid",
        inviter_name: "淞文",
        ledger_name: "家庭账本",
      }),
    });

    await expect(service.load("invite-token")).resolves.toEqual({
      inviteRole: "member",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "valid",
    });
  });

  it("未知角色或状态按 invalid 处理", async () => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue({
        invite_role: "owner",
        invite_status: "unexpected",
        inviter_name: null,
        ledger_name: null,
      }),
    });

    await expect(service.load("invite-token")).resolves.toEqual({
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    });
  });

  it("邀请不存在时返回 invalid", async () => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue(null),
    });

    await expect(service.load("invite-token")).resolves.toMatchObject({
      status: "invalid",
    });
  });
});
