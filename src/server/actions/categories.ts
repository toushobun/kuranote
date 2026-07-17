"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { categoriesErrorHref, routePaths } from "config/paths";
import { canManageMasterData } from "lib/ledger/permissions";
import { requireCurrentUserAndLedger } from "server/context/currentLedger";
import { categoryErrorCodes } from "server/errors/categories";
import {
  archiveCategoryService,
  createCategoryService,
  reorderCategoriesService,
  updateCategoryService,
} from "server/services/categories";
import {
  validateArchiveCategoryForm,
  validateCreateCategoryForm,
  validateReorderCategoryForm,
  validateUpdateCategoryForm,
} from "server/validators/categories";
import type { CategoryReorderActionResult } from "types/categories";

function requireCategoryManagement(
  role: Parameters<typeof canManageMasterData>[0],
) {
  if (!canManageMasterData(role)) {
    redirect(categoriesErrorHref(categoryErrorCodes.permissionDenied));
  }
}

export async function createCategory(formData: FormData) {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  requireCategoryManagement(currentLedger.currentUserRole);
  const validation = validateCreateCategoryForm(formData);

  if (!validation.ok) {
    redirect(categoriesErrorHref(validation.error));
  }

  const values = validation.value;
  const result = await createCategoryService({
    iconName: values.iconName,
    ledgerId: currentLedger.id,
    name: values.name,
    parentId: values.parentId,
    type: values.type,
    userId,
  });

  if (!result.ok) redirect(categoriesErrorHref(result.error));

  revalidatePath(routePaths.categories);
  redirect(routePaths.categories);
}

export async function updateCategory(formData: FormData) {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  requireCategoryManagement(currentLedger.currentUserRole);
  const validation = validateUpdateCategoryForm(formData);

  if (!validation.ok) {
    redirect(categoriesErrorHref(validation.error, validation.categoryId));
  }

  const values = validation.value;
  const result = await updateCategoryService({
    categoryId: values.categoryId,
    iconName: values.iconName,
    ledgerId: currentLedger.id,
    name: values.name,
    userId,
  });

  if (!result.ok)
    redirect(categoriesErrorHref(result.error, values.categoryId));

  revalidatePath(routePaths.categories);
  redirect(routePaths.categories);
}

export async function reorderCategories(
  formData: FormData,
): Promise<CategoryReorderActionResult> {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();

  if (!canManageMasterData(currentLedger.currentUserRole)) {
    return { ok: false, error: categoryErrorCodes.permissionDenied };
  }

  const validation = validateReorderCategoryForm(formData);

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const result = await reorderCategoriesService({
    ...validation.value,
    ledgerId: currentLedger.id,
    userId,
  });

  if (!result.ok) return result;

  revalidatePath(routePaths.categories);
  return { ok: true };
}

export async function archiveCategory(formData: FormData) {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  requireCategoryManagement(currentLedger.currentUserRole);
  const validation = validateArchiveCategoryForm(formData);

  if (!validation.ok) {
    redirect(categoriesErrorHref(validation.error));
  }

  const values = validation.value;
  const result = await archiveCategoryService({
    categoryId: values.categoryId,
    ledgerId: currentLedger.id,
    userId,
  });

  if (!result.ok)
    redirect(categoriesErrorHref(result.error, values.categoryId));

  revalidatePath(routePaths.categories);
  redirect(routePaths.categories);
}
