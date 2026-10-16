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
      order: vi.fn(),
      select: vi.fn(),
      then: (
        resolve: (value: QueryResult) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.order.mockReturnValue(query);
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
            reimbursement_amount: "40.00",
            reimbursement_income_item_id: incomeItemId,
            target_expense_item_id: reimbursementTargetId,
          },
        ],
        error: null,
      }),
      transaction_item_with_refund: createQuery({
        data: [
          {
            amount: "100.00",
            category_id: categoryId,
            id: reimbursementTargetId,
            refunded_amount: "10.00",
            reimbursement_amount: "70.00",
            transaction_record_id: reimbursementRecordId,
          },
          {
            amount: "80.00",
            category_id: categoryId,
            id: refundTargetId,
            refunded_amount: "30.00",
            reimbursement_amount: "20.00",
            transaction_record_id: refundRecordId,
          },
        ],
        error: null,
      }),
      transaction_payment: createQuery({
        data: [
          {
            account_id: accountId,
            transaction_record_id: reimbursementRecordId,
          },
          {
            account_id: accountId,
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
        refundItem: {
          accountId,
          amount: "80.00",
          categoryId,
          id: refundTargetId,
          refundedAmount: "30.00",
          refundLinkAmount: "30.00",
          reimbursementAmount: "20.00",
          transactionAt: "2026-08-15T02:00:00.000Z",
          transactionRecordId: refundRecordId,
        },
        reimbursementItems: [
          {
            accountId,
            amount: "100.00",
            categoryId,
            id: reimbursementTargetId,
            refundedAmount: "10.00",
            reimbursementAmount: "70.00",
            reimbursementLinkAmount: "40.00",
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

  it("关联对方为多账户记录时取 sort_order 最小的首个付款账户", async () => {
    const ledgerId = "00000000-0000-4000-8000-000000000032";
    const incomeItemId = "00000000-0000-4000-8000-000000000201";
    const refundTargetId = "00000000-0000-4000-8000-000000000203";
    const refundRecordId = "00000000-0000-4000-8000-000000000302";
    const firstAccountId = "00000000-0000-4000-8000-000000000043";
    const secondAccountId = "00000000-0000-4000-8000-000000000044";
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
        data: [],
        error: null,
      }),
      transaction_item_with_refund: createQuery({
        data: [
          {
            amount: "80.00",
            category_id: categoryId,
            id: refundTargetId,
            refunded_amount: "30.00",
            reimbursement_amount: "20.00",
            transaction_record_id: refundRecordId,
          },
        ],
        error: null,
      }),
      // 付款明细已按 sort_order 升序返回，仓储取第一条即为首个付款账户。
      transaction_payment: createQuery({
        data: [
          { account_id: firstAccountId, transaction_record_id: refundRecordId },
          {
            account_id: secondAccountId,
            transaction_record_id: refundRecordId,
          },
        ],
        error: null,
      }),
      transaction_record: createQuery({
        data: [
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

    const result = await repository.listByIncomeItemIds(ledgerId, [
      incomeItemId,
    ]);

    expect(result[0]?.refundItem?.accountId).toBe(firstAccountId);
  });
});
