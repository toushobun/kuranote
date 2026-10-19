// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  transactionErrorCodes,
  transactionLinkedEditErrorMessages,
} from "internal/transaction/errors";
import {
  createSupabaseLinkedTransactionItemRepository,
  type UpdateLinkedTransactionEditInput,
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

const updateEditInput: UpdateLinkedTransactionEditInput = {
  itemUpdates: [
    {
      amount: 80,
      categoryId,
      expectedUpdatedAt: updatedAt,
      transactionItemId,
    },
  ],
  ledgerId,
  merchantId,
  note: "编辑备注",
  payments: [{ accountId, amount: null }],
  transactionAt: "2026-08-21T01:30:00.000Z",
  transactionRecordId,
};

describe("LinkedTransactionItemRepository", () => {
  it("编辑快照携带 updated_at 作为乐观锁版本", async () => {
    const { repository } = createRepository();

    await expect(
      repository.findEditSnapshot(ledgerId, transactionItemId),
    ).resolves.toEqual({
      amount: "120.00",
      categoryId,
      transactionItemId,
      transactionRecordId,
      updatedAt,
    });
  });

  it("完整编辑 RPC 在一次调用中传递明细修改、交易头字段与单账户付款明细", async () => {
    const { repository, rpc } = createRepository();

    await repository.updateEdit(updateEditInput);

    expect(rpc).toHaveBeenCalledWith("update_linked_transaction_edit", {
      p_expected_record_updated_at: null,
      p_item_updates: updateEditInput.itemUpdates,
      p_ledger_id: ledgerId,
      p_merchant_id: merchantId,
      p_note: "编辑备注",
      p_payments: [{ accountId }],
      p_transaction_at: "2026-08-21T01:30:00.000Z",
      p_transaction_record_id: transactionRecordId,
    });
  });

  it("多账户付款明细透传金额并提交记录版本到 RPC", async () => {
    const secondAccountId = "00000000-0000-4000-8000-000000000044";
    const recordUpdatedAt = "2026-08-20T12:00:00.000Z";
    const { repository, rpc } = createRepository();

    await repository.updateEdit({
      ...updateEditInput,
      expectedRecordUpdatedAt: recordUpdatedAt,
      payments: [
        { accountId, amount: "500" },
        { accountId: secondAccountId, amount: "700" },
      ],
    });

    expect(rpc).toHaveBeenCalledWith(
      "update_linked_transaction_edit",
      expect.objectContaining({
        p_expected_record_updated_at: recordUpdatedAt,
        p_payments: [
          { accountId, amount: "500" },
          { accountId: secondAccountId, amount: "700" },
        ],
      }),
    );
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

  it("数据库未认证错误映射为 AuthenticationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("not_authenticated", "28000"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("数据库账本权限错误映射为 AuthorizationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("ledger_forbidden", "42501"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("交易明细不存在映射为 NotFoundError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("transaction_not_found", "22023"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("账户无效映射为稳定 accountInvalid ValidationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure(transactionErrorCodes.accountInvalid, "22023"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toMatchObject({
      code: transactionErrorCodes.accountInvalid,
      name: ValidationError.name,
    });
  });

  it("退款币种不一致映射为 refundLinkInvalid ValidationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("refund_currency_mismatch", "22023"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toMatchObject({
      code: transactionErrorCodes.refundLinkInvalid,
      name: ValidationError.name,
      message: transactionLinkedEditErrorMessages.refundCurrencyMismatch,
    });
  });

  it("报销币种不一致映射为 reimbursementLinkInvalid ValidationError", async () => {
    const { repository } = createRepository({
      rpcResult: rpcFailure("reimbursement_currency_mismatch", "22023"),
    });

    await expect(repository.updateEdit(updateEditInput)).rejects.toMatchObject({
      code: transactionErrorCodes.reimbursementLinkInvalid,
      name: ValidationError.name,
      message: transactionLinkedEditErrorMessages.reimbursementCurrencyMismatch,
    });
  });

  it.each([
    [
      "payment_account_duplicate",
      transactionErrorCodes.paymentAccountDuplicate,
    ],
    ["payment_total_mismatch", transactionErrorCodes.paymentTotalMismatch],
    [
      "payment_multi_account_not_allowed",
      transactionErrorCodes.paymentMultiAccountNotAllowed,
    ],
    [
      "payment_currency_mismatch",
      transactionErrorCodes.paymentCurrencyMismatch,
    ],
    ["payment_amount_required", transactionErrorCodes.paymentAmountRequired],
  ] as const)(
    "数据库付款明细错误 %s 转换为安全的 ValidationError",
    async (databaseError, expectedCode) => {
      const { repository } = createRepository({
        rpcResult: rpcFailure(databaseError, "22023"),
      });

      await expect(
        repository.updateEdit(updateEditInput),
      ).rejects.toMatchObject({
        code: expectedCode,
        name: ValidationError.name,
      });
    },
  );
});
