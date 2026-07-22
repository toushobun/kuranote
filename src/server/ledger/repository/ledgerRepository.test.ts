// @vitest-environment node

import { describe, expect, it } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { createSupabaseLedgerRepository } from "server/ledger/repository/ledgerRepository";
import { ledgerCreateErrorCodes } from "server/ledger/errors/ledgerCreate";
import { RepositoryError } from "server/shared/errors/appError";

const ledgerIdA = "00000000-0000-4000-8000-000000000001";
const ledgerIdB = "00000000-0000-4000-8000-000000000002";
const userId = "00000000-0000-4000-8000-000000000031";

const createInput = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

describe("createSupabaseLedgerRepository.create", () => {
  it("RPC 成功时返回 ok: true", async () => {
    const supabase = createSupabaseMock({ rpcResponse: {} });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.create(createInput)).resolves.toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_ledger_with_owner_settings",
      {
        p_base_currency: "JPY",
        p_display_color: "amber",
        p_display_name: "淞文",
        p_name: "家庭账本",
      },
    );
  });

  it.each([
    ["auth_required", ledgerCreateErrorCodes.authRequired],
    ["currency_invalid", ledgerCreateErrorCodes.currencyInvalid],
    ["display_color_invalid", ledgerCreateErrorCodes.displayColorInvalid],
    ["display_name_required", ledgerCreateErrorCodes.displayNameRequired],
    ["display_name_too_long", ledgerCreateErrorCodes.displayNameTooLong],
    ["ledger_name_required", ledgerCreateErrorCodes.nameRequired],
    ["ledger_name_too_long", ledgerCreateErrorCodes.nameTooLong],
    ["user_inactive", ledgerCreateErrorCodes.userInactive],
  ] as const)("RPC details 返回 %s 时映射为 %s", async (details, expected) => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: { details, message: "业务错误" } },
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.create(createInput)).resolves.toEqual({
      code: expected,
      ok: false,
    });
  });

  it("未知 details 时回退为 create_failed", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: { details: "unexpected", message: "业务错误" } },
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.create(createInput)).resolves.toEqual({
      code: ledgerCreateErrorCodes.createFailed,
      ok: false,
    });
  });
});

describe("createSupabaseLedgerRepository.getMemberCounts", () => {
  it("按账本分别查询 active 成员数量", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ count: 3 }, { count: 0 }],
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    const result = await repository.getMemberCounts([ledgerIdA, ledgerIdB]);

    expect(result).toEqual(
      new Map([
        [ledgerIdA, 3],
        [ledgerIdB, 0],
      ]),
    );
    expect(supabase.queries).toHaveLength(2);
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["ledger_id", ledgerIdA],
      method: "eq",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["status", "active"],
      method: "eq",
    });
  });

  it("count 为 null 时按 0 处理", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: null }] });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    const result = await repository.getMemberCounts([ledgerIdA]);

    expect(result.get(ledgerIdA)).toBe(0);
  });

  it("查询失败时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { message: "connection refused" } }],
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(
      repository.getMemberCounts([ledgerIdA]),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});

describe("createSupabaseLedgerRepository.getUserDisplayName", () => {
  it("返回去除首尾空白的显示名", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { display_name: "  淞文  " } }],
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.getUserDisplayName(userId)).resolves.toBe("淞文");
  });

  it("显示名为空字符串时返回 null", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { display_name: "   " } }],
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.getUserDisplayName(userId)).resolves.toBeNull();
  });

  it("用户不存在时返回 null", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.getUserDisplayName(userId)).resolves.toBeNull();
  });

  it("查询失败时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { message: "connection refused" } }],
    });
    const repository = createSupabaseLedgerRepository(supabase.client as never);

    await expect(repository.getUserDisplayName(userId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});
