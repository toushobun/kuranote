// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger";
import { createMerchantPresetService } from "../service/merchantPresetService";
import { createSupabaseMock } from "test/supabaseMock";
import {
  AuthenticationError,
  AuthorizationError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import { createMerchantPresetRepository } from "./merchantPresetRepository";

const payload = { merchants: [], merchantTags: [] };
function setup(options: Parameters<typeof createSupabaseMock>[0]) {
  const supabase = createSupabaseMock(options);
  const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  return {
    supabase,
    logger,
    repository: createMerchantPresetRepository(
      supabase.client as never,
      logger,
    ),
  };
}
describe("merchantPresetRepository", () => {
  it("读取当前默认币种，并独立分页读取账本有效商家的正式名与有效别名", async () => {
    const { repository, supabase } = setup({
      queryResponses: [
        { data: { base_currency: "JPY" } },
        { data: [{ name: "Brand" }] },
        { data: [] },
        { data: [{ alias: "Alias" }] },
        { data: [] },
      ],
    });
    await expect(repository.getCurrency("ledger")).resolves.toBe("JPY");
    await expect(repository.listExistingNames("ledger")).resolves.toEqual([
      "Brand",
      "Alias",
    ]);
    expect(supabase.queries[3]!.calls).toContainEqual({
      method: "eq",
      args: ["merchant.ledger_id", "ledger"],
    });
  });
  it.each([
    ["已归档商家同名", "merchant", "name", "is_archived"],
    ["已归档商家的残留别名", "merchant_alias", "alias", "merchant.is_archived"],
    ["已移除的别名", "merchant_alias", "alias", "is_archived"],
  ])(
    "已添加 key 排除%s，保留有效商家的标记",
    async (_label, table, nameField, archivedField) => {
      const template = getLedgerSetupTemplate("JPY")!;
      const [preset, active] = template.merchants;
      const fixtures: Record<string, unknown>[] = [
        {
          [nameField]: preset!.name.toUpperCase(),
          is_archived: false,
          "merchant.is_archived": false,
          [archivedField]: true,
        },
        {
          [nameField]: active!.name.toUpperCase(),
          is_archived: false,
          "merchant.is_archived": false,
        },
      ];
      const { repository, supabase } = setup({
        queryResponses: [{ data: { base_currency: "JPY" } }],
      });
      const from = supabase.from.getMockImplementation()!;
      // 用查询条件过滤 fixture，验证真实 Repository 与 Service 联动后的 addedKeys。
      supabase.from.mockImplementation((source) => {
        const query = from(source);
        const record = supabase.queries.at(-1)!;
        query.range.mockImplementation((offset: number, limit: number) => {
          record.response.data =
            source === table
              ? fixtures
                  .filter((row) =>
                    record.calls.every(
                      ({ method, args }) =>
                        method !== "eq" ||
                        (args[0] !== "is_archived" &&
                          args[0] !== "merchant.is_archived") ||
                        row[String(args[0])] === args[1],
                    ),
                  )
                  .slice(offset, limit + 1)
              : [];
          return query;
        });
        return query;
      });
      const service = createMerchantPresetService({
        repository,
        merchantService: { assertCanManage: vi.fn() },
      });
      const options = await service.load("ledger");
      expect(options.addedKeys).not.toContain(preset!.key);
      expect(options.addedKeys).toContain(active!.key);
      for (const query of supabase.queries.filter(
        ({ table: name }) => name === "merchant" || name === "merchant_alias",
      )) {
        expect(query.calls).toContainEqual({
          method: "eq",
          args: ["is_archived", false],
        });
        if (query.table === "merchant_alias")
          expect(query.calls).toContainEqual({
            method: "eq",
            args: ["merchant.is_archived", false],
          });
      }
    },
  );
  it("调用单个原子 RPC 并保留数据库实际新增数量", async () => {
    const { repository, supabase } = setup({ rpcResponse: { data: 2 } });
    await expect(
      repository.add({ ledgerId: "ledger", currency: "JPY", payload }),
    ).resolves.toBe(2);
    expect(supabase.rpc).toHaveBeenCalledWith("add_merchant_presets", {
      p_ledger_id: "ledger",
      p_currency: "JPY",
      p_payload: { accounts: [], specialStatusEnabled: false, ...payload },
    });
  });
  it.each([
    ["auth_required", AuthenticationError],
    ["permission_denied", AuthorizationError],
    ["merchant_preset_invalid", ValidationError],
  ])("仅精确匹配 RPC detail 转换业务异常：%s", async (details, type) => {
    const { repository } = setup({
      rpcResponse: { error: { details, message: "private SQL" } },
    });
    await expect(
      repository.add({ ledgerId: "ledger", currency: "JPY", payload }),
    ).rejects.toBeInstanceOf(type);
  });
  it("原始 message 不能冒充业务 detail，返回安全持久层错误", async () => {
    const { repository, logger } = setup({
      rpcResponse: { error: { message: "merchant_preset_invalid" } },
    });
    await expect(
      repository.add({ ledgerId: "ledger", currency: "JPY", payload }),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(logger.error).toHaveBeenCalled();
  });
  it("读取失败不伪装为空名称集合", async () => {
    const { repository } = setup({
      queryResponses: [{ error: { message: "private SQL" } }],
    });
    await expect(repository.listExistingNames("ledger")).rejects.toMatchObject({
      code: "merchant_preset_load_failed",
      message: "预设商家读取失败，请稍后重试。",
    });
  });
});
