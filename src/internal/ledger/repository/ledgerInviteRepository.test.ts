// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseLedgerInviteRepository } from "internal/ledger/repository/ledgerInviteRepository";
import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

const ledgerId = "00000000-0000-4000-8000-000000000032";

function createSupabaseStub(
  rpcResult:
    | { data: null; error: null }
    | { data: null; error: unknown }
    | { data: unknown; error: null },
) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as AuthenticatedSupabaseClient;
}

describe("createSupabaseLedgerInviteRepository", () => {
  it("RPC 成功时返回 ok: true", async () => {
    const supabase = createSupabaseStub({ data: null, error: null });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith("accept_ledger_invite", {
      p_token: "token-1",
    });
  });

  it("RPC 返回业务错误时映射为对应的错误码", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { details: "invite_invalid", message: "invalid" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({ code: "invite_invalid", ok: false });
  });

  it("RPC 返回未知错误时回退为 accept_failed", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { message: "unexpected" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({ code: "accept_failed", ok: false });
  });
});

describe("createSupabaseLedgerInviteRepository.create", () => {
  it("RPC 成功时返回邀请信息", async () => {
    const supabase = createSupabaseStub({
      data: [
        { invite_id: "invite-1", invite_role: "member", token: "token-abc" },
      ],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.create(ledgerId, "member");

    expect(result).toEqual({
      inviteId: "invite-1",
      ok: true,
      role: "member",
      token: "token-abc",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("create_ledger_invite_v2", {
      p_ledger_id: ledgerId,
      p_role: "member",
    });
  });

  it("RPC 返回畸形数据时返回 create_failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = createSupabaseStub({
      data: [{ invite_id: "invite-1", invite_role: "member" }],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.create(ledgerId, "member")).resolves.toEqual({
      code: ledgerInviteErrorCodes.createFailed,
      ok: false,
    });
    vi.restoreAllMocks();
  });

  it("RPC 返回业务错误时映射为对应错误码", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { details: "permission_denied", message: "denied" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.create(ledgerId, "member")).resolves.toEqual({
      code: ledgerInviteErrorCodes.permissionDenied,
      ok: false,
    });
  });
});

describe("createSupabaseLedgerInviteRepository.revoke", () => {
  it("RPC 成功时返回 ok: true", async () => {
    const supabase = createSupabaseStub({ data: null, error: null });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.revoke(ledgerId, "invite-1")).resolves.toEqual({
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("revoke_ledger_invite", {
      p_invite_id: "invite-1",
      p_ledger_id: ledgerId,
    });
  });

  it.each([
    ["permission_denied", ledgerInviteErrorCodes.permissionDenied],
    ["invite_already_used", ledgerInviteErrorCodes.inviteUsed],
    ["invite_already_revoked", ledgerInviteErrorCodes.inviteAlreadyRevoked],
  ] as const)(
    "RPC details 返回 %s 时映射撤销错误",
    async (details, expected) => {
      const supabase = createSupabaseStub({
        data: null,
        error: { details, message: "业务错误" },
      });
      const repository = createSupabaseLedgerInviteRepository(supabase);

      await expect(repository.revoke(ledgerId, "invite-1")).resolves.toEqual({
        code: expected,
        ok: false,
      });
    },
  );
});

describe("createSupabaseLedgerInviteRepository.listPending", () => {
  it("返回待接受邀请列表", async () => {
    const supabase = createSupabaseStub({
      data: [
        {
          created_at: "2026-07-13T10:00:00.000Z",
          invite_id: "invite-0",
          invite_role: "admin",
          invite_token: "admin-token",
        },
        {
          created_at: "2026-07-13T08:00:00.000Z",
          invite_id: "invite-2",
          invite_role: "viewer",
          invite_token: null,
        },
      ],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.listPending(ledgerId)).resolves.toEqual({
      invites: [
        {
          createdAt: "2026-07-13T10:00:00.000Z",
          id: "invite-0",
          role: "admin",
          token: "admin-token",
        },
        {
          createdAt: "2026-07-13T08:00:00.000Z",
          id: "invite-2",
          role: "viewer",
          token: null,
        },
      ],
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("list_pending_ledger_invites", {
      p_ledger_id: ledgerId,
    });
  });

  it("忽略结构无效的邀请记录", async () => {
    const supabase = createSupabaseStub({
      data: [
        { created_at: null, invite_id: "invite-1", invite_role: "member" },
        {
          created_at: "2026-07-13T09:00:00.000Z",
          invite_id: "invite-2",
          invite_role: "owner",
        },
      ],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.listPending(ledgerId)).resolves.toEqual({
      invites: [],
      ok: true,
    });
  });

  it("查询失败时映射稳定错误码", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { details: "permission_denied", message: "权限不足" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.listPending(ledgerId)).resolves.toEqual({
      code: ledgerInviteErrorCodes.permissionDenied,
      ok: false,
    });
  });
});
