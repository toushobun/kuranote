import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import { createSupabaseMock } from "test/supabaseMock";

import {
  loadPendingLedgerInvitesService,
  revokeLedgerInviteService,
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

describe("loadPendingLedgerInvitesService", () => {
  it("将待接受邀请和可恢复 token 映射为列表模型", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          {
            created_at: "2026-07-13T10:00:00.000Z",
            invite_id: "invite-0",
            invite_role: "admin",
            invite_token: "admin-token",
          },
          {
            created_at: "2026-07-13T09:00:00.000Z",
            invite_id: "invite-1",
            invite_role: "member",
            invite_token: "member-token",
          },
          {
            created_at: "2026-07-13T08:00:00.000Z",
            invite_id: "invite-2",
            invite_role: "viewer",
            invite_token: null,
          },
        ],
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadPendingLedgerInvitesService("ledger-id")).resolves.toEqual(
      {
        invites: [
          {
            createdAt: "2026-07-13T10:00:00.000Z",
            id: "invite-0",
            role: "admin",
            token: "admin-token",
          },
          {
            createdAt: "2026-07-13T09:00:00.000Z",
            id: "invite-1",
            role: "member",
            token: "member-token",
          },
          {
            createdAt: "2026-07-13T08:00:00.000Z",
            id: "invite-2",
            role: "viewer",
            token: null,
          },
        ],
        ok: true,
      },
    );
    expect(supabase.rpc).toHaveBeenCalledWith("list_pending_ledger_invites", {
      p_ledger_id: "ledger-id",
    });
  });

  it("忽略结构无效的邀请记录", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        data: [
          { created_at: null, invite_id: "invite-1", invite_role: "member" },
          {
            created_at: "2026-07-13T09:00:00.000Z",
            invite_id: "invite-2",
            invite_role: "owner",
          },
        ],
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(loadPendingLedgerInvitesService("ledger-id")).resolves.toEqual(
      { invites: [], ok: true },
    );
  });

  it("查询失败时映射稳定错误码", async () => {
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

    await expect(loadPendingLedgerInvitesService("ledger-id")).resolves.toEqual(
      {
        error: ledgerInviteErrorCodes.permissionDenied,
        ok: false,
      },
    );
  });
});

describe("revokeLedgerInviteService", () => {
  it("使用 ledger_id 与 invite_id 撤销邀请", async () => {
    const supabase = createSupabaseMock({ rpcResponse: {} });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      revokeLedgerInviteService("ledger-id", "invite-1"),
    ).resolves.toEqual({
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("revoke_ledger_invite", {
      p_invite_id: "invite-1",
      p_ledger_id: "ledger-id",
    });
  });

  it.each([
    ["permission_denied", ledgerInviteErrorCodes.permissionDenied],
    ["invite_already_used", ledgerInviteErrorCodes.inviteUsed],
    ["invite_already_revoked", ledgerInviteErrorCodes.inviteAlreadyRevoked],
  ])("根据 PostgreSQL DETAIL %s 映射撤销错误", async (details, expected) => {
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

    await expect(
      revokeLedgerInviteService("ledger-id", "invite-1"),
    ).resolves.toEqual({
      error: expected,
      ok: false,
    });
  });
});
