// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "internal/shared/errors/appError";
import {
  createSupabaseLinkedTransactionItemRepository,
  type UpdateLinkedTransactionItemInput,
} from "internal/transaction/repository/linkedTransactionItemRepository";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const transactionItemId = "00000000-0000-4000-8000-000000000201";
const accountId = "00000000-0000-4000-8000-000000000043";
const categoryId = "00000000-0000-4000-8000-000000005021";
const updatedAt = "2026-08-19T13:00:00.000Z";

function createQuery(result: { data: unknown; error: unknown | null }) {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    select: vi.fn(),
  };
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
}

function createRepository(options?: {
  queryResult?: { data: unknown; error: unknown | null };
  rpcResult?: { data: unknown; error: unknown | null };
}) {
  const query = createQuery(
    options?.queryResult ?? {
      data: {
        account_id: accountId,
        amount: "120.00",
        category_id: categoryId,
        id: transactionItemId,
        transaction_record_id: transactionRecordId,
        updated_at: updatedAt,
      },
      error: null,
    },
  );
  const from = vi.fn().mockReturnValue(query);
  const rpc = vi
    .fn()
    .mockResolvedValue(options?.rpcResult ?? { data: null, error: null });
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  const repository = createSupabaseLinkedTransactionItemRepository(
    { from, rpc } as never,
    logger,
  );
  return { from, logger, query, repository, rpc };
}

const updateInput: UpdateLinkedTransactionItemInput = {
  accountId,
  amount: 80,
  categoryId,
  expectedUpdatedAt: updatedAt,
  ledgerId,
  transactionItemId,
  transactionRecordId,
};

describe("LinkedTransactionItemRepository", () => {
  it("编辑快照携带 updated_at 作为乐观锁版本", async () => {
    const { repository } = createRepository();

    await expect(
      repository.findEditSnapshot(ledgerId, transactionItemId),
    ).resolves.toEqual({
      accountId,
      amount: "120.00",
      categoryId,
      transactionItemId,
      transactionRecordId,
      updatedAt,
    });
  });

  it("原子编辑 RPC 传递新值和 expectedUpdatedAt", async () => {
    const { repository, rpc } = createRepository();

    await repository.update(updateInput);

    expect(rpc).toHaveBeenCalledWith("update_linked_transaction_item", {
      p_account_id: accountId,
      p_amount: 80,
      p_category_id: categoryId,
      p_expected_updated_at: updatedAt,
      p_ledger_id: ledgerId,
      p_transaction_item_id: transactionItemId,
      p_transaction_record_id: transactionRecordId,
    });
  });

  it("updated_at 不一致映射为稳定 ConflictError", async () => {
    const { repository } = createRepository({
      rpcResult: {
        data: null,
        error: {
          code: "P0001",
          details: "transaction_item_version_conflict",
          message: "transaction_item_version_conflict",
        },
      },
    });

    await expect(repository.update(updateInput)).rejects.toMatchObject({
      code: "update_invalid",
      name: ConflictError.name,
    });
  });
});
