// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedgerRole } from "internal/ledger";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  transactionErrorCodes,
  transactionPaymentMessages,
} from "internal/transaction/errors";
import {
  createTransactionService,
  type TransactionService,
  type TransactionServiceDependencies,
} from "internal/transaction/service/transactionService";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000099";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";

function createRepository(
  overrides: Partial<
    TransactionServiceDependencies["transactionRepository"]
  > = {},
): TransactionServiceDependencies["transactionRepository"] {
  return {
    createBalanceAdjustment: vi.fn(),
    createNormal: vi.fn(),
    createTransfer: vi.fn(),
    isMultiAccountPaymentEnabled: vi.fn().mockResolvedValue(true),
    isSpecialStatusEnabled: vi.fn().mockResolvedValue(true),
    findActiveRecord: vi.fn().mockResolvedValue({
      created_at: "2026-06-04T01:00:00.000Z",
      created_by: userId,
      id: transactionRecordId,
      merchant_id: null,
      note: null,
      transaction_at: "2026-06-04T01:00:00.000Z",
      type: "normal",
    }),
    findUserSummaries: vi.fn().mockResolvedValue([]),
    listActiveMemberIds: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue([]),
    listPayments: vi.fn().mockResolvedValue([]),
    loadFilteredPage: vi.fn().mockResolvedValue({
      entries: [],
      nextOffset: null,
      settledCount: 0,
    }),
    listRecords: vi.fn().mockResolvedValue([]),
    loadGroupSummaries: vi.fn().mockResolvedValue([]),
    updateNormal: vi.fn(),
    updateBalanceAdjustment: vi.fn(),
    updateTransfer: vi.fn(),
    void: vi.fn(),
    ...overrides,
  };
}

function createService(
  role: CurrentLedgerRole | null,
  repository = createRepository(),
  categoryType?: "expense" | "income",
  systemKey?: "refund" | "reimbursement",
) {
  const accountQueryService = {
    getTransactionContext: vi.fn().mockResolvedValue({
      accountColorById: new Map(),
      accounts: [],
      holderIdsByAccountId: new Map(),
      showRecorder: false,
    }),
    listTransactionHolderOptions: vi.fn().mockResolvedValue([]),
    listTransactionOptionsWithHolders: vi.fn(),
    listTransactionOptions: vi.fn().mockResolvedValue([
      {
        currency: "JPY",
        id: normalInput.payments[0].accountId,
        name: "现金",
      },
    ]),
  };

  return {
    accountQueryService,
    repository,
    service: createTransactionService({
      accountQueryService,
      categoryQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue(
          categoryType
            ? [
                {
                  id: normalInput.items[0].categoryId,
                  name: "测试分类",
                  parent_id: null,
                  type: categoryType,
                  ...(systemKey ? { system_key: systemKey } : {}),
                },
              ]
            : [],
        ),
        listActiveSummaries: vi.fn(),
      },
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue(role),
      },
      merchantQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue([]),
        listActiveOptionsWithTags: vi.fn(),
        listActiveOptions: vi.fn(),
      },
      transactionRepository: repository,
    }),
  };
}

const normalInput = {
  items: [
    {
      amount: 1200,
      categoryId: "00000000-0000-4000-8000-000000005072",
    },
  ],
  ledgerId,
  merchantId: "00000000-0000-4000-8000-000000001001",
  note: null,
  payments: [
    { accountId: "00000000-0000-4000-8000-000000000045", amount: null },
  ],
  transactionAt: "2026-06-04T01:00:00.000Z",
  type: "expense" as const,
};

describe("TransactionService", () => {
  it.each(["owner", "admin", "member"] as const)(
    "%s 可以新增交易",
    async (role) => {
      const { repository, service } = createService(role);
      await service.createNormal(normalInput);
      expect(repository.createNormal).toHaveBeenCalledWith(normalInput);
    },
  );

  it("viewer 不能新增交易", async () => {
    const { repository, service } = createService("viewer");
    await expect(service.createNormal(normalInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("非账本成员新增交易时返回账本不存在错误", async () => {
    const { repository, service } = createService(null);

    await expect(service.createNormal(normalInput)).rejects.toMatchObject({
      code: transactionErrorCodes.ledgerInvalid,
      name: NotFoundError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("不能手动设置已报销状态", async () => {
    const { repository, service } = createService("member");

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            specialStatus: "reimbursed",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("收入分类不能设置待报销状态", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            specialStatus: "pendingReimbursement",
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("支出分类不能设置退款关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "expense",
    );

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            refundedItemId: "00000000-0000-4000-8000-000000005073",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("收入分类允许保存单目标退款关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
      "refund",
    );
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          refundedItemId: "00000000-0000-4000-8000-000000005073",
        },
      ],
      type: "income" as const,
    };

    await service.createNormal(input);

    expect(repository.createNormal).toHaveBeenCalledWith(input);
  });

  it("收入分类允许保存单目标报销关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
      "reimbursement",
    );
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          reimbursementItemId: "00000000-0000-4000-8000-000000005073",
        },
      ],
      type: "income" as const,
    };

    await service.createNormal(input);

    expect(repository.createNormal).toHaveBeenCalledWith(input);
  });

  it("支出分类不能建立报销关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "expense",
    );

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            reimbursementItemId: "00000000-0000-4000-8000-000000005073",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("同一收入明细不能同时建立退款和报销关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            refundedItemId: "00000000-0000-4000-8000-000000005074",
            reimbursementItemId: "00000000-0000-4000-8000-000000005073",
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("0 元退款收入允许写入待定金额关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
      "refund",
    );
    await service.createNormal({
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          amount: 0,
          refundedItemId: "00000000-0000-4000-8000-000000005073",
        },
      ],
      type: "income",
    });
    expect(repository.createNormal).toHaveBeenCalledOnce();
  });

  it("退款收入编辑允许重新提交单目标关联", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
      "refund",
    );
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          refundedItemId: "00000000-0000-4000-8000-000000005073",
        },
      ],
      transactionRecordId,
      type: "income" as const,
    };

    await service.updateNormal(input);

    expect(repository.updateNormal).toHaveBeenCalledWith(input);
  });

  it.each([
    { kind: "refundedItemId", required: "refund" },
    { kind: "reimbursementItemId", required: "reimbursement" },
  ] as const)("关联收入必须使用 $required 系统分类", async ({ kind }) => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );
    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            [kind]: "00000000-0000-4000-8000-000000005073",
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.incomeLinkCategoryInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("普通收入不允许使用退款系统分类", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
      "refund",
    );
    await expect(
      service.createNormal({ ...normalInput, type: "income" }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.incomeLinkCategoryInvalid,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("支出分类允许保存待报销状态", async () => {
    const repository = createRepository();
    const service = createTransactionService({
      accountQueryService: {
        getTransactionContext: vi.fn(),
        listTransactionHolderOptions: vi.fn().mockResolvedValue([]),
        listTransactionOptionsWithHolders: vi.fn(),
        listTransactionOptions: vi.fn().mockResolvedValue([
          {
            currency: "JPY",
            id: normalInput.payments[0].accountId,
            name: "现金",
          },
        ]),
      },
      categoryQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue([
          {
            id: normalInput.items[0].categoryId,
            name: "餐饮",
            parent_id: null,
            type: "expense",
          },
        ]),
        listActiveSummaries: vi.fn(),
      },
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("member"),
      },
      merchantQueryService: {
        findSummariesByIds: vi.fn(),
        listActiveOptionsWithTags: vi.fn(),
        listActiveOptions: vi.fn(),
      },
      transactionRepository: repository,
    });
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          specialStatus: "pendingReimbursement" as const,
        },
      ],
    };

    await service.createNormal(input);

    expect(repository.createNormal).toHaveBeenCalledWith(input);
  });

  it("viewer 不能修改交易", async () => {
    const { repository, service } = createService("viewer");
    await expect(
      service.updateNormal({ ...normalInput, transactionRecordId }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.findActiveRecord).not.toHaveBeenCalled();
    expect(repository.updateNormal).not.toHaveBeenCalled();
  });

  it("viewer 不能删除交易", async () => {
    const { repository, service } = createService("viewer");
    await expect(
      service.void({ ledgerId, transactionRecordId }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.findActiveRecord).not.toHaveBeenCalled();
    expect(repository.void).not.toHaveBeenCalled();
  });

  it("member 可以修改自己创建的交易", async () => {
    const { accountQueryService, repository, service } =
      createService("member");
    await service.updateNormal({ ...normalInput, transactionRecordId });
    expect(repository.updateNormal).toHaveBeenCalledOnce();
    expect(
      accountQueryService.listTransactionOptions,
    ).toHaveBeenCalledExactlyOnceWith({
      ledgerId,
      userId,
    });
  });

  it("普通交易引用已归档账户时服务端拒绝绕过页面编辑", async () => {
    const archivedAccountId = "00000000-0000-4000-8000-000000000046";
    const replacementAccountId = "00000000-0000-4000-8000-000000000047";
    const repository = createRepository({
      listPayments: vi.fn().mockResolvedValue([
        {
          account_id: archivedAccountId,
          amount: "1234.56",
          balance_delta: "-1234.56",
          sort_order: 0,
          transaction_record_id: transactionRecordId,
        },
      ]),
    });
    const { accountQueryService, service } = createService(
      "member",
      repository,
    );
    accountQueryService.listTransactionOptions.mockResolvedValue([
      {
        currency: "USD",
        id: replacementAccountId,
        name: "美元账户",
      },
    ]);

    await expect(
      service.updateNormal({
        ...normalInput,
        payments: [{ accountId: replacementAccountId, amount: null }],
        transactionRecordId,
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.accountInvalid,
      name: ValidationError.name,
    });
    expect(repository.updateNormal).not.toHaveBeenCalled();
    expect(accountQueryService.listTransactionOptions).toHaveBeenCalledOnce();
  });

  // 只读详情页（#928）不放宽服务端校验：member 直接提交他人记录的保存 / 删除请求也会被拒绝。
  it.each([
    {
      method: "updateNormal",
      run: (service: TransactionService) =>
        service.updateNormal({ ...normalInput, transactionRecordId }),
    },
    {
      method: "updateTransfer",
      run: (service: TransactionService) =>
        service.updateTransfer({
          accountId: normalInput.payments[0].accountId,
          ledgerId,
          note: null,
          transactionAt: "2026-06-04T01:00:00.000Z",
          transactionRecordId,
          transferAmount: 1200,
          transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
        }),
    },
    {
      method: "updateBalanceAdjustment",
      run: (service: TransactionService) =>
        service.updateBalanceAdjustment({
          ledgerId,
          note: "改备注",
          transactionAt: "2026-06-04T01:00:00.000Z",
          transactionRecordId,
        }),
    },
    {
      method: "void",
      run: (service: TransactionService) =>
        service.void({ ledgerId, transactionRecordId }),
    },
  ] as const)(
    "member 不能通过 $method 修改或删除他人创建的交易",
    async ({ method, run }) => {
      const repository = createRepository({
        findActiveRecord: vi.fn().mockResolvedValue({
          created_at: "2026-06-04T01:00:00.000Z",
          created_by: otherUserId,
          id: transactionRecordId,
          merchant_id: null,
          note: null,
          transaction_at: "2026-06-04T01:00:00.000Z",
          type: "normal",
        }),
      });
      const { service } = createService("member", repository);
      await expect(run(service)).rejects.toBeInstanceOf(AuthorizationError);
      expect(repository[method]).not.toHaveBeenCalled();
    },
  );

  it("转账引用已归档账户时服务端拒绝绕过页面编辑", async () => {
    const archivedAccountId = "00000000-0000-4000-8000-000000000046";
    const replacementAccountId = "00000000-0000-4000-8000-000000000047";
    const replacementTargetAccountId = "00000000-0000-4000-8000-000000000048";
    const repository = createRepository({
      listItems: vi.fn().mockResolvedValue([
        {
          account_id: normalInput.payments[0].accountId,
          amount: "1200",
          balance_delta: "-1200",
          category_id: null,
          note: null,
          transaction_record_id: transactionRecordId,
        },
        {
          account_id: archivedAccountId,
          amount: "1200",
          balance_delta: "1200",
          category_id: null,
          note: null,
          transaction_record_id: transactionRecordId,
        },
      ]),
    });
    const { accountQueryService, service } = createService(
      "member",
      repository,
    );
    accountQueryService.listTransactionOptions.mockResolvedValue([
      {
        currency: "USD",
        id: replacementAccountId,
        name: "美元账户",
      },
      {
        currency: "USD",
        id: replacementTargetAccountId,
        name: "美元储蓄账户",
      },
    ]);

    await expect(
      service.updateTransfer({
        accountId: replacementAccountId,
        ledgerId,
        note: null,
        transactionAt: "2026-06-04T01:00:00.000Z",
        transactionRecordId,
        transferAmount: 1200,
        transferTargetAccountId: replacementTargetAccountId,
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.accountInvalid,
      name: ValidationError.name,
    });
    expect(repository.updateTransfer).not.toHaveBeenCalled();
    expect(
      accountQueryService.listTransactionOptions,
    ).toHaveBeenCalledExactlyOnceWith({
      ledgerId,
      userId,
    });
  });

  it.each(["owner", "admin"] as const)(
    "%s 可以删除其他成员创建的交易",
    async (role) => {
      const repository = createRepository({
        findActiveRecord: vi.fn().mockResolvedValue({
          created_at: "2026-06-04T01:00:00.000Z",
          created_by: otherUserId,
          id: transactionRecordId,
          merchant_id: null,
          note: null,
          transaction_at: "2026-06-04T01:00:00.000Z",
          type: "normal",
        }),
      });
      const { service } = createService(role, repository);
      await service.void({ ledgerId, transactionRecordId });
      expect(repository.void).toHaveBeenCalledWith(
        ledgerId,
        transactionRecordId,
      );
    },
  );

  it("viewer 可以读取交易分组但仍不能写入", async () => {
    const repository = createRepository({
      loadGroupSummaries: vi.fn().mockResolvedValue([
        {
          balance: "-1200",
          expense: "1200",
          group_id: "merchant-1",
          group_key: "merchant-1",
          group_label: "商家",
          income: "0",
          latest_transaction_at: "2026-06-04T01:00:00.000Z",
          transaction_count: 1,
        },
      ]),
    });
    const { service } = createService("viewer", repository);
    const page = await service.getGroupPage(
      {
        baseCurrency: "JPY",
        currentUserRole: "member",
        id: ledgerId,
        name: "家庭账本",
      },
      "merchant",
      0,
    );
    expect(page.groups[0]).toMatchObject({
      key: "merchant-1",
      summary: { currency: "JPY", expense: "1200" },
      transactionCount: 1,
    });
  });

  function candidateService() {
    const records = [
      {
        id: "new-record",
        merchant_id: "00000000-0000-4000-8000-000000001001",
        transaction_at: "2026-11-01T00:00:00Z",
        created_at: "2026-11-01T00:00:00Z",
        created_by: userId,
        type: "normal",
      },
      {
        id: "old-record",
        merchant_id: "00000000-0000-4000-8000-000000001002",
        transaction_at: "2025-01-01T00:00:00Z",
        created_at: "2025-01-01T00:00:00Z",
        created_by: userId,
        type: "normal",
      },
    ];
    records.push({ ...records[0], id: "usd-record" });
    const items = Array.from({ length: 23 }, (_, index) => ({
      id: `candidate-${index}`,
      transaction_record_id:
        index === 22
          ? "old-record"
          : index === 21
            ? "usd-record"
            : "new-record",
      account_id:
        index === 21 ? "usd-account" : normalInput.payments[0].accountId,
      category_id: normalInput.items[0].categoryId,
      amount: "1000",
      refunded_amount: "0",
      reimbursement_amount: index === 20 ? "1200" : "0",
      special_status: index >= 20 ? "pending_reimbursement" : null,
    }));
    const payments = records.map((record) => ({
      id: `payment-${record.id}`,
      transaction_record_id: record.id,
      account_id:
        record.id === "usd-record"
          ? "usd-account"
          : normalInput.payments[0].accountId,
      amount: "1000",
      balance_delta: "-1000",
      sort_order: 0,
    }));
    const repository = createRepository({
      loadFilteredPage: vi
        .fn()
        .mockImplementation(
          async (input: {
            merchantPriorityId?: string;
            currency?: string;
            offset: number;
            query: string;
            settled?: boolean;
            specialStatuses?: string[];
          }) => {
            const matched = items.filter((item) => {
              const record = records.find(
                (record) => record.id === item.transaction_record_id,
              );
              if (!record) return false;
              if (
                input.currency &&
                (record.id === "usd-record" ? "USD" : "JPY") !== input.currency
              )
                return false;
              if (
                input.specialStatuses?.length &&
                !input.specialStatuses.some(
                  (status) =>
                    status === "pendingReimbursement" &&
                    item.special_status === "pending_reimbursement",
                )
              )
                return false;
              if (input.query && !String(item.amount).includes(input.query))
                return false;
              return true;
            });
            const settled = matched.filter(
              (item) =>
                Number(item.amount) -
                  Number(item.refunded_amount) -
                  Number(item.reimbursement_amount) <=
                0,
            );
            const selected = matched
              .filter(
                (item) => settled.includes(item) === Boolean(input.settled),
              )
              .sort((left, right) => {
                const a = records.find(
                  (record) => record.id === left.transaction_record_id,
                )!;
                const b = records.find(
                  (record) => record.id === right.transaction_record_id,
                )!;
                const priority =
                  Number(b.merchant_id === input.merchantPriorityId) -
                  Number(a.merchant_id === input.merchantPriorityId);
                return input.merchantPriorityId && priority
                  ? priority
                  : b.transaction_at.localeCompare(a.transaction_at) ||
                      b.created_at.localeCompare(a.created_at) ||
                      b.id.localeCompare(a.id) ||
                      left.id.localeCompare(right.id);
              });
            const page = selected.slice(input.offset, input.offset + 20);
            return {
              entries: page.map((item) => ({
                itemId: item.id,
                recordId: item.transaction_record_id,
              })),
              nextOffset:
                input.offset + 20 < selected.length ? input.offset + 20 : null,
              settledCount: settled.length,
            };
          },
        ),
      listRecords: vi
        .fn()
        .mockImplementation(async (input: { recordIds?: string[] }) =>
          input.recordIds
            ? records.filter((record) => input.recordIds?.includes(record.id))
            : records,
        ),
      listItems: vi
        .fn()
        .mockImplementation(async (_ledgerId: string, recordIds: string[]) =>
          items.filter((item) =>
            recordIds.includes(item.transaction_record_id),
          ),
        ),
      listPayments: vi
        .fn()
        .mockImplementation(async (_ledgerId: string, recordIds: string[]) =>
          payments.filter((payment) =>
            recordIds.includes(payment.transaction_record_id),
          ),
        ),
    });
    const context = createService("member", repository, "expense");
    context.accountQueryService.getTransactionContext.mockResolvedValue({
      accountColorById: new Map(),
      holderIdsByAccountId: new Map(),
      showRecorder: false,
      accounts: [
        {
          id: normalInput.payments[0].accountId,
          name: "现金",
          currency: "JPY",
        },
        { id: "usd-account", name: "美元", currency: "USD" },
      ],
    });
    const ledger = {
      baseCurrency: "JPY",
      currentUserRole: "member" as const,
      id: ledgerId,
      name: "家庭账本",
    };
    return { ...context, ledger };
  }

  it("候选按明细分页并按日期倒序，服务端按币种过滤、商家优先排序", async () => {
    const { service, ledger, repository } = candidateService();
    const first = await service.getLinkCandidatePage(ledger, "refund", {
      currency: "JPY",
    });
    expect(first.items).toHaveLength(20);
    expect(first.nextOffset).toBe(20);
    expect(first.settledCount).toBe(1);
    expect(repository.listRecords).toHaveBeenCalledTimes(1);
    const next = await service.getLinkCandidatePage(ledger, "refund", {
      offset: 20,
      currency: "JPY",
    });
    expect(next.items.map((item) => item.id)).toEqual(["candidate-22"]);
    expect(next.nextOffset).toBeNull();
    expect(next.settledCount).toBe(1);
    const merchant = await service.getLinkCandidatePage(ledger, "refund", {
      currency: "JPY",
      merchantId: "00000000-0000-4000-8000-000000001002",
    });
    expect(merchant.items[0].id).toBe("candidate-22");
    expect(merchant.items).toHaveLength(20);
    expect(merchant.nextOffset).toBe(20);
    expect(merchant.settledCount).toBe(1);
    expect(merchant.items[0]?.merchantId).toBe(
      "00000000-0000-4000-8000-000000001002",
    );
    const usd = await service.getLinkCandidatePage(ledger, "refund", {
      currency: "USD",
    });
    expect(usd.items.map((item) => item.id)).toEqual(["candidate-21"]);
    expect(usd.items[0]?.accountId).toBe("usd-account");
  });

  it("未传币种时跨页返回不同币种支出及原付款账户 ID", async () => {
    const { service, ledger } = candidateService();
    const first = await service.getLinkCandidatePage(ledger, "refund", {});
    const next = await service.getLinkCandidatePage(ledger, "refund", {
      offset: first.nextOffset ?? 0,
    });
    const candidates = [...first.items, ...next.items];
    expect(candidates).toHaveLength(22);
    expect(candidates.map((item) => item.id)).not.toContain("candidate-20");
    expect(candidates.map((item) => item.id)).toContain("candidate-22");
    const usdCandidate = candidates.find((item) => item.id === "candidate-21");
    expect(usdCandidate).toMatchObject({
      accountCurrency: "USD",
      accountId: "usd-account",
    });
  });

  it("报销候选保留已结清或核销结余，仅使用报销流程状态并忽略商家", async () => {
    const { service, ledger } = candidateService();
    const page = await service.getLinkCandidatePage(ledger, "reimbursement", {
      currency: "JPY",
      merchantId: "00000000-0000-4000-8000-000000001001",
    });
    expect(page.items.map((item) => item.id)).toEqual(["candidate-22"]);
    expect(page.settledCount).toBe(1);
    const settled = await service.getLinkCandidatePage(
      ledger,
      "reimbursement",
      {
        currency: "JPY",
        settled: true,
      },
    );
    expect(settled.items.map((item) => item.id)).toEqual(["candidate-20"]);
    expect(settled.items[0].remainingRefundableAmount).toBe("-200");
    expect(settled.settledCount).toBe(1);
    const search = await service.getLinkCandidatePage(ledger, "reimbursement", {
      query: "1000",
      currency: "JPY",
    });
    expect(search.items).toEqual(page.items);
  });

  it("退款候选独立计算全部已结清数量且搜索时商家优先", async () => {
    const { service, ledger } = candidateService();
    const first = await service.getLinkCandidatePage(ledger, "refund", {
      currency: "JPY",
    });
    expect(first.items).toHaveLength(20);
    expect(first.settledCount).toBe(1);
    const settled = await service.getLinkCandidatePage(ledger, "refund", {
      settled: true,
      currency: "JPY",
    });
    expect(settled.items.map((item) => item.id)).toEqual(["candidate-20"]);
    expect(settled.nextOffset).toBeNull();
    const otherMerchant = await service.getLinkCandidatePage(ledger, "refund", {
      merchantId: "00000000-0000-4000-8000-000000001002",
      settled: true,
    });
    expect(otherMerchant.items).toHaveLength(1);
    expect(otherMerchant.items[0].id).toBe("candidate-20");
    expect(otherMerchant.settledCount).toBe(1);
    const search = await service.getLinkCandidatePage(ledger, "refund", {
      query: "1000",
      settled: true,
      currency: "JPY",
    });
    expect(search.items).toEqual(settled.items);
  });

  it("同商家优先后翻页不重复，且只读取当前页记录详情", async () => {
    const { service, ledger, repository } = candidateService();
    const input = {
      merchantId: "00000000-0000-4000-8000-000000001002",
      currency: "JPY",
    };
    const first = await service.getLinkCandidatePage(ledger, "refund", input);
    const next = await service.getLinkCandidatePage(ledger, "refund", {
      ...input,
      offset: first.nextOffset ?? 0,
    });
    const ids = [...first.items, ...next.items].map((item) => item.id);
    expect(ids[0]).toBe("candidate-22");
    expect(ids).toHaveLength(21);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first.nextOffset).toBe(20);
    expect(next.nextOffset).toBeNull();
    expect(repository.listRecords).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        recordIds: expect.arrayContaining(["old-record", "new-record"]),
      }),
    );
    expect(repository.listItems).toHaveBeenNthCalledWith(2, ledger.id, [
      "new-record",
    ]);
    expect(repository.listRecords).toHaveBeenCalledTimes(2);
    expect(first.settledCount).toBe(1);
    const search = await service.getLinkCandidatePage(ledger, "refund", {
      ...input,
      query: "1000",
    });
    expect(search.items[0].id).toBe("candidate-22");
  });

  it("候选分页拒绝非法输入且非成员仍不能读取", async () => {
    const { service, ledger } = candidateService();
    await expect(
      service.getLinkCandidatePage(ledger, "refund", { offset: -1 }),
    ).rejects.toBeInstanceOf(ValidationError);
    const denied = createService(null);
    await expect(
      denied.service.getLinkCandidatePage(ledger, "refund", {}),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("纯数字关键词 7930 返回金额匹配结果", async () => {
    const repository = createRepository({
      listItems: vi.fn().mockResolvedValue([
        {
          account_id: "00000000-0000-4000-8000-000000000045",
          amount: "7930",
          category_id: normalInput.items[0].categoryId,
          transaction_record_id: transactionRecordId,
        },
      ]),
      listRecords: vi.fn().mockResolvedValue([
        {
          created_at: "2026-08-01T10:00:00.000Z",
          created_by: userId,
          id: transactionRecordId,
          merchant_id: null,
          note: null,
          transaction_at: "2026-08-01T10:00:00.000Z",
          type: "normal",
        },
      ]),
    });
    const { service } = createService("member", repository, "expense");

    const page = await service.search(
      {
        baseCurrency: "JPY",
        currentUserRole: "member",
        id: ledgerId,
        name: "家庭账本",
      },
      "7930",
    );

    expect(page).toMatchObject({ nextOffset: null, totalCount: 1 });
    expect(page.items[0]).toMatchObject({
      amount: "7930",
      id: transactionRecordId,
    });
  });

  it("非账本成员读取交易分组时返回账本不存在错误", async () => {
    const { repository, service } = createService(null);

    await expect(
      service.getGroupPage(
        {
          baseCurrency: "JPY",
          currentUserRole: "member",
          id: ledgerId,
          name: "家庭账本",
        },
        "merchant",
        0,
      ),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.ledgerInvalid,
      name: NotFoundError.name,
    });
    expect(repository.loadGroupSummaries).not.toHaveBeenCalled();
  });
});

describe("付款明细校验（create / update）", () => {
  const secondAccountId = "00000000-0000-4000-8000-000000000048";

  function createMultiAccountService(options?: {
    accountOptions?: Array<{ currency: string; id: string; name: string }>;
    repository?: ReturnType<typeof createRepository>;
  }) {
    const repository = options?.repository ?? createRepository();
    const accountQueryService = {
      getTransactionContext: vi.fn().mockResolvedValue({
        accountColorById: new Map(),
        accounts: [],
        holderIdsByAccountId: new Map(),
        showRecorder: false,
      }),
      listTransactionHolderOptions: vi.fn().mockResolvedValue([]),
      listTransactionOptionsWithHolders: vi.fn(),
      listTransactionOptions: vi.fn().mockResolvedValue(
        options?.accountOptions ?? [
          {
            currency: "JPY",
            id: normalInput.payments[0].accountId,
            name: "现金",
          },
          { currency: "JPY", id: secondAccountId, name: "储蓄账户" },
        ],
      ),
    };
    const categoryQueryService = {
      findSummariesByIds: vi.fn().mockResolvedValue([
        {
          id: normalInput.items[0].categoryId,
          name: "餐饮",
          parent_id: null,
          type: "expense" as const,
        },
      ]),
      listActiveSummaries: vi.fn(),
    };
    const service = createTransactionService({
      accountQueryService,
      categoryQueryService,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("member" as const),
      },
      merchantQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue([]),
        listActiveOptionsWithTags: vi.fn(),
        listActiveOptions: vi.fn(),
      },
      transactionRepository: repository,
    });
    return { accountQueryService, repository, service };
  }

  const multiAccountPayments = [
    { accountId: normalInput.payments[0].accountId, amount: "500" },
    { accountId: secondAccountId, amount: "700" },
  ];

  it.each(["createNormal", "updateNormal"] as const)(
    "%s 只查询一次账户选项并透传合法多账户付款明细",
    async (method) => {
      const { accountQueryService, repository, service } =
        createMultiAccountService();
      const input = {
        ...normalInput,
        items: [{ ...normalInput.items[0], amount: 1200 }],
        payments: multiAccountPayments,
        transactionRecordId,
      };

      await service[method](input);

      expect(repository[method]).toHaveBeenCalledWith(input);
      expect(
        accountQueryService.listTransactionOptions,
      ).toHaveBeenCalledExactlyOnceWith({
        ledgerId,
        userId,
      });
    },
  );

  it.each(["createNormal", "updateNormal"] as const)(
    "账本未开启多账户付款时 %s 拒绝多个付款账户",
    async (method) => {
      const repository = createRepository({
        isMultiAccountPaymentEnabled: vi.fn().mockResolvedValue(false),
      });
      const { service } = createMultiAccountService({ repository });

      await expect(
        service[method]({
          ...normalInput,
          items: [{ ...normalInput.items[0], amount: 1200 }],
          payments: multiAccountPayments,
          transactionRecordId,
        }),
      ).rejects.toMatchObject({
        code: transactionErrorCodes.paymentMultiAccountDisabled,
        message:
          transactionPaymentMessages[
            transactionErrorCodes.paymentMultiAccountDisabled
          ],
        name: ValidationError.name,
      });
      expect(repository.isMultiAccountPaymentEnabled).toHaveBeenCalledWith(
        ledgerId,
      );
      expect(repository[method]).not.toHaveBeenCalled();
    },
  );

  it("单个付款账户时不读取多账户付款开关", async () => {
    const repository = createRepository({
      isMultiAccountPaymentEnabled: vi.fn().mockResolvedValue(false),
    });
    const { service } = createMultiAccountService({ repository });

    await service.createNormal(normalInput);

    expect(repository.isMultiAccountPaymentEnabled).not.toHaveBeenCalled();
    expect(repository.createNormal).toHaveBeenCalledWith(normalInput);
  });

  it("新建交易时付款合计与支出明细合计不一致被拒绝", async () => {
    const { repository, service } = createMultiAccountService();

    await expect(
      service.createNormal({
        ...normalInput,
        items: [{ ...normalInput.items[0], amount: 1200 }],
        payments: [
          { accountId: normalInput.payments[0].accountId, amount: "500" },
          { accountId: secondAccountId, amount: "600" },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.paymentTotalMismatch,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("新建交易时重复付款账户被拒绝", async () => {
    const { repository, service } = createMultiAccountService();

    await expect(
      service.createNormal({
        ...normalInput,
        items: [{ ...normalInput.items[0], amount: 1200 }],
        payments: [
          { accountId: normalInput.payments[0].accountId, amount: "600" },
          { accountId: normalInput.payments[0].accountId, amount: "600" },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.paymentAccountDuplicate,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("新建交易时收支混合的记录拒绝使用多账户", async () => {
    const incomeCategoryId = "00000000-0000-4000-8000-000000005099";
    const repository = createRepository();
    const categoryQueryService = {
      findSummariesByIds: vi.fn().mockResolvedValue([
        {
          id: normalInput.items[0].categoryId,
          name: "餐饮",
          parent_id: null,
          type: "expense" as const,
        },
        {
          id: incomeCategoryId,
          name: "返款",
          parent_id: null,
          type: "income" as const,
        },
      ]),
      listActiveSummaries: vi.fn(),
    };
    const accountQueryService = {
      getTransactionContext: vi.fn().mockResolvedValue({
        accountColorById: new Map(),
        accounts: [],
        holderIdsByAccountId: new Map(),
        showRecorder: false,
      }),
      listTransactionHolderOptions: vi.fn().mockResolvedValue([]),
      listTransactionOptionsWithHolders: vi.fn(),
      listTransactionOptions: vi.fn().mockResolvedValue([
        {
          currency: "JPY",
          id: normalInput.payments[0].accountId,
          name: "现金",
        },
        { currency: "JPY", id: secondAccountId, name: "储蓄账户" },
      ]),
    };
    const mixedService = createTransactionService({
      accountQueryService,
      categoryQueryService,
      currentUserId: userId,
      ledgerAccessService: {
        getActiveMemberRole: vi.fn().mockResolvedValue("member" as const),
      },
      merchantQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue([]),
        listActiveOptionsWithTags: vi.fn(),
        listActiveOptions: vi.fn(),
      },
      transactionRepository: repository,
    });

    await expect(
      mixedService.createNormal({
        ...normalInput,
        items: [
          { ...normalInput.items[0], amount: 500 },
          { amount: 700, categoryId: incomeCategoryId },
        ],
        payments: multiAccountPayments,
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.paymentMultiAccountNotAllowed,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("新建交易时付款账户币种不一致被拒绝", async () => {
    const { repository, service } = createMultiAccountService({
      accountOptions: [
        {
          currency: "JPY",
          id: normalInput.payments[0].accountId,
          name: "现金",
        },
        { currency: "USD", id: secondAccountId, name: "美元账户" },
      ],
    });

    await expect(
      service.createNormal({
        ...normalInput,
        items: [{ ...normalInput.items[0], amount: 1200 }],
        payments: multiAccountPayments,
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.paymentCurrencyMismatch,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("新建交易时多账户缺少金额被拒绝", async () => {
    const { repository, service } = createMultiAccountService();

    await expect(
      service.createNormal({
        ...normalInput,
        items: [{ ...normalInput.items[0], amount: 1200 }],
        payments: [
          { accountId: normalInput.payments[0].accountId, amount: "500" },
          { accountId: secondAccountId, amount: null },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.paymentAmountRequired,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });
});

describe("特殊状态功能开关", () => {
  it("账本关闭特殊状态时拒绝特殊状态写入", async () => {
    const repository = createRepository({
      isSpecialStatusEnabled: vi.fn().mockResolvedValue(false),
    });
    const { service } = createService("member", repository, "expense");

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            specialStatus: "pendingReimbursement",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("账本关闭特殊状态时拒绝报销关联写入", async () => {
    const repository = createRepository({
      isSpecialStatusEnabled: vi.fn().mockResolvedValue(false),
    });
    const { service } = createService("member", repository, "income");

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            reimbursementItemId: "00000000-0000-4000-8000-000000005073",
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });

  it("账本关闭特殊状态时拒绝退款关联写入", async () => {
    const repository = createRepository({
      isSpecialStatusEnabled: vi.fn().mockResolvedValue(false),
    });
    const { service } = createService("member", repository, "income");

    await expect(
      service.createNormal({
        ...normalInput,
        items: [
          {
            ...normalInput.items[0],
            refundedItemId: "00000000-0000-4000-8000-000000005073",
          },
        ],
        type: "income",
      }),
    ).rejects.toMatchObject({
      code: transactionErrorCodes.specialStatusInvalid,
      name: ValidationError.name,
    });
    expect(repository.createNormal).not.toHaveBeenCalled();
  });
});

describe("余额调整编辑和撤销", () => {
  function adjustmentRepository() {
    return createRepository({
      findActiveRecord: vi.fn().mockResolvedValue({
        id: transactionRecordId,
        type: "balance_adjustment",
        created_by: userId,
      }),
      listItems: vi.fn().mockResolvedValue([
        {
          account_id: normalInput.payments[0].accountId,
          balance_delta: "2500",
        },
      ]),
    });
  }
  const editInput = {
    ledgerId,
    transactionRecordId,
    transactionAt: "2026-09-14T00:00:00.000Z",
    note: "盘点",
  };
  it("归档账户仍可修改时间备注且不提交账户或金额", async () => {
    const { service, repository, accountQueryService } = createService(
      "member",
      adjustmentRepository(),
    );
    accountQueryService.listTransactionOptions.mockResolvedValue([]);
    await service.updateBalanceAdjustment(editInput);
    expect(repository.findActiveRecord).toHaveBeenCalledExactlyOnceWith(
      ledgerId,
      transactionRecordId,
    );
    expect(repository.updateBalanceAdjustment).toHaveBeenCalledExactlyOnceWith(
      editInput,
    );
    expect(repository.listActiveMemberIds).not.toHaveBeenCalled();
  });
  it("拒绝修改账户和金额", async () => {
    const { service, repository } = createService(
      "member",
      adjustmentRepository(),
    );
    await expect(
      service.updateBalanceAdjustment({
        ...editInput,
        ...{ signedDelta: "999" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.updateBalanceAdjustment).not.toHaveBeenCalled();
  });
  it("查看者不能修改余额调整", async () => {
    const { service, repository } = createService(
      "viewer",
      adjustmentRepository(),
    );
    await expect(
      service.updateBalanceAdjustment(editInput),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.updateBalanceAdjustment).not.toHaveBeenCalled();
  });
  it("归档账户禁止撤销并返回可展示原因", async () => {
    const { service, repository, accountQueryService } = createService(
      "member",
      adjustmentRepository(),
    );
    accountQueryService.listTransactionOptions.mockResolvedValue([]);
    await expect(
      service.void({ ledgerId, transactionRecordId }),
    ).rejects.toMatchObject({
      code: "balance_adjustment_account_archived",
      message: "该账户已归档，无法撤销余额调整",
    });
    expect(repository.void).not.toHaveBeenCalled();
  });
  it("活动账户撤销走原子冲销 RPC", async () => {
    const { service, repository } = createService(
      "member",
      adjustmentRepository(),
    );
    await service.void({ ledgerId, transactionRecordId });
    expect(repository.findActiveRecord).toHaveBeenCalledExactlyOnceWith(
      ledgerId,
      transactionRecordId,
    );
    expect(repository.void).toHaveBeenCalledExactlyOnceWith(
      ledgerId,
      transactionRecordId,
    );
  });
});

describe("创建余额变更（导入）", () => {
  const accountId = "00000000-0000-4000-8000-000000000045";
  const input = {
    accountId,
    ledgerId,
    note: "初始余额",
    signedDelta: -20.5,
    transactionAt: "2026-01-05T03:00:00.000Z",
  };

  it("管理员合法差值直接提交给仓储", async () => {
    const { service, repository } = createService("owner");
    await service.createBalanceAdjustment(input);
    expect(repository.createBalanceAdjustment).toHaveBeenCalledExactlyOnceWith(
      input,
    );
  });

  it("普通成员没有管理权限，拒绝写入", async () => {
    const { service, repository } = createService("member");
    await expect(service.createBalanceAdjustment(input)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(repository.createBalanceAdjustment).not.toHaveBeenCalled();
  });

  it.each([
    ["零差值", { signedDelta: 0 }, transactionErrorCodes.amountInvalid],
    [
      "超过两位小数",
      { signedDelta: 1.234 },
      transactionErrorCodes.amountInvalid,
    ],
    ["超过上限", { signedDelta: 1e12 }, transactionErrorCodes.amountInvalid],
    [
      "备注过长",
      { note: "字".repeat(2001) },
      transactionErrorCodes.noteTooLong,
    ],
    [
      "时间格式不正确",
      { transactionAt: "2026-01-05" },
      transactionErrorCodes.dateInvalid,
    ],
    ["账户 id 非法", { accountId: "x" }, transactionErrorCodes.accountInvalid],
  ])("服务端重新校验：%s", async (_name, patch, code) => {
    const { service, repository } = createService("owner");
    await expect(
      service.createBalanceAdjustment({ ...input, ...patch }),
    ).rejects.toMatchObject({ code, name: ValidationError.name });
    expect(repository.createBalanceAdjustment).not.toHaveBeenCalled();
  });
});
