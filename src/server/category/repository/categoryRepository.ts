import type { Logger } from "server/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";
import { toRepositoryError } from "server/shared/supabase/repositoryError";
import type { CategorySummaryDbRow } from "server/db-types";
import type { CategoryRow } from "types/categories";
import type { TransactionType } from "types/transactions";

export type CategoryScope = {
  ledgerId: string;
  parentId: string | null;
  type: TransactionType;
};

export type CategoryRecord = {
  id: string;
  parentId: string | null;
  type: TransactionType;
};

export type CategorySibling = {
  iconName: string | null;
  id: string;
  name: string;
  sortOrder: number;
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
  findActiveByLedgerId(ledgerId: string): Promise<CategoryRow[]>;
  findByIdsWithParents(
    ledgerId: string,
    categoryIds: string[],
  ): Promise<CategorySummaryDbRow[]>;
  findActiveRootById(input: {
    categoryId: string;
    ledgerId: string;
    type: TransactionType;
  }): Promise<CategoryRecord | null>;
  insert(input: InsertCategoryInput): Promise<void>;
  listActiveSiblings(scope: CategoryScope): Promise<CategorySibling[]>;
  reorder(input: ReorderCategoriesInput): Promise<void>;
  updateDetails(input: UpdateCategoryDetailsInput): Promise<boolean>;
}

type CategoryRecordRow = {
  id: string;
  parent_id: string | null;
  type: TransactionType;
};

function toCategoryRecord(row: CategoryRecordRow): CategoryRecord {
  return {
    id: row.id,
    parentId: row.parent_id,
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

      return (data ?? []) as CategoryRow[];
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
      const categories = (data ?? []) as CategorySummaryDbRow[];
      const parentIds = [
        ...new Set(
          categories
            .map((category) => category.parent_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ].filter((id) => !uniqueCategoryIds.includes(id));
      if (parentIds.length === 0) return categories;

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
      return [...categories, ...((parentData ?? []) as CategorySummaryDbRow[])];
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
        throwRepositoryError(
          "category_reorder_failed",
          "分类排序保存失败，请稍后重试。",
          "[category] failed to reorder categories transactionally",
          error,
          {
            categoryCount: input.categoryIds.length,
            ledgerId: input.ledgerId,
            parentId: input.parentId,
            type: input.type,
          },
        );
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
