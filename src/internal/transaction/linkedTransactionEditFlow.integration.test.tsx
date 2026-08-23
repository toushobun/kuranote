import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import { EditTransactionTemplate } from "templates/transactions/TransactionFormPage";
import type { CurrentLedger } from "internal/ledger";
import { getTransactionActionModuleMocks } from "internal/transaction/adapter/next/actions.testUtils";
import { updateTransaction } from "internal/transaction/adapter/next/actions";
import {
  createLinkedTransactionEditService,
  type LinkedTransactionEditService,
} from "internal/transaction/service/linkedTransactionEditService";
import type { LinkedTransactionItemService } from "internal/transaction/service/linkedTransactionItemService";
import type { EditTransactionView } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionService } from "internal/transaction/service/transactionService";

const transactionActionModuleMocks = getTransactionActionModuleMocks();

const serverMocks = vi.hoisted(() => ({
  linkedUpdateNormal: vi.fn(),
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const transactionRecordId = "57492000-0000-4000-8000-000000000001";
const transactionItemId = "57492100-0000-4000-8000-000000000001";
const targetItemId = "57492100-0000-4000-8000-000000000002";
const accountId = "00000000-0000-4000-8000-000000000043";
const expenseCategoryId = "00000000-0000-4000-8000-000000005021";
const incomeCategoryId = "00000000-0000-4000-8000-000000005002";
const merchantId = "00000000-0000-4000-8000-000000001001";
const expectedUpdatedAt = "2026-08-21T01:00:00.000Z";
const transactionAt = "2026-08-20T01:30:00.000Z";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "owner",
  id: ledgerId,
  name: "家庭账本",
};

const accountOptions = [{ currency: "JPY", id: accountId, name: "现金" }];
const categoryOptions = [
  {
    id: expenseCategoryId,
    name: "餐饮",
    parentId: "00000000-0000-4000-8000-000000005001",
    parentName: "生活",
    type: "expense" as const,
  },
  {
    id: incomeCategoryId,
    name: "返款",
    parentId: "00000000-0000-4000-8000-000000005003",
    parentName: "收入",
    type: "income" as const,
  },
];
const merchantOptions = [{ icon_url: null, id: merchantId, name: "商家" }];

type NormalEditView = Omit<EditTransactionView, "initialValues"> & {
  initialValues: Extract<
    EditTransactionView["initialValues"],
    { items: unknown[] }
  >;
};

function reimbursementCandidate() {
  return {
    accountCurrency: "JPY",
    accountId,
    amount: "100",
    categoryName: "餐饮",
    id: targetItemId,
    parentCategoryName: "生活",
    refundedAmount: "0",
    remainingRefundableAmount: "60",
    transactionAt,
    transactionRecordId: "57492000-0000-4000-8000-000000000002",
  };
}

function createView(side: "parent" | "child"): NormalEditView {
  const isParent = side === "parent";
  return {
    accountOptions,
    canEdit: true,
    categoryOptions,
    editRestriction: null,
    frequentCategoryIds: [],
    initialValues: {
      accountId,
      items: [
        {
          amount: isParent ? "100" : "40",
          businessNetAmount: isParent ? "60" : "0",
          businessStatus: isParent
            ? {
                incomeLinkRole: null,
                offsetComposition: {
                  refundAmount: "0",
                  reimbursementAmount: "40",
                },
                settlementStatus: "pendingReimbursement",
              }
            : {
                incomeLinkRole: "reimbursement",
                offsetComposition: {
                  refundAmount: "0",
                  reimbursementAmount: "0",
                },
                settlementStatus: null,
              },
          categoryId: isParent ? expenseCategoryId : incomeCategoryId,
          expectedUpdatedAt,
          id: transactionItemId,
          refundCandidate: null,
          reimbursementCandidate: isParent ? null : reimbursementCandidate(),
          specialStatus: isParent ? "pendingReimbursement" : null,
        },
      ],
      merchantId,
      note: "编辑前备注",
      transactionAt,
      transactionRecordId,
      type: isParent ? "expense" : "income",
    },
    ledgerName: "家庭账本",
    merchantOptions,
    transactionItemSpecialStatusEnabled: true,
  };
}

function createScenario(side: "parent" | "child") {
  const view = createView(side);
  const persisted = { amount: view.initialValues.items[0]?.amount ?? "0" };
  const updateEdit = vi.fn<LinkedTransactionItemService["updateEdit"]>(
    async (input) => {
      persisted.amount = String(
        input.itemUpdates[0]?.amount ?? persisted.amount,
      );
    },
  );
  const linkedTransactionItemService = {
    updateEdit,
  } as unknown as LinkedTransactionItemService;
  const transactionService = {
    canModify: vi.fn().mockResolvedValue(true),
    getEditView: vi.fn().mockResolvedValue(view),
  } as unknown as TransactionService;
  const service: LinkedTransactionEditService =
    createLinkedTransactionEditService({
      linkedTransactionItemService,
      transactionService,
    });
  transactionActionModuleMocks.createRequestContainer.mockReturnValue({
    transaction: {
      linkedTransactionEditService: {
        updateNormal: serverMocks.linkedUpdateNormal,
      },
    },
  });
  transactionActionModuleMocks.createServerRequestDependencies.mockResolvedValue(
    {},
  );
  transactionActionModuleMocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger,
    userId: "00000000-0000-4000-8000-000000000031",
  });
  serverMocks.linkedUpdateNormal.mockImplementation(service.updateNormal);

  const action: typeof updateTransaction = async (previousState, formData) => {
    try {
      return await updateTransaction(previousState, formData);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("NEXT_REDIRECT:")
      ) {
        return {};
      }
      throw error;
    }
  };

  return { action, persisted, updateEdit, view };
}

function renderScenario(side: "parent" | "child") {
  const scenario = createScenario(side);
  const { initialValues, ...viewProps } = scenario.view;
  render(
    <UserThemeProvider storageScope={`issue-574-pr4-${side}`}>
      <EditTransactionTemplate
        {...viewProps}
        action={scenario.action}
        deleteAction={vi.fn(async () => ({}))}
        errorMessage={null}
        initialValues={initialValues}
      />
    </UserThemeProvider>,
  );
  return scenario;
}

describe("Issue #574 已关联交易跨层编辑流程", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    {
      amount: "70",
      name: "母项金额从表单确认后写入原子保存边界",
      side: "parent",
    },
    {
      amount: "80",
      name: "子项金额从表单确认后写入原子保存边界",
      side: "child",
    },
  ] as const)(
    "$name",
    async ({ amount, side }) => {
      const { persisted, updateEdit } = renderScenario(side);
      fireEvent.change(screen.getByLabelText("明细 1 金额"), {
        target: { value: amount },
      });

      fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
      const dialog = await screen.findByRole("dialog", {
        name: "同步修改关联数据？",
      });
      expect(updateEdit).not.toHaveBeenCalled();
      expect(persisted.amount).toBe(side === "parent" ? "100" : "40");

      fireEvent.click(within(dialog).getByRole("button", { name: "同步修改" }));
      await vi.waitFor(() => expect(updateEdit).toHaveBeenCalledOnce());

      expect(updateEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          itemUpdates: [
            expect.objectContaining({
              amount: Number(amount),
              expectedUpdatedAt,
              transactionItemId,
            }),
          ],
          ledgerId,
          transactionRecordId,
        }),
      );
      expect(persisted.amount).toBe(amount);
    },
    15_000,
  );

  it("取消确认后不会触发任何持久化写入", async () => {
    const { persisted, updateEdit } = renderScenario("child");
    fireEvent.change(screen.getByLabelText("明细 1 金额"), {
      target: { value: "80" },
    });

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    const dialog = await screen.findByRole("dialog", {
      name: "同步修改关联数据？",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));

    expect(updateEdit).not.toHaveBeenCalled();
    expect(persisted.amount).toBe("40");
    expect(dialog).not.toBeVisible();
  }, 15_000);
});
