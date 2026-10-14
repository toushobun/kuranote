// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
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
  it("读取当前默认币种，并独立分页读取账本全部正式名与别名", async () => {
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
