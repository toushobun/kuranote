"use server";

import { categorySuccessMessages } from "config/categoryMessages";
import { revalidateCategoryMutation } from "internal/category/adapter/next/revalidate";
import {
  categoryErrorCodes,
  categoryFallbackErrorMessages,
  getCategoryErrorMessage,
} from "internal/category/errors";
import {
  parseArchiveCategoryForm,
  parseCreateCategoryForm,
  parseReorderCategoriesForm,
  parseUpdateCategoryForm,
} from "internal/category/schema";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import type { CategoryActionState } from "types/categories";

function validationErrorState(code: string): CategoryActionState {
  return createErrorState(
    getCategoryErrorMessage(code) ?? categoryFallbackErrorMessages.inputInvalid,
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
    getCategoryErrorMessage(fallbackCode) ??
      categoryFallbackErrorMessages.operationFailed,
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
  return { success: categorySuccessMessages.create };
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
  return { success: categorySuccessMessages.update };
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
  return { success: categorySuccessMessages.archive };
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
