// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
  accountErrorCodes,
  getAccountErrorMessage,
} from "internal/account/errors";
import { createSupabaseAccountRepository } from "internal/account/repository/accountRepository";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const holderUserId = "00000000-0000-4000-8000-000000000041";
const accountId = "00000000-0000-4000-8000-000000000045";
const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };

describe("AccountRepository", () => {
  it("创建账户时调用持有人原子 RPC", async () => {
    const supabase = createSupabaseMock({ rpcResponse: { data: accountId } });
    const repository = createSupabaseAccountRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.create({
        currency: "JPY",
        holderUserIds: [holderUserId],
        initialBalance: 1000,
        ledgerId,
        name: "现金",
        type: "cash",
      }),
    ).resolves.toBe(accountId);

    expect(supabase.rpc).toHaveBeenCalledWith("create_account_with_holders", {
      p_currency: "JPY",
      p_holder_user_ids: [holderUserId],
      p_initial_balance: 1000,
      p_ledger_id: ledgerId,
      p_name: "现金",
      p_type: "cash",
    });
  });

  it("创建账户的数据库失败转换为安全 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "XX000",
          details: "private database details",
          message: "private database message",
        },
      },
    });
    const repository = createSupabaseAccountRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.create({
        currency: "JPY",
        holderUserIds: [holderUserId],
        initialBalance: 1000,
        ledgerId,
        name: "现金",
        type: "cash",
      }),
    ).rejects.toMatchObject({
      code: "account_create_failed",
      message: "账户新增失败，请稍后重试。",
    });
  });

  it.each(["create", "update"] as const)(
    "账户同维度名称冲突在 %s 中转换为安全 ConflictError",
    async (operation) => {
      const supabase = createSupabaseMock({
        rpcResponse: {
          error: {
            code: "23505",
            message: "private constraint name",
            details: "private details",
          },
        },
      });
      const repository = createSupabaseAccountRepository(
        supabase.client as never,
        logger,
      );

      await expect(
        repository[operation]({
          accountId,
          currency: "JPY",
          holderUserIds: [holderUserId],
          initialBalance: 1000,
          ledgerId,
          name: "现金",
          type: "cash",
        }),
      ).rejects.toMatchObject({
        code: accountErrorCodes.nameDuplicate,
        message: getAccountErrorMessage(accountErrorCodes.nameDuplicate),
        details: undefined,
        name: "ConflictError",
      });
    },
  );

  it("账户列表只查询目标账本中的未归档账户并保持排序", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseAccountRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.listAccounts(ledgerId)).resolves.toEqual([]);

    expect(supabase.queries[0].table).toBe("account");
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        { args: ["sort_order", { ascending: true }], method: "order" },
        { args: ["created_at", { ascending: true }], method: "order" },
      ]),
    );
  });

  it("归档账户时同时限定账户 ID、账本 ID 和未归档状态", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 1 }] });
    const repository = createSupabaseAccountRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.archive({
        accountId,
        archivedAt: "2026-07-21T00:00:00.000Z",
        ledgerId,
        userId,
      }),
    ).resolves.toBe(true);

    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["id", accountId], method: "eq" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
      ]),
    );
  });

  it("归档账户的数据库失败不会伪装为未命中", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { error: { code: "XX000", message: "private database message" } },
      ],
    });
    const repository = createSupabaseAccountRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.archive({
        accountId,
        archivedAt: "2026-07-21T00:00:00.000Z",
        ledgerId,
        userId,
      }),
    ).rejects.toMatchObject({
      code: "account_archive_failed",
      message: "账户删除失败，请稍后重试。",
    });
  });

  it("账户为空时不查询持有人表", async () => {
    const supabase = createSupabaseMock();
    const repository = createSupabaseAccountRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.listHolders(ledgerId, [])).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

it("账户资料和目标余额通过同一 RPC 保存", async () => {
  const supabase = createSupabaseMock({ rpcResponse: { data: accountId } });
  const repository = createSupabaseAccountRepository(
    supabase.client as never,
    logger,
  );
  await repository.update({
    accountId,
    ledgerId,
    currency: "JPY",
    holderUserIds: [holderUserId],
    name: "现金",
    type: "cash",
    targetBalance: -100,
    balanceAdjustmentNote: "盘点",
  });
  expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(
    "update_account_with_balance_adjustment",
    {
      p_account_id: accountId,
      p_ledger_id: ledgerId,
      p_currency: "JPY",
      p_holder_user_ids: [holderUserId],
      p_name: "现金",
      p_type: "cash",
      p_target_balance: -100,
      p_adjustment_note: "盘点",
    },
  );
});
