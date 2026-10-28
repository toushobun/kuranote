// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { RepositoryError } from "internal/shared/errors/appError";
import { createMerchantEntryRepository } from "./merchantEntryRepository";
function setup(data: unknown = null, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  return {
    rpc,
    logger,
    repository: createMerchantEntryRepository({ rpc } as never, logger),
  };
}
describe("merchantEntryRepository", () => {
  it("排行 RPC 传入账本和上限并转换 bigint 计数", async () => {
    const { rpc, repository } = setup([
      { merchant_id: "merchant", record_count: "123" },
    ]);
    expect(await repository.loadFrequentMerchantCounts("ledger", 8)).toEqual([
      { merchantId: "merchant", recordCount: 123 },
    ]);
    expect(rpc).toHaveBeenCalledWith("load_frequent_transaction_merchants", {
      p_ledger_id: "ledger",
      p_limit: 8,
    });
  });
  it("样本 RPC 传入商家、账本、上限并保留明细及付款", async () => {
    const data = [
      {
        id: "r",
        payments: [{ accountId: "a", currency: "JPY", isArchived: false }],
        items: [{ categoryId: "c", amount: "100" }],
      },
    ];
    const { rpc, repository } = setup(data);
    expect(
      await repository.loadMerchantHistory("ledger", "merchant", 20),
    ).toEqual(data);
    expect(rpc).toHaveBeenCalledWith("load_merchant_entry_history", {
      p_ledger_id: "ledger",
      p_merchant_id: "merchant",
      p_limit: 20,
    });
  });
  it("无数据时返回空列表", async () => {
    const { repository } = setup();
    expect(await repository.loadFrequentMerchantCounts("ledger", 8)).toEqual(
      [],
    );
    expect(
      await repository.loadMerchantHistory("ledger", "merchant", 20),
    ).toEqual([]);
  });
  it.each(["counts", "history"])(
    "%s 查询失败记录安全日志并抛出 RepositoryError，不吞掉失败或泄露数据库消息",
    async (query) => {
      const { repository, logger } = setup(null, {
        code: "42501",
        message: "secret SQL",
      });
      const result =
        query === "counts"
          ? repository.loadFrequentMerchantCounts("ledger", 8)
          : repository.loadMerchantHistory("ledger", "merchant", 20);
      await expect(result).rejects.toBeInstanceOf(RepositoryError);
      await expect(result).rejects.toMatchObject({
        code: "transaction_merchant_suggestions_load_failed",
        message: "商家记账建议加载失败，请稍后重试。",
      });
      expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
        "secret SQL",
      );
    },
  );
});
