// @vitest-environment node

import type { CurrentLedgerRole } from "internal/ledger";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { accountErrorCodes } from "internal/account/errors";
import type { AccountRepository } from "internal/account/repository/accountRepository";
import { createAccountService } from "internal/account/service/accountService";
import type { LedgerAccessService } from "internal/ledger";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const holderUserId = "00000000-0000-4000-8000-000000000041";
const accountId = "00000000-0000-4000-8000-000000000045";

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
) {
  return createAccountService({
    accountRepository: repository,
    ledgerAccessService,
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
    expect(repository.listAccounts).toHaveBeenCalledWith(ledgerId);
    expect(repository.listHolders).toHaveBeenCalledWith(ledgerId, [accountId]);
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
      holderUserIds: [holderUserId],
      initialBalance: 1000,
      ledgerId,
      name: "现金",
      type: "cash",
    });
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
