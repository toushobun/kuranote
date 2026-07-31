import { categoryErrorCodes } from "internal/category/errors";
import type { Logger } from "internal/shared/logging/logger";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type { TransactionCategoryType } from "types/transactions";

export type CategoryScope = {
  ledgerId: string;
  parentId: string | null;
  type: TransactionCategoryType;
};

export type CategoryRecord = {
  id: string;
  parentId: string | null;
  type: TransactionCategoryType;
};

export type CategorySibling = {
  iconName: string | null;
  id: string;
  name: string;
  sortOrder: number;
};

export type CategoryData = {
  created_at: string;
  icon_name: string | null;
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  type: TransactionCategoryType;
};

export type CategorySummary = {
  id: string;
  name: string;
  parent_id: string | null;
  type: TransactionCategoryType;
};

export type InsertCategoryInput = CategoryScope & {
  createdBy: string;
  iconName: string;
  name: string;
  sortOrder: number;
};

export type ReorderCategoriesInput = CategoryScope & {
  categoryIds: string[];
};

export type UpdateCategoryDetailsInput = {
  categoryId: string;
  iconName: string;
  ledgerId: string;
  name: string;
  updatedBy: string;
};

export type ArchiveCategoryInput = {
  archivedAt: string;
  archivedBy: string;
  categoryId: string;
  includeChildren: boolean;
  ledgerId: string;
};

export interface CategoryRepository {
  archive(input: ArchiveCategoryInput): Promise<number>;
  findActiveById(input: {
    categoryId: string;
    ledgerId: string;
  }): Promise<CategoryRecord | null>;
  findActiveByLedgerId(ledgerId: string): Promise<CategoryData[]>;
  findByIdsWithParents(
    ledgerId: string,
    categoryIds: string[],
  ): Promise<CategorySummary[]>;
  findActiveRootById(input: {
    categoryId: string;
    ledgerId: string;
    type: TransactionCategoryType;
  }): Promise<CategoryRecord | null>;
  insert(input: InsertCategoryInput): Promise<void>;
  listActiveSiblings(scope: CategoryScope): Promise<CategorySibling[]>;
  reorder(input: ReorderCategoriesInput): Promise<void>;
  updateDetails(input: UpdateCategoryDetailsInput): Promise<boolean>;
}

type CategoryRecordRow = {
  id: string;
  parent_id: string | null;
  type: TransactionCategoryType;
};

type CategoryRow = {
  created_at: string;
  icon_name: string | null;
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  type: TransactionCategoryType;
};

type CategorySummaryRow = {
  id: string;
  name: string;
  parent_id: string | null;
  type: TransactionCategoryType;
};

type CategoryReorderRpcError = {
  code?: string | null;
  details?: string | null;
  message?: string | null;
};

const categoryReorderRpcErrorCodes = [
  "auth_required",
  "permission_denied",
  "ledger_required",
  "ledger_not_found",
  "category_type_invalid",
  "category_order_invalid",
  "category_parent_invalid",
  "category_set_invalid",
  "category_write_failed",
] as const;

type CategoryReorderRpcErrorCode =
  (typeof categoryReorderRpcErrorCodes)[number];

function findCategoryReorderRpcErrorCode(
  error: CategoryReorderRpcError,
): CategoryReorderRpcErrorCode | null {
  const businessErrorCode = error.details?.trim();
  return categoryReorderRpcErrorCodes.includes(
    businessErrorCode as CategoryReorderRpcErrorCode,
  )
    ? (businessErrorCode as CategoryReorderRpcErrorCode)
    : null;
}

function toCategoryRecord(row: CategoryRecordRow): CategoryRecord {
  return {
    id: row.id,
    parentId: row.parent_id,
    type: row.type,
  };
}

function toCategoryData(row: CategoryRow): CategoryData {
  return {
    created_at: row.created_at,
    icon_name: row.icon_name,
    id: row.id,
    name: row.name,
    parent_id: row.parent_id,
    sort_order: row.sort_order,
    type: row.type,
  };
}

function toCategorySummary(row: CategorySummaryRow): CategorySummary {
  return {
    id: row.id,
    name: row.name,
    parent_id: row.parent_id,
    type: row.type,
  };
}

export function createSupabaseCategoryRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): CategoryRepository {
  function throwRepositoryError(
    code: string,
    message: string,
    logMessage: string,
    error: { code?: string; message: string },
    metadata: Record<string, unknown>,
  ): never {
    logger.error(logMessage, {
      ...metadata,
      code: error.code,
      message: error.message,
    });
    throw toRepositoryError(code, message);
  }

  function throwReorderRpcError(
    error: CategoryReorderRpcError,
    input: ReorderCategoriesInput,
  ): never {
    const rpcErrorCode = findCategoryReorderRpcErrorCode(error);

    logger.error("[category] failed to reorder categories transactionally", {
      categoryCount: input.categoryIds.length,
      databaseCode: error.code,
      databaseDetails: error.details,
      databaseMessage: error.message,
      ledgerId: input.ledgerId,
      parentId: input.parentId,
      type: input.type,
    });

    if (rpcErrorCode === "auth_required") {
      throw new AuthenticationError("auth_required", "请先登录。");
    }

    if (rpcErrorCode === "permission_denied" || error.code === "42501") {
      throw new AuthorizationError(
        categoryErrorCodes.permissionDenied,
        "只有账本所有者或管理员可以维护分类。",
      );
    }

    if (
      rpcErrorCode === "ledger_required" ||
      rpcErrorCode === "ledger_not_found"
    ) {
      throw new NotFoundError(
        categoryErrorCodes.ledgerInvalid,
        "账本不存在或已归档。",
      );
    }

    if (rpcErrorCode === "category_type_invalid") {
      throw new ValidationError(
        categoryErrorCodes.typeInvalid,
        "分类类型不正确。",
      );
    }

    if (rpcErrorCode === "category_order_invalid") {
      throw new ValidationError(
        categoryErrorCodes.orderInvalid,
        "分类排序内容不正确。",
      );
    }

    if (rpcErrorCode === "category_parent_invalid") {
      throw new ValidationError(
        categoryErrorCodes.parentInvalid,
        "大分类指定不正确。",
      );
    }

    if (rpcErrorCode === "category_set_invalid") {
      throw new ConflictError(
        categoryErrorCodes.reorderConflict,
        "分类列表已发生变化，请刷新页面后重试。",
      );
    }

    throw toRepositoryError(
      categoryErrorCodes.reorderFailed,
      "分类排序保存失败，请稍后重试。",
    );
  }

  return {
    async archive(input) {
      let query = supabase
        .from("category")
        .update(
          {
            archived_at: input.archivedAt,
            archived_by: input.archivedBy,
            is_archived: true,
            updated_by: input.archivedBy,
          },
          { count: "exact" },
        )
        .eq("ledger_id", input.ledgerId)
        .eq("is_archived", false);

      query = input.includeChildren
        ? query.or(`id.eq.${input.categoryId},parent_id.eq.${input.categoryId}`)
        : query.eq("id", input.categoryId);
      const { count, error } = await query;

      if (error) {
        throwRepositoryError(
          "category_archive_failed",
          "分类归档失败，请稍后重试。",
          "[category] failed to archive category",
          error,
          {
            categoryId: input.categoryId,
            ledgerId: input.ledgerId,
          },
        );
      }

      return count ?? 0;
    },

    async findActiveById({ categoryId, ledgerId }) {
      const { data, error } = await supabase
        .from("category")
        .select("id, parent_id, type")
        .eq("id", categoryId)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        throwRepositoryError(
          "category_load_failed",
          "分类加载失败，请稍后重试。",
          "[category] failed to load category",
          error,
          { categoryId, ledgerId },
        );
      }

      return data ? toCategoryRecord(data as CategoryRecordRow) : null;
    },

    async findActiveByLedgerId(ledgerId) {
      const { data, error } = await supabase
        .from("category")
        .select("id, name, icon_name, parent_id, type, sort_order, created_at")
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("type", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        throwRepositoryError(
          "category_load_failed",
          "分类加载失败，请稍后重试。",
          "[category] failed to load categories",
          error,
          { ledgerId },
        );
      }

      return ((data ?? []) as CategoryRow[]).map(toCategoryData);
    },

    async findByIdsWithParents(ledgerId, categoryIds) {
      const uniqueCategoryIds = [...new Set(categoryIds)];
      if (uniqueCategoryIds.length === 0) return [];

      const { data, error } = await supabase
        .from("category")
        .select("id, name, parent_id, type")
        .eq("ledger_id", ledgerId)
        .in("id", uniqueCategoryIds);
      if (error) {
        throwRepositoryError(
          "category_summary_load_failed",
          "分类信息加载失败，请稍后重试。",
          "[category] failed to load category summaries",
          error,
          { ledgerId },
        );
      }
      const categoryRows = (data ?? []) as CategorySummaryRow[];
      const parentIds = [
        ...new Set(
          categoryRows
            .map((category) => category.parent_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ].filter((id) => !uniqueCategoryIds.includes(id));
      if (parentIds.length === 0) return categoryRows.map(toCategorySummary);

      const { data: parentData, error: parentError } = await supabase
        .from("category")
        .select("id, name, parent_id, type")
        .eq("ledger_id", ledgerId)
        .in("id", parentIds);
      if (parentError) {
        throwRepositoryError(
          "category_summary_load_failed",
          "分类信息加载失败，请稍后重试。",
          "[category] failed to load parent category summaries",
          parentError,
          { ledgerId },
        );
      }
      return [
        ...categoryRows,
        ...((parentData ?? []) as CategorySummaryRow[]),
      ].map(toCategorySummary);
    },

    async findActiveRootById({ categoryId, ledgerId, type }) {
      const { data, error } = await supabase
        .from("category")
        .select("id, parent_id, type")
        .eq("id", categoryId)
        .eq("ledger_id", ledgerId)
        .eq("type", type)
        .eq("is_archived", false)
        .is("parent_id", null)
        .maybeSingle();

      if (error) {
        throwRepositoryError(
          "category_parent_load_failed",
          "大分类加载失败，请稍后重试。",
          "[category] failed to load parent category",
          error,
          { categoryId, ledgerId, type },
        );
      }

      return data ? toCategoryRecord(data as CategoryRecordRow) : null;
    },

    async insert(input) {
      const { error } = await supabase.from("category").insert({
        created_by: input.createdBy,
        icon_name: input.iconName,
        ledger_id: input.ledgerId,
        name: input.name,
        parent_id: input.parentId,
        sort_order: input.sortOrder,
        type: input.type,
        updated_by: input.createdBy,
      });

      if (error) {
        throwRepositoryError(
          "category_create_failed",
          "分类创建失败，请稍后重试。",
          "[category] failed to create category",
          error,
          {
            ledgerId: input.ledgerId,
            parentId: input.parentId,
            type: input.type,
          },
        );
      }
    },

    async listActiveSiblings(scope) {
      let query = supabase
        .from("category")
        .select("id, name, icon_name, sort_order")
        .eq("ledger_id", scope.ledgerId)
        .eq("type", scope.type)
        .eq("is_archived", false);

      query =
        scope.parentId === null
          ? query.is("parent_id", null)
          : query.eq("parent_id", scope.parentId);
      const { data, error } = await query;

      if (error) {
        throwRepositoryError(
          "category_siblings_load_failed",
          "同级分类加载失败，请稍后重试。",
          "[category] failed to load sibling categories",
          error,
          {
            ledgerId: scope.ledgerId,
            parentId: scope.parentId,
            type: scope.type,
          },
        );
      }

      return (data ?? []).map((row) => ({
        iconName: row.icon_name,
        id: row.id,
        name: row.name,
        sortOrder: Number(row.sort_order ?? 0),
      }));
    },

    async reorder(input) {
      const { data, error } = await supabase.rpc("reorder_categories", {
        p_category_ids: input.categoryIds,
        p_ledger_id: input.ledgerId,
        p_parent_id: input.parentId,
        p_type: input.type,
      });

      if (error) {
        throwReorderRpcError(error, input);
      }

      if (Number(data) !== input.categoryIds.length) {
        throwRepositoryError(
          "category_reorder_failed",
          "分类排序保存失败，请稍后重试。",
          "[category] category reorder RPC returned an unexpected count",
          { message: "unexpected updated category count" },
          {
            actualCount: data,
            expectedCount: input.categoryIds.length,
            ledgerId: input.ledgerId,
            parentId: input.parentId,
            type: input.type,
          },
        );
      }
    },

    async updateDetails(input) {
      const { count, error } = await supabase
        .from("category")
        .update(
          {
            icon_name: input.iconName,
            name: input.name,
            updated_by: input.updatedBy,
          },
          { count: "exact" },
        )
        .eq("id", input.categoryId)
        .eq("ledger_id", input.ledgerId)
        .eq("is_archived", false);

      if (error) {
        throwRepositoryError(
          "category_update_failed",
          "分类更新失败，请稍后重试。",
          "[category] failed to update category",
          error,
          { categoryId: input.categoryId, ledgerId: input.ledgerId },
        );
      }

      return count === 1;
    },
  };
}
