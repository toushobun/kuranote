// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { merchantErrorCodes } from "internal/merchant/errors";
import { createSupabaseMerchantRepository } from "internal/merchant/repository/merchantRepository";
import {
  ConflictError,
  RepositoryError,
} from "internal/shared/errors/appError";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const merchantId = "00000000-0000-4000-8000-000000001001";

function createLogger() {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe("createSupabaseMerchantRepository", () => {
  it("交易选项优先使用首选别名作为展示名称", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [{ icon_url: null, id: merchantId, name: "正式商家名" }] },
        { data: [{ alias: "展示名", merchant_id: merchantId }] },
      ],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.findSummariesByIds(ledgerId, [merchantId]),
    ).resolves.toEqual([{ icon_url: null, id: merchantId, name: "展示名" }]);
  });

  it("通过 RPC 原子切换同一商家的展示别名", async () => {
    const aliasId = "00000000-0000-4000-8000-000000001002";
    const supabase = createSupabaseMock({ rpcResponse: { data: true } });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.setPreferredAlias({ aliasId, ledgerId, merchantId }),
    ).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith("set_merchant_preferred_alias", {
      p_alias_id: aliasId,
      p_ledger_id: ledgerId,
      p_merchant_id: merchantId,
    });
  });

  it("展示名唯一约束冲突会转换为安全的 ConflictError", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: { code: "23505", message: "private constraint detail" },
      },
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    const operation = repository.setPreferredAlias({
      aliasId: null,
      ledgerId,
      merchantId,
    });

    await expect(operation).rejects.toMatchObject({
      code: merchantErrorCodes.aliasPreferredUpdateFailed,
    });
    await expect(operation).rejects.toBeInstanceOf(ConflictError);
  });

  it("商家列表只读取指定账本的未归档记录并按既有顺序排序", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listActive(ledgerId)).resolves.toEqual([]);

    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].table).toBe("merchant");
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        { args: ["sort_order", { ascending: true }], method: "order" },
        { args: ["created_at", { ascending: false }], method: "order" },
      ]),
    );
  });

  it("商家列表会读取别名并挂到所属商家", async () => {
    const aliasId = "00000000-0000-4000-8000-000000001002";
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            {
              created_at: "2026-01-01T00:00:00.000Z",
              icon_url: null,
              id: merchantId,
              name: "LIFE",
              note: null,
              sort_order: 0,
              website_url: null,
            },
          ],
        },
        {
          data: [
            {
              alias: "来福",
              created_at: "2026-01-01T00:00:00.000Z",
              id: aliasId,
              merchant_id: merchantId,
              sort_order: 0,
            },
          ],
        },
      ],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listActive(ledgerId)).resolves.toMatchObject([
      { aliases: [{ id: aliasId }], id: merchantId },
    ]);
    expect(supabase.queries[1].table).toBe("merchant_alias");
  });

  it("交易历史用按 ID 查询不会排除已归档商家", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await repository.findSummariesByIds(ledgerId, [merchantId]);

    expect(supabase.queries[0].calls).toContainEqual({
      args: ["id", [merchantId]],
      method: "in",
    });
    expect(supabase.queries[0].calls).not.toContainEqual({
      args: ["is_archived", false],
      method: "eq",
    });
  });

  it("更新商家只命中当前账本中的未归档记录", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 1 }] });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.updateMerchant({
        ledgerId,
        merchantId,
        name: "ライフ",
        note: null,
        siteUrl: null,
        userId,
      }),
    ).resolves.toBe(true);

    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["id", merchantId], method: "eq" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
      ]),
    );
  });

  it("唯一约束冲突会转换为安全的 ConflictError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { error: { code: "23505", message: "merchant_active_name_unique" } },
      ],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    const operation = repository.createMerchant({
      ledgerId,
      name: "LIFE",
      note: null,
      siteUrl: null,
      userId,
    });

    await expect(operation).rejects.toMatchObject({ code: "create_failed" });
    await expect(operation).rejects.toBeInstanceOf(ConflictError);
  });

  it("Supabase 错误会记录并转换为安全的 RepositoryError", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { code: "XX000", message: "private detail" } }],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.listActive(ledgerId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[merchant] failed to load merchants",
      expect.objectContaining({ databaseCode: "XX000", ledgerId }),
    );
  });
});
