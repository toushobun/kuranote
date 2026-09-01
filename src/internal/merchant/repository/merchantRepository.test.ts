// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { merchantErrorCodes } from "internal/merchant/errors";
import { createSupabaseMerchantRepository } from "internal/merchant/repository/merchantRepository";
import {
  ConflictError,
  RepositoryError,
  ValidationError,
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

    await expect(repository.listActive(ledgerId)).resolves.toEqual({
      merchants: [],
      tags: [],
    });

    expect(supabase.queries).toHaveLength(2);
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

  it("商家列表会装配别名、标签及统一计算的商家数量", async () => {
    const aliasId = "00000000-0000-4000-8000-000000001002";
    const tagId = "00000000-0000-4000-8000-000000002001";
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
        { data: [{ icon: "🛒", id: tagId, name: "超市", sort_order: 0 }] },
        { data: [{ merchant_id: merchantId, tag_id: tagId }] },
      ],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listActive(ledgerId)).resolves.toMatchObject({
      merchants: [
        {
          aliases: [{ id: aliasId }],
          id: merchantId,
          tags: [{ id: tagId, merchant_count: 1 }],
        },
      ],
      tags: [{ id: tagId, merchant_count: 1 }],
    });
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
    const supabase = createSupabaseMock({ rpcResponse: { data: true } });
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

    expect(supabase.rpc).toHaveBeenCalledWith("update_merchant_with_tags", {
      p_ledger_id: ledgerId,
      p_merchant_id: merchantId,
      p_name: "ライフ",
      p_note: null,
      p_tag_ids: [],
      p_website_url: null,
    });
  });

  it("唯一约束冲突会转换为安全的 ConflictError", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: { code: "23505", message: "merchant_active_name_unique" },
      },
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

  it.each([
    {
      invoke: (
        repository: ReturnType<typeof createSupabaseMerchantRepository>,
      ) =>
        repository.createMerchant({
          ledgerId,
          name: "LIFE",
          note: null,
          siteUrl: null,
          tagIds: [merchantId],
          userId,
        }),
      operation: "新增",
    },
    {
      invoke: (
        repository: ReturnType<typeof createSupabaseMerchantRepository>,
      ) =>
        repository.updateMerchant({
          ledgerId,
          merchantId,
          name: "LIFE",
          note: null,
          siteUrl: null,
          tagIds: [merchantId],
          userId,
        }),
      operation: "更新",
    },
  ])(
    "商家$operation时标签状态竞争会转换为 ConflictError",
    async ({ invoke }) => {
      const supabase = createSupabaseMock({
        rpcResponse: {
          error: {
            code: "22023",
            details: "merchant_tags_invalid",
            message: "private detail",
          },
        },
      });
      const repository = createSupabaseMerchantRepository(
        supabase.client as never,
        createLogger(),
      );

      const operation = invoke(repository);

      await expect(operation).rejects.toMatchObject({
        code: merchantErrorCodes.merchantTagInvalid,
        message: "该商家标签不存在或已不可用。",
      });
      await expect(operation).rejects.toBeInstanceOf(ConflictError);
    },
  );

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

  it("读取当前账本未归档标签并按排序返回", async () => {
    const tagId = "00000000-0000-4000-8000-000000002001";
    const secondMerchantId = "00000000-0000-4000-8000-000000001002";
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [{ icon: "🛒", id: tagId, name: "超市", sort_order: 0 }] },
        { data: [{ id: merchantId }, { id: secondMerchantId }] },
        {
          data: [
            { merchant_id: merchantId, tag_id: tagId },
            { merchant_id: secondMerchantId, tag_id: tagId },
          ],
        },
      ],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listActiveTags(ledgerId)).resolves.toEqual([
      { icon: "🛒", id: tagId, merchant_count: 2, name: "超市", sort_order: 0 },
    ]);
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
      ]),
    );
    expect(supabase.queries[1].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
      ]),
    );
    expect(supabase.queries[2].calls).toContainEqual({
      args: ["merchant_id", [merchantId, secondMerchantId]],
      method: "in",
    });
  });

  it("标签校验只读取当前账本未归档标签 ID", async () => {
    const tagId = "00000000-0000-4000-8000-000000002001";
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [{ id: tagId }] }],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listActiveTagIds(ledgerId)).resolves.toEqual([
      tagId,
    ]);
    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["id"], method: "select" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
      ]),
    );
  });

  it("通过 RPC 原子创建商家标签", async () => {
    const tagId = "00000000-0000-4000-8000-000000002001";
    const supabase = createSupabaseMock({ rpcResponse: { data: tagId } });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await repository.createTag({ icon: "🛒", ledgerId, name: "超市" });

    expect(supabase.rpc).toHaveBeenCalledWith("create_merchant_tag", {
      p_icon: "🛒",
      p_ledger_id: ledgerId,
      p_name: "超市",
    });
  });

  it("读取单个商家时只查询该商家关联的标签", async () => {
    const tagId = "00000000-0000-4000-8000-000000002001";
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: {
            created_at: "2026-01-01T00:00:00.000Z",
            icon_url: null,
            id: merchantId,
            name: "LIFE",
            note: null,
            sort_order: 0,
            website_url: null,
          },
        },
        { data: [] },
        { data: [{ merchant_id: merchantId, tag_id: tagId }] },
        { data: [{ icon: "🛒", id: tagId, name: "超市", sort_order: 0 }] },
      ],
    });
    const repository = createSupabaseMerchantRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.findActiveMerchantData(ledgerId, merchantId),
    ).resolves.toMatchObject({
      id: merchantId,
      tags: [{ id: tagId }],
    });
    expect(supabase.queries[3].table).toBe("merchant_tags");
    expect(supabase.queries[3].calls).toContainEqual({
      args: ["id", [tagId]],
      method: "in",
    });
  });

  it.each([
    {
      databaseCode: "22023",
      code: merchantErrorCodes.merchantTagOrderInvalid,
      details: "merchant_tag_order_invalid",
      errorType: ValidationError,
      message: "标签排序内容不正确。",
    },
    {
      databaseCode: "22023",
      code: merchantErrorCodes.merchantTagSetInvalid,
      details: "merchant_tag_set_invalid",
      errorType: ConflictError,
      message: "标签列表已发生变化，请刷新页面后重试。",
    },
    {
      databaseCode: "P0002",
      code: merchantErrorCodes.ledgerInvalid,
      details: "ledger_not_found",
      errorType: ConflictError,
      message: "账本不存在、已停用或您无法访问。",
    },
  ])(
    "标签排序 RPC 的 $details 会转换为对应业务错误",
    async ({ code, databaseCode, details, errorType, message }) => {
      const supabase = createSupabaseMock({
        rpcResponse: {
          error: {
            code: databaseCode,
            details,
            message: "private detail",
          },
        },
      });
      const repository = createSupabaseMerchantRepository(
        supabase.client as never,
        createLogger(),
      );

      const operation = repository.reorderTags(ledgerId, [merchantId]);

      await expect(operation).rejects.toMatchObject({ code, message });
      await expect(operation).rejects.toBeInstanceOf(errorType);
    },
  );
});
