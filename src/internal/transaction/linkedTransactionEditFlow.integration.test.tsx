import { getTransactionActionModuleMocks } from "internal/transaction/adapter/next/actions.testUtils";
import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { pressItemAmountKey } from "test/transactionConfirmStep";
import { EditTransactionReceiptTemplate } from "templates/transactions/EditTransactionReceipt";
import type { CurrentLedger } from "internal/ledger";
import { ConflictError } from "internal/shared/errors/appError";
import {
  transactionErrorCodes,
  transactionLinkedEditErrorMessages,
} from "internal/transaction/errors";
import { updateTransaction } from "internal/transaction/adapter/next/actions";
import {
  createLinkedTransactionEditService,
  type LinkedTransactionEditService,
} from "internal/transaction/service/linkedTransactionEditService";
import type { LinkedTransactionItemService } from "internal/transaction/service/linkedTransactionItemService";
import type { EditTransactionEntryView } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionService } from "internal/transaction/service/transactionService";

const transactionActionModuleMocks = getTransactionActionModuleMocks();

// 小票换商家时的快捷金额；这里不关心建议内容。
vi.mock("lib/api/clientQuery", () => ({
  fetchClientJson: vi.fn(async () => null),
}));

const serverMocks = vi.hoisted(() => ({
  linkedUpdateNormal: vi.fn(),
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const transactionRecordId = "57492000-0000-4000-8000-000000000001";
const transactionItemId = "57492100-0000-4000-8000-000000000001";
const targetItemId = "57492100-0000-4000-8000-000000000002";
const accountId = "00000000-0000-4000-8000-000000000043";
const otherAccountId = "00000000-0000-4000-8000-000000000044";
const expenseCategoryId = "00000000-0000-4000-8000-000000005021";
const incomeCategoryId = "00000000-0000-4000-8000-000000005002";
const merchantId = "00000000-0000-4000-8000-000000001001";
const expectedUpdatedAt = "2026-08-21T01:00:00.000Z";
const expectedRecordUpdatedAt = "2026-08-21T01:00:01.000Z";
const transactionAt = "2026-08-20T01:30:00.000Z";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "owner",
  id: ledgerId,
  name: "家庭账本",
};

const accountOptions = [
  { currency: "JPY", holders: [], id: accountId, name: "现金", type: "cash" },
  {
    currency: "JPY",
    holders: [],
    id: otherAccountId,
    name: "银行",
    type: "bank",
  },
] satisfies EditTransactionEntryView["accountOptions"];
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
const merchantOptions = [
  { icon_url: null, id: merchantId, name: "商家", tags: [] },
];

type NormalEditView = Omit<EditTransactionEntryView, "initialValues"> & {
  initialValues: Extract<
    EditTransactionEntryView["initialValues"],
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
    canDelete: true,
    categoryOptions,
    editRestriction: null,
    frequentCategoryIds: [],
    initialValues: {
      expectedRecordUpdatedAt,
      payments: [{ accountId, amount: null }],
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
    ledgerId,
    ledgerName: "家庭账本",
    merchantOptions,
    merchantTags: [],
    multiAccountPaymentEnabled: true,
    transactionItemSpecialStatusEnabled: true,
  };
}

// 无关联的多账户支出：治疗费 1,200，现金 500 + 银行 700。
function createMultiAccountView(): NormalEditView {
  const view = createView("parent");
  return {
    ...view,
    initialValues: {
      ...view.initialValues,
      items: [
        {
          amount: "1200",
          businessStatus: null,
          categoryId: expenseCategoryId,
          expectedUpdatedAt,
          id: transactionItemId,
          refundCandidate: null,
          reimbursementCandidate: null,
          specialStatus: null,
        },
      ],
      payments: [
        { accountId, amount: "500" },
        { accountId: otherAccountId, amount: "700" },
      ],
    },
  };
}

function createScenario(view: NormalEditView) {
  const persisted = {
    amount: view.initialValues.items[0]?.amount ?? "0",
    payments: view.initialValues.payments,
  };
  const updateEdit = vi.fn<LinkedTransactionItemService["updateEdit"]>(
    async (input) => {
      persisted.amount = String(
        input.itemUpdates[0]?.amount ?? persisted.amount,
      );
      persisted.payments = input.payments;
    },
  );
  const linkedTransactionItemService = {
    updateEdit,
  } as unknown as LinkedTransactionItemService;
  const updateNormal = vi.fn<TransactionService["updateNormal"]>(
    async (input) => {
      persisted.payments = input.payments;
    },
  );
  const transactionService = {
    canModify: vi.fn().mockResolvedValue(true),
    getEditView: vi.fn().mockResolvedValue(view),
    updateNormal,
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

  return { action, persisted, updateEdit, updateNormal, view };
}

function renderScenario(view: NormalEditView) {
  const scenario = createScenario(view);
  const { initialValues, ...viewProps } = scenario.view;
  const { container } = render(
    <EditTransactionReceiptTemplate
      {...viewProps}
      action={scenario.action}
      deleteAction={vi.fn(async () => ({}))}
      frequentMerchants={[]}
      initialValues={initialValues}
    />,
    { wrapper: ConfirmDialogTestProviders },
  );
  return { ...scenario, container };
}

// 在小票上把明细 1 的金额改成 amount（点金额 → 计算器 → 确定）。
async function changeItemAmount(current: string, amount: string) {
  fireEvent.click(
    screen.getByRole("button", { name: `修改明细 1 金额：${current}` }),
  );
  pressItemAmountKey("清空");
  for (const key of amount) pressItemAmountKey(key);
  pressItemAmountKey("确定");
  await vi.waitFor(() =>
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
  );
}

async function submitForSyncConfirmation() {
  // 抽屉关闭动画结束前背景会被 aria-hidden。
  fireEvent.click(await screen.findByRole("button", { name: "保存修改" }));
  return screen.findByRole("dialog", { name: "同步修改关联数据？" });
}

describe("Issue #574 已关联交易跨层编辑流程", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("母项金额从表单直接写入原子保存边界", async () => {
    const { persisted, updateEdit } = renderScenario(createView("parent"));
    await changeItemAmount("¥100", "70");

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await vi.waitFor(() => expect(updateEdit).toHaveBeenCalledOnce());

    expect(
      screen.queryByRole("dialog", { name: "同步修改关联数据？" }),
    ).not.toBeInTheDocument();
    expect(persisted.amount).toBe("70");
  }, 15_000);

  it("子项金额从表单确认后写入原子保存边界", async () => {
    const { persisted, updateEdit } = renderScenario(createView("child"));
    await changeItemAmount("+ ¥40", "80");

    const dialog = await submitForSyncConfirmation();
    expect(updateEdit).not.toHaveBeenCalled();
    expect(persisted.amount).toBe("40");

    fireEvent.click(within(dialog).getByRole("button", { name: "同步修改" }));
    await vi.waitFor(() => expect(updateEdit).toHaveBeenCalledOnce());

    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemUpdates: [
          expect.objectContaining({
            amount: 80,
            expectedUpdatedAt,
            transactionItemId,
          }),
        ],
        ledgerId,
        transactionRecordId,
      }),
    );
    expect(persisted.amount).toBe("80");
  }, 15_000);

  it("付款账户变化先返回确认冲突并在确认后保存成功", async () => {
    const { persisted, updateEdit } = renderScenario(createView("child"));
    fireEvent.click(screen.getByRole("button", { name: "更换支付账户 1" }));
    fireEvent.click(await screen.findByRole("radio", { name: /^银行/ }));

    const dialog = await submitForSyncConfirmation();
    expect(serverMocks.linkedUpdateNormal).toHaveBeenCalledOnce();
    expect(serverMocks.linkedUpdateNormal).toHaveBeenLastCalledWith(
      currentLedger,
      expect.objectContaining({
        confirmSync: false,
        payments: [{ accountId: otherAccountId, amount: null }],
      }),
    );
    await expect(
      serverMocks.linkedUpdateNormal.mock.results[0]?.value,
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedSyncConfirmationRequired,
      name: ConflictError.name,
    });
    expect(updateEdit).not.toHaveBeenCalled();
    expect(persisted.payments).toEqual([{ accountId, amount: null }]);

    fireEvent.click(within(dialog).getByRole("button", { name: "同步修改" }));
    await vi.waitFor(() => expect(updateEdit).toHaveBeenCalledOnce());

    expect(serverMocks.linkedUpdateNormal).toHaveBeenCalledTimes(2);
    expect(serverMocks.linkedUpdateNormal).toHaveBeenLastCalledWith(
      currentLedger,
      expect.objectContaining({ confirmSync: true }),
    );
    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        payments: [{ accountId: otherAccountId, amount: null }],
        itemUpdates: [
          expect.objectContaining({
            amount: 40,
            expectedUpdatedAt,
            transactionItemId,
          }),
        ],
      }),
    );
    expect(persisted.payments).toEqual([
      { accountId: otherAccountId, amount: null },
    ]);
    expect(persisted.amount).toBe("40");
  }, 15_000);

  it("表单提交记录版本，冲突时返回 ConflictError 并保留原数据", async () => {
    const { action, container, persisted, updateEdit } = renderScenario(
      createView("child"),
    );
    const form = container.querySelector<HTMLFormElement>(
      "#edit-transaction-receipt-form",
    );
    if (!form) throw new Error("测试表单不存在");
    const formData = new FormData(form);
    expect(formData.get("expectedRecordUpdatedAt")).toBe(
      expectedRecordUpdatedAt,
    );
    formData.set("note", "修改后的备注");
    const conflict = new ConflictError(
      transactionErrorCodes.updateInvalid,
      transactionLinkedEditErrorMessages.itemVersionConflict,
    );
    updateEdit.mockRejectedValueOnce(conflict);

    const state = await action({}, formData);

    expect(state).toMatchObject({
      error: conflict.message,
    });
    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRecordUpdatedAt,
      }),
    );
    await expect(
      serverMocks.linkedUpdateNormal.mock.results[0]?.value,
    ).rejects.toBe(conflict);
    expect(persisted.amount).toBe("40");
    expect(persisted.payments).toEqual([{ accountId, amount: null }]);
    expect(transactionActionModuleMocks.redirect).not.toHaveBeenCalled();
  }, 15_000);

  it("取消确认后不会触发任何持久化写入", async () => {
    const { persisted, updateEdit } = renderScenario(createView("child"));
    await changeItemAmount("+ ¥40", "80");

    const dialog = await submitForSyncConfirmation();
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));

    expect(updateEdit).not.toHaveBeenCalled();
    expect(persisted.amount).toBe("40");
    expect(dialog).not.toBeVisible();
  }, 15_000);
});

describe("Issue #915 多账户付款跨层编辑流程", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("多账户记录不改动直接保存时付款明细保持不变", async () => {
    const view = createMultiAccountView();
    const { persisted, updateNormal } = renderScenario(view);

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await vi.waitFor(() => expect(updateNormal).toHaveBeenCalledOnce());

    expect(updateNormal).toHaveBeenCalledWith(
      expect.objectContaining({ payments: view.initialValues.payments }),
    );
    expect(persisted.payments).toEqual(view.initialValues.payments);
    expect(transactionActionModuleMocks.redirect).toHaveBeenCalled();
  }, 15_000);

  it("在表单中删到 1 行后保存为单账户", async () => {
    const { persisted, updateNormal } = renderScenario(
      createMultiAccountView(),
    );

    fireEvent.click(screen.getByRole("button", { name: "删除支付账户 2" }));
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await vi.waitFor(() => expect(updateNormal).toHaveBeenCalledOnce());

    expect(persisted.payments).toEqual([{ accountId, amount: null }]);
  }, 15_000);
});
