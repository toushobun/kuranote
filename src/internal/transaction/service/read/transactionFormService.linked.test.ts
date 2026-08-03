// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedger } from "internal/ledger";
import type { TransactionItemDbRow } from "internal/db-types";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import { getEditTransactionView } from "internal/transaction/service/read/transactionFormService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const accountId = "00000000-0000-4000-8000-000000000045";
const categoryId = "00000000-0000-4000-8000-000000005072";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member",
  id: ledgerId,
  name: "家庭账本",
  transactionItemSpecialStatusEnabled: true,
};

function createDependencies(itemOverrides: Partial<TransactionItemDbRow>) {
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
        category_id: categoryId,
        id: "00000000-0000-4000-8000-000000008001",
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
          id: categoryId,
          name: "餐饮",
          parent_id: null,
          type: "expense",
        },
      ]),
    },
    currentUserId: userId,
    merchantQueryService: {
      findSummariesByIds: vi.fn(),
      listActiveOptions: vi.fn().mockResolvedValue([]),
    },
    transactionRepository: repository,
  } satisfies TransactionReadDependencies<TransactionFormRepository>;
}

describe("getEditTransactionView linked restriction", () => {
  it.each([
    ["已报销支出", { special_status: "reimbursed" as const }],
    [
      "主动结算关联",
      {
        settled_by_item_id: "00000000-0000-4000-8000-000000008002",
      },
    ],
    ["被其他明细结算", { is_reimbursement_income: true }],
    ["退款关联任一方", { has_refund_link: true }],
  ])("%s 返回整体只读态", async (_label, itemOverrides) => {
    const view = await getEditTransactionView(
      createDependencies(itemOverrides),
      currentLedger,
      transactionRecordId,
    );

    expect(view).toMatchObject({
      canEdit: false,
      editRestriction: "linked",
    });
  });
});
