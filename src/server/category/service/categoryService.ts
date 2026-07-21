import { canManageMasterData } from "lib/ledger/permissions";
import { categoryErrorCodes } from "server/category/categoryErrors";
import type {
  CategoryRepository,
  CategoryScope,
} from "server/category/repository/categoryRepository";
import type { LedgerAccessService } from "server/ledger/service/ledgerAccessService";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "server/shared/errors/appError";
import type {
  CategoriesViewData,
  CategoryRow,
  CategoryTreeItem,
} from "types/categories";
import type { TransactionType } from "types/transactions";
import {
  getCategoryDisplayName,
  getCategoryStoredName,
} from "utils/categoryNames";

export type CategoriesView = CategoriesViewData & {
  canManageCategories: boolean;
};

export type CreateCategoryInput = CategoryScope & {
  iconName: string;
  name: string;
  userId: string;
};

export type UpdateCategoryInput = {
  categoryId: string;
  iconName: string;
  ledgerId: string;
  name: string;
  userId: string;
};

export type ArchiveCategoryInput = {
  categoryId: string;
  ledgerId: string;
  userId: string;
};

export type ReorderCategoriesInput = CategoryScope & {
  categoryIds: string[];
  userId: string;
};

export type CategoryServiceDependencies = {
  categoryRepository: CategoryRepository;
  ledgerAccessService: LedgerAccessService;
};

export type CategoryService = {
  archive(input: ArchiveCategoryInput): Promise<void>;
  create(input: CreateCategoryInput): Promise<void>;
  getCategoriesView(input: {
    ledgerId: string;
    ledgerName: string;
    userId: string;
  }): Promise<CategoriesView>;
  reorder(input: ReorderCategoriesInput): Promise<void>;
  update(input: UpdateCategoryInput): Promise<void>;
};

function buildCategoryTree(categories: CategoryRow[]): CategoryTreeItem[] {
  const roots: CategoryTreeItem[] = categories
    .filter((category) => category.parent_id === null)
    .map((category) => ({ ...category, children: [] }));
  const rootById = new Map(roots.map((category) => [category.id, category]));

  for (const category of categories) {
    if (category.parent_id === null) continue;
    rootById.get(category.parent_id)?.children.push(category);
  }

  return roots;
}

function normalizeCategoryDisplayName(name: string, iconName?: string | null) {
  return getCategoryDisplayName(name, iconName).trim().toLowerCase();
}

function isDuplicateName(
  siblings: Awaited<ReturnType<CategoryRepository["listActiveSiblings"]>>,
  name: string,
  excludeCategoryId?: string,
) {
  const normalizedName = normalizeCategoryDisplayName(name);

  return siblings.some(
    (category) =>
      category.id !== excludeCategoryId &&
      normalizeCategoryDisplayName(category.name, category.iconName) ===
        normalizedName,
  );
}

function nextSortOrder(
  siblings: Awaited<ReturnType<CategoryRepository["listActiveSiblings"]>>,
) {
  const maxSortOrder = Math.max(
    0,
    ...siblings.map((category) =>
      Number.isFinite(category.sortOrder) ? category.sortOrder : 0,
    ),
  );
  return maxSortOrder + 10;
}

function operationError(
  code:
    | typeof categoryErrorCodes.archiveFailed
    | typeof categoryErrorCodes.createFailed
    | typeof categoryErrorCodes.reorderFailed
    | typeof categoryErrorCodes.updateFailed,
  details?: unknown,
) {
  const messages = {
    [categoryErrorCodes.archiveFailed]: "分类隐藏失败。",
    [categoryErrorCodes.createFailed]:
      "分类新增失败。请确认分类名称是否重复，或稍后重试。",
    [categoryErrorCodes.reorderFailed]: "分类排序保存失败，请稍后重试。",
    [categoryErrorCodes.updateFailed]:
      "分类更新失败。请确认分类名称是否重复，或稍后重试。",
  };

  return new RepositoryError(code, messages[code], { details });
}

async function withOperationError<T>(
  code:
    | typeof categoryErrorCodes.archiveFailed
    | typeof categoryErrorCodes.createFailed
    | typeof categoryErrorCodes.reorderFailed
    | typeof categoryErrorCodes.updateFailed,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RepositoryError) {
      throw operationError(code);
    }
    throw error;
  }
}

/**
 * Category 模块 UseCase。权限、账本归属、父子层级与状态校验在这里
 * 独立成立，不假设调用方一定经过 Router middleware。
 */
export function createCategoryService({
  categoryRepository,
  ledgerAccessService,
}: CategoryServiceDependencies): CategoryService {
  async function requireActiveMemberRole(ledgerId: string, userId: string) {
    const role = await ledgerAccessService.getActiveMemberRole({
      ledgerId,
      userId,
    });

    if (!role) {
      throw new AuthorizationError(
        categoryErrorCodes.permissionDenied,
        "只有账本所有者或管理员可以维护分类。",
      );
    }

    return role;
  }

  async function requireManagePermission(ledgerId: string, userId: string) {
    const role = await requireActiveMemberRole(ledgerId, userId);

    if (!canManageMasterData(role)) {
      throw new AuthorizationError(
        categoryErrorCodes.permissionDenied,
        "只有账本所有者或管理员可以维护分类。",
      );
    }
  }

  async function listSiblingsOrThrow(
    scope: CategoryScope,
    operation:
      | typeof categoryErrorCodes.createFailed
      | typeof categoryErrorCodes.reorderFailed
      | typeof categoryErrorCodes.updateFailed,
  ) {
    try {
      return await categoryRepository.listActiveSiblings(scope);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw operationError(operation);
      }
      throw error;
    }
  }

  return {
    async archive({ categoryId, ledgerId, userId }) {
      await requireManagePermission(ledgerId, userId);

      const category = await withOperationError(
        categoryErrorCodes.archiveFailed,
        () => categoryRepository.findActiveById({ categoryId, ledgerId }),
      );

      if (!category) {
        throw new NotFoundError(
          categoryErrorCodes.archiveFailed,
          "分类隐藏失败。",
        );
      }

      const archivedCount = await withOperationError(
        categoryErrorCodes.archiveFailed,
        () =>
          categoryRepository.archive({
            archivedAt: new Date().toISOString(),
            archivedBy: userId,
            categoryId,
            includeChildren: category.parentId === null,
            ledgerId,
          }),
      );

      if (archivedCount === 0) {
        throw operationError(categoryErrorCodes.archiveFailed);
      }
    },

    async create(input) {
      await requireManagePermission(input.ledgerId, input.userId);

      if (input.parentId !== null) {
        const parent = await withOperationError(
          categoryErrorCodes.createFailed,
          () =>
            categoryRepository.findActiveRootById({
              categoryId: input.parentId as string,
              ledgerId: input.ledgerId,
              type: input.type,
            }),
        );

        if (!parent) {
          throw new ValidationError(
            categoryErrorCodes.parentInvalid,
            "大分类指定不正确。",
          );
        }
      }

      const siblings = await listSiblingsOrThrow(
        input,
        categoryErrorCodes.createFailed,
      );
      if (isDuplicateName(siblings, input.name)) {
        throw new ConflictError(
          categoryErrorCodes.createFailed,
          "分类新增失败。请确认分类名称是否重复，或稍后重试。",
        );
      }

      await withOperationError(categoryErrorCodes.createFailed, () =>
        categoryRepository.insert({
          createdBy: input.userId,
          iconName: input.iconName,
          ledgerId: input.ledgerId,
          name: getCategoryStoredName(input.name, input.iconName),
          parentId: input.parentId,
          sortOrder: nextSortOrder(siblings),
          type: input.type,
        }),
      );
    },

    async getCategoriesView({ ledgerId, ledgerName, userId }) {
      const role = await requireActiveMemberRole(ledgerId, userId);
      const categories =
        await categoryRepository.findActiveByLedgerId(ledgerId);
      const roots = buildCategoryTree(categories);

      return {
        canManageCategories: canManageMasterData(role),
        categories: roots,
        ledgerName,
        parentOptions: roots.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
        })),
      };
    },

    async reorder(input) {
      await requireManagePermission(input.ledgerId, input.userId);
      const siblings = await listSiblingsOrThrow(
        input,
        categoryErrorCodes.reorderFailed,
      );
      const siblingIds = new Set(siblings.map((category) => category.id));

      if (
        siblings.length !== input.categoryIds.length ||
        new Set(input.categoryIds).size !== input.categoryIds.length ||
        !input.categoryIds.every((categoryId) => siblingIds.has(categoryId))
      ) {
        throw new ValidationError(
          categoryErrorCodes.reorderFailed,
          "分类排序保存失败，请稍后重试。",
        );
      }

      const originalSortOrderById = new Map(
        siblings.map((category) => [category.id, category.sortOrder]),
      );
      const updatedCategoryIds: string[] = [];

      for (const [index, categoryId] of input.categoryIds.entries()) {
        let updated = false;

        try {
          updated = await categoryRepository.updateSortOrder({
            categoryId,
            ledgerId: input.ledgerId,
            parentId: input.parentId,
            sortOrder: (index + 1) * 10,
            type: input.type,
            updatedBy: input.userId,
          });
        } catch (error) {
          if (!(error instanceof RepositoryError)) throw error;
        }

        if (updated) {
          updatedCategoryIds.push(categoryId);
          continue;
        }

        let recoveryFailed = false;
        for (const updatedCategoryId of updatedCategoryIds.toReversed()) {
          const originalSortOrder =
            originalSortOrderById.get(updatedCategoryId);
          if (originalSortOrder === undefined) continue;

          try {
            const restored = await categoryRepository.updateSortOrder({
              categoryId: updatedCategoryId,
              ledgerId: input.ledgerId,
              parentId: input.parentId,
              sortOrder: originalSortOrder,
              type: input.type,
              updatedBy: input.userId,
            });
            recoveryFailed ||= !restored;
          } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            recoveryFailed = true;
          }
        }

        throw operationError(categoryErrorCodes.reorderFailed, {
          recoveryFailed: recoveryFailed || undefined,
        });
      }
    },

    async update({ categoryId, iconName, ledgerId, name, userId }) {
      await requireManagePermission(ledgerId, userId);

      const category = await withOperationError(
        categoryErrorCodes.updateFailed,
        () => categoryRepository.findActiveById({ categoryId, ledgerId }),
      );

      if (!category) {
        throw new NotFoundError(
          categoryErrorCodes.updateFailed,
          "分类更新失败。请确认分类名称是否重复，或稍后重试。",
        );
      }

      const siblings = await listSiblingsOrThrow(
        {
          ledgerId,
          parentId: category.parentId,
          type: category.type,
        },
        categoryErrorCodes.updateFailed,
      );
      if (isDuplicateName(siblings, name, categoryId)) {
        throw new ConflictError(
          categoryErrorCodes.updateFailed,
          "分类更新失败。请确认分类名称是否重复，或稍后重试。",
        );
      }

      const updated = await withOperationError(
        categoryErrorCodes.updateFailed,
        () =>
          categoryRepository.updateDetails({
            categoryId,
            iconName,
            ledgerId,
            name: getCategoryStoredName(name, iconName),
            updatedBy: userId,
          }),
      );

      if (!updated) {
        throw operationError(categoryErrorCodes.updateFailed);
      }
    },
  };
}
