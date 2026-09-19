// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createLedgerAccessMock } from "test/mocks/ledgerAccess";
import { createTransactionExportQueryService } from "./transactionExportQueryService";

function setup() {
  const transactionRepository = {
    listRecords: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue([]),
    findUserSummaries: vi
      .fn()
      .mockResolvedValue([{ id: "historical", display_name: "原记账人" }]),
  };
  const ledgerAccessService = createLedgerAccessMock();
  return {
    transactionRepository,
    ledgerAccessService,
    service: createTransactionExportQueryService({
      transactionRepository,
      ledgerAccessService,
    }),
  };
}
const input = { ledgerId: "ledger", userId: "viewer" };

describe("transactionExportQueryService", () => {
  it("读取超过千条交易及同一批超过千条明细，不使用当前用户覆盖记账人", async () => {
    const { service, transactionRepository } = setup();
    const records = Array.from({ length: 1001 }, (_, index) => ({
      id: `record-${index}`,
      type: "normal",
      transaction_at: "2026-09-19T00:00:00Z",
      merchant_id: null,
      created_by: "historical",
      note: null,
    }));
    transactionRepository.listRecords.mockImplementation(
      async ({ offset, limit }: { offset: number; limit: number }) =>
        records.slice(offset, offset + limit),
    );
    const items = Array.from({ length: 1002 }, (_, index) => ({
      transaction_record_id: "record-0",
      account_id: "account",
      category_id: "category",
      amount: String(index),
      balance_delta: String(-index),
    }));
    transactionRepository.listItems.mockImplementation(
      async (
        _ledgerId: string,
        ids: string[],
        { offset, limit }: { offset: number; limit: number },
      ) =>
        ids.includes("record-0") ? items.slice(offset, offset + limit) : [],
    );
    const result = await service.listAllForExport(input);
    expect(result).toHaveLength(1001);
    expect(result[0].items).toHaveLength(1002);
    expect(result[0].recorderName).toBe("原记账人");
    expect(result.at(-1)?.id).toBe("record-1000");
    expect(transactionRepository.listRecords).toHaveBeenCalledWith({
      ledgerId: "ledger",
      recordType: "all",
      offset: 1000,
      limit: 100,
    });
  });
  it("空账本返回空数组且不查询关联资料", async () => {
    const { service, transactionRepository } = setup();
    await expect(service.listAllForExport(input)).resolves.toEqual([]);
    expect(transactionRepository.listItems).not.toHaveBeenCalled();
  });
  it("成员权限失效时不读交易", async () => {
    const { service, transactionRepository, ledgerAccessService } = setup();
    ledgerAccessService.getActiveMemberRole.mockResolvedValue(null);
    await expect(service.listAllForExport(input)).rejects.toMatchObject({
      code: "ledger_invalid",
    });
    expect(transactionRepository.listRecords).not.toHaveBeenCalled();
  });
  it("中途查询失败时不会返回部分交易", async () => {
    const { service, transactionRepository } = setup();
    transactionRepository.listRecords.mockRejectedValueOnce(
      new Error("读取失败"),
    );
    await expect(service.listAllForExport(input)).rejects.toThrow("读取失败");
  });
});
