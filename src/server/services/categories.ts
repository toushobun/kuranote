import { createClient } from "lib/supabase/server";
import {
  categoryErrorCodes,
  type CategoryServiceErrorCode,
} from "server/errors/categories";
import type { ServiceResult } from "server/services/serviceResult";
import type { TransactionType } from "types/transactions";
import {
  getCategoryDisplayName,
  getCategoryStoredName,
} from "utils/categoryNames";

export type CreateCategoryParams = {
  iconName: string;
  ledgerId: string;
  name: string;
  parentId: string | null;
  type: TransactionType;
  userId: string;
};

export type UpdateCategoryParams = {
  categoryId: string;
  iconName: string;
  ledgerId: string;
  name: string;
  userId: string;
};

export type ArchiveCategoryParams = {
  categoryId: string;
  ledgerId: string;
  userId: string;
};

export type ReorderCategoryParams = {
  categoryIds: string[];
  ledgerId: string;
  parentId: string | null;
  type: TransactionType;
  userId: string;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CategoryScope = {
  ledgerId: string;
  parentId: string | null;
  type: TransactionType;
};

type CategoryNameAvailability = "available" | "duplicate" | "error";

function normalizeCategoryDisplayName(name: string, iconName?: string | null) {
  return getCategoryDisplayName(name, iconName).trim().toLowerCase();
}

async function loadCategoryNameAvailability(
  supabase: SupabaseClient,
  params: CategoryScope & {
    excludeCategoryId?: string;
    name: string;
  },
): Promise<CategoryNameAvailability> {
  let query = supabase
    .from("category")
    .select("id, name, icon_name")
    .eq("ledger_id", params.ledgerId)
    .eq("type", params.type)
    .eq("is_archived", false);

  query =
    params.parentId === null
      ? query.is("parent_id", null)
      : query.eq("parent_id", params.parentId);

  const { data, error } = await query;

  if (error) return "error";

  const normalizedName = normalizeCategoryDisplayName(params.name);
  const siblingRows = (data ?? []) as Array<{
    icon_name: string | null;
    id: string;
    name: string;
  }>;
  const duplicate = siblingRows.some(
    (category) =>
      category.id !== params.excludeCategoryId &&
      normalizeCategoryDisplayName(category.name, category.icon_name) ===
        normalizedName,
  );

  return duplicate ? "duplicate" : "available";
}

async function loadNextSortOrder(
  supabase: SupabaseClient,
  params: CategoryScope,
) {
  let query = supabase
    .from("category")
    .select("sort_order")
    .eq("ledger_id", params.ledgerId)
    .eq("type", params.type)
    .eq("is_archived", false)
    .order("sort_order", { ascending: false })
    .limit(1);

  query =
    params.parentId === null
      ? query.is("parent_id", null)
      : query.eq("parent_id", params.parentId);

  const { data, error } = await query;

  if (error) {
    return null;
  }

  const maxSortOrder = Number(data?.[0]?.sort_order ?? 0);

  return Number.isFinite(maxSortOrder) ? maxSortOrder + 10 : 10;
}

export async function createCategoryService(
  params: CreateCategoryParams,
): Promise<ServiceResult<CategoryServiceErrorCode>> {
  const supabase = await createClient();

  if (params.parentId !== null) {
    const { data, error } = await supabase
      .from("category")
      .select("id")
      .eq("id", params.parentId)
      .eq("ledger_id", params.ledgerId)
      .eq("type", params.type)
      .eq("is_archived", false)
      .is("parent_id", null)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: categoryErrorCodes.parentInvalid };
    }
  }

  const nameAvailability = await loadCategoryNameAvailability(supabase, params);

  if (nameAvailability === "error") {
    return { ok: false, error: categoryErrorCodes.createFailed };
  }

  if (nameAvailability === "duplicate") {
    return { ok: false, error: categoryErrorCodes.createFailed };
  }

  const sortOrder = await loadNextSortOrder(supabase, params);

  if (sortOrder === null) {
    return { ok: false, error: categoryErrorCodes.createFailed };
  }

  const { error } = await supabase.from("category").insert({
    created_by: params.userId,
    icon_name: params.iconName,
    ledger_id: params.ledgerId,
    name: getCategoryStoredName(params.name, params.iconName),
    parent_id: params.parentId,
    sort_order: sortOrder,
    type: params.type,
    updated_by: params.userId,
  });

  if (error) {
    return { ok: false, error: categoryErrorCodes.createFailed };
  }

  return { ok: true };
}

export async function updateCategoryService(
  params: UpdateCategoryParams,
): Promise<ServiceResult<CategoryServiceErrorCode>> {
  const supabase = await createClient();
  const { data: category, error: categoryError } = await supabase
    .from("category")
    .select("id, parent_id, type")
    .eq("id", params.categoryId)
    .eq("ledger_id", params.ledgerId)
    .eq("is_archived", false)
    .maybeSingle();

  if (categoryError || !category) {
    return { ok: false, error: categoryErrorCodes.updateFailed };
  }

  const categoryScope = category as {
    id: string;
    parent_id: string | null;
    type: TransactionType;
  };
  const nameAvailability = await loadCategoryNameAvailability(supabase, {
    excludeCategoryId: params.categoryId,
    ledgerId: params.ledgerId,
    name: params.name,
    parentId: categoryScope.parent_id,
    type: categoryScope.type,
  });

  if (nameAvailability === "error") {
    return { ok: false, error: categoryErrorCodes.updateFailed };
  }

  if (nameAvailability === "duplicate") {
    return { ok: false, error: categoryErrorCodes.updateFailed };
  }

  const { error, count } = await supabase
    .from("category")
    .update(
      {
        icon_name: params.iconName,
        name: getCategoryStoredName(params.name, params.iconName),
        updated_by: params.userId,
      },
      { count: "exact" },
    )
    .eq("id", params.categoryId)
    .eq("ledger_id", params.ledgerId)
    .eq("is_archived", false);

  if (error || count !== 1) {
    return { ok: false, error: categoryErrorCodes.updateFailed };
  }

  return { ok: true };
}

async function updateCategorySortOrder(
  supabase: SupabaseClient,
  params: ReorderCategoryParams,
  categoryId: string,
  sortOrder: number,
) {
  let updateQuery = supabase
    .from("category")
    .update(
      {
        sort_order: sortOrder,
        updated_by: params.userId,
      },
      { count: "exact" },
    )
    .eq("id", categoryId)
    .eq("ledger_id", params.ledgerId)
    .eq("type", params.type)
    .eq("is_archived", false);

  updateQuery =
    params.parentId === null
      ? updateQuery.is("parent_id", null)
      : updateQuery.eq("parent_id", params.parentId);

  const { error, count } = await updateQuery;

  return error === null && count === 1;
}

export async function reorderCategoriesService(
  params: ReorderCategoryParams,
): Promise<
  | { ok: true }
  | {
      error: typeof categoryErrorCodes.reorderFailed;
      ok: false;
      recoveryFailed?: boolean;
    }
> {
  const supabase = await createClient();
  let validationQuery = supabase
    .from("category")
    .select("id, sort_order")
    .eq("ledger_id", params.ledgerId)
    .eq("type", params.type)
    .eq("is_archived", false);

  validationQuery =
    params.parentId === null
      ? validationQuery.is("parent_id", null)
      : validationQuery.eq("parent_id", params.parentId);

  const { data, error } = await validationQuery;
  const categoryRows = (data ?? []) as Array<{
    id: string;
    sort_order: number;
  }>;
  const siblingIds = new Set(categoryRows.map((category) => category.id));
  const containsEverySibling = params.categoryIds.every((categoryId) =>
    siblingIds.has(categoryId),
  );

  if (
    error ||
    categoryRows.length !== params.categoryIds.length ||
    !containsEverySibling
  ) {
    return { ok: false, error: categoryErrorCodes.reorderFailed };
  }

  const originalSortOrderById = new Map(
    categoryRows.map((category) => [category.id, category.sort_order]),
  );
  const updatedCategoryIds: string[] = [];

  for (const [index, categoryId] of params.categoryIds.entries()) {
    const updated = await updateCategorySortOrder(
      supabase,
      params,
      categoryId,
      (index + 1) * 10,
    );

    if (!updated) {
      let recoveryFailed = false;

      // 尽可能恢复所有已写入项，避免一次恢复失败阻止后续补偿。
      for (const updatedCategoryId of updatedCategoryIds.toReversed()) {
        const originalSortOrder = originalSortOrderById.get(updatedCategoryId);

        if (originalSortOrder !== undefined) {
          const restored = await updateCategorySortOrder(
            supabase,
            params,
            updatedCategoryId,
            originalSortOrder,
          );
          recoveryFailed ||= !restored;
        }
      }

      return {
        ok: false,
        error: categoryErrorCodes.reorderFailed,
        recoveryFailed: recoveryFailed || undefined,
      };
    }

    updatedCategoryIds.push(categoryId);
  }

  return { ok: true };
}

export async function archiveCategoryService(
  params: ArchiveCategoryParams,
): Promise<ServiceResult<CategoryServiceErrorCode>> {
  const supabase = await createClient();
  const { data: category, error: categoryError } = await supabase
    .from("category")
    .select("id, parent_id")
    .eq("id", params.categoryId)
    .eq("ledger_id", params.ledgerId)
    .eq("is_archived", false)
    .maybeSingle();

  if (categoryError || !category) {
    return { ok: false, error: categoryErrorCodes.archiveFailed };
  }

  let query = supabase
    .from("category")
    .update(
      {
        archived_at: new Date().toISOString(),
        archived_by: params.userId,
        is_archived: true,
        updated_by: params.userId,
      },
      { count: "exact" },
    )
    .eq("ledger_id", params.ledgerId)
    .eq("is_archived", false);

  query =
    category.parent_id === null
      ? query.or(`id.eq.${params.categoryId},parent_id.eq.${params.categoryId}`)
      : query.eq("id", params.categoryId);

  const { error, count } = await query;

  if (error || !count) {
    return { ok: false, error: categoryErrorCodes.archiveFailed };
  }

  return { ok: true };
}
