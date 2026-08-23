// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { CurrentLedger } from "internal/ledger";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
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
const oldAccountId = "00000000-0000-4000-8000-000000000043";
const sameCurrencyAccountId = "00000000-0000-4000-8000-000000000044";
const otherCurrencyAccountId = "00000000-0000-4000-8000-000000000045";
const incomeCategoryId = "00000000-0000-4000-8000-000000005021";
const expenseCategoryId = "00000000-0000-4000-8000-000000005022";
const invalidCategoryId = "00000000-0000-4000-8000-000000005099";
const merchantId = "00000000-0000-4000-8000-000000001001";
const otherMerchantId = "00000000-0000-4000-8000-000000001002";
const updatedAt = "2026-08-21T01:00:00.000Z";
const transactionAt = "2026-08-20T01:30:00.000Z";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "member",
  id: ledgerId,
  name: "家庭账本",
};

function candidate(id: string) {
  return {
    accountCurrency: "JPY",
    accountId: oldAccountId,
    amount: "100",
    categoryName: "餐饮",
    id,
    parentCategoryName: "生活",
    refundedAmount: "0",
    remainingRefundableAmount: "100",
    transactionAt,
    transactionRecordId: "00000000-0000-4000-8000-000000008888",
  };
}

function formOptions() {
  return {
    accountOptions: [
      { currency: "JPY", id: oldAccountId, name: "现金" },
      { currency: "JPY", id: sameCurrencyAccountId, name: "银行" },
      { currency: "USD", id: otherCurrencyAccountId, name: "美元" },
    ],
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
    merchantOptions: [
      { icon_url: null, id: merchantId, name: "商家" },
      { icon_url: null, id: otherMerchantId, name: "新商家" },
    ],
    transactionItemSpecialStatusEnabled: true,
  };
}

function createIncomeView(
  role: "refund" | "reimbursement" = "reimbursement",
): EditTransactionView {
  return {
    ...formOptions(),
    canEdit: false,
    editRestriction: "linked",
    initialValues: {
      accountId: oldAccountId,
      items: [
        {
          amount: "100",
          businessStatus: {
            incomeLinkRole: role,
            offsetComposition: {
              refundAmount: "0",
              reimbursementAmount: "0",
            },
            settlementStatus: null,
          },
          categoryId: incomeCategoryId,
          id: linkedItemId,
          refundCandidate: role === "refund" ? candidate(targetItemId) : null,
          reimbursementCandidate:
            role === "reimbursement" ? candidate(targetItemId) : null,
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

function createTargetView(
  source: "refund" | "reimbursement" = "reimbursement",
): EditTransactionView {
  return {
    ...formOptions(),
    canEdit: false,
    editRestriction: "linked",
    initialValues: {
      accountId: oldAccountId,
      items: [
        {
          amount: "300",
          businessStatus: {
            incomeLinkRole: null,
            offsetComposition: {
              refundAmount: source === "refund" ? "50" : "0",
              reimbursementAmount: source === "reimbursement" ? "50" : "0",
            },
            settlementStatus: "pendingReimbursement",
          },
          categoryId: expenseCategoryId,
          id: linkedItemId,
          refundCandidate: null,
          reimbursementCandidate: null,
          specialStatus: "pendingReimbursement",
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

function createUnlinkedView(): EditTransactionView {
  return {
    ...formOptions(),
    canEdit: true,
    editRestriction: null,
    initialValues: {
      accountId: oldAccountId,
      items: [
        {
          amount: "100",
          businessStatus: null,
          categoryId: expenseCategoryId,
          id: linkedItemId,
          refundCandidate: null,
          reimbursementCandidate: null,
          specialStatus: null,
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

function createViewWithSibling(): EditTransactionView {
  const view = createIncomeView();
  if (!("items" in view.initialValues)) throw new Error("测试数据不正确");
  view.initialValues.items.push({
    amount: "50",
    businessStatus: null,
    categoryId: expenseCategoryId,
    id: siblingItemId,
    refundCandidate: null,
    reimbursementCandidate: null,
    specialStatus: null,
  });
  return view;
}

function createSettledTargetView(): EditTransactionView {
  const view = createTargetView();
  if (!("items" in view.initialValues)) throw new Error("测试数据不正确");
  const item = view.initialValues.items[0];
  if (!item?.businessStatus) throw new Error("测试数据不正确");
  item.businessStatus.offsetComposition.reimbursementAmount = "300";
  item.businessStatus.settlementStatus = "reimbursed";
  item.specialStatus = "reimbursed";
  return view;
}

function createPendingView(): EditTransactionView {
  const view = createUnlinkedView();
  if (!("items" in view.initialValues)) throw new Error("测试数据不正确");
  const item = view.initialValues.items[0];
  if (!item) throw new Error("测试数据不正确");
  item.specialStatus = "pendingReimbursement";
  return view;
}

function incomeInput(
  overrides: Partial<LinkedTransactionEditInput> = {},
): LinkedTransactionEditInput {
  return {
    accountId: oldAccountId,
    confirmSync: false,
    expectedUpdatedAtByItemId: {},
    items: [
      {
        amount: 100,
        categoryId: incomeCategoryId,
        id: linkedItemId,
        reimbursementItemId: targetItemId,
      },
    ],
    ledgerId,
    merchantId,
    note: null,
    transactionAt,
    transactionRecordId,
    type: "income",
    ...overrides,
  };
}

function targetInput(
  overrides: Partial<LinkedTransactionEditInput> = {},
): LinkedTransactionEditInput {
  return {
    accountId: oldAccountId,
    confirmSync: false,
    expectedUpdatedAtByItemId: {},
    items: [
      {
        amount: 300,
        categoryId: expenseCategoryId,
        id: linkedItemId,
        specialStatus: "pendingReimbursement",
      },
    ],
    ledgerId,
    merchantId,
    note: null,
    transactionAt,
    transactionRecordId,
    type: "expense",
    ...overrides,
  };
}

function siblingInput(
  siblingOverrides: Partial<LinkedTransactionEditInput["items"][number]>,
): LinkedTransactionEditInput {
  return incomeInput({
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
  });
}

function createService(view: EditTransactionView | null) {
  const updateNormal = vi.fn();
  const voidTransaction = vi.fn();
  const transactionService = {
    canModify: vi.fn().mockResolvedValue(true),
    getEditView: vi.fn().mockResolvedValue(view),
    updateNormal,
    void: voidTransaction,
  } as unknown as TransactionService;
  const updateEdit = vi.fn();
  const linkedTransactionItemService = {
    getEditSnapshot: vi.fn(),
    update: vi.fn(),
    updateEdit,
  } as unknown as LinkedTransactionItemService;
  const service = createLinkedTransactionEditService({
    linkedTransactionItemService,
    transactionService,
  });
  return {
    linkedTransactionItemService,
    service,
    transactionService,
    updateEdit,
    updateNormal,
    voidTransaction,
  };
}

describe("LinkedTransactionEditService", () => {
  it("没有关联时继续走普通保存路径且不要求确认", async () => {
    const { service, updateEdit, updateNormal } =
      createService(createUnlinkedView());
    const input = targetInput({
      items: [
        {
          amount: 300,
          categoryId: expenseCategoryId,
          id: linkedItemId,
        },
      ],
    });

    await service.updateNormal(currentLedger, input);

    expect(updateNormal).toHaveBeenCalledWith(input);
    expect(updateEdit).not.toHaveBeenCalled();
  });

  it("只改日期商家备注时不触发同步确认并走单事务保存", async () => {
    const { service, updateEdit } = createService(createIncomeView());
    const input = incomeInput({
      merchantId: otherMerchantId,
      note: "仅修改备注",
      transactionAt: "2026-08-21T01:30:00.000Z",
    });

    await service.updateNormal(currentLedger, input);

    expect(updateEdit).toHaveBeenCalledWith({
      itemUpdates: [],
      ledgerId,
      merchantId: otherMerchantId,
      note: "仅修改备注",
      transactionAt: "2026-08-21T01:30:00.000Z",
      transactionRecordId,
    });
  });

  it("HTTP 空字符串备注与原空备注等价时不执行无效保存", async () => {
    const { service, updateEdit } = createService(createIncomeView());

    await service.updateNormal(currentLedger, incomeInput({ note: "" }));

    expect(updateEdit).not.toHaveBeenCalled();
  });

  it("子项金额变化但未确认时返回确认冲突", async () => {
    const { service, updateEdit } = createService(createIncomeView());
    const input = incomeInput({
      items: [
        {
          amount: 120,
          categoryId: incomeCategoryId,
          id: linkedItemId,
          reimbursementItemId: targetItemId,
        },
      ],
    });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedSyncConfirmationRequired,
      name: ConflictError.name,
    });
    expect(updateEdit).not.toHaveBeenCalled();
  });

  it("确认后把子项修改与 expectedUpdatedAt 路由到 PR1 原子编排 RPC", async () => {
    const { service, updateEdit } = createService(createIncomeView());
    const input = incomeInput({
      confirmSync: true,
      expectedUpdatedAtByItemId: { [linkedItemId]: updatedAt },
      items: [
        {
          amount: 120,
          categoryId: incomeCategoryId,
          id: linkedItemId,
          reimbursementItemId: targetItemId,
        },
      ],
    });

    await service.updateNormal(currentLedger, input);

    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemUpdates: [
          {
            accountId: oldAccountId,
            amount: 120,
            categoryId: incomeCategoryId,
            expectedUpdatedAt: updatedAt,
            transactionItemId: linkedItemId,
          },
        ],
      }),
    );
  });

  it("母项金额变化不要求确认并路由到 PR1 原子编排 RPC", async () => {
    const { service, updateEdit } = createService(createTargetView());
    const input = targetInput({
      expectedUpdatedAtByItemId: { [linkedItemId]: updatedAt },
      items: [
        {
          amount: 360,
          categoryId: expenseCategoryId,
          id: linkedItemId,
          specialStatus: "pendingReimbursement",
        },
      ],
    });

    await service.updateNormal(currentLedger, input);

    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemUpdates: [expect.objectContaining({ amount: 360 })],
      }),
    );
  });

  it("母项与子项同时变化时仍要求确认", async () => {
    const view = createTargetView();
    if (!("items" in view.initialValues)) throw new Error("测试数据不正确");
    const incomeView = createIncomeView();
    if (!("items" in incomeView.initialValues)) {
      throw new Error("测试数据不正确");
    }
    view.initialValues.items.push({
      ...incomeView.initialValues.items[0],
      id: siblingItemId,
    });
    const { service, updateEdit } = createService(view);

    await expect(
      service.updateNormal(
        currentLedger,
        targetInput({
          expectedUpdatedAtByItemId: {
            [linkedItemId]: updatedAt,
            [siblingItemId]: updatedAt,
          },
          items: [
            {
              amount: 360,
              categoryId: expenseCategoryId,
              id: linkedItemId,
              specialStatus: "pendingReimbursement",
            },
            {
              amount: 120,
              categoryId: incomeCategoryId,
              id: siblingItemId,
              reimbursementItemId: targetItemId,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedSyncConfirmationRequired,
      name: ConflictError.name,
    });
    expect(updateEdit).not.toHaveBeenCalled();
  });

  it("退款关联不允许切换账户", async () => {
    const { service } = createService(createIncomeView("refund"));
    const input = incomeInput({
      accountId: sameCurrencyAccountId,
      items: [
        {
          amount: 100,
          categoryId: incomeCategoryId,
          id: linkedItemId,
          refundedItemId: targetItemId,
        },
      ],
    });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.refundLinkInvalid,
      name: ValidationError.name,
    });
  });

  it("报销关联切换账户时拒绝不同币种", async () => {
    const { service } = createService(createIncomeView());
    const input = incomeInput({ accountId: otherCurrencyAccountId });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.reimbursementLinkInvalid,
      name: ValidationError.name,
    });
  });

  it("原账户不在有效选项中时仍拒绝报销关联切换账户", async () => {
    const view = createIncomeView();
    view.accountOptions = view.accountOptions.filter(
      (account) => account.id !== oldAccountId,
    );
    const { service } = createService(view);
    const input = incomeInput({ accountId: otherCurrencyAccountId });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.reimbursementLinkInvalid,
      name: ValidationError.name,
    });
  });

  it("报销关联允许同币种账户并在确认后保存", async () => {
    const { service, updateEdit } = createService(createIncomeView());
    const input = incomeInput({
      accountId: sameCurrencyAccountId,
      confirmSync: true,
      expectedUpdatedAtByItemId: { [linkedItemId]: updatedAt },
    });

    await service.updateNormal(currentLedger, input);

    expect(updateEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        itemUpdates: [
          expect.objectContaining({ accountId: sameCurrencyAccountId }),
        ],
      }),
    );
  });

  it("关联收入改成支出分类时要求先解除关联", async () => {
    const { service } = createService(createIncomeView());
    const input = incomeInput({
      items: [
        {
          amount: 100,
          categoryId: expenseCategoryId,
          id: linkedItemId,
          reimbursementItemId: targetItemId,
        },
      ],
    });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedEditRequiresUnlink,
      name: ValidationError.name,
    });
  });

  it("待报销状态本身不能被取消", async () => {
    const { service } = createService(createTargetView());
    const input = targetInput({
      items: [
        {
          amount: 300,
          categoryId: expenseCategoryId,
          id: linkedItemId,
          specialStatus: null,
        },
      ],
    });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
  });

  it("修改关联对象时要求先解除原关联", async () => {
    const { service } = createService(createIncomeView());
    const input = incomeInput({
      items: [
        {
          amount: 100,
          categoryId: incomeCategoryId,
          id: linkedItemId,
          reimbursementItemId: "00000000-0000-4000-8000-000000000399",
        },
      ],
    });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedEditRequiresUnlink,
      name: ValidationError.name,
    });
  });

  it("删除已关联明细时返回明确拒绝", async () => {
    const { service } = createService(createIncomeView());
    const input = incomeInput({ items: [] });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedDeleteForbidden,
      name: ValidationError.name,
    });
  });

  it("删除只包含子项关联明细的交易时继续执行原子删除", async () => {
    const { service, voidTransaction } = createService(createIncomeView());

    await service.void(currentLedger, { ledgerId, transactionRecordId });

    expect(voidTransaction).toHaveBeenCalledWith({
      ledgerId,
      transactionRecordId,
    });
  });

  it("删除包含母项关联明细的交易时仍返回明确拒绝", async () => {
    const { service, voidTransaction } = createService(createTargetView());

    await expect(
      service.void(currentLedger, { ledgerId, transactionRecordId }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedDeleteForbidden,
      name: ValidationError.name,
    });
    expect(voidTransaction).not.toHaveBeenCalled();
  });

  it("缺少乐观锁版本时不调用保存 RPC", async () => {
    const { service, updateEdit } = createService(createIncomeView());
    const input = incomeInput({
      confirmSync: true,
      items: [
        {
          amount: 120,
          categoryId: incomeCategoryId,
          id: linkedItemId,
          reimbursementItemId: targetItemId,
        },
      ],
    });

    await expect(
      service.updateNormal(currentLedger, input),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.linkedVersionInvalid,
      name: ConflictError.name,
    });
    expect(updateEdit).not.toHaveBeenCalled();
  });

  it("Repository 并发 ConflictError 通过完整保存流程原样冒泡", async () => {
    const { linkedTransactionItemService, service } =
      createService(createIncomeView());
    const conflict = new ConflictError(
      transactionErrorCodes.updateInvalid,
      "交易明细已被其他操作更新，请刷新后重试。",
    );
    vi.mocked(linkedTransactionItemService.updateEdit).mockRejectedValueOnce(
      conflict,
    );
    const input = incomeInput({
      confirmSync: true,
      expectedUpdatedAtByItemId: { [linkedItemId]: updatedAt },
      items: [
        {
          amount: 120,
          categoryId: incomeCategoryId,
          id: linkedItemId,
          reimbursementItemId: targetItemId,
        },
      ],
    });

    await expect(service.updateNormal(currentLedger, input)).rejects.toBe(
      conflict,
    );
  });

  describe("边界校验", () => {
    it.each([
      [{ specialStatus: "pendingReimbursement" as const }],
      [{ reimbursementItemId: targetItemId }],
    ])(
      "关联交易中的其他明细发生业务关系变化时拒绝静默丢弃",
      async (overrides) => {
        const { service, updateEdit } = createService(createViewWithSibling());

        await expect(
          service.updateNormal(currentLedger, siblingInput(overrides)),
        ).rejects.toMatchObject({
          code: transactionErrorCodes.linkedEditRequiresUnlink,
          name: ValidationError.name,
        });
        expect(updateEdit).not.toHaveBeenCalled();
      },
    );

    it("已结清母项原样回传派生状态时仍可同步修改金额", async () => {
      const { service, updateEdit } = createService(createSettledTargetView());
      const input = targetInput({
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
      });

      await service.updateNormal(currentLedger, input);

      expect(updateEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          itemUpdates: [expect.objectContaining({ amount: 320 })],
        }),
      );
    });

    it("关联交易切换收入支出类型时要求先解除关联", async () => {
      const { service, updateEdit, updateNormal } = createService(
        createSettledTargetView(),
      );
      const input = targetInput({
        confirmSync: true,
        items: [],
        type: "income",
      });

      await expect(
        service.updateNormal(currentLedger, input),
      ).rejects.toMatchObject({
        code: transactionErrorCodes.linkedEditRequiresUnlink,
        name: ValidationError.name,
      });
      expect(updateNormal).not.toHaveBeenCalled();
      expect(updateEdit).not.toHaveBeenCalled();
    });

    it("普通明细不能伪造关联派生状态", async () => {
      const { service, updateEdit, updateNormal } =
        createService(createUnlinkedView());
      const input = targetInput({
        items: [
          {
            amount: 300,
            categoryId: expenseCategoryId,
            id: linkedItemId,
            specialStatus: "reimbursementSurplus",
          },
        ],
      });

      await expect(
        service.updateNormal(currentLedger, input),
      ).rejects.toMatchObject({
        code: transactionErrorCodes.specialStatusInvalid,
        name: ValidationError.name,
      });
      expect(updateNormal).not.toHaveBeenCalled();
      expect(updateEdit).not.toHaveBeenCalled();
    });

    it("待报销明细缺少特殊状态字段时拒绝旧保存路径清空状态", async () => {
      const { service, updateEdit, updateNormal } =
        createService(createPendingView());
      const input = targetInput({
        items: [
          {
            amount: 300,
            categoryId: expenseCategoryId,
            id: linkedItemId,
          },
        ],
      });

      await expect(
        service.updateNormal(currentLedger, input),
      ).rejects.toMatchObject({
        code: transactionErrorCodes.specialStatusInvalid,
        name: ValidationError.name,
      });
      expect(updateNormal).not.toHaveBeenCalled();
      expect(updateEdit).not.toHaveBeenCalled();
    });

    it("待报销明细提交未知分类时返回分类无效", async () => {
      const { service, updateEdit, updateNormal } =
        createService(createPendingView());
      const input = targetInput({
        items: [
          {
            amount: 300,
            categoryId: invalidCategoryId,
            id: linkedItemId,
            specialStatus: "pendingReimbursement",
          },
        ],
      });

      await expect(
        service.updateNormal(currentLedger, input),
      ).rejects.toMatchObject({
        code: transactionErrorCodes.categoryInvalid,
        name: ValidationError.name,
      });
      expect(updateNormal).not.toHaveBeenCalled();
      expect(updateEdit).not.toHaveBeenCalled();
    });

    it.each(["expense", "income"] as const)(
      "整条省略待报销明细时即使目标类型为 %s 也拒绝删除",
      async (type) => {
        const { service, updateEdit, updateNormal } =
          createService(createPendingView());
        const input = targetInput({ items: [], type });

        await expect(
          service.updateNormal(currentLedger, input),
        ).rejects.toMatchObject({
          code: transactionErrorCodes.specialStatusInvalid,
          name: ValidationError.name,
        });
        expect(updateNormal).not.toHaveBeenCalled();
        expect(updateEdit).not.toHaveBeenCalled();
      },
    );

    it("重复持久化明细 ID 时拒绝保存", async () => {
      const { service, updateEdit, updateNormal } =
        createService(createUnlinkedView());
      const duplicatedItem = {
        amount: 300,
        categoryId: expenseCategoryId,
        id: linkedItemId,
      };
      const input = targetInput({
        items: [duplicatedItem, { ...duplicatedItem }],
      });

      await expect(
        service.updateNormal(currentLedger, input),
      ).rejects.toMatchObject({
        code: transactionErrorCodes.updateInvalid,
        name: ValidationError.name,
      });
      expect(updateNormal).not.toHaveBeenCalled();
      expect(updateEdit).not.toHaveBeenCalled();
    });
  });
});
