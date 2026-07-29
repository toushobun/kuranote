// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
  getTransactionReadDependencies,
  requireTransactionReadLedger,
  type TransactionReadAccessDependencies,
} from "internal/transaction/service/transactionReadAccess";
import {
  AuthenticationError,
  NotFoundError,
} from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

function createDependencies(
  currentUserId: string | null = userId,
  role: "owner" | "admin" | "member" | "viewer" | null = "member",
): TransactionReadAccessDependencies {
  return {
    accountQueryService: {} as never,
    categoryQueryService: {} as never,
    currentUserId,
    ledgerAccessService: {
      getActiveMemberRole: vi.fn().mockResolvedValue(role),
    },
    merchantQueryService: {} as never,
    transactionRepository: {} as never,
  };
}

const currentLedger = {
  baseCurrency: "JPY",
  currentUserId: userId,
  currentUserRole: "owner" as const,
  id: ledgerId,
  name: "家庭账本",
};

describe("transactionReadAccess", () => {
  it("未登录时拒绝构造读取依赖", () => {
    expect(() =>
      getTransactionReadDependencies(createDependencies(null)),
    ).toThrow(AuthenticationError);
  });

  it("active 成员读取时用真实用户和角色补全账本", async () => {
    await expect(
      requireTransactionReadLedger(
        createDependencies(userId, "viewer"),
        currentLedger,
      ),
    ).resolves.toEqual({
      ...currentLedger,
      currentUserId: userId,
      currentUserRole: "viewer",
    });
  });

  it("非成员或归档账本读取时返回统一 404", async () => {
    await expect(
      requireTransactionReadLedger(
        createDependencies(userId, null),
        currentLedger,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
