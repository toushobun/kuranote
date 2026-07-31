// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "internal/category/errors";
import type { CategoryRepository } from "internal/category/repository/categoryRepository";
import { createCategoryService } from "internal/category/service/categoryService";
import type { LedgerAccessService } from "internal/ledger";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
} from "internal/shared/errors/appError";
import type { Category } from "types/categories";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryId = "00000000-0000-4000-8000-000000000101";
const secondCategoryId = "00000000-0000-4000-8000-000000000102";
const parentId = "00000000-0000-4000-8000-000000000103";

function createRepository(
  overrides: Partial<CategoryRepository> = {},
): CategoryRepository {
  return {
    archive: vi.fn().mockResolvedValue(1),
    findActiveById: vi.fn().mockResolvedValue({
      id: categoryId,
      parentId: null,
      type: "expense",
    }),
    findActiveByLedgerId: vi.fn().mockResolvedValue([]),
    findByIdsWithParents: vi.fn().mockResolvedValue([]),
    findActiveRootById: vi.fn().mockResolvedValue({
      id: parentId,
      parentId: null,
      type: "expense",
    }),
    insert: vi.fn(),
    listActiveSiblings: vi.fn().mockResolvedValue([]),
    reorder: vi.fn(),
    updateDetails: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function createLedgerAccessService(
  role: "owner" | "admin" | "member" | "viewer" | null = "owner",
): LedgerAccessService {
  return {
    getActiveMemberRole: vi.fn().mockResolvedValue(role),
  };
}

function createService(
  repository: CategoryRepository = createRepository(),
  role: "owner" | "admin" | "member" | "viewer" | null = "owner",
) {
  return createCategoryService({
    categoryRepository: repository,
    ledgerAccessService: createLedgerAccessService(role),
  });
}

const baseRow = {
  created_at: "2026-01-01T00:00:00.000Z",
  icon_name: null,
  sort_order: 10,
  type: "expense" as const,
};

describe("createCategoryService", () => {
  it("SSR 读取直接组装分类树并按真实成员角色返回管理权限", async () => {
    const rows: Category[] = [
      { ...baseRow, id: categoryId, name: "餐饮", parent_id: null },
      { ...baseRow, id: secondCategoryId, name: "外食", parent_id: categoryId },
    ];
    const repository = createRepository({
      findActiveByLedgerId: vi.fn().mockResolvedValue(rows),
    });
    const service = createService(repository, "member");

    await expect(
      service.getCategoriesView({
        ledgerId,
        ledgerName: "家庭账本",
        userId,
      }),
    ).resolves.toEqual({
      canManageCategories: false,
      categories: [{ ...rows[0], children: [rows[1]] }],
      ledgerName: "家庭账本",
      parentOptions: [{ id: categoryId, name: "餐饮", type: "expense" }],
    });
  });

  it("非活动账本成员读取分类时返回 404", async () => {
    const repository = createRepository();
    const service = createService(repository, null);

    await expect(
      service.getCategoriesView({ ledgerId, ledgerName: "家庭账本", userId }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findActiveByLedgerId).not.toHaveBeenCalled();
  });

  it("非 owner/admin 不能执行写操作且 Repository 不会被调用", async () => {
    const repository = createRepository();
    const service = createService(repository, "member");

    await expect(
      service.create({
        iconName: "🍽️",
        ledgerId,
        name: "餐饮",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.listActiveSiblings).not.toHaveBeenCalled();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("创建小分类时验证父分类属于同一账本、同一类型且为大分类", async () => {
    const repository = createRepository({
      findActiveRootById: vi.fn().mockResolvedValue(null),
    });
    const service = createService(repository);

    await expect(
      service.create({
        iconName: "🛒",
        ledgerId,
        name: "超市",
        parentId,
        type: "expense",
        userId,
      }),
    ).rejects.toMatchObject({
      code: categoryErrorCodes.parentInvalid,
    });
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("同级显示名称重复时返回冲突且不写入", async () => {
    const repository = createRepository({
      listActiveSiblings: vi.fn().mockResolvedValue([
        {
          iconName: "🍔",
          id: secondCategoryId,
          name: "🍔 食费",
          sortOrder: 10,
        },
      ]),
    });
    const service = createService(repository);

    await expect(
      service.create({
        iconName: "🍽️",
        ledgerId,
        name: " 食费 ",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("创建分类时保存 Emoji 名称并按同级最大值加 10", async () => {
    const repository = createRepository({
      listActiveSiblings: vi.fn().mockResolvedValue([
        {
          iconName: "🍚",
          id: secondCategoryId,
          name: "🍚 主食",
          sortOrder: 20,
        },
      ]),
    });
    const service = createService(repository);

    await service.create({
      iconName: "🍽️",
      ledgerId,
      name: "餐饮",
      parentId: null,
      type: "expense",
      userId,
    });

    expect(repository.insert).toHaveBeenCalledWith({
      createdBy: userId,
      iconName: "🍽️",
      ledgerId,
      name: "🍽️ 餐饮",
      parentId: null,
      sortOrder: 30,
      type: "expense",
    });
  });

  it("更新分类时保持原父级和类型进行同级重名校验", async () => {
    const repository = createRepository({
      findActiveById: vi.fn().mockResolvedValue({
        id: categoryId,
        parentId,
        type: "expense",
      }),
    });
    const service = createService(repository);

    await service.update({
      categoryId,
      iconName: "🍜",
      ledgerId,
      name: "外食",
      userId,
    });

    expect(repository.listActiveSiblings).toHaveBeenCalledWith({
      ledgerId,
      parentId,
      type: "expense",
    });
    expect(repository.updateDetails).toHaveBeenCalledWith({
      categoryId,
      iconName: "🍜",
      ledgerId,
      name: "🍜 外食",
      updatedBy: userId,
    });
  });

  it("排序只调用一次事务型 Repository RPC", async () => {
    const reorder = vi.fn();
    const repository = createRepository({ reorder });
    const service = createService(repository);

    await service.reorder({
      categoryIds: [secondCategoryId, categoryId],
      ledgerId,
      parentId: null,
      type: "expense",
      userId,
    });

    expect(reorder).toHaveBeenCalledOnce();
    expect(reorder).toHaveBeenCalledWith({
      categoryIds: [secondCategoryId, categoryId],
      ledgerId,
      parentId: null,
      type: "expense",
    });
    expect(repository.listActiveSiblings).not.toHaveBeenCalled();
  });

  it("无分类管理权限时不会调用排序 RPC", async () => {
    const repository = createRepository();
    const service = createService(repository, "member");

    await expect(
      service.reorder({
        categoryIds: [categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.reorder).not.toHaveBeenCalled();
  });

  it("排序 RPC 失败时转换为既有 reorder_failed 语义", async () => {
    const repository = createRepository({
      reorder: vi
        .fn()
        .mockRejectedValue(
          new RepositoryError("category_reorder_failed", "失败"),
        ),
    });
    const service = createService(repository);

    await expect(
      service.reorder({
        categoryIds: [categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toMatchObject({
      code: categoryErrorCodes.reorderFailed,
      details: undefined,
    });
  });

  it("归档大分类时同时归档其直接子分类", async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.archive({ categoryId, ledgerId, userId });

    expect(repository.archive).toHaveBeenCalledWith({
      archivedAt: expect.any(String),
      archivedBy: userId,
      categoryId,
      includeChildren: true,
      ledgerId,
    });
  });

  it("分类归档或更新在前置检查后未命中时返回 409", async () => {
    const archiveRepository = createRepository({
      archive: vi.fn().mockResolvedValue(0),
    });
    const updateRepository = createRepository({
      updateDetails: vi.fn().mockResolvedValue(false),
    });

    await expect(
      createService(archiveRepository).archive({
        categoryId,
        ledgerId,
        userId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      createService(updateRepository).update({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
