// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createLedgerAccessMock } from "test/mocks/ledgerAccess";
import { createTransactionExportQueryService } from "./transactionExportQueryService";

function setup() {
  const transactionRepository = {
    listRecords: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue([]),
    listPayments: vi.fn().mockResolvedValue([]),
    loadRecordRates: vi.fn().mockResolvedValue([]),
    loadFilteredPage: vi.fn().mockResolvedValue({
      entries: [],
      nextOffset: null,
      settledCount: 0,
      totalCount: 0,
    }),
    findUserSummaries: vi
      .fn()
      .mockResolvedValue([{ id: "historical", display_name: "原记账人" }]),
  };
  const attachmentStorageRepository = {
    listByRecords: vi.fn().mockResolvedValue([]),
    getSignedReadUrls: vi.fn().mockResolvedValue([]),
  };
  const ledgerAccessService = createLedgerAccessMock();
  return {
    transactionRepository,
    attachmentStorageRepository,
    ledgerAccessService,
    service: createTransactionExportQueryService({
      transactionRepository,
      attachmentStorageRepository,
      ledgerAccessService,
    }),
  };
}
const input = { ledgerId: "ledger", userId: "viewer" };

describe("transactionExportQueryService", () => {
  it("照片按 sort_order 导出并分批签名，且使用账本权限", async () => {
    const { service, attachmentStorageRepository } = setup();
    attachmentStorageRepository.listByRecords.mockResolvedValue([
      { id: "b", transaction_record_id: "record", sort_order: 1 },
      { id: "a", transaction_record_id: "record", sort_order: 0 },
    ]);
    attachmentStorageRepository.getSignedReadUrls.mockResolvedValue([
      { id: "a", fullUrl: "https://example.com/a.jpg" },
      { id: "b", fullUrl: "https://example.com/b.jpg" },
    ]);
    await expect(
      service.listPhotosForExport({ ...input, recordIds: ["record"] }),
    ).resolves.toEqual([
      {
        recordId: "record",
        sortOrder: 0,
        fullUrl: "https://example.com/a.jpg",
      },
      {
        recordId: "record",
        sortOrder: 1,
        fullUrl: "https://example.com/b.jpg",
      },
    ]);
    expect(attachmentStorageRepository.listByRecords).toHaveBeenCalledWith(
      "ledger",
      ["record"],
    );
  });
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
  it("普通记录的账户来自付款明细、明细不再携带账户；转账仍由明细表达账户", async () => {
    const { service, transactionRepository } = setup();
    transactionRepository.listRecords.mockResolvedValueOnce([
      {
        id: "normal-1",
        type: "normal",
        transaction_at: "2026-09-19T00:00:00Z",
        merchant_id: null,
        created_by: null,
        note: null,
      },
      {
        id: "transfer-1",
        type: "transfer",
        transaction_at: "2026-09-19T00:00:00Z",
        merchant_id: null,
        created_by: null,
        note: null,
      },
    ]);
    transactionRepository.listItems.mockResolvedValueOnce([
      {
        transaction_record_id: "normal-1",
        account_id: "mirror-account",
        category_id: "food",
        amount: "120",
        balance_delta: null,
      },
      {
        transaction_record_id: "transfer-1",
        account_id: "bank",
        category_id: null,
        amount: "300",
        balance_delta: "300",
      },
      {
        transaction_record_id: "transfer-1",
        account_id: "cash",
        category_id: null,
        amount: "300",
        balance_delta: "-300",
      },
    ]);
    transactionRepository.listPayments.mockResolvedValueOnce([
      {
        transaction_record_id: "normal-1",
        account_id: "me",
        amount: "50",
        balance_delta: "-50",
        sort_order: 0,
      },
      {
        transaction_record_id: "normal-1",
        account_id: "wife",
        amount: "70",
        balance_delta: "-70",
        sort_order: 1,
      },
    ]);
    const result = await service.listAllForExport(input);
    expect(result).toEqual([
      {
        id: "normal-1",
        type: "normal",
        transactionAt: "2026-09-19T00:00:00Z",
        merchantId: null,
        recorderName: "",
        note: "",
        items: [{ categoryId: "food", amount: "120" }],
        payments: [
          { accountId: "me", amount: "50" },
          { accountId: "wife", amount: "70" },
        ],
      },
      {
        id: "transfer-1",
        type: "transfer",
        transactionAt: "2026-09-19T00:00:00Z",
        merchantId: null,
        recorderName: "",
        note: "",
        items: [
          {
            accountId: "bank",
            categoryId: null,
            amount: "300",
            balanceDelta: "300",
          },
          {
            accountId: "cash",
            categoryId: null,
            amount: "300",
            balanceDelta: "-300",
          },
        ],
      },
    ]);
    expect(transactionRepository.listPayments).toHaveBeenCalledWith(
      "ledger",
      ["normal-1"],
      expect.objectContaining({ offset: 0 }),
    );
  });
  it("将日期边界与类型组合传给查询层", async () => {
    const { service, transactionRepository } = setup();
    const scope = {
      dateStart: "2026-11-25T00:00:00Z",
      dateEnd: "2026-11-26T00:00:00Z",
      recordTypes: ["normal", "balance_adjustment"] as (
        | "normal"
        | "balance_adjustment"
      )[],
    };
    await service.listAllForExport({ ...input, ...scope });
    expect(transactionRepository.listRecords).toHaveBeenCalledWith({
      ledgerId: "ledger",
      recordType: "all",
      offset: 0,
      limit: 100,
      ...scope,
    });
  });
  it("空账本返回空数组且不查询关联资料", async () => {
    const { service, transactionRepository } = setup();
    await expect(service.listAllForExport(input)).resolves.toEqual([]);
    expect(transactionRepository.listItems).not.toHaveBeenCalled();
    expect(transactionRepository.listPayments).not.toHaveBeenCalled();
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
