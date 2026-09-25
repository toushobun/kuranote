// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseLedgerInviteRepository } from "internal/ledger/repository/ledgerInviteRepository";
import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import {
  expectConcurrentModificationConflict,
  retryableConcurrencyRpcErrors,
} from "test/concurrencyConflict";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const placeholderId = "00000000-0000-4000-8000-000000000051";
const acceptedRow = {
  ledger_id: ledgerId,
  ledger_name: "家庭账本",
  placeholder_id: null,
  result: "joined",
};

function createLoggerStub() {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() } satisfies Logger;
}

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
  it("匿名邀请接受成功时返回 joined 且占位为 null", async () => {
    const supabase = createSupabaseStub({
      data: [
        {
          ledger_id: ledgerId,
          ledger_name: "家庭账本",
          placeholder_id: null,
          result: "joined",
        },
      ],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({
      invite: { ledgerId, placeholderId: null, result: "joined" },
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("accept_ledger_invite", {
      p_token: "token-1",
    });
  });

  it.each([
    ["already_member", null],
    ["claimed", placeholderId],
  ] as const)(
    "接受结果 %s 读取占位绑定标识",
    async (resultValue, rowPlaceholderId) => {
      const supabase = createSupabaseStub({
        data: [
          {
            ledger_id: ledgerId,
            ledger_name: "家庭账本",
            placeholder_id: rowPlaceholderId,
            result: resultValue,
          },
        ],
        error: null,
      });
      const repository = createSupabaseLedgerInviteRepository(supabase);

      await expect(repository.accept("token-1")).resolves.toEqual({
        invite: {
          ledgerId,
          placeholderId: rowPlaceholderId,
          result: resultValue,
        },
        ok: true,
      });
    },
  );

  it.each([
    ["空结果", null],
    ["空数组", []],
    ["多行结果", [acceptedRow, acceptedRow]],
    ["缺少 ledger_id", [{ ...acceptedRow, ledger_id: undefined }]],
    ["未知 result", [{ ...acceptedRow, result: "merged" }]],
    ["claimed 缺少占位", [{ ...acceptedRow, result: "claimed" }]],
    ["匿名结果带有占位", [{ ...acceptedRow, placeholder_id: placeholderId }]],
    ["占位类型错误", [{ ...acceptedRow, placeholder_id: 1 }]],
  ])("返回行%s时抛出安全 RepositoryError", async (_label, data) => {
    const logger = createLoggerStub();
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({ data, error: null }),
      logger,
    );

    await expect(repository.accept("token-1")).rejects.toMatchObject({
      code: "ledger_invite_accept_result_invalid",
      message: "加入账本失败，请稍后重试。",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[ledger] accept_ledger_invite returned invalid data",
      expect.not.objectContaining({ data: expect.anything() }),
    );
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

  it.each([
    [
      "placeholder_claim_existing_member",
      ledgerInviteErrorCodes.placeholderClaimExistingMember,
    ],
    [
      "placeholder_claim_account_name_conflict",
      ledgerInviteErrorCodes.placeholderClaimAccountNameConflict,
    ],
    [
      "placeholder_already_claimed",
      ledgerInviteErrorCodes.placeholderAlreadyClaimed,
    ],
    ["invite_already_used", ledgerInviteErrorCodes.inviteUsed],
    ["user_inactive", ledgerInviteErrorCodes.userInactive],
  ] as const)("接受时 details 为 %s 精确映射", async (details, expected) => {
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({
        data: null,
        error: { code: "23505", details, message: "duplicate key" },
      }),
    );

    await expect(repository.accept("token-1")).resolves.toEqual({
      code: expected,
      ok: false,
    });
  });

  it.each([
    [
      "message 含业务码但 details 为空",
      { message: "placeholder_claim_existing_member" },
    ],
    [
      "details 仅部分匹配",
      { details: "placeholder_claim_existing_member_x", message: "x" },
    ],
    [
      "约束名出现在 details",
      {
        code: "23505",
        details: "account_active_name_unique",
        message: "duplicate key value violates unique constraint",
      },
    ],
  ])("%s时不映射业务码且不泄露原始信息", async (_label, error) => {
    const logger = createLoggerStub();
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({ data: null, error }),
      logger,
    );

    const failure = await repository.accept("token-1").catch((e) => e);

    expect(failure).toMatchObject({
      code: "ledger_invite_accept_failed",
      message: "加入账本失败，请稍后重试。",
    });
    expect(JSON.stringify(failure)).not.toContain("account_active_name_unique");
    expect(failure.message).not.toContain("placeholder_claim");
  });

  it("RPC 返回未知错误时转换为安全 RepositoryError", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { message: "unexpected" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(repository.accept("token-1")).rejects.toMatchObject({
      code: "ledger_invite_accept_failed",
      message: "加入账本失败，请稍后重试。",
    });
  });
});

describe("createSupabaseLedgerInviteRepository.create", () => {
  it("placeholderId 必填：透传 p_placeholder_id 并返回完整邀请信息", async () => {
    const supabase = createSupabaseStub({
      data: [
        {
          invite_id: "invite-1",
          invite_role: "viewer",
          placeholder_id: placeholderId,
          token: "token-abc",
        },
      ],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(
      repository.create(ledgerId, "viewer", placeholderId),
    ).resolves.toEqual({
      inviteId: "invite-1",
      ok: true,
      placeholderId,
      role: "viewer",
      token: "token-abc",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("create_ledger_invite_v2", {
      p_ledger_id: ledgerId,
      p_placeholder_id: placeholderId,
      p_role: "viewer",
    });
  });

  it.each([
    ["缺少 placeholder_id", undefined],
    ["placeholder_id 类型错误", 1],
    ["返回的占位与请求不一致", "00000000-0000-4000-8000-000000000099"],
    ["返回 null 占位", null],
  ])("返回行%s时抛出安全 RepositoryError", async (_label, rowPlaceholderId) => {
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({
        data: [
          {
            invite_id: "invite-1",
            invite_role: "member",
            placeholder_id: rowPlaceholderId,
            token: "token-abc",
          },
        ],
        error: null,
      }),
    );

    await expect(
      repository.create(ledgerId, "member", placeholderId),
    ).rejects.toMatchObject({
      code: "ledger_invite_create_result_invalid",
      message: "邀请链接生成失败，请稍后重试。",
    });
  });

  it.each([
    [
      "placeholder_invite_pending",
      ledgerInviteErrorCodes.placeholderInvitePending,
    ],
    ["placeholder_not_found", ledgerInviteErrorCodes.placeholderNotFound],
    [
      "placeholder_already_claimed",
      ledgerInviteErrorCodes.placeholderAlreadyClaimed,
    ],
    ["ledger_not_found", ledgerInviteErrorCodes.ledgerNotFound],
    ["placeholder_required", ledgerInviteErrorCodes.placeholderRequired],
  ] as const)("生成时 details 为 %s 精确映射", async (details, expected) => {
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({
        data: null,
        error: { code: "23505", details, message: "业务错误" },
      }),
    );

    await expect(
      repository.create(ledgerId, "member", placeholderId),
    ).resolves.toEqual({ code: expected, ok: false });
  });

  it("生成时未知数据库错误记录安全日志并抛出 RepositoryError", async () => {
    const logger = createLoggerStub();
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({
        data: null,
        error: {
          code: "23505",
          details: "Key (placeholder_id)=(x) already exists.",
          message: "ledger_invite_one_pending_placeholder",
        },
      }),
      logger,
    );

    const failure = await repository
      .create(ledgerId, "member", placeholderId)
      .catch((e) => e);

    expect(failure).toMatchObject({
      code: "ledger_invite_create_failed",
      message: "邀请链接生成失败，请稍后重试。",
    });
    expect(JSON.stringify(failure)).not.toContain(
      "ledger_invite_one_pending_placeholder",
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[ledger] create_ledger_invite_v2 failed",
      expect.objectContaining({ code: "23505" }),
    );
  });

  it("RPC 返回畸形数据时转换为安全 RepositoryError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = createSupabaseStub({
      data: [{ invite_id: "invite-1", invite_role: "member" }],
      error: null,
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(
      repository.create(ledgerId, "member", placeholderId),
    ).rejects.toMatchObject({
      code: "ledger_invite_create_result_invalid",
      message: "邀请链接生成失败，请稍后重试。",
    });
    vi.restoreAllMocks();
  });

  it("RPC 返回业务错误时映射为对应错误码", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { details: "permission_denied", message: "denied" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    await expect(
      repository.create(ledgerId, "member", placeholderId),
    ).resolves.toEqual({
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
          placeholder_id: null,
        },
        {
          created_at: "2026-07-13T08:00:00.000Z",
          invite_id: "invite-2",
          invite_role: "viewer",
          invite_token: null,
          placeholder_id: placeholderId,
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
          placeholderId: null,
          role: "admin",
          token: "admin-token",
        },
        {
          createdAt: "2026-07-13T08:00:00.000Z",
          id: "invite-2",
          placeholderId,
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
          placeholder_id: null,
        },
        {
          created_at: "2026-07-13T09:00:00.000Z",
          invite_id: "invite-3",
          invite_role: "member",
          placeholder_id: 1,
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

describe("createSupabaseLedgerInviteRepository 错误码补全（#816）", () => {
  it.each(["create", "listPending"] as const)(
    "%s 时 details 为 ledger_required 精确映射",
    async (method) => {
      const repository = createSupabaseLedgerInviteRepository(
        createSupabaseStub({
          data: null,
          error: { code: "22023", details: "ledger_required", message: "x" },
        }),
      );

      const result =
        method === "create"
          ? await repository.create(ledgerId, "member", placeholderId)
          : await repository.listPending(ledgerId);

      expect(result).toEqual({
        code: ledgerInviteErrorCodes.ledgerRequired,
        ok: false,
      });
    },
  );
});

describe("createSupabaseLedgerInviteRepository 并发冲突（#816）", () => {
  const operations = [
    [
      "accept_ledger_invite",
      (repository: ReturnType<typeof createSupabaseLedgerInviteRepository>) =>
        repository.accept("token-1"),
    ],
    [
      "create_ledger_invite_v2",
      (repository: ReturnType<typeof createSupabaseLedgerInviteRepository>) =>
        repository.create(ledgerId, "member", placeholderId),
    ],
    [
      "revoke_ledger_invite",
      (repository: ReturnType<typeof createSupabaseLedgerInviteRepository>) =>
        repository.revoke(ledgerId, "invite-1"),
    ],
  ] as const;

  describe.each(operations)("%s", (operation, run) => {
    it.each(retryableConcurrencyRpcErrors)(
      "%s 转换为可重试的 ConflictError",
      async (_label, error) => {
        const logger = createLoggerStub();
        const repository = createSupabaseLedgerInviteRepository(
          createSupabaseStub({ data: null, error }),
          logger,
        );

        const failure = await run(repository).catch((e: unknown) => e);

        expectConcurrentModificationConflict(failure, logger.warn, operation);
        expect(logger.error).not.toHaveBeenCalled();
      },
    );
  });

  it("接受时的 account_holder_changed（40001）按可重试冲突处理", async () => {
    const logger = createLoggerStub();
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({
        data: null,
        error: {
          code: "40001",
          details: "account_holder_changed",
          message: "account_holder_changed",
        },
      }),
      logger,
    );

    const failure = await repository.accept("token-1").catch((e) => e);

    expectConcurrentModificationConflict(
      failure,
      logger.warn,
      "accept_ledger_invite",
    );
  });

  it("已有业务 detail 映射优先于 SQLSTATE", async () => {
    const repository = createSupabaseLedgerInviteRepository(
      createSupabaseStub({
        data: null,
        error: { code: "40001", details: "invite_invalid", message: "x" },
      }),
    );

    await expect(repository.accept("token-1")).resolves.toEqual({
      code: ledgerInviteErrorCodes.inviteInvalid,
      ok: false,
    });
  });
});
