// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedgerRole } from "internal/ledger";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";
import {
  createTransactionService,
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
    convert: vi.fn(),
    createNormal: vi.fn(),
    createTransfer: vi.fn(),
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
    listPendingReimbursementItems: vi.fn().mockResolvedValue([]),
    listRecords: vi.fn().mockResolvedValue([]),
    loadGroupSummaries: vi.fn().mockResolvedValue([]),
    updateNormal: vi.fn(),
    updateTransfer: vi.fn(),
    void: vi.fn(),
    ...overrides,
  };
}

function createService(
  role: CurrentLedgerRole | null,
  repository = createRepository(),
  categoryType?: "expense" | "income",
) {
  return {
    repository,
    service: createTransactionService({
      accountQueryService: {
        getTransactionContext: vi.fn(),
        listTransactionOptions: vi.fn(),
      },
      categoryQueryService: {
        findSummariesByIds: vi.fn().mockResolvedValue(
          categoryType
            ? [
                {
                  id: normalInput.items[0].categoryId,
                  name: "测试分类",
                  parent_id: null,
                  type: categoryType,
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
        findSummariesByIds: vi.fn(),
        listActiveOptions: vi.fn(),
      },
      transactionRepository: repository,
    }),
  };
}

const normalInput = {
  accountId: "00000000-0000-4000-8000-000000000045",
  items: [
    {
      amount: 1200,
      categoryId: "00000000-0000-4000-8000-000000005072",
    },
  ],
  ledgerId,
  merchantId: "00000000-0000-4000-8000-000000001001",
  note: null,
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

  it("支出分类不能设置报销关联", async () => {
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
            reimbursementItemIds: ["00000000-0000-4000-8000-000000005073"],
          },
        ],
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

  it("同一收入明细不能同时设置报销和退款关联", async () => {
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
            refundedItemId: "00000000-0000-4000-8000-000000005073",
            reimbursementItemIds: ["00000000-0000-4000-8000-000000005074"],
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

  it("支出分类允许保存待报销状态", async () => {
    const repository = createRepository();
    const service = createTransactionService({
      accountQueryService: {
        getTransactionContext: vi.fn(),
        listTransactionOptions: vi.fn(),
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
    const { repository, service } = createService("member");
    await service.updateNormal({ ...normalInput, transactionRecordId });
    expect(repository.updateNormal).toHaveBeenCalledOnce();
  });

  it("member 不能修改他人创建的交易", async () => {
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
    await expect(
      service.updateNormal({ ...normalInput, transactionRecordId }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.updateNormal).not.toHaveBeenCalled();
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
});
