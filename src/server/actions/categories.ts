"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { categoriesErrorHref, routePaths } from "config/paths";
import { createClient } from "lib/supabase/server";
import { requireCurrentUserAndLedger } from "server/context/currentLedger";
import {
  archiveCategoryService,
  createCategoryService,
  updateCategoryService,
} from "server/services/categories";
import { categoryTypeOptions } from "types/categories";
import type { TransactionType } from "types/transactions";
import { getFormText, isUuid } from "utils/formData";

const categoryTypeValues = categoryTypeOptions.map((option) => option.value);
const categoryNameMaxLength = 100;

function parseCategoryType(value: string): TransactionType | null {
  return categoryTypeValues.includes(value as TransactionType)
    ? (value as TransactionType)
    : null;
}

async function validateParentCategory(params: {
  ledgerId: string;
  parentId: string;
  type: TransactionType;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("category")
    .select("id")
    .eq("id", params.parentId)
    .eq("ledger_id", params.ledgerId)
    .eq("type", params.type)
    .eq("is_archived", false)
    .is("parent_id", null)
    .maybeSingle();

  return !error && data !== null;
}

export async function createCategory(formData: FormData) {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const name = getFormText(formData, "name");
  const type = parseCategoryType(getFormText(formData, "type"));
  const parentIdText = getFormText(formData, "parentId");
  const parentId = parentIdText.length > 0 ? parentIdText : null;

  if (name.length === 0) redirect(categoriesErrorHref("name_required"));
  if (name.length > categoryNameMaxLength)
    redirect(categoriesErrorHref("name_too_long"));
  if (!type) redirect(categoriesErrorHref("type_invalid"));
  if (parentId !== null && !isUuid(parentId)) {
    redirect(categoriesErrorHref("parent_invalid"));
  }
  if (
    parentId !== null &&
    !(await validateParentCategory({
      ledgerId: currentLedger.id,
      parentId,
      type,
    }))
  ) {
    redirect(categoriesErrorHref("parent_invalid"));
  }

  const result = await createCategoryService({
    ledgerId: currentLedger.id,
    name,
    parentId,
    type,
    userId,
  });

  if (!result.ok) redirect(categoriesErrorHref(result.error));

  revalidatePath(routePaths.categories);
  redirect(routePaths.categories);
}

export async function updateCategory(formData: FormData) {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const categoryId = getFormText(formData, "categoryId");
  const name = getFormText(formData, "name");

  if (!isUuid(categoryId)) redirect(categoriesErrorHref("category_invalid"));
  if (name.length === 0)
    redirect(categoriesErrorHref("name_required", categoryId));
  if (name.length > categoryNameMaxLength)
    redirect(categoriesErrorHref("name_too_long", categoryId));

  const result = await updateCategoryService({
    categoryId,
    ledgerId: currentLedger.id,
    name,
    userId,
  });

  if (!result.ok) redirect(categoriesErrorHref(result.error, categoryId));

  revalidatePath(routePaths.categories);
  redirect(routePaths.categories);
}

export async function archiveCategory(formData: FormData) {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const categoryId = getFormText(formData, "categoryId");

  if (!isUuid(categoryId)) redirect(categoriesErrorHref("category_invalid"));

  const result = await archiveCategoryService({
    categoryId,
    ledgerId: currentLedger.id,
    userId,
  });

  if (!result.ok) redirect(categoriesErrorHref(result.error, categoryId));

  revalidatePath(routePaths.categories);
  redirect(routePaths.categories);
}
