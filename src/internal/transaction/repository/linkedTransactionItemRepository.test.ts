// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";
import {
  createSupabaseLinkedTransactionItemRepository,
  type UpdateLinkedTransactionEditInput,
  type UpdateLinkedTransactionItemInput,
} from "internal/transaction/repository/linkedTransactionItemRepository";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const transactionItemId = "00000000-0000-4000-8000-000000000201";
const accountId = "00000000-0000-4000-8000-000000000043";
const categoryId = "00000000-0000-4000-8000-000000005021";
const merchantId = "00000000-0000-4000-8000-000000001001";
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

function rpcFailure(details: string, code = "P0001") {
  return {
    data: null,
    error: {
      code,
      details,
      message: details,
    },
  };
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

const updateEditInput: UpdateLinkedTransactionEditInput = {
  itemUpdates: [
    {
      accountId,
      amount: 80,
      categoryId,
      expectedUpdatedAt: updatedAt,
      transactionItemId,
    },
  ],
  ledgerId,
  merchantId,
  note: "编辑备注",
  transactionAt: "2026-08-21T01:30:00.000Z",
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

  it("完整编辑 RPC 在一次调用中传递明细修改和交易头字段", async () => {
    const { repository, rpc } = createRepository();

    await repository.updateEdit(updateEditInput);

    expect(rpc).toHaveBeenCalledWith("update_linked_transaction_edit", {
      p_item_updates: updateEditInput.itemUpdates,
      p_ledger_id: ledgerId,
      p_merchant_id: merchantId,
      p_note: "编辑备注",
      p_transaction_at: "2026-08-21T01:30:00.000Z",
      p_transaction_record_id: transactionRecordId,
    });
  });

  it("完整编辑 RPC 的并发冲突继续映射为 ConflictError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("transaction_item_version_conflict"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toMatchObject({
      code: transactionErrorCodes.updateInvalid,
      name: ConflictError.name,
    });
  });

  it("updated_at 不一致映射为稳定 ConflictError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("transaction_item_version_conflict"),
    });

    await expect(repository.update(updateInput)).rejects.toMatchObject({
      code: "update_invalid",
      name: ConflictError.name,
    });
  });

  it("数据库未认证错误映射为 AuthenticationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("not_authenticated", "28000"),
    });

    await expect(repository.update(updateInput)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("数据库账本权限错误映射为 AuthorizationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("ledger_forbidden", "42501"),
    });

    await expect(repository.update(updateInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("交易明细不存在映射为 NotFoundError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("transaction_not_found", "22023"),
    });

    await expect(repository.update(updateInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("账户无效映射为稳定 accountInvalid ValidationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure(transactionErrorCodes.accountInvalid, "22023"),
    });

    await expect(repository.update(updateInput)).rejects.toMatchObject({
      code: transactionErrorCodes.accountInvalid,
      name: ValidationError.name,
    });
  });

  it("退款账户不一致映射为 refundLinkInvalid ValidationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("refund_account_mismatch", "22023"),
    });

    await expect(repository.update(updateInput)).rejects.toMatchObject({
      code: transactionErrorCodes.refundLinkInvalid,
      name: ValidationError.name,
    });
  });

  it("报销币种不一致映射为 reimbursementLinkInvalid ValidationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("reimbursement_currency_mismatch", "22023"),
    });

    await expect(repository.update(updateInput)).rejects.toMatchObject({
      code: transactionErrorCodes.reimbursementLinkInvalid,
      name: ValidationError.name,
    });
  });
});
