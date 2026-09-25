// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
  expectConcurrentModificationConflict,
  retryableConcurrencyRpcErrors,
} from "test/concurrencyConflict";
import { createSupabaseMock } from "test/supabaseMock";

import { getLedgerPlaceholderMemberErrorMessage } from "internal/ledger/errors/ledgerPlaceholderMember";
import { createSupabaseLedgerPlaceholderMemberRepository } from "internal/ledger/repository/ledgerPlaceholderMemberRepository";
import { RepositoryError } from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const placeholderId = "00000000-0000-4000-8000-000000000051";

function createLogger() {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createRepository(
  options: Parameters<typeof createSupabaseMock>[0] = {},
) {
  const supabase = createSupabaseMock(options);
  const logger = createLogger();
  const repository = createSupabaseLedgerPlaceholderMemberRepository(
    supabase.client as never,
    logger,
  );
  return { logger, repository, supabase };
}

const rawError = {
  code: "XX000",
  details: "secret detail",
  message: 'relation "ledger_placeholder_member" violates constraint',
};

describe("createSupabaseLedgerPlaceholderMemberRepository.listUnclaimed", () => {
  it("只查询该账本未认领的占位并转换为摘要", async () => {
    const { repository, supabase } = createRepository({
      queryResponses: [
        { data: [{ display_name: "奶奶", id: placeholderId }], error: null },
      ],
    });

    await expect(repository.listUnclaimed(ledgerId)).resolves.toEqual([
      { displayName: "奶奶", id: placeholderId },
    ]);
    expect(supabase.queries[0]?.table).toBe("ledger_placeholder_member");
    expect(supabase.queries[0]?.calls).toEqual(
      expect.arrayContaining([
        { args: ["id, display_name"], method: "select" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["claimed_by", null], method: "is" },
      ]),
    );
  });

  it.each([
    [{ display_name: 1, id: placeholderId }],
    [{ display_name: "  ", id: placeholderId }],
    [{ display_name: "奶奶" }],
    [null],
  ])("行格式异常 %j 时抛出安全 RepositoryError", async (row) => {
    const { repository } = createRepository({
      queryResponses: [{ data: [row], error: null }],
    });

    await expect(repository.listUnclaimed(ledgerId)).rejects.toMatchObject({
      code: "ledger_placeholder_list_result_invalid",
      message: getLedgerPlaceholderMemberErrorMessage(
        "placeholder_load_failed",
      ),
    });
  });

  it("查询失败时记录日志并抛出不含原始信息的 RepositoryError", async () => {
    const { logger, repository } = createRepository({
      queryResponses: [{ data: null, error: rawError }],
    });

    const failure = await repository
      .listUnclaimed(ledgerId)
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RepositoryError);
    expect((failure as RepositoryError).message).not.toContain("relation");
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("createSupabaseLedgerPlaceholderMemberRepository 写操作", () => {
  it("create 透传参数并返回新 ID", async () => {
    const { repository, supabase } = createRepository({
      rpcResponse: { data: placeholderId, error: null },
    });

    await expect(repository.create(ledgerId, "奶奶")).resolves.toEqual({
      ok: true,
      placeholderId,
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_ledger_placeholder_member",
      { p_display_name: "奶奶", p_ledger_id: ledgerId },
    );
  });

  it("create 返回值不是 ID 时抛出 RepositoryError", async () => {
    const { repository } = createRepository({
      rpcResponse: { data: null, error: null },
    });

    await expect(repository.create(ledgerId, "奶奶")).rejects.toMatchObject({
      code: "ledger_placeholder_create_result_invalid",
    });
  });

  it("rename 与 delete 透传参数", async () => {
    const { repository, supabase } = createRepository();

    await expect(
      repository.rename(ledgerId, placeholderId, "外婆"),
    ).resolves.toEqual({ ok: true });
    await expect(repository.delete(ledgerId, placeholderId)).resolves.toEqual({
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenNthCalledWith(
      1,
      "rename_ledger_placeholder_member",
      {
        p_display_name: "外婆",
        p_ledger_id: ledgerId,
        p_placeholder_id: placeholderId,
      },
    );
    expect(supabase.rpc).toHaveBeenNthCalledWith(
      2,
      "delete_ledger_placeholder_member",
      { p_ledger_id: ledgerId, p_placeholder_id: placeholderId },
    );
  });

  it.each([
    ["placeholder_name_conflict", "create"],
    ["placeholder_name_member_conflict", "create"],
    ["placeholder_name_member_conflict", "rename"],
    ["placeholder_name_invalid", "rename"],
    ["placeholder_already_claimed", "rename"],
    ["placeholder_in_use", "delete"],
    ["placeholder_not_found", "delete"],
    ["permission_denied", "create"],
    ["auth_required", "rename"],
  ] as const)("details=%s 精确映射为业务错误码（%s）", async (code, op) => {
    const { repository } = createRepository({
      rpcResponse: { data: null, error: { code: "P0001", details: code } },
    });

    const result =
      op === "create"
        ? await repository.create(ledgerId, "奶奶")
        : op === "rename"
          ? await repository.rename(ledgerId, placeholderId, "奶奶")
          : await repository.delete(ledgerId, placeholderId);

    expect(result).toEqual({ code, ok: false });
  });

  it("message 中出现业务码但 details 不匹配时不做模糊匹配", async () => {
    const { logger, repository } = createRepository({
      rpcResponse: {
        data: null,
        error: { code: "P0001", details: null, message: "placeholder_in_use" },
      },
    });

    const failure = await repository
      .delete(ledgerId, placeholderId)
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RepositoryError);
    expect(failure).toMatchObject({
      code: "placeholder_delete_failed",
      message: getLedgerPlaceholderMemberErrorMessage(
        "placeholder_delete_failed",
      ),
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it("未知错误不泄露原始信息", async () => {
    const { repository } = createRepository({
      rpcResponse: { data: null, error: rawError },
    });

    const failure = await repository
      .rename(ledgerId, placeholderId, "奶奶")
      .catch((error: unknown) => error as RepositoryError);

    expect(failure).toBeInstanceOf(RepositoryError);
    expect((failure as RepositoryError).message).not.toContain("secret");
    expect((failure as RepositoryError).message).not.toContain("relation");
  });
});

describe("createSupabaseLedgerPlaceholderMemberRepository.ensure", () => {
  it("透传账本与名字数组，并把返回行转换为名字与占位 ID", async () => {
    const { repository, supabase } = createRepository({
      rpcResponse: {
        data: [{ display_name: "奶奶", placeholder_id: placeholderId }],
        error: null,
      },
    });

    await expect(repository.ensure(ledgerId, ["奶奶"])).resolves.toEqual({
      ok: true,
      placeholders: [{ displayName: "奶奶", placeholderId }],
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "ensure_ledger_placeholder_members",
      { p_display_names: ["奶奶"], p_ledger_id: ledgerId },
    );
  });

  it.each([
    [null],
    [{ display_name: "奶奶" }],
    [[{ display_name: "奶奶", placeholder_id: 1 }]],
    [[{ display_name: " ", placeholder_id: placeholderId }]],
    [[null]],
  ])("返回值格式异常 %j 时记录日志并抛出安全 RepositoryError", async (data) => {
    const { logger, repository } = createRepository({
      rpcResponse: { data, error: null },
    });

    const failure = await repository
      .ensure(ledgerId, ["奶奶"])
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RepositoryError);
    expect(failure).toMatchObject({
      code: "ledger_placeholder_ensure_result_invalid",
      message: getLedgerPlaceholderMemberErrorMessage(
        "placeholder_create_failed",
      ),
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it.each([
    "placeholder_name_conflict",
    "placeholder_name_member_conflict",
    "placeholder_name_invalid",
    "permission_denied",
    "auth_required",
  ] as const)("details=%s 精确映射为业务错误码", async (code) => {
    const { repository } = createRepository({
      rpcResponse: { data: null, error: { code: "23505", details: code } },
    });

    await expect(repository.ensure(ledgerId, ["奶奶"])).resolves.toEqual({
      code,
      ok: false,
    });
  });

  it("message 中出现业务码但 details 不匹配时不做模糊匹配，也不泄露原始信息", async () => {
    const { logger, repository } = createRepository({
      rpcResponse: {
        data: null,
        error: {
          ...rawError,
          details: null,
          message: "placeholder_name_member_conflict",
        },
      },
    });

    const failure = await repository
      .ensure(ledgerId, ["奶奶"])
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RepositoryError);
    expect(failure).toMatchObject({
      code: "placeholder_create_failed",
      message: getLedgerPlaceholderMemberErrorMessage(
        "placeholder_create_failed",
      ),
    });
    expect((failure as RepositoryError).message).not.toContain("placeholder_");
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("createSupabaseLedgerPlaceholderMemberRepository 并发冲突（#816）", () => {
  type Repository = ReturnType<
    typeof createSupabaseLedgerPlaceholderMemberRepository
  >;
  const operations = [
    [
      "create_ledger_placeholder_member",
      (repository: Repository) => repository.create(ledgerId, "奶奶"),
    ],
    [
      "rename_ledger_placeholder_member",
      (repository: Repository) =>
        repository.rename(ledgerId, placeholderId, "奶奶"),
    ],
    [
      "delete_ledger_placeholder_member",
      (repository: Repository) => repository.delete(ledgerId, placeholderId),
    ],
    [
      "ensure_ledger_placeholder_members",
      (repository: Repository) => repository.ensure(ledgerId, ["奶奶"]),
    ],
  ] as const;

  describe.each(operations)("%s", (operation, run) => {
    it.each(retryableConcurrencyRpcErrors)(
      "%s 转换为可重试的 ConflictError",
      async (_label, error) => {
        const { logger, repository } = createRepository({
          rpcResponse: { data: null, error },
        });

        const failure = await run(repository).catch((e: unknown) => e);

        expectConcurrentModificationConflict(failure, logger.warn, operation);
        expect(logger.error).not.toHaveBeenCalled();
      },
    );
  });

  it("已有业务 detail 映射优先于 SQLSTATE", async () => {
    const { repository } = createRepository({
      rpcResponse: {
        data: null,
        error: { code: "40001", details: "placeholder_in_use" },
      },
    });

    await expect(repository.delete(ledgerId, placeholderId)).resolves.toEqual({
      code: "placeholder_in_use",
      ok: false,
    });
  });
});
