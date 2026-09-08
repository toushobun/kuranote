// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { transactionErrorCodes } from "internal/transaction/errors";
import { createTransactionService } from "internal/transaction/service/transactionService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userA = "00000000-0000-4000-8000-000000000031";
const userB = "00000000-0000-4000-8000-000000000033";
const inactiveUser = "00000000-0000-4000-8000-000000000099";

function createService(activeMemberIds: string[]) {
  const listActiveMemberIds = vi.fn().mockResolvedValue(activeMemberIds);
  const service = createTransactionService({
    accountQueryService: {} as never,
    categoryQueryService: {} as never,
    currentUserId: userA,
    ledgerAccessService: {} as never,
    merchantQueryService: {} as never,
    transactionRepository: { listActiveMemberIds } as never,
  });

  return { listActiveMemberIds, service };
}

describe("TransactionService consumer validation", () => {
  it("未显式提交消费者时保持 undefined 并交由数据库默认逻辑处理", async () => {
    const { listActiveMemberIds, service } = createService([userA]);

    await expect(
      service.validateConsumerUserIds({ ledgerId }),
    ).resolves.toBeUndefined();
    expect(listActiveMemberIds).not.toHaveBeenCalled();
  });

  it("显式消费者只允许 active 成员并去重", async () => {
    const { listActiveMemberIds, service } = createService([userA, userB]);

    await expect(
      service.validateConsumerUserIds({
        consumerUserIds: [userB, userA, userB],
        ledgerId,
      }),
    ).resolves.toEqual([userB, userA]);
    expect(listActiveMemberIds).toHaveBeenCalledWith(ledgerId);
  });

  it("包含非 active 成员时拒绝保存", async () => {
    const { service } = createService([userA, userB]);

    await expect(
      service.validateConsumerUserIds({
        consumerUserIds: [userA, inactiveUser],
        ledgerId,
      }),
    ).rejects.toMatchObject({ code: transactionErrorCodes.consumerInvalid });
  });

  it("显式空数组时拒绝保存", async () => {
    const { service } = createService([userA]);

    await expect(
      service.validateConsumerUserIds({ consumerUserIds: [], ledgerId }),
    ).rejects.toMatchObject({ code: transactionErrorCodes.consumerInvalid });
  });
});
