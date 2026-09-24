// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";
import { getLedgerPlaceholderMemberErrorMessage } from "internal/ledger/errors/ledgerPlaceholderMember";
import { createLedgerPlaceholderMemberService } from "internal/ledger/service/ledgerPlaceholderMemberService";
import { appErrorToResponseBody } from "internal/shared/http/errorResponse";
import {
  type AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";

const actor = {
  ledgerId: "00000000-0000-4000-8000-000000000032",
  userId: "00000000-0000-4000-8000-000000000031",
};
const placeholderId = "00000000-0000-4000-8000-000000000051";

function createRepository() {
  return {
    create: vi.fn().mockResolvedValue({ ok: true, placeholderId }),
    delete: vi.fn().mockResolvedValue({ ok: true }),
    listUnclaimed: vi
      .fn()
      .mockResolvedValue([{ displayName: "奶奶", id: placeholderId }]),
    rename: vi.fn().mockResolvedValue({ ok: true }),
  };
}

function createService(
  repository = createRepository(),
  role: CurrentLedgerRole | null = "owner",
) {
  return createLedgerPlaceholderMemberService({
    ledgerAccessService: {
      getActiveMemberRole: vi.fn().mockResolvedValue(role),
    },
    ledgerPlaceholderMemberRepository: repository,
  });
}

describe("createLedgerPlaceholderMemberService.listUnclaimed", () => {
  it.each(["owner", "admin", "member", "viewer"] as const)(
    "%s 可以读取占位摘要",
    async (role) => {
      const repository = createRepository();
      await expect(
        createService(repository, role).listUnclaimed(actor),
      ).resolves.toEqual([{ displayName: "奶奶", id: placeholderId }]);
      expect(repository.listUnclaimed).toHaveBeenCalledWith(actor.ledgerId);
    },
  );

  it("非 active 成员被拒绝且不查询", async () => {
    const repository = createRepository();
    await expect(
      createService(repository, null).listUnclaimed(actor),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.listUnclaimed).not.toHaveBeenCalled();
  });
});

describe("createLedgerPlaceholderMemberService 管理权限", () => {
  const operations = {
    create: (service: ReturnType<typeof createService>) =>
      service.create({ ...actor, displayName: "奶奶" }),
    delete: (service: ReturnType<typeof createService>) =>
      service.delete({ ...actor, placeholderId }),
    rename: (service: ReturnType<typeof createService>) =>
      service.rename({ ...actor, displayName: "奶奶", placeholderId }),
  };

  it.each(
    (["create", "rename", "delete"] as const).flatMap((op) =>
      (["member", "viewer"] as const).map((role) => [op, role] as const),
    ),
  )("%s：%s 无权执行且不调用 Repository", async (op, role) => {
    const repository = createRepository();
    const failure = await operations[op](createService(repository, role)).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(AuthorizationError);
    expect(appErrorToResponseBody(failure as AppError).status).toBe(403);
    expect(repository[op]).not.toHaveBeenCalled();
  });

  it.each(["owner", "admin"] as const)("%s 可以创建", async (role) => {
    const repository = createRepository();
    await expect(
      createService(repository, role).create({
        ...actor,
        displayName: "  奶奶 ",
      }),
    ).resolves.toEqual({ placeholderId });
    expect(repository.create).toHaveBeenCalledWith(actor.ledgerId, "奶奶");
  });

  it("改名与删除把占位 ID 转为小写后透传", async () => {
    const repository = createRepository();
    const service = createService(repository);
    const upper = placeholderId.toUpperCase();

    await service.rename({
      ...actor,
      displayName: "外婆",
      placeholderId: upper,
    });
    await service.delete({ ...actor, placeholderId: upper });

    expect(repository.rename).toHaveBeenCalledWith(
      actor.ledgerId,
      placeholderId,
      "外婆",
    );
    expect(repository.delete).toHaveBeenCalledWith(
      actor.ledgerId,
      placeholderId,
    );
  });
});

describe("createLedgerPlaceholderMemberService 名字校验", () => {
  it.each([
    ["   ", "placeholder_name_invalid"],
    ["あ".repeat(101), "placeholder_name_too_long"],
  ])("名字 %j 返回 ValidationError(%s)", async (displayName, code) => {
    const repository = createRepository();
    const failure = await createService(repository)
      .create({ ...actor, displayName })
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ValidationError);
    expect(failure).toMatchObject({
      code,
      message: getLedgerPlaceholderMemberErrorMessage(code),
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("恰好 100 个字符可以提交", async () => {
    const repository = createRepository();
    await createService(repository).create({
      ...actor,
      displayName: "あ".repeat(100),
    });
    expect(repository.create).toHaveBeenCalled();
  });
});

describe("createLedgerPlaceholderMemberService 错误映射", () => {
  it.each([
    ["placeholder_name_conflict", ConflictError, 409],
    ["placeholder_in_use", ConflictError, 409],
    ["placeholder_already_claimed", ConflictError, 409],
    ["placeholder_name_invalid", ValidationError, 400],
    ["placeholder_not_found", NotFoundError, 404],
    ["permission_denied", AuthorizationError, 403],
    ["auth_required", AuthenticationError, 401],
    ["placeholder_delete_failed", RepositoryError, 500],
  ] as const)(
    "%s 映射为对应子类及 HTTP status",
    async (code, ErrorClass, status) => {
      const repository = createRepository();
      repository.delete.mockResolvedValue({ code, ok: false });
      repository.rename.mockResolvedValue({ code, ok: false });
      const service = createService(repository);

      for (const run of [
        () => service.delete({ ...actor, placeholderId }),
        () => service.rename({ ...actor, displayName: "奶奶", placeholderId }),
      ]) {
        const failure = await run().catch((error: unknown) => error);
        expect(failure).toBeInstanceOf(ErrorClass);
        expect(failure).toMatchObject({
          code,
          message: getLedgerPlaceholderMemberErrorMessage(code),
        });
        expect(appErrorToResponseBody(failure as AppError).status).toBe(status);
      }
    },
  );

  it("创建重名返回冲突文案", async () => {
    const repository = createRepository();
    repository.create.mockResolvedValue({
      code: "placeholder_name_conflict",
      ok: false,
    });

    await expect(
      createService(repository).create({ ...actor, displayName: "奶奶" }),
    ).rejects.toMatchObject({
      code: "placeholder_name_conflict",
      message: getLedgerPlaceholderMemberErrorMessage(
        "placeholder_name_conflict",
      ),
    });
  });
});
