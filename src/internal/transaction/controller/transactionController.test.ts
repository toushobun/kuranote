// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestContainer } from "internal/container";
import {
  createTransactionHandler,
  updateTransactionHandler,
} from "internal/transaction/controller/transactionController";

const mocks = vi.hoisted(() => ({ revalidateTransactionMutation: vi.fn() }));

vi.mock("internal/transaction/adapter/next/revalidate", () => ({
  revalidateTransactionMutation: mocks.revalidateTransactionMutation,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const accountId = "00000000-0000-4000-8000-000000000045";
const targetAccountId = "00000000-0000-4000-8000-000000000046";
const categoryId = "00000000-0000-4000-8000-000000005072";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";

const normalInput = {
  accountId,
  items: [{ amount: 1200, categoryId }],
  ledgerId,
  merchantId: null,
  note: "午餐",
  tagNames: ["工作日"],
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
    updateTransfer: vi.fn(),
    void: vi.fn(),
  } as unknown as RequestContainer["transaction"]["service"];
}

function createContext(
  validated: Partial<Record<"json" | "param" | "query", unknown>>,
  service: RequestContainer["transaction"]["service"],
) {
  const json = vi.fn().mockImplementation((body, status) => ({ body, status }));
  const valid = vi
    .fn()
    .mockImplementation((target: "json" | "param" | "query") =>
      validated[target],
    );
  const get = vi.fn().mockImplementation((key: string) => {
    if (key === "requestDependencies") {
      return {
        auth: {
          email: "user@example.com",
          isAuthenticated: true,
          userId: "00000000-0000-4000-8000-000000000031",
        },
      };
    }
    if (key === "container") {
      return { transaction: { service } };
    }
    return undefined;
  });

  return { get, json, req: { valid } };
}

describe("transactionController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("创建普通交易时只调用 createNormal", async () => {
    const service = createService();
    const context = createContext({ json: normalInput }, service);

    await createTransactionHandler(
      context as unknown as Parameters<typeof createTransactionHandler>[0],
    );

    expect(service.createNormal).toHaveBeenCalledWith(normalInput);
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

  it("更新普通交易时附加路径中的交易记录 ID", async () => {
    const service = createService();
    const context = createContext(
      {
        json: normalInput,
        param: { transactionRecordId },
      },
      service,
    );

    await updateTransactionHandler(
      context as unknown as Parameters<typeof updateTransactionHandler>[0],
    );

    expect(service.updateNormal).toHaveBeenCalledWith({
      ...normalInput,
      transactionRecordId,
    });
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
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });
});
