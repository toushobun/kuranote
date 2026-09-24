// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createLedgerInvitePreviewService } from "internal/ledger/service/ledgerInvitePreviewService";

describe("LedgerInvitePreviewService", () => {
  it("将有效邀请预览映射为页面模型", async () => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue({
        invite_role: "member",
        invite_status: "valid",
        inviter_name: "淞文",
        is_placeholder_bound: false,
        ledger_name: "家庭账本",
        placeholder_display_name: null,
      }),
    });

    await expect(service.load("invite-token")).resolves.toEqual({
      inviteRole: "member",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "valid",
    });
  });

  it("有效绑定邀请返回占位当前名字", async () => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue({
        invite_role: "viewer",
        invite_status: "valid",
        inviter_name: "淞文",
        is_placeholder_bound: true,
        ledger_name: "家庭账本",
        placeholder_display_name: "小明",
      }),
    });

    await expect(service.load("invite-token")).resolves.toMatchObject({
      isPlaceholderBound: true,
      placeholderDisplayName: "小明",
    });
  });

  it.each([
    ["未绑定却带名字", false, "小明"],
    ["绑定标记缺失", null, "小明"],
    ["绑定但名字缺失", true, null],
  ])("%s时不展示占位名字", async (_label, bound, name) => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue({
        invite_role: "member",
        invite_status: "valid",
        inviter_name: "淞文",
        is_placeholder_bound: bound,
        ledger_name: "家庭账本",
        placeholder_display_name: name,
      }),
    });

    await expect(service.load("invite-token")).resolves.toMatchObject({
      isPlaceholderBound: false,
      placeholderDisplayName: null,
    });
  });

  it("未知角色或状态按 invalid 处理", async () => {
    const service = createLedgerInvitePreviewService({
      findByToken: vi.fn().mockResolvedValue({
        invite_role: "owner",
        invite_status: "unexpected",
        inviter_name: null,
        is_placeholder_bound: null,
        ledger_name: null,
        placeholder_display_name: null,
      }),
    });

    await expect(service.load("invite-token")).resolves.toEqual({
      inviteRole: null,
      inviterName: null,
      isPlaceholderBound: false,
      ledgerName: null,
      placeholderDisplayName: null,
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
