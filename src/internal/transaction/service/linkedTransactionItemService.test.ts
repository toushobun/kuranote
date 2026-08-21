// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "internal/shared/errors/appError";
import type { LinkedTransactionItemRepository } from "internal/transaction/repository/linkedTransactionItemRepository";
import { createLinkedTransactionItemService } from "internal/transaction/service/linkedTransactionItemService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000034";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const transactionItemId = "00000000-0000-4000-8000-000000000201";
const updatedAt = "2026-08-19T13:00:00.000Z";

function createLinkedRepository(
  overrides: Partial<LinkedTransactionItemRepository> = {},
): LinkedTransactionItemRepository {
  return {
    findEditSnapshot: vi.fn().mockResolvedValue({
      accountId: "00000000-0000-4000-8000-000000000043",
      amount: "120.00",
      categoryId: "00000000-0000-4000-8000-000000005021",
      transactionItemId,
      transactionRecordId,
      updatedAt,
    }),
    update: vi.fn(),
    ...overrides,
  };
}

function createService(options?: {
  currentUserId?: string | null;
  role?: "owner" | "admin" | "member" | "viewer";
  linkedRepository?: LinkedTransactionItemRepository;
  recordCreatedBy?: string | null;
  recordExists?: boolean;
}) {
  const linkedRepository =
    options?.linkedRepository ?? createLinkedRepository();
  const service = createLinkedTransactionItemService({
    currentUserId:
      options?.currentUserId === undefined ? userId : options.currentUserId,
    ledgerAccessService: {
      getActiveMemberRole: vi.fn().mockResolvedValue(options?.role ?? "member"),
    } as never,
    linkedTransactionItemRepository: linkedRepository,
    transactionRepository: {
      findActiveRecord: vi.fn().mockResolvedValue(
        options?.recordExists === false
          ? null
          : {
              created_at: "2026-08-19T12:00:00.000Z",
              created_by:
                options?.recordCreatedBy === undefined
                  ? userId
                  : options.recordCreatedBy,
              id: transactionRecordId,
              merchant_id: null,
              note: null,
              transaction_at: "2026-08-19T12:00:00.000Z",
              type: "normal",
            },
      ),
    },
  });
  return { linkedRepository, service };
}

const updateInput = {
  accountId: "00000000-0000-4000-8000-000000000043",
  amount: 80,
  categoryId: "00000000-0000-4000-8000-000000005021",
  expectedUpdatedAt: updatedAt,
  ledgerId,
  transactionItemId,
  transactionRecordId,
};

describe("LinkedTransactionItemService", () => {
  it("有修改权限时返回携带 updatedAt 的编辑快照", async () => {
    const { service } = createService();

    await expect(
      service.getEditSnapshot({
        ledgerId,
        transactionItemId,
        transactionRecordId,
      }),
    ).resolves.toMatchObject({ updatedAt });
  });

  it("有修改权限时调用原子 Repository", async () => {
    const { linkedRepository, service } = createService();

    await service.update(updateInput);

    expect(linkedRepository.update).toHaveBeenCalledWith(updateInput);
  });

  it("未登录不能调用关联编辑能力", async () => {
    const { linkedRepository, service } = createService({
      currentUserId: null,
    });

    await expect(service.update(updateInput)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(linkedRepository.update).not.toHaveBeenCalled();
  });

  it("viewer 不能调用关联编辑能力", async () => {
    const { linkedRepository, service } = createService({ role: "viewer" });

    await expect(service.update(updateInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(linkedRepository.update).not.toHaveBeenCalled();
  });

  it("目标交易已不存在时在调用关联 Repository 前返回 NotFoundError", async () => {
    const { linkedRepository, service } = createService({
      recordExists: false,
    });

    await expect(service.update(updateInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(linkedRepository.update).not.toHaveBeenCalled();
  });

  it("member 不能修改其他成员创建的交易", async () => {
    const { linkedRepository, service } = createService({
      recordCreatedBy: otherUserId,
      role: "member",
    });

    await expect(service.update(updateInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(linkedRepository.update).not.toHaveBeenCalled();
  });

  it("编辑快照不属于请求交易时返回 NotFoundError", async () => {
    const linkedRepository = createLinkedRepository({
      findEditSnapshot: vi.fn().mockResolvedValue({
        accountId: "00000000-0000-4000-8000-000000000043",
        amount: "120.00",
        categoryId: "00000000-0000-4000-8000-000000005021",
        transactionItemId,
        transactionRecordId: "00000000-0000-4000-8000-000000008888",
        updatedAt,
      }),
    });
    const { service } = createService({ linkedRepository });

    await expect(
      service.getEditSnapshot({
        ledgerId,
        transactionItemId,
        transactionRecordId,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("Repository 的并发 ConflictError 原样透出", async () => {
    const conflict = new ConflictError(
      "update_invalid",
      "交易明细已被其他操作更新，请刷新后重试。",
    );
    const linkedRepository = createLinkedRepository({
      update: vi.fn().mockRejectedValue(conflict),
    });
    const { service } = createService({ linkedRepository });

    await expect(service.update(updateInput)).rejects.toBe(conflict);
  });
});
