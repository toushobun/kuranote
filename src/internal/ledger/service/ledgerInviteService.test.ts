// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseLedgerInviteRepository } from "internal/ledger/repository/ledgerInviteRepository";
import { createLedgerInviteService } from "internal/ledger/service/ledgerInviteService";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { getLedgerInviteErrorMessage } from "internal/ledger/errors/ledgerInvite";
import { appErrorToResponseBody } from "internal/shared/http/errorResponse";
import {
  type AppError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";

function createRepository() {
  return {
    accept: vi.fn().mockResolvedValue({
      invite: {
        ledgerId: "00000000-0000-4000-8000-000000000032",
        placeholderId: null,
        result: "joined",
      },
      ok: true,
    }),
    create: vi.fn().mockResolvedValue({
      inviteId: "00000000-0000-4000-8000-000000000041",
      ok: true,
      placeholderId: "00000000-0000-4000-8000-000000000051",
      role: "member" as const,
      token: "a".repeat(64),
    }),
    listPending: vi.fn().mockResolvedValue({ invites: [], ok: true }),
    revoke: vi.fn().mockResolvedValue({ ok: true }),
  };
}

function createPlaceholderMemberService() {
  return {
    create: vi.fn().mockResolvedValue({
      placeholderId: "00000000-0000-4000-8000-000000000051",
    }),
  };
}

function createService(
  repository = createRepository(),
  role: CurrentLedgerRole | null = "owner",
  placeholderMemberService = createPlaceholderMemberService(),
  logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
) {
  return createLedgerInviteService({
    ledgerAccessService: {
      getActiveMemberRole: vi.fn().mockResolvedValue(role),
    },
    ledgerInviteRepository: repository,
    ledgerPlaceholderMemberService: placeholderMemberService,
    logger,
  });
}

const actor = {
  ledgerId: "00000000-0000-4000-8000-000000000032",
  userId: "00000000-0000-4000-8000-000000000031",
};
const placeholderId = "00000000-0000-4000-8000-000000000051";

describe("createLedgerInviteService.accept", () => {
  it("Repository 成功时返回结构化结果", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(service.accept("token")).resolves.toEqual({
      ledgerId: actor.ledgerId,
      placeholderId: null,
      result: "joined",
    });
    expect(repository.accept).toHaveBeenCalledWith("token");
  });

  it("认领结果透传占位 ID", async () => {
    const repository = createRepository();
    repository.accept.mockResolvedValue({
      invite: { ledgerId: actor.ledgerId, placeholderId, result: "claimed" },
      ok: true,
    });
    const service = createService(repository);

    await expect(service.accept("token")).resolves.toEqual({
      ledgerId: actor.ledgerId,
      placeholderId,
      result: "claimed",
    });
  });
});

describe("createLedgerInviteService.create 占位绑定", () => {
  it("placeholderId 必填，原样传给 Repository", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(
      service.create({ ...actor, placeholderId, role: "member" }),
    ).resolves.toMatchObject({ placeholderId });
    expect(repository.create).toHaveBeenCalledWith(
      actor.ledgerId,
      "member",
      placeholderId,
    );
  });

  it("RPC 返回 placeholder_required 时映射为 ValidationError(400)", async () => {
    const repository = createRepository();
    repository.create.mockResolvedValue({
      code: "placeholder_required",
      ok: false,
    });
    const service = createService(repository);

    const failure = await service
      .create({ ...actor, placeholderId, role: "member" })
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ValidationError);
    expect(failure).toMatchObject({
      code: "placeholder_required",
      message: getLedgerInviteErrorMessage("placeholder_required"),
    });
    expect(appErrorToResponseBody(failure as AppError).status).toBe(400);
  });
});

describe("createLedgerInviteService.inviteMember", () => {
  const input = { ...actor, displayName: "  小明 ", role: "viewer" as const };

  it("先创建待邀请成员，再用新占位 ID 生成绑定邀请", async () => {
    const repository = createRepository();
    repository.create.mockResolvedValue({
      inviteId: "00000000-0000-4000-8000-000000000041",
      ok: true,
      placeholderId,
      role: "viewer",
      token: "a".repeat(64),
    });
    const placeholderMemberService = createPlaceholderMemberService();
    const service = createService(
      repository,
      "admin",
      placeholderMemberService,
    );

    await expect(service.inviteMember(input)).resolves.toEqual({
      inviteId: "00000000-0000-4000-8000-000000000041",
      placeholderId,
      role: "viewer",
      token: "a".repeat(64),
    });
    expect(placeholderMemberService.create).toHaveBeenCalledWith({
      displayName: "  小明 ",
      ledgerId: actor.ledgerId,
      userId: actor.userId,
    });
    expect(repository.create).toHaveBeenCalledWith(
      actor.ledgerId,
      "viewer",
      placeholderId,
    );
  });

  it("第 1 步重名时返回引导文案，不复用同名占位也不生成邀请", async () => {
    const repository = createRepository();
    const placeholderMemberService = createPlaceholderMemberService();
    placeholderMemberService.create.mockRejectedValue(
      new ConflictError(
        "placeholder_name_conflict",
        "当前账本已有同名的待邀请成员，请换一个名字。",
      ),
    );
    const service = createService(
      repository,
      "owner",
      placeholderMemberService,
    );

    const failure = await service
      .inviteMember(input)
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ConflictError);
    expect(failure).toMatchObject({
      code: "invite_member_name_conflict",
      message: "已有同名待邀请成员，请在列表中为 TA 生成邀请链接。",
    });
    expect(appErrorToResponseBody(failure as AppError).status).toBe(409);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("第 1 步与现有成员重名时提示换一个名字，不引导生成邀请链接", async () => {
    const repository = createRepository();
    const placeholderMemberService = createPlaceholderMemberService();
    placeholderMemberService.create.mockRejectedValue(
      new ConflictError(
        "placeholder_name_member_conflict",
        "当前账本已有同名成员，请换一个名字。",
      ),
    );
    const service = createService(
      repository,
      "owner",
      placeholderMemberService,
    );

    const failure = await service
      .inviteMember(input)
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ConflictError);
    expect(failure).toMatchObject({
      code: "placeholder_name_member_conflict",
      message: "当前账本已有同名成员，请换一个名字。",
    });
    expect(appErrorToResponseBody(failure as AppError).status).toBe(409);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("第 1 步的其他错误原样抛出", async () => {
    const placeholderMemberService = createPlaceholderMemberService();
    const nameError = new ValidationError(
      "placeholder_name_invalid",
      "请输入待邀请成员的名字。",
    );
    placeholderMemberService.create.mockRejectedValue(nameError);
    const repository = createRepository();
    const service = createService(
      repository,
      "owner",
      placeholderMemberService,
    );

    await expect(service.inviteMember(input)).rejects.toBe(nameError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each([
    ["业务错误", () => ({ code: "ledger_not_found", ok: false }) as const],
    [
      "数据库异常",
      () => {
        throw new RepositoryError(
          "ledger_invite_create_failed",
          "邀请链接生成失败，请稍后重试。",
        );
      },
    ],
  ])(
    "第 2 步%s时返回部分成功文案，且只创建一次待邀请成员",
    async (_label, createImpl) => {
      const repository = createRepository();
      repository.create.mockImplementation(async () => createImpl());
      const placeholderMemberService = createPlaceholderMemberService();
      const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
      const service = createService(
        repository,
        "owner",
        placeholderMemberService,
        logger,
      );

      const failure = await service
        .inviteMember(input)
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(ConflictError);
      expect(failure).toMatchObject({
        code: "invite_member_link_failed",
        message: "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。",
      });
      expect(appErrorToResponseBody(failure as AppError).status).toBe(409);
      expect(placeholderMemberService.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        "[ledger] invite member link creation failed",
        expect.objectContaining({ errorName: expect.any(String) }),
      );
    },
  );

  it.each(["member", "viewer"] as const)(
    "%s 无权邀请成员，不创建待邀请成员",
    async (role) => {
      const repository = createRepository();
      const placeholderMemberService = createPlaceholderMemberService();
      const service = createService(repository, role, placeholderMemberService);

      await expect(service.inviteMember(input)).rejects.toBeInstanceOf(
        AuthorizationError,
      );
      expect(placeholderMemberService.create).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    },
  );
});

describe.each(["create", "revoke", "listPending"] as const)(
  "createLedgerInviteService.%s 权限",
  (operation) => {
    it.each(["owner", "admin"] as const)("%s 可以执行", async (role) => {
      const repository = createRepository();
      const service = createService(repository, role);

      if (operation === "create") {
        await expect(
          service.create({ ...actor, placeholderId, role: "member" }),
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
      const repository = createRepository();
      const service = createService(repository, role);

      const action =
        operation === "create"
          ? service.create({ ...actor, placeholderId, role: "member" })
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

it("已归档账本不能管理邀请", async () => {
  const repository = createRepository();
  const service = createService(repository, null);

  await expect(service.listPending(actor)).rejects.toBeInstanceOf(
    NotFoundError,
  );
  expect(repository.listPending).not.toHaveBeenCalled();
});

describe("createLedgerInviteService 错误映射", () => {
  it("撤销已使用邀请时抛出 ConflictError", async () => {
    const repository = createRepository();
    repository.revoke.mockResolvedValue({
      code: "invite_already_used",
      ok: false,
    });
    const service = createService(repository);

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
    const service = createService(repository);

    await expect(service.listPending(actor)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});

describe("createLedgerInviteService 占位错误映射", () => {
  it.each([
    ["placeholder_invite_pending", "create", ConflictError, 409],
    ["placeholder_already_claimed", "create", ConflictError, 409],
    ["placeholder_not_found", "create", NotFoundError, 404],
    ["placeholder_claim_existing_member", "accept", ConflictError, 409],
    ["placeholder_claim_account_name_conflict", "accept", ConflictError, 409],
    ["placeholder_already_claimed", "accept", ConflictError, 409],
    ["ledger_not_found", "create", NotFoundError, 404],
    ["user_inactive", "accept", AuthorizationError, 403],
  ] as const)(
    "%s（%s）映射为对应子类及 HTTP status",
    async (code, operation, ErrorClass, status) => {
      const repository = createRepository();
      repository.create.mockResolvedValue({ code, ok: false });
      repository.accept.mockResolvedValue({ code, ok: false });
      const service = createService(repository);

      const failure = await (
        operation === "create"
          ? service.create({ ...actor, placeholderId, role: "member" })
          : service.accept("token")
      ).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(ErrorClass);
      expect(failure).toMatchObject({
        code,
        message: getLedgerInviteErrorMessage(code),
      });
      expect(appErrorToResponseBody(failure as AppError).status).toBe(status);
    },
  );
});

describe("createLedgerInviteService.create 大写占位 ID", () => {
  it("大写 placeholderId 归一化为小写后生成成功，不抛 RepositoryError", async () => {
    // 使用真实 Repository，数据库按 PostgreSQL 惯例返回小写 UUID。
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          invite_id: "00000000-0000-4000-8000-000000000041",
          invite_role: "member",
          placeholder_id: "0000000a-0000-4000-8000-00000000005b",
          token: "a".repeat(64),
        },
      ],
      error: null,
    });
    const service = createLedgerInviteService({
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("owner"),
      },
      ledgerInviteRepository: createSupabaseLedgerInviteRepository({
        rpc,
      } as unknown as AuthenticatedSupabaseClient),
      ledgerPlaceholderMemberService: createPlaceholderMemberService(),
    });

    const created = await service.create({
      ...actor,
      placeholderId: "0000000A-0000-4000-8000-00000000005B",
      role: "member",
    });

    expect(created.placeholderId).toBe("0000000a-0000-4000-8000-00000000005b");
    expect(rpc).toHaveBeenCalledWith("create_ledger_invite_v2", {
      p_ledger_id: actor.ledgerId,
      p_placeholder_id: "0000000a-0000-4000-8000-00000000005b",
      p_role: "member",
    });
  });
});
