// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { LedgerAccessService } from "internal/ledger";
import { merchantErrorCodes } from "internal/merchant/errors";
import type { MerchantRepository } from "internal/merchant/repository/merchantRepository";
import { createMerchantIconService } from "internal/merchant/service/merchantIconService";
import { createMerchantService } from "internal/merchant/service/merchantService";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";
const tagId = "00000000-0000-4000-8000-000000002001";

const activeMerchant = {
  aliases: [],
  created_at: "2026-01-01T00:00:00.000Z",
  display_name: "LIFE",
  icon_url: null,
  id: merchantId,
  name: "LIFE",
  note: null,
  sort_order: 0,
  tags: [],
  website_url: null,
};

function createRepository(
  overrides: Partial<MerchantRepository> = {},
): MerchantRepository {
  return {
    archiveAlias: vi.fn().mockResolvedValue(true),
    archiveMerchant: vi.fn().mockResolvedValue(true),
    archiveTag: vi.fn().mockResolvedValue(true),
    createAlias: vi.fn(),
    createMerchant: vi.fn(),
    createTag: vi.fn(),
    findActiveAlias: vi.fn().mockResolvedValue({ merchantId }),
    findActiveMerchant: vi.fn().mockResolvedValue(true),
    findActiveMerchantData: vi.fn().mockResolvedValue(null),
    findActiveTag: vi.fn().mockResolvedValue(null),
    findSummariesByIds: vi.fn().mockResolvedValue([]),
    listActive: vi.fn().mockResolvedValue({ merchants: [], tags: [] }),
    listActiveSummaries: vi.fn().mockResolvedValue([]),
    listActiveTagIds: vi.fn().mockResolvedValue([]),
    listActiveTags: vi.fn().mockResolvedValue([]),
    reorderTags: vi.fn(),
    setPreferredAlias: vi.fn().mockResolvedValue(true),
    updateMerchant: vi.fn().mockResolvedValue(true),
    updateTag: vi.fn().mockResolvedValue(true),
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
  merchantIconService: ReturnType<typeof createMerchantIconService> = {
    fetchIcon: vi.fn().mockResolvedValue({
      url: "https://t2.gstatic.com/faviconV2?url=https://example.com",
    }),
  },
  logger: Logger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
) {
  return createMerchantService({
    currentUserId,
    ledgerAccessService,
    logger,
    merchantIconService,
    merchantRepository: repository,
  });
}

describe("createMerchantService", () => {
  it("设置别名展示名时校验别名归属并调用原子更新", async () => {
    const repository = createRepository();

    await createService(repository).setPreferredAlias({
      aliasId,
      ledgerId,
      merchantId,
    });

    expect(repository.setPreferredAlias).toHaveBeenCalledWith({
      aliasId,
      ledgerId,
      merchantId,
    });
  });

  it("选择正式名时以空别名清除当前展示别名", async () => {
    const repository = createRepository();

    await createService(repository).setPreferredAlias({
      aliasId: null,
      ledgerId,
      merchantId,
    });

    expect(repository.findActiveAlias).not.toHaveBeenCalled();
    expect(repository.setPreferredAlias).toHaveBeenCalledWith({
      aliasId: null,
      ledgerId,
      merchantId,
    });
  });
  it("未登录时拒绝读取商家列表", async () => {
    await expect(
      createService(createRepository(), createLedgerAccessService(), null).list(
        { keyword: "", ledgerId },
      ),
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
    const fetchIcon = vi.fn().mockResolvedValue({
      url: "https://t2.gstatic.com/faviconV2?url=https://example.com",
    });
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
    );

    await service.createMerchant({
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
    });

    expect(repository.createMerchant).toHaveBeenCalledWith({
      iconUrl: expect.stringContaining("t2.gstatic.com"),
      ledgerId,
      name: "LIFE",
      note: "常用超市",
      siteUrl: "https://example.com",
      tagIds: [],
      userId,
    });
    expect(fetchIcon).toHaveBeenCalledWith("https://example.com");
  });

  it("创建商家时图标抓取失败仍保存商家", async () => {
    const repository = createRepository();
    const fetchIcon = vi.fn().mockRejectedValue(new Error("provider failed"));
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
      logger,
    );

    await expect(
      service.createMerchant({
        ledgerId,
        name: "LIFE",
        note: null,
        siteUrl: "https://example.com",
      }),
    ).resolves.toBeUndefined();
    expect(repository.createMerchant).toHaveBeenCalledWith(
      expect.objectContaining({ iconUrl: null }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "[merchant] failed to fetch icon while saving merchant",
      { errorName: "Error", ledgerId },
    );
  });

  it("创建商家时复用与网址匹配的预览图标", async () => {
    const repository = createRepository();
    const fetchIcon = vi.fn();
    const previewIconUrl =
      "https://t2.gstatic.com/faviconV2?url=https://example.com&size=128";
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
    );

    await service.createMerchant({
      ledgerId,
      name: "LIFE",
      note: null,
      previewIconUrl,
      siteUrl: "https://example.com/products",
    });

    expect(fetchIcon).not.toHaveBeenCalled();
    expect(repository.createMerchant).toHaveBeenCalledWith(
      expect.objectContaining({ iconUrl: previewIconUrl }),
    );
  });

  it("网址变化时重新抓取图标并随商家更新落库", async () => {
    const repository = createRepository({
      findActiveMerchantData: vi.fn().mockResolvedValue({
        ...activeMerchant,
        icon_url: "https://t1.gstatic.com/old",
        website_url: "https://old.example.com",
      }),
    });
    const fetchIcon = vi.fn().mockResolvedValue({
      url: "https://t2.gstatic.com/faviconV2?url=https://new.example.com",
    });
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
    );

    await service.updateMerchant({
      ledgerId,
      merchantId,
      name: "LIFE",
      note: null,
      siteUrl: "https://new.example.com",
    });

    expect(fetchIcon).toHaveBeenCalledWith("https://new.example.com");
    expect(repository.updateMerchant).toHaveBeenCalledWith(
      expect.objectContaining({
        iconUrl: "https://t2.gstatic.com/faviconV2?url=https://new.example.com",
        siteUrl: "https://new.example.com",
      }),
    );
  });

  it("更新商家时图标抓取失败仍保存其他修改", async () => {
    const repository = createRepository({
      findActiveMerchantData: vi.fn().mockResolvedValue({
        ...activeMerchant,
        icon_url: "https://t1.gstatic.com/old",
        website_url: "https://old.example.com",
      }),
    });
    const fetchIcon = vi.fn().mockRejectedValue(new Error("provider failed"));
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
      logger,
    );

    await expect(
      service.updateMerchant({
        ledgerId,
        merchantId,
        name: "新名称",
        note: "新备注",
        siteUrl: "https://new.example.com",
      }),
    ).resolves.toBeUndefined();
    expect(repository.updateMerchant).toHaveBeenCalledWith(
      expect.objectContaining({
        iconUrl: null,
        name: "新名称",
        note: "新备注",
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "[merchant] failed to fetch icon while saving merchant",
      { errorName: "Error", ledgerId },
    );
  });

  it("网址未变化时沿用缓存且不重复抓取", async () => {
    const repository = createRepository({
      findActiveMerchantData: vi.fn().mockResolvedValue({
        ...activeMerchant,
        icon_url: "https://t2.gstatic.com/cached",
        website_url: "https://example.com",
      }),
    });
    const fetchIcon = vi.fn();
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
    );

    await service.updateMerchant({
      ledgerId,
      merchantId,
      name: "LIFE",
      note: null,
      siteUrl: "https://example.com",
    });

    expect(fetchIcon).not.toHaveBeenCalled();
    expect(repository.updateMerchant).toHaveBeenCalledWith(
      expect.objectContaining({ iconUrl: "https://t2.gstatic.com/cached" }),
    );
  });

  it("保存商家修改时复用编辑页获取的图标预览", async () => {
    const repository = createRepository({
      findActiveMerchantData: vi.fn().mockResolvedValue({
        ...activeMerchant,
        icon_url: "https://t1.gstatic.com/old",
        website_url: "https://old.example.com",
      }),
    });
    const fetchIcon = vi.fn();
    const previewIconUrl =
      "https://t2.gstatic.com/faviconV2?url=https://new.example.com&size=128";
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
    );

    await service.updateMerchant({
      ledgerId,
      merchantId,
      name: "LIFE",
      note: null,
      previewIconUrl,
      siteUrl: "https://new.example.com/path",
    });

    expect(fetchIcon).not.toHaveBeenCalled();
    expect(repository.updateMerchant).toHaveBeenCalledWith(
      expect.objectContaining({
        iconUrl: previewIconUrl,
        siteUrl: "https://new.example.com/path",
      }),
    );
  });

  it("清空网址时同步清除旧图标缓存", async () => {
    const repository = createRepository({
      findActiveMerchantData: vi.fn().mockResolvedValue({
        ...activeMerchant,
        icon_url: "https://t2.gstatic.com/cached",
        website_url: "https://example.com",
      }),
    });
    const fetchIcon = vi.fn();
    const service = createService(
      repository,
      createLedgerAccessService(),
      userId,
      { fetchIcon },
    );

    await service.updateMerchant({
      ledgerId,
      merchantId,
      name: "LIFE",
      note: null,
      siteUrl: null,
    });

    expect(fetchIcon).not.toHaveBeenCalled();
    expect(repository.updateMerchant).toHaveBeenCalledWith(
      expect.objectContaining({ iconUrl: null, siteUrl: null }),
    );
  });

  it("创建商家只读取未归档标签 ID 进行校验", async () => {
    const repository = createRepository({
      listActiveTagIds: vi.fn().mockResolvedValue([tagId]),
    });

    await createService(repository).createMerchant({
      ledgerId,
      name: "LIFE",
      note: null,
      siteUrl: null,
      tagIds: [tagId],
    });

    expect(repository.listActiveTagIds).toHaveBeenCalledWith(ledgerId);
    expect(repository.listActiveTags).not.toHaveBeenCalled();
  });

  it("创建标签由 Repository 原子分配排序", async () => {
    const repository = createRepository();

    await createService(repository).createTag({
      icon: "🛒",
      ledgerId,
      name: "超市",
    });

    expect(repository.createTag).toHaveBeenCalledWith({
      icon: "🛒",
      ledgerId,
      name: "超市",
    });
    expect(repository.listActiveTags).not.toHaveBeenCalled();
  });

  it("API 商家列表读取不需要 SSR 账本名称", async () => {
    const repository = createRepository();

    await expect(
      createService(repository).list({ keyword: "LIFE", ledgerId }),
    ).resolves.toEqual({
      canManageMerchants: true,
      merchants: [],
      selectedTag: null,
      tagFilterError: null,
      tags: [],
    });
    expect(repository.listActive).toHaveBeenCalledWith(ledgerId);
  });

  it("商家列表读取会附加权限并按名称或别名筛选", async () => {
    const repository = createRepository({
      listActive: vi.fn().mockResolvedValue({
        merchants: [
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
            tags: [],
            website_url: null,
          },
        ],
        tags: [],
      }),
    });

    await expect(
      createService(repository).list({
        keyword: "来福",
        ledgerId,
      }),
    ).resolves.toMatchObject({
      canManageMerchants: true,
      merchants: [{ id: merchantId }],
    });
  });

  it("标签筛选与关键词按 AND 生效且徽标计数不受筛选影响", async () => {
    const tag = {
      icon: "🛒",
      id: tagId,
      merchant_count: 1,
      name: "超市",
      sort_order: 0,
    };
    const merchant = {
      aliases: [],
      created_at: "2026-01-01T00:00:00.000Z",
      display_name: "LIFE",
      icon_url: null,
      id: merchantId,
      name: "LIFE",
      note: null,
      sort_order: 0,
      tags: [tag],
      website_url: null,
    };
    const repository = createRepository({
      listActive: vi.fn().mockResolvedValue({
        merchants: [
          merchant,
          {
            ...merchant,
            display_name: "Amazon",
            id: `${merchantId.slice(0, -1)}2`,
            name: "Amazon",
            tags: [],
          },
        ],
        tags: [tag],
      }),
    });

    await expect(
      createService(repository).list({ keyword: "LIFE", ledgerId, tagId }),
    ).resolves.toMatchObject({
      merchants: [{ id: merchantId }],
      selectedTag: { id: tagId, merchant_count: 1 },
      tags: [{ id: tagId, merchant_count: 1 }],
    });
    expect(repository.listActiveTags).not.toHaveBeenCalled();
  });

  it("已归档或不存在的标签返回空结果并说明筛选已失效", async () => {
    const repository = createRepository({
      listActive: vi.fn().mockResolvedValue({
        merchants: [
          {
            aliases: [],
            created_at: "2026-01-01T00:00:00.000Z",
            display_name: "LIFE",
            icon_url: null,
            id: merchantId,
            name: "LIFE",
            note: null,
            sort_order: 0,
            tags: [],
            website_url: null,
          },
        ],
        tags: [],
      }),
    });

    await expect(
      createService(repository).list({ keyword: "", ledgerId, tagId }),
    ).resolves.toMatchObject({
      merchants: [],
      selectedTag: null,
      tagFilterError: "该商家分类不存在或已不可用。",
      tags: [],
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

  it("更新或归档不存在的标签时统一返回校验错误", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await expect(
      service.archiveTag({ ledgerId, tagId }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.updateTag({ icon: "🛒", ledgerId, name: "超市", tagId }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.archiveTag).not.toHaveBeenCalled();
    expect(repository.updateTag).not.toHaveBeenCalled();
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

  it("别名归档未命中时不向错误详情暴露内部 ID", async () => {
    const repository = createRepository({
      archiveAlias: vi.fn().mockResolvedValue(false),
    });

    await expect(
      createService(repository).archiveAlias({ aliasId, ledgerId }),
    ).rejects.toMatchObject({
      code: merchantErrorCodes.aliasArchiveFailed,
      details: undefined,
    });
  });

  it("商家更新或归档在前置检查后未命中时返回 409", async () => {
    const repository = createRepository({
      archiveMerchant: vi.fn().mockResolvedValue(false),
      findActiveMerchantData: vi.fn().mockResolvedValue(activeMerchant),
      updateMerchant: vi.fn().mockResolvedValue(false),
    });
    const service = createService(repository);

    await expect(
      service.archiveMerchant({ ledgerId, merchantId }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      service.updateMerchant({
        ledgerId,
        merchantId,
        name: "LIFE",
        note: null,
        siteUrl: null,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("商家不存在或已归档时更新与归档返回 404", async () => {
    const repository = createRepository({
      findActiveMerchant: vi.fn().mockResolvedValue(false),
    });
    const service = createService(repository);

    await expect(
      service.archiveMerchant({ ledgerId, merchantId }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.updateMerchant({
        ledgerId,
        merchantId,
        name: "LIFE",
        note: null,
        siteUrl: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.archiveMerchant).not.toHaveBeenCalled();
    expect(repository.updateMerchant).not.toHaveBeenCalled();
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
