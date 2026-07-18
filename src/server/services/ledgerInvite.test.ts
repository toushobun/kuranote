import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { loadLedgerInvitePreview } from "./ledgerInvite";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// 邀请创建 / 撤销 / 列表 / 接受的测试已迁移至
// server/ledger/repository/ledgerInviteRepository.test.ts 和
// server/ledger/service/ledgerInviteService.test.ts（见 #472）。

describe("loadLedgerInvitePreview", () => {
  it("将有效邀请预览映射为页面模型", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          {
            invite_role: "member",
            invite_status: "valid",
            inviter_name: "淞文",
            ledger_name: "家庭账本",
          },
        ],
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadLedgerInvitePreview("invite-token")).resolves.toEqual({
      inviteRole: "member",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "valid",
    });
  });

  it.each(["already_member", "accepted", "revoked"] as const)(
    "映射 %s 邀请状态",
    async (status) => {
      const supabase = createSupabaseMock({
        rpcResponse: {
          data: [
            {
              invite_role: "viewer",
              invite_status: status,
              inviter_name: "管理员",
              ledger_name: "共享账本",
            },
          ],
        },
      });
      mocks.createClient.mockResolvedValue(supabase.client);

      await expect(loadLedgerInvitePreview("invite-token")).resolves.toEqual({
        inviteRole: "viewer",
        inviterName: "管理员",
        ledgerName: "共享账本",
        status,
      });
    },
  );

  it("RPC 返回未知状态时按 invalid 处理", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          {
            invite_role: "owner",
            invite_status: "unexpected",
            inviter_name: 123,
            ledger_name: null,
          },
        ],
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadLedgerInvitePreview("invite-token")).resolves.toEqual({
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    });
  });

  it("RPC 返回错误时按 invalid 处理", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: new Error("rpc failed") },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadLedgerInvitePreview("invite-token")).resolves.toEqual({
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    });
  });

  it("Supabase 客户端异常时降级且不记录 token", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createClient.mockRejectedValue(new Error("invite-token leaked"));

    await expect(loadLedgerInvitePreview("invite-token")).resolves.toEqual({
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ledgerInvite] failed to load invite preview",
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("invite-token"),
    );
    consoleError.mockRestore();
  });
});
