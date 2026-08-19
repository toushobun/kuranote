// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { TransactionItemDbRow } from "internal/db-types";
import type { CurrentLedger } from "internal/ledger";
import { RepositoryError } from "internal/shared/errors/appError";
import type { TransactionIncomeLinkRepository } from "internal/transaction/repository/transactionIncomeLinkRepository";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import type { TransferEditInitialValues } from "internal/transaction/service/read/transactionReadModels";
import {
  getEditTransactionView,
  getNewTransactionView,
} from "internal/transaction/service/read/transactionFormService";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000099";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const accountId = "00000000-0000-4000-8000-000000000045";
const targetAccountId = "00000000-0000-4000-8000-000000000046";
const parentCategoryId = "00000000-0000-4000-8000-000000005001";
const categoryId = "00000000-0000-4000-8000-000000005072";
const incomeCategoryId = "00000000-0000-4000-8000-000000005073";
const incomeItemId = "00000000-0000-4000-8000-000000008001";
const linkedExpenseItemId = "00000000-0000-4000-8000-000000008002";
const merchantId = "00000000-0000-4000-8000-000000001001";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member",
  id: ledgerId,
  name: "家庭账本",
  transactionItemSpecialStatusEnabled: true,
};

function createRepository(
  overrides: Partial<TransactionFormRepository> = {},
): TransactionFormRepository {
  return {
    findActiveRecord: vi.fn().mockResolvedValue(null),
    loadFrequentCategoryCounts: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function createDependencies(repository: TransactionFormRepository) {
  return {
    accountQueryService: {
      getTransactionContext: vi.fn(),
      listTransactionOptions: vi.fn().mockResolvedValue([
        { currency: "JPY", id: accountId, name: "现金" },
        { currency: "JPY", id: targetAccountId, name: "储蓄" },
      ]),
    },
    categoryQueryService: {
      findSummariesByIds: vi.fn(),
      listActiveSummaries: vi.fn().mockResolvedValue([
        {
          id: parentCategoryId,
          name: "餐饮",
          parent_id: null,
          type: "expense",
        },
        {
          id: categoryId,
          name: "午餐",
          parent_id: parentCategoryId,
          type: "expense",
        },
      ]),
    },
    currentUserId: userId,
    merchantQueryService: {
      findSummariesByIds: vi.fn(),
      listActiveOptions: vi
        .fn()
        .mockResolvedValue([
          { icon_url: null, id: merchantId, name: "便利店" },
        ]),
    },
    transactionRepository: repository,
  } satisfies TransactionReadDependencies<TransactionFormRepository>;
}

function createLinkedDependencies({
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
    loadFrequentCategoryCounts: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue([
      {
        account_id: accountId,
        amount: "1000",
        balance_delta: "-1000",
        category_id: categoryId,
        id: incomeItemId,
        note: null,
        transaction_record_id: transactionRecordId,
        ...itemOverrides,
      },
    ]),
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

describe("getEditTransactionView", () => {
  it("普通交易还原表单和编辑权限", async () => {
    const repository = createRepository({
      findActiveRecord: vi.fn().mockResolvedValue({
        created_at: "2026-06-04T01:00:00.000Z",
        created_by: otherUserId,
        id: transactionRecordId,
        merchant_id: merchantId,
        note: "午餐",
        transaction_at: "2026-06-04T01:30:05.000Z",
        type: "normal",
      }),
      listItems: vi.fn().mockResolvedValue([
        {
          account_id: accountId,
          amount: "1200.00",
          balance_delta: "-1200.00",
          business_net_amount: "1200",
          category_id: categoryId,
          note: null,
          special_status: "pending_reimbursement",
          transaction_record_id: transactionRecordId,
        },
      ]),
    });

    const view = await getEditTransactionView(
      createDependencies(repository),
      currentLedger,
      transactionRecordId,
    );

    expect(view).not.toBeNull();
    expect(view).toMatchObject({
      canEdit: false,
      initialValues: {
        accountId,
        items: [
          { amount: "1200", categoryId, specialStatus: "pendingReimbursement" },
        ],
        merchantId,
        note: "午餐",
        transactionRecordId,
        type: "expense",
      },
      ledgerName: "家庭账本",
      transactionItemSpecialStatusEnabled: true,
    });
    if (!view || view.initialValues.type === "transfer") {
      throw new Error("预期普通交易编辑视图");
    }
    expect(view.initialValues.items[0]?.businessNetAmount).toBeUndefined();
  });

  it("正确还原转账的转出、转入账户和金额", async () => {
    const repository = createRepository({
      findActiveRecord: vi.fn().mockResolvedValue({
        created_at: "2026-06-04T01:00:00.000Z",
        created_by: userId,
        id: transactionRecordId,
        merchant_id: null,
        note: "账户调拨",
        transaction_at: "2026-06-04T01:30:05.000Z",
        type: "transfer",
      }),
      listItems: vi.fn().mockResolvedValue([
        {
          account_id: accountId,
          amount: "5000.00",
          balance_delta: "-5000.00",
          category_id: null,
          note: null,
          transaction_record_id: transactionRecordId,
        },
        {
          account_id: targetAccountId,
          amount: "5000.00",
          balance_delta: "5000.00",
          category_id: null,
          note: null,
          transaction_record_id: transactionRecordId,
        },
      ]),
    });

    const view = await getEditTransactionView(
      createDependencies(repository),
      currentLedger,
      transactionRecordId,
    );

    expect(view?.canEdit).toBe(true);
    expect(view?.initialValues).toEqual({
      accountId,
      note: "账户调拨",
      transactionAt: "2026-06-04T01:30:05.000Z",
      transactionRecordId,
      transferAmount: "5000",
      transferTargetAccountId: targetAccountId,
      type: "transfer",
    } satisfies TransferEditInitialValues);
  });

  it("转账明细结构损坏时返回 null", async () => {
    const repository = createRepository({
      findActiveRecord: vi.fn().mockResolvedValue({
        created_at: "2026-06-04T01:00:00.000Z",
        created_by: userId,
        id: transactionRecordId,
        merchant_id: null,
        note: null,
        transaction_at: "2026-06-04T01:30:05.000Z",
        type: "transfer",
      }),
      listItems: vi.fn().mockResolvedValue([
        {
          account_id: accountId,
          amount: "5000.00",
          balance_delta: "-5000.00",
          category_id: null,
          note: null,
          transaction_record_id: transactionRecordId,
        },
      ]),
    });

    await expect(
      getEditTransactionView(
        createDependencies(repository),
        currentLedger,
        transactionRecordId,
      ),
    ).resolves.toBeNull();
  });
});

describe("getNewTransactionView", () => {
  it("常用分类辅助查询失败时仍加载表单并降级为手动排序", async () => {
    const repository = createRepository({
      loadFrequentCategoryCounts: vi
        .fn()
        .mockRejectedValue(
          new RepositoryError(
            "transaction_frequent_categories_load_failed",
            "常用分类加载失败",
          ),
        ),
    });

    const view = await getNewTransactionView(
      createDependencies(repository),
      currentLedger,
    );

    expect(view.accountOptions).toHaveLength(2);
    expect(view.categoryOptions).toHaveLength(1);
    expect(view.merchantOptions).toHaveLength(1);
    expect(view.frequentCategoryIds).toEqual([categoryId]);
  });
});

describe("getEditTransactionView income links", () => {
  it.each([
    ["已报销支出", { special_status: "reimbursed" as const }],
    ["作为报销对象", { has_reimbursement_link: true }],
    ["作为退款对象", { has_refund_link: true, is_refund_income: false }],
  ])("%s 返回整体只读态", async (_label, itemOverrides) => {
    const view = await getEditTransactionView(
      createLinkedDependencies({ itemOverrides }),
      currentLedger,
      transactionRecordId,
    );

    expect(view).toMatchObject({
      canEdit: false,
      editRestriction: "linked",
    });
  });

  it("报销收入编辑时保留核销超额后的有符号剩余额度", async () => {
    const incomeLinkRepository: TransactionIncomeLinkRepository = {
      listByIncomeItemIds: vi.fn().mockResolvedValue([
        {
          incomeItemId,
          refundItem: null,
          reimbursementItems: [
            {
              accountId,
              amount: "1000",
              categoryId,
              id: linkedExpenseItemId,
              refundedAmount: "100",
              reimbursementAmount: "1600",
              reimbursementLinkAmount: "400",
              transactionAt: "2026-08-01T01:00:00.000Z",
              transactionRecordId: "00000000-0000-4000-8000-000000009998",
            },
          ],
        },
      ]),
    };

    const view = await getEditTransactionView(
      createLinkedDependencies({
        incomeLinkRepository,
        itemOverrides: {
          balance_delta: "1000",
          business_net_amount: "600",
          category_id: incomeCategoryId,
          has_reimbursement_link: true,
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
            businessNetAmount: "600",
            businessStatus: {
              incomeLinkRole: "reimbursement",
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: "0",
              },
              settlementStatus: null,
            },
            reimbursementCandidate: {
              id: linkedExpenseItemId,
              remainingRefundableAmount: "-300",
            },
          },
        ],
      },
    });
  });

  it("退款收入编辑时按退款和报销组合口径回填退款对象", async () => {
    const incomeLinkRepository: TransactionIncomeLinkRepository = {
      listByIncomeItemIds: vi.fn().mockResolvedValue([
        {
          incomeItemId,
          refundItem: {
            accountId,
            amount: "0.3",
            categoryId,
            id: linkedExpenseItemId,
            refundedAmount: "0.2",
            reimbursementAmount: "0.05",
            transactionAt: "2026-08-01T01:00:00.000Z",
            transactionRecordId: "00000000-0000-4000-8000-000000009998",
            refundLinkAmount: "0.1",
          },
          reimbursementItems: [],
        },
      ]),
    };

    const view = await getEditTransactionView(
      createLinkedDependencies({
        incomeLinkRepository,
        itemOverrides: {
          balance_delta: "1000",
          business_net_amount: "0",
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
            businessNetAmount: "0",
            businessStatus: {
              incomeLinkRole: "refund",
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: "0",
              },
              settlementStatus: null,
            },
            refundCandidate: {
              id: linkedExpenseItemId,
              remainingRefundableAmount: "0.15",
            },
          },
        ],
      },
    });
  });
});
