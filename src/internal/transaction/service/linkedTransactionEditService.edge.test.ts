// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { CurrentLedger } from "internal/ledger";
import { ValidationError } from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";
import type { LinkedTransactionItemService } from "internal/transaction/service/linkedTransactionItemService";
import {
  createLinkedTransactionEditService,
  type LinkedTransactionEditInput,
} from "internal/transaction/service/linkedTransactionEditService";
import type { EditTransactionView } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionService } from "internal/transaction/service/transactionService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const linkedItemId = "00000000-0000-4000-8000-000000000201";
const siblingItemId = "00000000-0000-4000-8000-000000000202";
const targetItemId = "00000000-0000-4000-8000-000000000301";
const accountId = "00000000-0000-4000-8000-000000000043";
const incomeCategoryId = "00000000-0000-4000-8000-000000005021";
const expenseCategoryId = "00000000-0000-4000-8000-000000005022";
const merchantId = "00000000-0000-4000-8000-000000001001";
const updatedAt = "2026-08-21T01:00:00.000Z";
const transactionAt = "2026-08-20T01:30:00.000Z";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member",
  id: ledgerId,
  name: "家庭账本",
};

function formOptions() {
  return {
    accountOptions: [{ currency: "JPY", id: accountId, name: "现金" }],
    categoryOptions: [
      {
        id: incomeCategoryId,
        name: "返款",
        parentId: "00000000-0000-4000-8000-000000005001",
        parentName: "收入",
        type: "income" as const,
      },
      {
        id: expenseCategoryId,
        name: "餐饮",
        parentId: "00000000-0000-4000-8000-000000005002",
        parentName: "生活",
        type: "expense" as const,
      },
    ],
    frequentCategoryIds: [],
    merchantOptions: [{ icon_url: null, id: merchantId, name: "商家" }],
    transactionItemSpecialStatusEnabled: true,
  };
}

function linkedCandidate() {
  return {
    accountCurrency: "JPY",
    accountId,
    amount: "300",
    categoryName: "餐饮",
    id: targetItemId,
    parentCategoryName: "生活",
    refundedAmount: "0",
    remainingRefundableAmount: "300",
    transactionAt,
    transactionRecordId: "00000000-0000-4000-8000-000000008888",
  };
}

function createViewWithSibling(): EditTransactionView {
  return {
    ...formOptions(),
    canEdit: false,
    editRestriction: "linked",
    initialValues: {
      accountId,
      items: [
        {
          amount: "100",
          businessStatus: {
            incomeLinkRole: "reimbursement",
            offsetComposition: {
              refundAmount: "0",
              reimbursementAmount: "0",
            },
            settlementStatus: null,
          },
          categoryId: incomeCategoryId,
          id: linkedItemId,
          refundCandidate: null,
          reimbursementCandidate: linkedCandidate(),
          specialStatus: null,
        },
        {
          amount: "50",
          businessStatus: null,
          categoryId: expenseCategoryId,
          id: siblingItemId,
          refundCandidate: null,
          reimbursementCandidate: null,
          specialStatus: null,
        },
      ],
      merchantId,
      note: "",
      transactionAt,
      transactionRecordId,
      type: "income",
    },
    ledgerName: "家庭账本",
  };
}

function createSettledTargetView(): EditTransactionView {
  return {
    ...formOptions(),
    canEdit: false,
    editRestriction: "linked",
    initialValues: {
      accountId,
      items: [
        {
          amount: "300",
          businessStatus: {
            incomeLinkRole: null,
            offsetComposition: {
              refundAmount: "0",
              reimbursementAmount: "300",
            },
            settlementStatus: "reimbursed",
          },
          categoryId: expenseCategoryId,
          id: linkedItemId,
          refundCandidate: null,
          reimbursementCandidate: null,
          specialStatus: "reimbursed",
        },
      ],
      merchantId,
      note: "",
      transactionAt,
      transactionRecordId,
      type: "expense",
    },
    ledgerName: "家庭账本",
  };
}

function createService(view: EditTransactionView) {
  const updateEdit = vi.fn();
  const transactionService = {
    canModify: vi.fn().mockResolvedValue(true),
    getEditView: vi.fn().mockResolvedValue(view),
    updateNormal: vi.fn(),
    void: vi.fn(),
  } as unknown as TransactionService;
  const linkedTransactionItemService = {
    getEditSnapshot: vi.fn(),
    update: vi.fn(),
    updateEdit,
  } as unknown as LinkedTransactionItemService;

  return {
    service: createLinkedTransactionEditService({
      linkedTransactionItemService,
      transactionService,
    }),
    updateEdit,
  };
}

function siblingInput(
  siblingOverrides: Partial<LinkedTransactionEditInput["items"][number]>,
): LinkedTransactionEditInput {
  return {
    accountId,
    confirmSync: true,
    expectedUpdatedAtByItemId: { [linkedItemId]: updatedAt },
    items: [
      {
        amount: 100,
        categoryId: incomeCategoryId,
        id: linkedItemId,
        reimbursementItemId: targetItemId,
      },
      {
        amount: 50,
        categoryId: expenseCategoryId,
        id: siblingItemId,
        ...siblingOverrides,
      },
    ],
    ledgerId,
    merchantId,
    note: null,
    transactionAt,
    transactionRecordId,
    type: "income",
  };
}

describe("LinkedTransactionEditService edge cases", () => {
  it.each([
    [{ specialStatus: "pendingReimbursement" as const }],
    [{ reimbursementItemId: targetItemId }],
  ])("关联交易中的其他明细发生业务关系变化时拒绝静默丢弃", async (overrides) => {
    const { service, updateEdit } = createService(createViewWithSibling());

    await expect(
      service.updateNormal(currentLedger, siblingInput(overrides)),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedEditRequiresUnlink,
      name: ValidationError.name,
    });
    expect(updateEdit).not.toHaveBeenCalled();
  });

  it("已结清母项原样回传派生状态时仍可同步修改金额", async () => {
    const { service, updateEdit } = createService(createSettledTargetView());
    const input: LinkedTransactionEditInput = {
      accountId,
      confirmSync: true,
      expectedUpdatedAtByItemId: { [linkedItemId]: updatedAt },
      items: [
        {
          amount: 320,
          categoryId: expenseCategoryId,
          id: linkedItemId,
          specialStatus: "reimbursed",
        },
      ],
      ledgerId,
      merchantId,
      note: null,
      transactionAt,
      transactionRecordId,
      type: "expense",
    };

    await service.updateNormal(currentLedger, input);

    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemUpdates: [expect.objectContaining({ amount: 320 })],
      }),
    );
  });
});
