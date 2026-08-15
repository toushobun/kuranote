// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createSupabaseTransactionIncomeLinkRepository } from "internal/transaction/repository/transactionIncomeLinkRepository";

describe("TransactionIncomeLinkRepository", () => {
  type QueryResult = {
    data: unknown;
    error: { code?: string } | null;
  };

  function createQuery(result: QueryResult) {
    const query = {
      eq: vi.fn(),
      in: vi.fn(),
      select: vi.fn(),
      then: (
        resolve: (value: QueryResult) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.select.mockReturnValue(query);
    return query;
  }

  it("从新报销关联表和退款关联表读取收入关联目标", async () => {
    const ledgerId = "00000000-0000-4000-8000-000000000032";
    const incomeItemId = "00000000-0000-4000-8000-000000000201";
    const reimbursementTargetId = "00000000-0000-4000-8000-000000000202";
    const refundTargetId = "00000000-0000-4000-8000-000000000203";
    const reimbursementRecordId = "00000000-0000-4000-8000-000000000301";
    const refundRecordId = "00000000-0000-4000-8000-000000000302";
    const accountId = "00000000-0000-4000-8000-000000000043";
    const categoryId = "00000000-0000-4000-8000-000000005021";
    const queries = {
      transaction_item_refund_link: createQuery({
        data: [
          {
            refund_amount: "30.00",
            refund_income_item_id: incomeItemId,
            refunded_item_id: refundTargetId,
          },
        ],
        error: null,
      }),
      transaction_item_reimbursement_link: createQuery({
        data: [
          {
            reimbursement_income_item_id: incomeItemId,
            target_expense_item_id: reimbursementTargetId,
          },
        ],
        error: null,
      }),
      transaction_item_with_refund: createQuery({
        data: [
          {
            account_id: accountId,
            amount: "100.00",
            category_id: categoryId,
            id: reimbursementTargetId,
            refunded_amount: "0.00",
            transaction_record_id: reimbursementRecordId,
          },
          {
            account_id: accountId,
            amount: "80.00",
            category_id: categoryId,
            id: refundTargetId,
            refunded_amount: "30.00",
            transaction_record_id: refundRecordId,
          },
        ],
        error: null,
      }),
      transaction_record: createQuery({
        data: [
          {
            id: reimbursementRecordId,
            transaction_at: "2026-08-15T01:00:00.000Z",
          },
          {
            id: refundRecordId,
            transaction_at: "2026-08-15T02:00:00.000Z",
          },
        ],
        error: null,
      }),
    };
    const from = vi.fn((table: keyof typeof queries) => queries[table]);
    const repository = createSupabaseTransactionIncomeLinkRepository(
      { from } as never,
      { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    );

    await expect(
      repository.listByIncomeItemIds(ledgerId, [incomeItemId]),
    ).resolves.toEqual([
      {
        incomeItemId,
        refundAllocations: [
          {
            refundAmount: "30.00",
            refundedItem: {
              accountId,
              amount: "80.00",
              categoryId,
              id: refundTargetId,
              refundedAmount: "30.00",
              transactionAt: "2026-08-15T02:00:00.000Z",
              transactionRecordId: refundRecordId,
            },
          },
        ],
        reimbursementItems: [
          {
            accountId,
            amount: "100.00",
            categoryId,
            id: reimbursementTargetId,
            refundedAmount: "0.00",
            transactionAt: "2026-08-15T01:00:00.000Z",
            transactionRecordId: reimbursementRecordId,
          },
        ],
      },
    ]);

    expect(from).toHaveBeenCalledWith("transaction_item_reimbursement_link");
    expect(queries.transaction_item_reimbursement_link.in).toHaveBeenCalledWith(
      "reimbursement_income_item_id",
      [incomeItemId],
    );
  });
});
