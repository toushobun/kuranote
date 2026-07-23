// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createLedgerInviteService } from "internal/ledger/service/ledgerInviteService";
import {
  AuthorizationError,
  ConflictError,
  RepositoryError,
} from "internal/shared/errors/appError";
import type { CurrentLedgerRole } from "lib/ledger/current-ledger";

function createRepository(role: CurrentLedgerRole | null = "owner") {
  return {
    accept: vi.fn().mockResolvedValue({ ok: true }),
    create: vi.fn().mockResolvedValue({
      inviteId: "00000000-0000-4000-8000-000000000041",
      ok: true,
      role: "member" as const,
      token: "a".repeat(64),
    }),
    getMemberRole: vi.fn().mockResolvedValue(role),
    listPending: vi.fn().mockResolvedValue({ invites: [], ok: true }),
    revoke: vi.fn().mockResolvedValue({ ok: true }),
  };
}

const actor = {
  ledgerId: "00000000-0000-4000-8000-000000000032",
  userId: "00000000-0000-4000-8000-000000000031",
};

describe("createLedgerInviteService.accept", () => {
  it("Repository 成功时正常完成", async () => {
    const repository = createRepository();
    const service = createLedgerInviteService({
      ledgerInviteRepository: repository,
    });

    await expect(service.accept("token")).resolves.toBeUndefined();
    expect(repository.accept).toHaveBeenCalledWith("token");
  });
});

describe.each(["create", "revoke", "listPending"] as const)(
  "createLedgerInviteService.%s 权限",
  (operation) => {
    it.each(["owner", "admin"] as const)("%s 可以执行", async (role) => {
      const repository = createRepository(role);
      const service = createLedgerInviteService({
        ledgerInviteRepository: repository,
      });

      if (operation === "create") {
        await expect(
          service.create({ ...actor, role: "member" }),
        ).resolves.toMatchObject({ role: "member" });
      } else if (operation === "revoke") {
        await expect(
          service.revoke({ ...actor, inviteId: "invite-1" }),
        ).resolves.toBeUndefined();
      } else {
        await expect(service.listPending(actor)).resolves.toEqual([]);
      }
    });

    it.each(["member", "viewer"] as const)("%s 无权执行", async (role) => {
      const repository = createRepository(role);
      const service = createLedgerInviteService({
        ledgerInviteRepository: repository,
      });

      const action =
        operation === "create"
          ? service.create({ ...actor, role: "member" })
          : operation === "revoke"
            ? service.revoke({ ...actor, inviteId: "invite-1" })
            : service.listPending(actor);

      await expect(action).rejects.toBeInstanceOf(AuthorizationError);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.revoke).not.toHaveBeenCalled();
      expect(repository.listPending).not.toHaveBeenCalled();
    });
  },
);

describe("createLedgerInviteService 错误映射", () => {
  it("撤销已使用邀请时抛出 ConflictError", async () => {
    const repository = createRepository();
    repository.revoke.mockResolvedValue({
      code: "invite_already_used",
      ok: false,
    });
    const service = createLedgerInviteService({
      ledgerInviteRepository: repository,
    });

    await expect(
      service.revoke({ ...actor, inviteId: "invite-1" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("列表读取失败时抛出 RepositoryError", async () => {
    const repository = createRepository();
    repository.listPending.mockResolvedValue({
      code: "load_failed",
      ok: false,
    });
    const service = createLedgerInviteService({
      ledgerInviteRepository: repository,
    });

    await expect(service.listPending(actor)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});
