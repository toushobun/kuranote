// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedger } from "internal/ledger";
import type { TransactionItemDbRow } from "internal/db-types";
import type { TransactionIncomeLinkRepository } from "internal/transaction/repository/transactionIncomeLinkRepository";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import { getEditTransactionView } from "internal/transaction/service/read/transactionFormService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const accountId = "00000000-0000-4000-8000-000000000045";
const expenseCategoryId = "00000000-0000-4000-8000-000000005072";
const incomeCategoryId = "00000000-0000-4000-8000-000000005073";
const incomeItemId = "00000000-0000-4000-8000-000000008001";
const linkedExpenseItemId = "00000000-0000-4000-8000-000000008002";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member",
  id: ledgerId,
  name: "家庭账本",
  transactionItemSpecialStatusEnabled: true,
};

function createDependencies({
  incomeLinkRepository,
  itemOverrides,
}: {
  incomeLinkRepository?: TransactionIncomeLinkRepository;
  itemOverrides: Partial<TransactionItemDbRow>;
}) {
  const repository: TransactionFormRepository = {
    findActiveRecord: vi.fn().mockResolvedValue({
      created_at: "2026-08-03T01:00:00.000Z",
      created_by: userId,
      id: transactionRecordId,
      merchant_id: null,
      note: null,
      transaction_at: "2026-08-03T01:00:00.000Z",
      type: "normal",
    }),
    listItems: vi.fn().mockResolvedValue([
      {
        account_id: accountId,
        amount: "1000",
        balance_delta: "-1000",
        category_id: expenseCategoryId,
        id: incomeItemId,
        note: null,
        transaction_record_id: transactionRecordId,
        ...itemOverrides,
      },
    ]),
    listPendingReimbursementItems: vi.fn().mockResolvedValue([]),
  };

  return {
    accountQueryService: {
      getTransactionContext: vi.fn(),
      listTransactionOptions: vi
        .fn()
        .mockResolvedValue([{ currency: "JPY", id: accountId, name: "现金" }]),
    },
    categoryQueryService: {
      findSummariesByIds: vi.fn(),
      listActiveSummaries: vi.fn().mockResolvedValue([
        {
          id: expenseCategoryId,
          name: "餐饮",
          parent_id: null,
          type: "expense",
        },
        {
          id: incomeCategoryId,
          name: "退款收入",
          parent_id: null,
          type: "income",
        },
      ]),
    },
    currentUserId: userId,
    merchantQueryService: {
      findSummariesByIds: vi.fn(),
      listActiveOptions: vi.fn().mockResolvedValue([]),
    },
    transactionIncomeLinkRepository: incomeLinkRepository,
    transactionRepository: repository,
  };
}

describe("getEditTransactionView linked restriction", () => {
  it.each([
    ["已报销支出", { special_status: "reimbursed" as const }],
    [
      "作为报销对象",
      {
        settled_by_item_id: "00000000-0000-4000-8000-000000008003",
      },
    ],
    [
      "作为退款对象",
      { has_refund_link: true, is_refund_income: false },
    ],
  ])("%s 返回整体只读态", async (_label, itemOverrides) => {
    const view = await getEditTransactionView(
      createDependencies({ itemOverrides }),
      currentLedger,
      transactionRecordId,
    );

    expect(view).toMatchObject({
      canEdit: false,
      editRestriction: "linked",
    });
  });

  it("报销收入允许编辑并回填已选支出", async () => {
    const incomeLinkRepository: TransactionIncomeLinkRepository = {
      listByIncomeItemIds: vi.fn().mockResolvedValue([
        {
          incomeItemId,
          refundedItem: null,
          reimbursementItems: [
            {
              accountId,
              amount: "1000",
              categoryId: expenseCategoryId,
              id: linkedExpenseItemId,
              refundedAmount: "0",
              transactionAt: "2026-08-01T01:00:00.000Z",
              transactionRecordId:
                "00000000-0000-4000-8000-000000009998",
            },
          ],
        },
      ]),
    };

    const view = await getEditTransactionView(
      createDependencies({
        incomeLinkRepository,
        itemOverrides: {
          balance_delta: "1000",
          category_id: incomeCategoryId,
          is_reimbursement_income: true,
        },
      }),
      currentLedger,
      transactionRecordId,
    );

    expect(view).toMatchObject({
      canEdit: true,
      editRestriction: null,
      initialValues: {
        items: [
          {
            businessStatus: "reimbursement",
            reimbursementItemIds: [linkedExpenseItemId],
          },
        ],
      },
      reimbursementCandidates: [{ id: linkedExpenseItemId }],
    });
  });

  it("退款收入允许编辑并回填退款对象", async () => {
    const incomeLinkRepository: TransactionIncomeLinkRepository = {
      listByIncomeItemIds: vi.fn().mockResolvedValue([
        {
          incomeItemId,
          refundedItem: {
            accountId,
            amount: "3000",
            categoryId: expenseCategoryId,
            id: linkedExpenseItemId,
            refundedAmount: "1000",
            transactionAt: "2026-08-01T01:00:00.000Z",
            transactionRecordId:
              "00000000-0000-4000-8000-000000009998",
          },
          reimbursementItems: [],
        },
      ]),
    };

    const view = await getEditTransactionView(
      createDependencies({
        incomeLinkRepository,
        itemOverrides: {
          balance_delta: "1000",
          category_id: incomeCategoryId,
          has_refund_link: true,
          is_refund_income: true,
        },
      }),
      currentLedger,
      transactionRecordId,
    );

    expect(view).toMatchObject({
      canEdit: true,
      editRestriction: null,
      initialValues: {
        items: [
          {
            businessStatus: "refund",
            refundedItemId: linkedExpenseItemId,
            refundCandidate: {
              id: linkedExpenseItemId,
              remainingRefundableAmount: "3000",
            },
          },
        ],
      },
    });
  });
});
