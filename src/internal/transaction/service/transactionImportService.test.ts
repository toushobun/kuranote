import { describe, expect, it, vi } from "vitest";

import type { CurrentLedger } from "internal/ledger";
import { createTransactionImportService } from "internal/transaction/service/transactionImportService";
import type { TransactionService } from "internal/transaction/service/transactionService";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "owner",
  id: "ledger-1",
  name: "家庭账本",
};

function transactionListItem(overrides: Record<string, unknown> = {}) {
  return {
    account_currency: "JPY",
    account_name: "钱包",
    amount: "1200",
    categoryItems: [],
    created_at: "2026-09-17T10:00:01+09:00",
    id: "record-1",
    merchant_icon_url: null,
    merchant_name: "业务超市",
    note: null,
    recorder_name: "淞文",
    transaction_at: "2026-09-17T10:00:00+09:00",
    type: "expense",
    ...overrides,
  };
}

function createService() {
  const getGroupItems = vi.fn();
  const getEditView = vi.fn();
  const createNormal = vi.fn(async () => undefined);
  const createTransfer = vi.fn(async () => undefined);
  const service = {
    createNormal,
    createTransfer,
    getEditView,
    getGroupItems,
  } as unknown as TransactionService;

  return {
    createNormal,
    createTransfer,
    getEditView,
    getGroupItems,
    importService: createTransactionImportService({ currentLedger, service }),
  };
}

describe("TransactionImportService", () => {
  it("收支按日期、金额、商家和账户判定疑似重复", async () => {
    const { getGroupItems, importService } = createService();
    getGroupItems.mockResolvedValue({
      groups: [
        {
          date: "2026-09-17",
          items: [transactionListItem()],
          label: "9月17日",
          summary: {
            balance: "0",
            currency: "JPY",
            expense: "1200",
            income: "0",
          },
        },
      ],
      nextOffset: null,
    });

    const duplicate = await importService.hasPossibleNormalDuplicate({
      accountId: "account-1",
      items: [{ amount: 1200, categoryId: "category-1" }],
      ledgerId: "ledger-1",
      merchantId: "merchant-1",
      note: null,
      timeZoneOffsetMinutes: 0,
      totalAmount: 1200,
      transactionAt: "2026-09-17 10:00:00",
      type: "expense",
    });

    expect(duplicate).toBe(true);
    expect(getGroupItems).toHaveBeenCalledWith(
      currentLedger,
      "day",
      "2026-09-17",
      0,
      {
        accountId: "account-1",
        merchantId: "merchant-1",
        recordType: "expense",
      },
    );
  });

  it("转账会读取候选记录的真实转入账户，避免同名账户造成误报", async () => {
    const { getEditView, getGroupItems, importService } = createService();
    getGroupItems.mockResolvedValue({
      groups: [
        {
          date: "2026-09-17",
          items: [
            transactionListItem({
              account_name: "钱包 → 银行卡",
              amount: "5000",
              id: "transfer-1",
              type: "transfer",
            }),
          ],
          label: "9月17日",
          summary: { balance: "0", currency: "JPY", expense: "0", income: "0" },
        },
      ],
      nextOffset: null,
    });
    getEditView.mockResolvedValue({
      initialValues: {
        accountId: "from-account",
        note: "",
        transactionAt: "2026-09-17 10:00:00",
        transactionRecordId: "transfer-1",
        transferAmount: "5000",
        transferTargetAccountId: "other-same-name-account",
        type: "transfer",
      },
    });

    const duplicate = await importService.hasPossibleTransferDuplicate({
      accountId: "from-account",
      ledgerId: "ledger-1",
      note: null,
      timeZoneOffsetMinutes: 0,
      transactionAt: "2026-09-17 10:00:00",
      transferAmount: 5000,
      transferTargetAccountId: "to-account",
    });

    expect(duplicate).toBe(false);
    expect(getEditView).toHaveBeenCalledWith(currentLedger, "transfer-1");
  });

  it("转账两侧账户都一致时判定为疑似重复", async () => {
    const { getEditView, getGroupItems, importService } = createService();
    getGroupItems.mockResolvedValue({
      groups: [
        {
          date: "2026-09-17",
          items: [
            transactionListItem({
              amount: "5000",
              id: "transfer-1",
              type: "transfer",
            }),
          ],
          label: "9月17日",
          summary: { balance: "0", currency: "JPY", expense: "0", income: "0" },
        },
      ],
      nextOffset: null,
    });
    getEditView.mockResolvedValue({
      initialValues: {
        accountId: "from-account",
        note: "",
        transactionAt: "2026-09-17 10:00:00",
        transactionRecordId: "transfer-1",
        transferAmount: "5000",
        transferTargetAccountId: "to-account",
        type: "transfer",
      },
    });

    await expect(
      importService.hasPossibleTransferDuplicate({
        accountId: "from-account",
        ledgerId: "ledger-1",
        note: null,
        timeZoneOffsetMinutes: 0,
        transactionAt: "2026-09-17 10:00:00",
        transferAmount: 5000,
        transferTargetAccountId: "to-account",
      }),
    ).resolves.toBe(true);
  });
});
