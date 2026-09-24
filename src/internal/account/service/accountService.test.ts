// @vitest-environment node

import type { CurrentLedgerRole } from "internal/ledger";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError } from "internal/shared/errors/appError";
import {
  accountErrorCodes,
  getAccountErrorMessage,
} from "internal/account/errors";
import type { AccountRepository } from "internal/account/repository/accountRepository";
import { createAccountService } from "internal/account/service/accountService";
import type {
  LedgerAccessService,
  LedgerPlaceholderMemberQueryService,
} from "internal/ledger";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const holderUserId = "00000000-0000-4000-8000-000000000041";
const accountId = "00000000-0000-4000-8000-000000000045";
const placeholderId = "00000000-0000-4000-8000-000000000061";

function createPlaceholderQueryService(
  placeholders = [{ displayName: "奶奶", id: placeholderId }],
): LedgerPlaceholderMemberQueryService {
  return { listUnclaimed: vi.fn().mockResolvedValue(placeholders) };
}

function createRepository(): AccountRepository {
  return {
    archive: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(accountId),
    findActiveLedger: vi.fn().mockResolvedValue({
      baseCurrency: "JPY",
      id: ledgerId,
      name: "家庭账本",
    }),
    findSummariesByIds: vi.fn().mockResolvedValue([]),
    isActiveAccount: vi.fn().mockResolvedValue(true),
    listAccounts: vi.fn().mockResolvedValue([]),
    listActiveMembers: vi.fn().mockResolvedValue([
      {
        created_at: "2026-07-01T00:00:00.000Z",
        joined_at: null,
        role: "owner",
        user_id: userId,
      },
      {
        created_at: "2026-07-02T00:00:00.000Z",
        joined_at: null,
        role: "member",
        user_id: holderUserId,
      },
    ]),
    listDisplaySettings: vi.fn().mockResolvedValue([]),
    listHolders: vi.fn().mockResolvedValue([]),
    listUsers: vi.fn().mockImplementation(async (userIds: string[]) =>
      userIds.map((id) => ({
        display_name: id === userId ? "淞文" : "成员",
        email: `${id}@example.com`,
        id,
        status: "active",
      })),
    ),
    update: vi.fn().mockResolvedValue(true),
  };
}

function createLedgerAccessService(
  role: CurrentLedgerRole | null = "owner",
): LedgerAccessService {
  return {
    getActiveMemberRole: vi.fn().mockResolvedValue(role),
  };
}

function createInput() {
  return {
    currency: " jpy ",
    holderPlaceholderId: null as string | null,
    holderUserIds: [holderUserId, holderUserId],
    initialBalance: 1000,
    ledgerId,
    name: " 现金 ",
    type: "cash" as const,
    userId,
  };
}

function createService(
  repository: AccountRepository,
  ledgerAccessService = createLedgerAccessService(),
  ledgerPlaceholderMemberQueryService = createPlaceholderQueryService(),
) {
  return createAccountService({
    accountRepository: repository,
    ledgerAccessService,
    ledgerPlaceholderMemberQueryService,
  });
}

describe("AccountService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("读取账户页面时通过账本窄接口校验权限并聚合成员信息", async () => {
    const repository = createRepository();
    const ledgerAccessService = createLedgerAccessService();
    vi.mocked(repository.listAccounts).mockResolvedValue([
      {
        created_at: "2026-07-01T00:00:00.000Z",
        currency: "JPY",
        current_balance: "1000",
        id: accountId,
        is_archived: false,
        initial_balance: "1000",
        name: "现金",
        sort_order: 0,
        type: "cash",
      },
    ]);
    vi.mocked(repository.listHolders).mockResolvedValue([
      {
        account_id: accountId,
        id: "00000000-0000-4000-8000-000000000051",
        role: "owner",
        placeholder_id: null,
        share_ratio: null,
        user_id: holderUserId,
      },
    ]);
    vi.mocked(repository.listDisplaySettings).mockResolvedValue([
      {
        display_color: "sky",
        display_name: "家里的成员",
        user_id: holderUserId,
      },
    ]);
    const service = createService(repository, ledgerAccessService);

    const view = await service.getView({ ledgerId, userId });

    expect(ledgerAccessService.getActiveMemberRole).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
    expect(view).toEqual(
      expect.objectContaining({
        baseCurrency: "JPY",
        canManageAccounts: true,
        canWriteTransactions: true,
        ledgerName: "家庭账本",
      }),
    );
    expect(view.accounts[0].holders[0]).toEqual(
      expect.objectContaining({
        display_color: "sky",
        display_name: "家里的成员",
        user_id: holderUserId,
      }),
    );
    expect(view.holderOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          display_name: "家里的成员",
          user_id: holderUserId,
        }),
      ]),
    );
    expect(repository.listAccounts).toHaveBeenCalledWith(ledgerId, undefined);
    expect(repository.listHolders).toHaveBeenCalledWith(ledgerId, [accountId]);
  });

  it("includeArchived 透传给仓储以读取归档账户", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.getView({ ledgerId, userId, includeArchived: true });

    expect(repository.listAccounts).toHaveBeenCalledWith(ledgerId, true);
  });

  it("非 active 成员在读取账户数据前被账本窄接口拒绝", async () => {
    const repository = createRepository();
    const service = createService(repository, createLedgerAccessService(null));

    await expect(service.getView({ ledgerId, userId })).rejects.toMatchObject({
      code: accountErrorCodes.ledgerInvalid,
    });
    expect(repository.findActiveLedger).not.toHaveBeenCalled();
    expect(repository.listActiveMembers).not.toHaveBeenCalled();
    expect(repository.listAccounts).not.toHaveBeenCalled();
  });

  it("普通成员可以读取账户但不能维护账户", async () => {
    const repository = createRepository();
    const service = createService(
      repository,
      createLedgerAccessService("member"),
    );

    await expect(service.getView({ ledgerId, userId })).resolves.toEqual(
      expect.objectContaining({ canManageAccounts: false }),
    );
    await expect(service.create(createInput())).rejects.toMatchObject({
      code: accountErrorCodes.permissionDenied,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("创建账户前规范化字段并确认持有人属于当前账本", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(service.create(createInput())).resolves.toEqual({ accountId });

    expect(repository.create).toHaveBeenCalledWith({
      currency: "JPY",
      holderPlaceholderId: null,
      holderUserIds: [holderUserId],
      initialBalance: 1000,
      ledgerId,
      name: "现金",
      type: "cash",
    });
  });

  it("保留数据库同维度重名冲突，不增加账本全局预判重", async () => {
    const repository = createRepository();
    const service = createService(repository);
    const error = new ConflictError(
      accountErrorCodes.nameDuplicate,
      getAccountErrorMessage(accountErrorCodes.nameDuplicate)!,
    );
    vi.mocked(repository.create).mockRejectedValue(error);
    await expect(service.create(createInput())).rejects.toBe(error);
    expect(repository.listAccounts).not.toHaveBeenCalled();
  });

  it("允许不指定任何持有人创建账户", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(
      service.create({ ...createInput(), holderUserIds: [] }),
    ).resolves.toEqual({ accountId });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ holderUserIds: [] }),
    );
  });

  it("持有人不是当前账本有效成员时拒绝创建", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(
      service.create({
        ...createInput(),
        holderUserIds: ["00000000-0000-4000-8000-000000000099"],
      }),
    ).rejects.toMatchObject({ code: accountErrorCodes.holderInvalid });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("持有人超过 1 个时拒绝创建", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(
      service.create({
        ...createInput(),
        holderUserIds: [userId, holderUserId],
      }),
    ).rejects.toMatchObject({ code: accountErrorCodes.holderTooMany });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("更新不存在或已删除的账户时返回 account_not_found", async () => {
    const repository = createRepository();
    vi.mocked(repository.isActiveAccount).mockResolvedValue(false);
    const service = createService(repository);

    await expect(
      service.update({ ...createInput(), accountId }),
    ).rejects.toMatchObject({ code: accountErrorCodes.accountNotFound });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("归档成功时写入固定时间和当前用户", async () => {
    const repository = createRepository();
    const service = createAccountService({
      accountRepository: repository,
      ledgerAccessService: createLedgerAccessService(),
      ledgerPlaceholderMemberQueryService: createPlaceholderQueryService(),
      now: () => new Date("2026-07-21T00:00:00.000Z"),
    });

    await expect(
      service.archive({ accountId, ledgerId, userId }),
    ).resolves.toBe(undefined);
    expect(repository.archive).toHaveBeenCalledWith({
      accountId,
      archivedAt: "2026-07-21T00:00:00.000Z",
      ledgerId,
      userId,
    });
    expect(repository.listActiveMembers).not.toHaveBeenCalled();
  });

  it("交易上下文保留已归档账户的历史显示信息", async () => {
    const repository = createRepository();
    vi.mocked(repository.findSummariesByIds).mockResolvedValue([
      { currency: "JPY", id: accountId, name: "已归档现金" },
    ]);
    const service = createService(repository);

    await expect(
      service.getTransactionContext({
        accountIds: [accountId],
        ledgerId,
        userId,
      }),
    ).resolves.toMatchObject({
      accounts: [{ currency: "JPY", id: accountId, name: "已归档现金" }],
    });
    expect(repository.findSummariesByIds).toHaveBeenCalledWith(ledgerId, [
      accountId,
    ]);
    expect(repository.listAccounts).not.toHaveBeenCalled();
  });
});

describe("余额调整", () => {
  it("将目标余额和独立备注一次性交给原子保存", async () => {
    const repository = createRepository();
    await createService(repository).update({
      ...createInput(),
      accountId,
      targetBalance: -250,
      balanceAdjustmentNote: " 盘点 ",
    });
    expect(repository.update).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        accountId,
        targetBalance: -250,
        balanceAdjustmentNote: "盘点",
      }),
    );
  });
  it.each([NaN, Infinity, 1.001, 1e12])(
    "拒绝无效目标余额 %s",
    async (targetBalance) => {
      const repository = createRepository();
      await expect(
        createService(repository).update({
          ...createInput(),
          accountId,
          targetBalance,
        }),
      ).rejects.toMatchObject({ code: accountErrorCodes.balanceInvalid });
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
  it("非管理成员不能调整余额", async () => {
    const repository = createRepository();
    await expect(
      createService(repository, createLedgerAccessService("member")).update({
        ...createInput(),
        accountId,
        targetBalance: 10,
      }),
    ).rejects.toMatchObject({ name: "AuthorizationError" });
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe("AccountService 占位持有人", () => {
  const placeholderHolder = {
    account_id: accountId,
    id: "00000000-0000-4000-8000-000000000052",
    placeholder_id: placeholderId,
    role: "owner" as const,
    share_ratio: null,
    user_id: null,
  };

  function mockPlaceholderAccount(repository: AccountRepository) {
    vi.mocked(repository.listAccounts).mockResolvedValue([
      {
        created_at: "2026-07-01T00:00:00.000Z",
        currency: "JPY",
        current_balance: "0",
        id: accountId,
        initial_balance: "0",
        is_archived: false,
        name: "奶奶的钱包",
        sort_order: 0,
        type: "cash",
      },
    ]);
    vi.mocked(repository.listHolders).mockResolvedValue([placeholderHolder]);
  }

  it("读取路径显示占位名字，不用占位 ID 查询用户，也不会变成无持有人", async () => {
    const repository = createRepository();
    mockPlaceholderAccount(repository);

    const view = await createService(repository).getView({ ledgerId, userId });

    expect(view.accounts[0].holders).toEqual([
      expect.objectContaining({
        display_color: null,
        display_name: "奶奶",
        email: null,
        kind: "placeholder",
        placeholder_id: placeholderId,
        user_id: null,
      }),
    ]);
    const queriedUserIds = vi
      .mocked(repository.listUsers)
      .mock.calls.flatMap(([ids]) => ids);
    expect(queriedUserIds).not.toContain(placeholderId);
    expect(view.placeholderHolderOptions).toEqual([
      { display_name: "奶奶", placeholder_id: placeholderId },
    ]);
    // 占位不是成员候选。
    expect(view.holderOptions.map((option) => option.user_id)).not.toContain(
      placeholderId,
    );
  });

  it("创建时把占位 ID 透传给 Repository，且不传用户持有人", async () => {
    const repository = createRepository();

    await createService(repository).create({
      ...createInput(),
      holderPlaceholderId: placeholderId.toUpperCase(),
      holderUserIds: [],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        holderPlaceholderId: placeholderId,
        holderUserIds: [],
      }),
    );
  });

  it("编辑时保持占位持有人", async () => {
    const repository = createRepository();

    await createService(repository).update({
      ...createInput(),
      accountId,
      holderPlaceholderId: placeholderId,
      holderUserIds: [],
    });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        holderPlaceholderId: placeholderId,
        holderUserIds: [],
      }),
    );
  });

  it("同时指定成员与占位时拒绝", async () => {
    const repository = createRepository();

    await expect(
      createService(repository).create({
        ...createInput(),
        holderPlaceholderId: placeholderId,
        holderUserIds: [holderUserId],
      }),
    ).rejects.toMatchObject({
      code: accountErrorCodes.holderIdentityInvalid,
      name: "ValidationError",
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("占位不属于该账本或已被认领时预检失败", async () => {
    const repository = createRepository();
    const service = createService(
      repository,
      createLedgerAccessService(),
      createPlaceholderQueryService([]),
    );

    await expect(
      service.update({
        ...createInput(),
        accountId,
        holderPlaceholderId: placeholderId,
        holderUserIds: [],
      }),
    ).rejects.toMatchObject({
      code: accountErrorCodes.placeholderUnavailable,
      message: getAccountErrorMessage(accountErrorCodes.placeholderUnavailable),
      name: "ConflictError",
    });
    expect(repository.update).not.toHaveBeenCalled();
  });
});
