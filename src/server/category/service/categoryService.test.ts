// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "server/category/categoryErrors";
import type { CategoryRepository } from "server/category/repository/categoryRepository";
import { createCategoryService } from "server/category/service/categoryService";
import type { LedgerAccessService } from "server/ledger/service/ledgerAccessService";
import {
  AuthorizationError,
  ConflictError,
  RepositoryError,
} from "server/shared/errors/appError";
import type { CategoryRow } from "types/categories";

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
    updateDetails: vi.fn().mockResolvedValue(true),
    updateSortOrder: vi.fn().mockResolvedValue(true),
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
    const rows: CategoryRow[] = [
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

  it("排序必须完整覆盖同级分类并保留 reorder_failed 语义", async () => {
    const repository = createRepository({
      listActiveSiblings: vi.fn().mockResolvedValue([
        {
          iconName: null,
          id: categoryId,
          name: "餐饮",
          sortOrder: 10,
        },
      ]),
    });
    const service = createService(repository);

    await expect(
      service.reorder({
        categoryIds: [categoryId, secondCategoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toMatchObject({ code: categoryErrorCodes.reorderFailed });
    expect(repository.updateSortOrder).not.toHaveBeenCalled();
  });

  it("排序列表包含重复 ID 时不会绕过完整覆盖校验", async () => {
    const repository = createRepository({
      listActiveSiblings: vi.fn().mockResolvedValue([
        {
          iconName: null,
          id: categoryId,
          name: "餐饮",
          sortOrder: 10,
        },
        {
          iconName: null,
          id: secondCategoryId,
          name: "交通",
          sortOrder: 20,
        },
      ]),
    });
    const service = createService(repository);

    await expect(
      service.reorder({
        categoryIds: [categoryId, categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toMatchObject({ code: categoryErrorCodes.reorderFailed });
    expect(repository.updateSortOrder).not.toHaveBeenCalled();
  });

  it("排序中途失败时恢复已写入项并保留恢复失败标记", async () => {
    const updateSortOrder = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(
        new RepositoryError("category_reorder_failed", "失败"),
      )
      .mockResolvedValueOnce(false);
    const repository = createRepository({
      listActiveSiblings: vi.fn().mockResolvedValue([
        {
          iconName: null,
          id: categoryId,
          name: "餐饮",
          sortOrder: 10,
        },
        {
          iconName: null,
          id: secondCategoryId,
          name: "交通",
          sortOrder: 20,
        },
      ]),
      updateSortOrder,
    });
    const service = createService(repository);

    await expect(
      service.reorder({
        categoryIds: [secondCategoryId, categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).rejects.toMatchObject({
      code: categoryErrorCodes.reorderFailed,
      details: { recoveryFailed: true },
    });
    expect(updateSortOrder).toHaveBeenNthCalledWith(3, {
      categoryId: secondCategoryId,
      ledgerId,
      parentId: null,
      sortOrder: 20,
      type: "expense",
      updatedBy: userId,
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
});
