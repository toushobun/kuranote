"use server";

import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { revalidateCategoryMutation } from "internal/category/adapter/next/revalidate";
import {
  categoryErrorCodes,
  getCategoryErrorMessage,
} from "internal/category/categoryErrors";
import {
  parseArchiveCategoryForm,
  parseCreateCategoryForm,
  parseReorderCategoriesForm,
  parseUpdateCategoryForm,
} from "internal/category/schema";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { CategoryActionState } from "types/categories";

function createErrorState(message: string): CategoryActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

function validationErrorState(code: string): CategoryActionState {
  return createErrorState(
    getCategoryErrorMessage(code) ?? "分类信息不正确，请确认后重试。",
  );
}

function actionErrorState(
  error: unknown,
  fallbackCode: string,
  operation: string,
): CategoryActionState {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error(`[category] ${operation} failed unexpectedly`, {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(
    getCategoryErrorMessage(fallbackCode) ?? "分类操作失败，请稍后重试。",
  );
}

async function getCategoryService() {
  const dependencies = await createServerRequestDependencies();
  return createRequestContainer(dependencies).category.service;
}

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const validation = parseCreateCategoryForm(formData);

  if (!validation.ok) {
    return validationErrorState(validation.error);
  }

  const { currentLedger, userId } = await requireCurrentUserAndLedger();

  try {
    const service = await getCategoryService();
    await service.create({
      ...validation.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return actionErrorState(error, categoryErrorCodes.createFailed, "create");
  }

  revalidateCategoryMutation();
  redirect(routePaths.categories);
}

export async function updateCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const validation = parseUpdateCategoryForm(formData);

  if (!validation.ok) {
    return validationErrorState(validation.error);
  }

  const { currentLedger, userId } = await requireCurrentUserAndLedger();

  try {
    const service = await getCategoryService();
    await service.update({
      ...validation.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return actionErrorState(error, categoryErrorCodes.updateFailed, "update");
  }

  revalidateCategoryMutation();
  redirect(routePaths.categories);
}

export async function archiveCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const validation = parseArchiveCategoryForm(formData);

  if (!validation.ok) {
    return validationErrorState(validation.error);
  }

  const { currentLedger, userId } = await requireCurrentUserAndLedger();

  try {
    const service = await getCategoryService();
    await service.archive({
      categoryId: validation.value.categoryId,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return actionErrorState(error, categoryErrorCodes.archiveFailed, "archive");
  }

  revalidateCategoryMutation();
  redirect(routePaths.categories);
}

export async function reorderCategories(
  formData: FormData,
): Promise<CategoryActionState> {
  const validation = parseReorderCategoriesForm(formData);

  if (!validation.ok) {
    return validationErrorState(validation.error);
  }

  const { currentLedger, userId } = await requireCurrentUserAndLedger();

  try {
    const service = await getCategoryService();
    await service.reorder({
      ...validation.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    return actionErrorState(error, categoryErrorCodes.reorderFailed, "reorder");
  }

  revalidateCategoryMutation();
  return {};
}
