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
    ledgerInviteRepository: { accept },
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
