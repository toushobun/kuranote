// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { LedgerAccessService } from "internal/ledger/service/ledgerAccessService";
import { merchantErrorCodes } from "internal/merchant/errors";
import type { MerchantRepository } from "internal/merchant/repository/merchantRepository";
import { createMerchantService } from "internal/merchant/service/merchantService";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RepositoryError,
} from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";

function createRepository(
  overrides: Partial<MerchantRepository> = {},
): MerchantRepository {
  return {
    archiveAlias: vi.fn().mockResolvedValue(true),
    archiveMerchant: vi.fn().mockResolvedValue(true),
    createAlias: vi.fn(),
    createMerchant: vi.fn(),
    findActiveAlias: vi.fn().mockResolvedValue({ merchantId }),
    findActiveMerchant: vi.fn().mockResolvedValue(true),
    findSummariesByIds: vi.fn().mockResolvedValue([]),
    listActive: vi.fn().mockResolvedValue([]),
    listActiveSummaries: vi.fn().mockResolvedValue([]),
    updateMerchant: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function createLedgerAccessService(
  overrides: Partial<LedgerAccessService> = {},
): LedgerAccessService {
  return {
    getActiveMemberRole: vi.fn().mockResolvedValue("owner"),
    ...overrides,
  };
}

function createService(
  repository: MerchantRepository = createRepository(),
  ledgerAccessService: LedgerAccessService = createLedgerAccessService(),
  currentUserId: string | null = userId,
) {
  return createMerchantService({
    currentUserId,
    ledgerAccessService,
    merchantRepository: repository,
  });
}

describe("createMerchantService", () => {
  it("未登录时拒绝读取商家列表", async () => {
    await expect(
      createService(
        createRepository(),
        createLedgerAccessService(),
        null,
      ).getView({ keyword: "", ledgerId, ledgerName: "家庭账本" }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("非活动账本成员时拒绝读取", async () => {
    const ledgerAccessService = createLedgerAccessService({
      getActiveMemberRole: vi.fn().mockResolvedValue(null),
    });

    await expect(
      createService(createRepository(), ledgerAccessService).listActiveOptions({
        ledgerId,
      }),
    ).rejects.toMatchObject({ code: merchantErrorCodes.ledgerInvalid });
  });

  it("普通成员可以读取但不能维护商家", async () => {
    const repository = createRepository();
    const ledgerAccessService = createLedgerAccessService({
      getActiveMemberRole: vi.fn().mockResolvedValue("member"),
    });
    const service = createService(repository, ledgerAccessService);

    await expect(service.listActiveOptions({ ledgerId })).resolves.toEqual([]);
    await expect(
      service.createMerchant({
        ledgerId,
        name: "LIFE",
        note: null,
        siteUrl: null,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.createMerchant).not.toHaveBeenCalled();
  });

  it("管理员创建商家时由 Service 注入当前用户 ID", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.createMerchant({
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
    });

    expect(repository.createMerchant).toHaveBeenCalledWith({
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
      userId,
    });
  });

  it("API 商家列表读取不需要 SSR 账本名称", async () => {
    const repository = createRepository();

    await expect(
      createService(repository).list({ keyword: "LIFE", ledgerId }),
    ).resolves.toEqual({ canManageMerchants: true, merchants: [] });
    expect(repository.listActive).toHaveBeenCalledWith(ledgerId);
  });

  it("商家页面读取会附加权限、账本名称并按名称或别名筛选", async () => {
    const repository = createRepository({
      listActive: vi.fn().mockResolvedValue([
        {
          aliases: [
            {
              alias: "来福",
              created_at: "2026-01-01T00:00:00.000Z",
              id: aliasId,
              merchant_id: merchantId,
              sort_order: 0,
            },
          ],
          created_at: "2026-01-01T00:00:00.000Z",
          icon_url: null,
          id: merchantId,
          name: "LIFE",
          note: null,
          sort_order: 0,
          website_url: null,
        },
      ]),
    });

    await expect(
      createService(repository).getView({
        keyword: "来福",
        ledgerId,
        ledgerName: "家庭账本",
      }),
    ).resolves.toMatchObject({
      canManageMerchants: true,
      ledgerName: "家庭账本",
      merchants: [{ id: merchantId }],
    });
  });

  it("新增别名前确认商家属于当前账本且未归档", async () => {
    const repository = createRepository({
      findActiveMerchant: vi.fn().mockResolvedValue(false),
    });

    await expect(
      createService(repository).createAlias({
        alias: "来福",
        ledgerId,
        merchantId,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.createAlias).not.toHaveBeenCalled();
  });

  it("归档别名时验证所属商家并返回商家 ID", async () => {
    const repository = createRepository();

    await expect(
      createService(repository).archiveAlias({ aliasId, ledgerId }),
    ).resolves.toBe(merchantId);
    expect(repository.archiveAlias).toHaveBeenCalledWith({ aliasId, userId });
  });

  it("别名所属商家不在当前账本时返回 alias_invalid", async () => {
    const repository = createRepository({
      findActiveMerchant: vi.fn().mockResolvedValue(false),
    });

    await expect(
      createService(repository).archiveAlias({ aliasId, ledgerId }),
    ).rejects.toMatchObject({ code: merchantErrorCodes.aliasInvalid });
    expect(repository.archiveAlias).not.toHaveBeenCalled();
  });

  it("别名归档未命中时保留商家 ID", async () => {
    const repository = createRepository({
      archiveAlias: vi.fn().mockResolvedValue(false),
    });

    await expect(
      createService(repository).archiveAlias({ aliasId, ledgerId }),
    ).rejects.toMatchObject({
      code: merchantErrorCodes.aliasArchiveFailed,
      details: { merchantId },
    });
  });

  it("商家更新或归档未命中时保留既有操作错误码", async () => {
    const repository = createRepository({
      archiveMerchant: vi.fn().mockResolvedValue(false),
      updateMerchant: vi.fn().mockResolvedValue(false),
    });
    const service = createService(repository);

    await expect(
      service.archiveMerchant({ ledgerId, merchantId }),
    ).rejects.toMatchObject({ code: merchantErrorCodes.archiveFailed });
    await expect(
      service.updateMerchant({
        ledgerId,
        merchantId,
        name: "LIFE",
        note: null,
        siteUrl: null,
      }),
    ).rejects.toMatchObject({ code: merchantErrorCodes.updateFailed });
  });

  it("Repository 异常保持内部错误，不伪装成权限错误", async () => {
    const ledgerAccessService = createLedgerAccessService({
      getActiveMemberRole: vi
        .fn()
        .mockRejectedValue(
          new RepositoryError("ledger_member_load_failed", "读取失败"),
        ),
    });

    await expect(
      createService(createRepository(), ledgerAccessService).listActiveOptions({
        ledgerId,
      }),
    ).rejects.toMatchObject({ code: "ledger_member_load_failed" });
  });
});
