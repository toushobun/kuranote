import { describe, expect, it, vi } from "vitest";

import { createTransactionImportService } from "internal/transaction/service/transactionImportService";
import type { TransactionService } from "internal/transaction/service/transactionService";

function createService() {
  const createBalanceAdjustment = vi.fn(async () => undefined);
  const createNormal = vi.fn(async () => undefined);
  const createTransfer = vi.fn(async () => undefined);
  const service = {
    createBalanceAdjustment,
    createNormal,
    createTransfer,
  } as unknown as TransactionService;

  return {
    createBalanceAdjustment,
    createNormal,
    createTransfer,
    importService: createTransactionImportService({ service }),
  };
}

describe("TransactionImportService", () => {
  it.each([
    "createNormal",
    "createTransfer",
    "createBalanceAdjustment",
  ] as const)("%s 使用共享转换并在非法日期时阻止写入", async (method) => {
    const services = createService();
    const input = {
      signedDelta: -1200,
      accountId: "account-1",
      payments: [{ accountId: "account-1", amount: null }],
      items: [{ amount: 1200, categoryId: "category-1" }],
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
      note: null,
      timeZoneOffsetMinutes: -540,
      transactionAt: "2026-01-01 00:30:15",
      transferAmount: 1200,
      transferTargetAccountId: "account-2",
      type: "expense" as const,
    };
    await services.importService[method](input);
    const { timeZoneOffsetMinutes: offset, ...transaction } = input;
    expect(offset).toBe(-540);
    expect(services[method]).toHaveBeenCalledExactlyOnceWith({
      ...transaction,
      transactionAt: "2025-12-31T15:30:15.000Z",
    });
    await expect(
      services.importService[method]({
        ...input,
        transactionAt: "2026-02-30 10:00:00",
      }),
    ).rejects.toMatchObject({ code: "date_invalid" });
    expect(services[method]).toHaveBeenCalledOnce();
  });

  it("多账户付款原样传给正式 Service，保留金额与顺序", async () => {
    const { createNormal, importService } = createService();
    const payments = [
      { accountId: "card-1", amount: "0" },
      { accountId: "card-2", amount: "1200" },
    ];
    await importService.createNormal({
      payments,
      items: [{ amount: 1200, categoryId: "category-1" }],
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
      note: null,
      timeZoneOffsetMinutes: 0,
      transactionAt: "2026-01-01 00:00:00",
      type: "expense",
    });
    expect(createNormal).toHaveBeenCalledWith(
      expect.objectContaining({ payments }),
    );
  });
});
