// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createLedgerInviteService } from "server/ledger/service/ledgerInviteService";
import type { LedgerInviteRepository } from "server/ledger/repository/ledgerInviteRepository";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "server/shared/errors/appError";

function createService(
  accept: LedgerInviteRepository["accept"],
): ReturnType<typeof createLedgerInviteService> {
  return createLedgerInviteService({
    ledgerInviteRepository: {
      accept,
      create: vi.fn(),
      listPending: vi.fn(),
      revoke: vi.fn(),
    },
  });
}

describe("createLedgerInviteService", () => {
  it("Repository 返回成功时正常 resolve", async () => {
    const service = createService(vi.fn().mockResolvedValue({ ok: true }));

    await expect(service.accept("token")).resolves.toBeUndefined();
  });

  it.each([
    ["auth_required", AuthenticationError],
    ["permission_denied", AuthorizationError],
    ["invite_invalid", NotFoundError],
    ["invite_already_revoked", ConflictError],
    ["invite_already_used", ConflictError],
    ["invite_role_invalid", ValidationError],
    ["accept_failed", RepositoryError],
  ] as const)("Repository 返回 %s 时抛出 %s", async (code, ErrorClass) => {
    const service = createService(
      vi.fn().mockResolvedValue({ code, ok: false }),
    );

    await expect(service.accept("token")).rejects.toBeInstanceOf(ErrorClass);
  });

  it("权限判断独立成立，不依赖任何 Hono / Router 上下文", async () => {
    const accept = vi.fn().mockResolvedValue({
      code: "permission_denied",
      ok: false,
    });
    const service = createService(accept);

    await expect(service.accept("token")).rejects.toThrow(AuthorizationError);
    expect(accept).toHaveBeenCalledWith("token");
  });
});

describe("createLedgerInviteService.create", () => {
  it("Repository 返回成功时返回邀请信息", async () => {
    const create = vi.fn().mockResolvedValue({
      inviteId: "invite-1",
      ok: true,
      role: "member",
      token: "token-abc",
    });
    const service = createLedgerInviteService({
      ledgerInviteRepository: {
        accept: vi.fn(),
        create,
        listPending: vi.fn(),
        revoke: vi.fn(),
      },
    });

    await expect(service.create("ledger-1", "member")).resolves.toEqual({
      inviteId: "invite-1",
      role: "member",
      token: "token-abc",
    });
    expect(create).toHaveBeenCalledWith("ledger-1", "member");
  });

  it("Repository 返回失败时抛出对应错误", async () => {
    const service = createLedgerInviteService({
      ledgerInviteRepository: {
        accept: vi.fn(),
        create: vi.fn().mockResolvedValue({
          code: "permission_denied",
          ok: false,
        }),
        listPending: vi.fn(),
        revoke: vi.fn(),
      },
    });

    await expect(service.create("ledger-1", "member")).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
});

describe("createLedgerInviteService.revoke", () => {
  it("Repository 返回成功时正常 resolve", async () => {
    const revoke = vi.fn().mockResolvedValue({ ok: true });
    const service = createLedgerInviteService({
      ledgerInviteRepository: {
        accept: vi.fn(),
        create: vi.fn(),
        listPending: vi.fn(),
        revoke,
      },
    });

    await expect(service.revoke("ledger-1", "invite-1")).resolves.toBeUndefined();
    expect(revoke).toHaveBeenCalledWith("ledger-1", "invite-1");
  });

  it("Repository 返回已使用错误时抛出 ConflictError", async () => {
    const service = createLedgerInviteService({
      ledgerInviteRepository: {
        accept: vi.fn(),
        create: vi.fn(),
        listPending: vi.fn(),
        revoke: vi.fn().mockResolvedValue({
          code: "invite_already_used",
          ok: false,
        }),
      },
    });

    await expect(
      service.revoke("ledger-1", "invite-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("createLedgerInviteService.listPending", () => {
  it("Repository 返回成功时返回邀请列表", async () => {
    const invites = [
      { createdAt: "2026-07-13T10:00:00.000Z", id: "invite-1", role: "member" as const, token: "token" },
    ];
    const listPending = vi.fn().mockResolvedValue({ invites, ok: true });
    const service = createLedgerInviteService({
      ledgerInviteRepository: {
        accept: vi.fn(),
        create: vi.fn(),
        listPending,
        revoke: vi.fn(),
      },
    });

    await expect(service.listPending("ledger-1")).resolves.toEqual(invites);
    expect(listPending).toHaveBeenCalledWith("ledger-1");
  });

  it("Repository 返回失败时抛出对应错误", async () => {
    const service = createLedgerInviteService({
      ledgerInviteRepository: {
        accept: vi.fn(),
        create: vi.fn(),
        listPending: vi.fn().mockResolvedValue({
          code: "load_failed",
          ok: false,
        }),
        revoke: vi.fn(),
      },
    });

    await expect(service.listPending("ledger-1")).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});
