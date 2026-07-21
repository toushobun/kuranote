// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseTransactionRepository } from "server/transaction/repository/transactionRepository";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";

function createRepository(rpc = vi.fn()) {
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  const maybeSingle = vi.fn();
  const query = {
    eq: vi.fn(),
    in: vi.fn(),
    maybeSingle,
    select: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  const supabase = { from: vi.fn().mockReturnValue(query), rpc };
  return {
    logger,
    maybeSingle,
    repository: createSupabaseTransactionRepository(supabase as never, logger),
    rpc,
  };
}

describe("TransactionRepository", () => {
  it("普通交易创建继续调用原子 RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const { repository } = createRepository(rpc);
    await repository.createNormal({
      accountId: "00000000-0000-4000-8000-000000000045",
      items: [
        {
          amount: 1200,
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
      ],
      ledgerId,
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: null,
      tagNames: ["日常"],
      transactionAt: "2026-06-04T01:00:00.000Z",
      type: "expense",
    });
    expect(rpc).toHaveBeenCalledWith(
      "create_transaction",
      expect.objectContaining({ p_ledger_id: ledgerId, p_type: "expense" }),
    );
  });

  it("RPC 权限错误只转换为安全应用错误", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { details: "permission_denied", message: "database details" },
    });
    const { logger, repository } = createRepository(rpc);
    await expect(
      repository.void(ledgerId, transactionRecordId),
    ).rejects.toMatchObject({
      code: "permission_denied",
      message: "交易操作失败，请稍后重试。",
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("权限读取限定账本、有效状态与交易 ID", async () => {
    const { maybeSingle, repository } = createRepository();
    maybeSingle.mockResolvedValue({
      data: {
        created_at: "2026-06-04T01:00:00.000Z",
        created_by: "00000000-0000-4000-8000-000000000031",
        id: transactionRecordId,
        merchant_id: null,
        note: null,
        transaction_at: "2026-06-04T01:00:00.000Z",
        type: "normal",
      },
      error: null,
    });
    await expect(
      repository.findActiveRecord(ledgerId, transactionRecordId),
    ).resolves.toMatchObject({ id: transactionRecordId, type: "normal" });
  });
});
