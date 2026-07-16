import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import { createSupabaseMock } from "test/supabaseMock";

import {
  acceptLedgerInviteService,
  createLedgerInviteService,
  loadLedgerInvitePreview,
  loadPendingLedgerInvitesService,
} from "./ledgerInvite";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createLedgerInviteService", () => {
  it.each(["admin", "member", "viewer"] as const)(
    "以 %s 角色生成邀请",
    async (role) => {
      const supabase = createSupabaseMock({
        rpcResponse: {
          data: [
            {
              invite_id: "invite-id",
              invite_role: role,
              token: "invite-token",
            },
          ],
        },
      });
      mocks.createClient.mockResolvedValue(supabase.client);

      await expect(
        createLedgerInviteService("ledger-id", role),
      ).resolves.toEqual({
        inviteId: "invite-id",
        ok: true,
        role,
        token: "invite-token",
      });
      expect(supabase.rpc).toHaveBeenCalledWith("create_ledger_invite_v2", {
        p_ledger_id: "ledger-id",
        p_role: role,
      });
    },
  );

  it("非管理员生成邀请时根据 PostgreSQL DETAIL 映射 permission_denied", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "42501",
          details: "permission_denied",
          hint: null,
          message: "权限不足",
        },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createLedgerInviteService("ledger-id", "member"),
    ).resolves.toEqual({
      error: ledgerInviteErrorCodes.permissionDenied,
      ok: false,
    });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("未知 RPC 错误仅记录非敏感诊断字段并返回 create_failed", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "42883",
          details: "possibly-sensitive-details",
          hint: "Check the function signature",
          message: "function digest(text, unknown) does not exist",
        },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createLedgerInviteService("ledger-id", "member"),
    ).resolves.toEqual({
      error: ledgerInviteErrorCodes.createFailed,
      ok: false,
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ledgerInvite] create_ledger_invite_v2 failed",
      {
        code: "42883",
        hint: "Check the function signature",
        message: "function digest(text, unknown) does not exist",
      },
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ details: expect.anything() }),
    );
    consoleError.mockRestore();
  });

  it.each([
    null,
    [],
    [{}],
    [{ invite_id: "id", invite_role: "owner", token: "token" }],
  ])("RPC 返回无效数据 %j 时返回 create_failed", async (data) => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const supabase = createSupabaseMock({ rpcResponse: { data } });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createLedgerInviteService("ledger-id", "member"),
    ).resolves.toEqual({
      error: ledgerInviteErrorCodes.createFailed,
      ok: false,
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ledgerInvite] create_ledger_invite_v2 returned invalid data",
      {
        isArray: Array.isArray(data),
        rowCount: Array.isArray(data) ? data.length : null,
      },
    );
    consoleError.mockRestore();
  });
});

describe("loadPendingLedgerInvitesService", () => {
  it("映射待接受邀请及可恢复 token", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          {
            created_at: "2026-07-16T05:00:00.000Z",
            invite_id: "invite-id",
            invite_role: "admin",
            invite_token: "restored-token",
          },
        ],
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      loadPendingLedgerInvitesService("ledger-id"),
    ).resolves.toEqual({
      invites: [
        {
          createdAt: "2026-07-16T05:00:00.000Z",
          id: "invite-id",
          role: "admin",
          token: "restored-token",
        },
      ],
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("list_pending_ledger_invites", {
      p_ledger_id: "ledger-id",
    });
  });

  it("无管理权限时保留邀请元数据但不返回 token", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          {
            created_at: "2026-07-16T05:00:00.000Z",
            invite_id: "invite-id",
            invite_role: "member",
            invite_token: null,
          },
        ],
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      loadPendingLedgerInvitesService("ledger-id"),
    ).resolves.toEqual({
      invites: [
        {
          createdAt: "2026-07-16T05:00:00.000Z",
          id: "invite-id",
          role: "member",
          token: null,
        },
      ],
      ok: true,
    });
  });

  it("RPC 失败时返回稳定加载错误", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: new Error("rpc failed") },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      loadPendingLedgerInvitesService("ledger-id"),
    ).resolves.toEqual({
      error: ledgerInviteErrorCodes.loadFailed,
      ok: false,
    });
  });
});

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

describe("acceptLedgerInviteService", () => {
  it("接受邀请成功时返回 ok", async () => {
    const supabase = createSupabaseMock({ rpcResponse: {} });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(acceptLedgerInviteService("invite-token")).resolves.toEqual({
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("accept_ledger_invite", {
      p_token: "invite-token",
    });
  });

  it.each([
    ["invite_already_used", ledgerInviteErrorCodes.inviteUsed],
    ["invite_invalid", ledgerInviteErrorCodes.inviteInvalid],
    ["permission_denied", ledgerInviteErrorCodes.permissionDenied],
  ])("根据 PostgreSQL DETAIL %s 映射业务错误", async (details, expected) => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "P0001",
          details,
          hint: null,
          message: "业务错误",
        },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(acceptLedgerInviteService("invite-token")).resolves.toEqual({
      error: expected,
      ok: false,
    });
  });

  it("未知业务错误时回退 invite_invalid", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "P0001",
          details: "unexpected_error",
          hint: null,
          message: "未知错误",
        },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(acceptLedgerInviteService("invite-token")).resolves.toEqual({
      error: ledgerInviteErrorCodes.inviteInvalid,
      ok: false,
    });
  });
});
