// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedger } from "lib/ledger/current-ledger";
import type { TransactionRepository } from "internal/transaction/repository/transactionRepository";
import type { TransferEditInitialValues } from "internal/transaction/entity/transferEditInitialValues";
import { getEditTransactionView } from "internal/transaction/service/read/transactionFormService";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000099";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const accountId = "00000000-0000-4000-8000-000000000045";
const targetAccountId = "00000000-0000-4000-8000-000000000046";
const parentCategoryId = "00000000-0000-4000-8000-000000005001";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";
const tagId = "00000000-0000-4000-8000-000000003001";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member",
  id: ledgerId,
  name: "家庭账本",
};

function createRepository(
  overrides: Partial<TransactionRepository> = {},
): TransactionRepository {
  return {
    convert: vi.fn(),
    createNormal: vi.fn(),
    createTransfer: vi.fn(),
    findActiveRecord: vi.fn().mockResolvedValue(null),
    findUserSummaries: vi.fn().mockResolvedValue([]),
    listActiveMemberIds: vi.fn().mockResolvedValue([]),
    listActiveTags: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue([]),
    listRecords: vi.fn().mockResolvedValue([]),
    listTagAssignments: vi.fn().mockResolvedValue([]),
    listTagsByIds: vi.fn().mockResolvedValue([]),
    loadDashboardMonthSource: vi.fn().mockResolvedValue({
      categories: [],
      items: [],
    }),
    loadDashboardRecentlyUsedAccountIds: vi.fn().mockResolvedValue([]),
    loadGroupSummaries: vi.fn().mockResolvedValue([]),
    updateNormal: vi.fn(),
    updateTransfer: vi.fn(),
    void: vi.fn(),
    ...overrides,
  };
}

function createDependencies(repository: TransactionRepository) {
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
  } satisfies TransactionReadDependencies;
}

describe("getEditTransactionView", () => {
  it("普通交易还原表单、历史标签和编辑权限", async () => {
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
          category_id: categoryId,
          note: null,
          transaction_record_id: transactionRecordId,
        },
      ]),
      listTagAssignments: vi
        .fn()
        .mockResolvedValue([
          { tag_id: tagId, transaction_record_id: transactionRecordId },
        ]),
      listTagsByIds: vi
        .fn()
        .mockResolvedValue([{ color: null, id: tagId, name: "已归档标签" }]),
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
        items: [{ amount: "1200", categoryId }],
        merchantId,
        note: "午餐",
        tagNames: ["已归档标签"],
        transactionRecordId,
        type: "expense",
      },
      ledgerName: "家庭账本",
    });
    expect(repository.listTagsByIds).toHaveBeenCalledWith(ledgerId, [tagId]);
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
