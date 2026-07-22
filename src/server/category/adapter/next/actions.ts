"use server";

import { redirect } from "next/navigation";

import { categoriesErrorHref, routePaths } from "config/paths";
import {
  categoryErrorCodes,
  type CategoryErrorCode,
} from "server/category/categoryErrors";
import { revalidateCategoryMutation } from "server/category/adapter/next/revalidate";
import {
  parseArchiveCategoryForm,
  parseCreateCategoryForm,
  parseReorderCategoriesForm,
  parseUpdateCategoryForm,
} from "server/category/schema";
import { createRequestContainer } from "server/container";
import { requireCurrentUserAndLedger } from "server/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { AppError } from "server/shared/errors/appError";
import type { CategoryReorderActionResult } from "types/categories";

async function getCategoryActionContext() {
  const [{ currentLedger, userId }, dependencies] = await Promise.all([
    requireCurrentUserAndLedger(),
    createServerRequestDependencies(),
  ]);

  return {
    currentLedger,
    service: createRequestContainer(dependencies).category.service,
    userId,
  };
}

function redirectCategoryError(
  error: string,
  categoryId?: string | null,
): never {
  redirect(categoriesErrorHref(error, categoryId));
}

export async function createCategory(formData: FormData) {
  const validation = parseCreateCategoryForm(formData);

  if (!validation.ok) {
    redirectCategoryError(validation.error);
  }

  const { currentLedger, service, userId } = await getCategoryActionContext();

  try {
    await service.create({
      ...validation.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    if (error instanceof AppError) {
      redirectCategoryError(error.code);
    }
    throw error;
  }

  revalidateCategoryMutation();
  redirect(routePaths.categories);
}

export async function updateCategory(formData: FormData) {
  const validation = parseUpdateCategoryForm(formData);

  if (!validation.ok) {
    redirectCategoryError(validation.error, validation.categoryId);
  }

  const { currentLedger, service, userId } = await getCategoryActionContext();

  try {
    await service.update({
      ...validation.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    if (error instanceof AppError) {
      redirectCategoryError(error.code, validation.value.categoryId);
    }
    throw error;
  }

  revalidateCategoryMutation();
  redirect(routePaths.categories);
}

export async function archiveCategory(formData: FormData) {
  const validation = parseArchiveCategoryForm(formData);

  if (!validation.ok) {
    redirectCategoryError(validation.error);
  }

  const { currentLedger, service, userId } = await getCategoryActionContext();

  try {
    await service.archive({
      categoryId: validation.value.categoryId,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    if (error instanceof AppError) {
      redirectCategoryError(error.code, validation.value.categoryId);
    }
    throw error;
  }

  revalidateCategoryMutation();
  redirect(routePaths.categories);
}

export async function reorderCategories(
  formData: FormData,
): Promise<CategoryReorderActionResult> {
  const validation = parseReorderCategoriesForm(formData);

  if (!validation.ok) {
    return { error: validation.error, ok: false };
  }

  const { currentLedger, service, userId } = await getCategoryActionContext();

  try {
    await service.reorder({
      ...validation.value,
      ledgerId: currentLedger.id,
      userId,
    });
  } catch (error) {
    if (error instanceof AppError) {
      const recoveryFailed =
        typeof error.details === "object" &&
        error.details !== null &&
        "recoveryFailed" in error.details &&
        (error.details as Record<string, unknown>).recoveryFailed === true;

      const categoryErrorValues = new Set<CategoryErrorCode>(
        Object.values(categoryErrorCodes),
      );
      const errorCode = categoryErrorValues.has(error.code as CategoryErrorCode)
        ? (error.code as CategoryErrorCode)
        : categoryErrorCodes.reorderFailed;

      return {
        error: errorCode,
        ok: false,
        ...(recoveryFailed ? { recoveryFailed: true } : {}),
      };
    }
    throw error;
  }

  revalidateCategoryMutation();
  return { ok: true };
}
