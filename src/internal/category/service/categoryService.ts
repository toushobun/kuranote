import { canManageMasterData } from "internal/ledger";
import {
  categoryErrorCodes,
  getCategoryErrorMessage,
} from "internal/category/errors";
import type {
  CategoryRepository,
  CategoryScope,
} from "internal/category/repository/categoryRepository";
import { buildCategoriesView } from "internal/category/service/read/categoriesView";
import {
  getNextCategorySortOrder,
  hasDuplicateCategoryName,
} from "internal/category/service/read/categorySiblings";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { CategoriesViewData } from "types/categories";
import type { CategorySummaryDbRow } from "internal/db-types";
import { getCategoryStoredName } from "utils/categoryNames";

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

/** Transaction 等其他模块只依赖此窄查询接口。 */
export interface CategoryQueryService {
  findSummariesByIds(input: {
    categoryIds: string[];
    ledgerId: string;
    userId: string;
  }): Promise<CategorySummaryDbRow[]>;
  listActiveSummaries(input: {
    ledgerId: string;
    userId: string;
  }): Promise<CategorySummaryDbRow[]>;
}

export interface CategoryService extends CategoryQueryService {
  archive(input: ArchiveCategoryInput): Promise<void>;
  create(input: CreateCategoryInput): Promise<void>;
  getCategoriesView(input: {
    ledgerId: string;
    ledgerName: string;
    userId: string;
  }): Promise<CategoriesView>;
  reorder(input: ReorderCategoriesInput): Promise<void>;
  update(input: UpdateCategoryInput): Promise<void>;
}

function repositoryError(
  code:
    | typeof categoryErrorCodes.archiveFailed
    | typeof categoryErrorCodes.createFailed
    | typeof categoryErrorCodes.reorderFailed
    | typeof categoryErrorCodes.updateFailed,
) {
  return new RepositoryError(
    code,
    getCategoryErrorMessage(code) ?? "分类操作失败，请稍后重试。",
  );
}

function conflictError(
  code:
    | typeof categoryErrorCodes.archiveFailed
    | typeof categoryErrorCodes.updateFailed,
) {
  return new ConflictError(
    code,
    getCategoryErrorMessage(code) ?? "分类状态已变化，请刷新后重试。",
  );
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
      throw repositoryError(code);
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
    return requireActiveLedgerMemberRole(ledgerAccessService, {
      ledgerId,
      userId,
    });
  }

  async function requireManagePermission(ledgerId: string, userId: string) {
    const role = await requireActiveMemberRole(ledgerId, userId);

    if (!canManageMasterData(role)) {
      throw new AuthorizationError(
        categoryErrorCodes.permissionDenied,
        getCategoryErrorMessage(categoryErrorCodes.permissionDenied) ??
          "没有权限维护分类。",
      );
    }
  }

  async function listSiblingsOrThrow(
    scope: CategoryScope,
    operation:
      | typeof categoryErrorCodes.createFailed
      | typeof categoryErrorCodes.updateFailed,
  ) {
    try {
      return await categoryRepository.listActiveSiblings(scope);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw repositoryError(operation);
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
          categoryErrorCodes.categoryInvalid,
          getCategoryErrorMessage(categoryErrorCodes.categoryInvalid) ??
            "分类指定不正确。",
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
        throw conflictError(categoryErrorCodes.archiveFailed);
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
            getCategoryErrorMessage(categoryErrorCodes.parentInvalid) ??
              "大分类指定不正确。",
          );
        }
      }

      const siblings = await listSiblingsOrThrow(
        input,
        categoryErrorCodes.createFailed,
      );
      if (hasDuplicateCategoryName(siblings, input.name)) {
        throw new ConflictError(
          categoryErrorCodes.createFailed,
          getCategoryErrorMessage(categoryErrorCodes.createFailed) ??
            "分类新增失败，请稍后重试。",
        );
      }

      await withOperationError(categoryErrorCodes.createFailed, () =>
        categoryRepository.insert({
          createdBy: input.userId,
          iconName: input.iconName,
          ledgerId: input.ledgerId,
          name: getCategoryStoredName(input.name, input.iconName),
          parentId: input.parentId,
          sortOrder: getNextCategorySortOrder(siblings),
          type: input.type,
        }),
      );
    },

    async findSummariesByIds({ categoryIds, ledgerId, userId }) {
      await requireActiveMemberRole(ledgerId, userId);
      return categoryRepository.findByIdsWithParents(ledgerId, categoryIds);
    },

    async getCategoriesView({ ledgerId, ledgerName, userId }) {
      const role = await requireActiveMemberRole(ledgerId, userId);
      const categories =
        await categoryRepository.findActiveByLedgerId(ledgerId);
      return buildCategoriesView({ categories, ledgerName, role });
    },

    async listActiveSummaries({ ledgerId, userId }) {
      await requireActiveMemberRole(ledgerId, userId);
      return (await categoryRepository.findActiveByLedgerId(ledgerId)).map(
        ({ id, name, parent_id, type }) => ({ id, name, parent_id, type }),
      );
    },

    async reorder(input) {
      await requireManagePermission(input.ledgerId, input.userId);
      await withOperationError(categoryErrorCodes.reorderFailed, () =>
        categoryRepository.reorder({
          categoryIds: input.categoryIds,
          ledgerId: input.ledgerId,
          parentId: input.parentId,
          type: input.type,
        }),
      );
    },

    async update({ categoryId, iconName, ledgerId, name, userId }) {
      await requireManagePermission(ledgerId, userId);

      const category = await withOperationError(
        categoryErrorCodes.updateFailed,
        () => categoryRepository.findActiveById({ categoryId, ledgerId }),
      );

      if (!category) {
        throw new NotFoundError(
          categoryErrorCodes.categoryInvalid,
          getCategoryErrorMessage(categoryErrorCodes.categoryInvalid) ??
            "分类指定不正确。",
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
      if (hasDuplicateCategoryName(siblings, name, categoryId)) {
        throw new ConflictError(
          categoryErrorCodes.updateFailed,
          getCategoryErrorMessage(categoryErrorCodes.updateFailed) ??
            "分类更新失败，请稍后重试。",
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
        throw conflictError(categoryErrorCodes.updateFailed);
      }
    },
  };
}
