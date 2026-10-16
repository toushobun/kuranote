// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestContainer } from "internal/container";
import {
  convertTransactionHandler,
  createTransactionHandler,
  updateTransactionHandler,
  voidTransactionHandler,
} from "internal/transaction/controller/transactionController";

const mocks = vi.hoisted(() => ({ revalidateTransactionMutation: vi.fn() }));

vi.mock("internal/transaction/adapter/next/revalidate", () => ({
  revalidateTransactionMutation: mocks.revalidateTransactionMutation,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const accountId = "00000000-0000-4000-8000-000000000045";
const targetAccountId = "00000000-0000-4000-8000-000000000046";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const userId = "00000000-0000-4000-8000-000000000031";
const currentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "owner" as const,
  id: ledgerId,
  name: "家庭账本",
};

const normalInput = {
  accountId,
  items: [{ amount: 1200, categoryId }],
  ledgerId,
  merchantId,
  note: "午餐",
  transactionAt: "2026-07-20T01:00:00.000Z",
  type: "expense" as const,
};

const transferInput = {
  accountId,
  ledgerId,
  note: "转入储蓄",
  transactionAt: "2026-07-20T01:00:00.000Z",
  transferAmount: 3000,
  transferTargetAccountId: targetAccountId,
  type: "transfer" as const,
};

function createService() {
  return {
    convert: vi.fn(),
    createNormal: vi.fn(),
    createTransfer: vi.fn(),
    updateNormal: vi.fn(),
    updateBalanceAdjustment: vi.fn(),
    updateTransfer: vi.fn(),
    void: vi.fn(),
  } as unknown as RequestContainer["transaction"]["service"];
}

function createContext(
  validated: Partial<Record<"json" | "param" | "query", unknown>>,
  service: RequestContainer["transaction"]["service"],
) {
  const linkedTransactionEditService = {
    updateNormal: vi.fn(),
    void: vi.fn(),
  } as RequestContainer["transaction"]["linkedTransactionEditService"];
  const getAccessibleLedger = vi.fn().mockResolvedValue(currentLedger);
  const json = vi
    .fn()
    .mockImplementation((body: unknown, status: number) => ({ body, status }));
  const valid = vi
    .fn()
    .mockImplementation(
      (target: "json" | "param" | "query") => validated[target],
    );
  const get = vi.fn().mockImplementation((key: string) => {
    if (key === "requestDependencies") {
      return {
        auth: {
          email: "user@example.com",
          isAuthenticated: true,
          userId,
        },
      };
    }
    if (key === "container") {
      return {
        ledger: { currentLedgerService: { getAccessibleLedger } },
        transaction: { linkedTransactionEditService, service },
      };
    }
    return undefined;
  });

  return {
    get,
    getAccessibleLedger,
    json,
    linkedTransactionEditService,
    req: { valid },
  };
}

describe("transactionController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("创建普通交易时只调用 createNormal", async () => {
    const service = createService();
    const context = createContext({ json: normalInput }, service);

    await createTransactionHandler(
      context as unknown as Parameters<typeof createTransactionHandler>[0],
    );

    expect(service.createNormal).toHaveBeenCalledWith({
      items: normalInput.items,
      ledgerId: normalInput.ledgerId,
      merchantId: normalInput.merchantId,
      note: normalInput.note,
      payments: [{ accountId, amount: null }],
      transactionAt: normalInput.transactionAt,
      type: normalInput.type,
    });
    expect(service.createTransfer).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
    expect(context.json).toHaveBeenCalledWith({ ok: true }, 201);
  });

  it("创建转账时只向 createTransfer 传递转账字段", async () => {
    const service = createService();
    const context = createContext({ json: transferInput }, service);

    await createTransactionHandler(
      context as unknown as Parameters<typeof createTransactionHandler>[0],
    );

    expect(service.createTransfer).toHaveBeenCalledWith({
      accountId,
      ledgerId,
      note: "转入储蓄",
      transactionAt: "2026-07-20T01:00:00.000Z",
      transferAmount: 3000,
      transferTargetAccountId: targetAccountId,
    });
    expect(service.createNormal).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("更新普通交易时通过关联编辑 Service 保存", async () => {
    const service = createService();
    const context = createContext(
      {
        json: {
          ...normalInput,
          confirmSync: false,
          expectedUpdatedAtByItemId: {},
        },
        param: { transactionRecordId },
      },
      service,
    );

    await updateTransactionHandler(
      context as unknown as Parameters<typeof updateTransactionHandler>[0],
    );

    expect(context.getAccessibleLedger).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
    expect(
      context.linkedTransactionEditService.updateNormal,
    ).toHaveBeenCalledWith(currentLedger, {
      confirmSync: false,
      expectedUpdatedAtByItemId: {},
      items: normalInput.items,
      ledgerId: normalInput.ledgerId,
      merchantId: normalInput.merchantId,
      note: normalInput.note,
      payments: [{ accountId, amount: null }],
      transactionAt: normalInput.transactionAt,
      transactionRecordId,
      type: normalInput.type,
    });
    expect(service.updateNormal).not.toHaveBeenCalled();
    expect(service.updateTransfer).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
    expect(context.json).toHaveBeenCalledWith({ ok: true }, 200);
  });

  it("更新转账时只向 updateTransfer 传递转账字段和记录 ID", async () => {
    const service = createService();
    const context = createContext(
      {
        json: transferInput,
        param: { transactionRecordId },
      },
      service,
    );

    await updateTransactionHandler(
      context as unknown as Parameters<typeof updateTransactionHandler>[0],
    );

    expect(service.updateTransfer).toHaveBeenCalledWith({
      accountId,
      ledgerId,
      note: "转入储蓄",
      transactionAt: "2026-07-20T01:00:00.000Z",
      transactionRecordId,
      transferAmount: 3000,
      transferTargetAccountId: targetAccountId,
    });
    expect(service.updateNormal).not.toHaveBeenCalled();
    expect(context.getAccessibleLedger).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("转换为普通交易时透传付款明细", async () => {
    const service = createService();
    const context = createContext(
      {
        json: {
          accountId,
          items: normalInput.items,
          ledgerId: normalInput.ledgerId,
          merchantId: normalInput.merchantId,
          note: normalInput.note,
          targetType: "expense",
          transactionAt: normalInput.transactionAt,
        },
        param: { transactionRecordId },
      },
      service,
    );

    await convertTransactionHandler(
      context as unknown as Parameters<typeof convertTransactionHandler>[0],
    );

    expect(service.convert).toHaveBeenCalledWith({
      items: normalInput.items,
      ledgerId: normalInput.ledgerId,
      merchantId: normalInput.merchantId,
      note: normalInput.note,
      payments: [{ accountId, amount: null }],
      targetType: "expense",
      transactionAt: normalInput.transactionAt,
      transactionRecordId,
    });
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
    expect(context.json).toHaveBeenCalledWith({ ok: true }, 200);
  });

  it("转换为转账时按转账字段透传", async () => {
    const service = createService();
    const context = createContext(
      {
        json: {
          accountId,
          ledgerId: transferInput.ledgerId,
          note: transferInput.note,
          targetType: "transfer",
          transactionAt: transferInput.transactionAt,
          transferAmount: transferInput.transferAmount,
          transferTargetAccountId: targetAccountId,
        },
        param: { transactionRecordId },
      },
      service,
    );

    await convertTransactionHandler(
      context as unknown as Parameters<typeof convertTransactionHandler>[0],
    );

    expect(service.convert).toHaveBeenCalledWith({
      accountId,
      ledgerId: transferInput.ledgerId,
      note: transferInput.note,
      targetType: "transfer",
      transactionAt: transferInput.transactionAt,
      transactionRecordId,
      transferAmount: transferInput.transferAmount,
      transferTargetAccountId: targetAccountId,
    });
  });

  it("作废交易时通过关联编辑 Service 校验并删除", async () => {
    const service = createService();
    const context = createContext(
      {
        param: { transactionRecordId },
        query: { ledgerId },
      },
      service,
    );

    await voidTransactionHandler(
      context as unknown as Parameters<typeof voidTransactionHandler>[0],
    );

    expect(context.linkedTransactionEditService.void).toHaveBeenCalledWith(
      currentLedger,
      { ledgerId, transactionRecordId },
    );
    expect(service.void).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });
});
