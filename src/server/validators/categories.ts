import { categoryEmojiValues } from "config/categoryEmojis";
import {
  categoryErrorCodes,
  type CategoryValidationErrorCode,
} from "server/errors/categories";
import { categoryTypeOptions } from "types/categories";
import type { TransactionType } from "types/transactions";
import {
  getCategoryStoredName,
  getUnicodeCharacterCount,
} from "utils/categoryNames";
import { getFormText, isUuid } from "utils/formData";

import {
  invalid,
  parseEnumValue,
  parseOptionalUuidText,
  parseRequiredUuidField,
  parseTextField,
  type ValidationResult,
  valid,
} from "./common";

export type { CategoryValidationErrorCode };

const categoryTypeValues = categoryTypeOptions.map((option) => option.value);
const categoryNameMaxLength = 100;
const maxReorderCategoryCount = 200;

export type CreateCategoryValues = {
  iconName: string;
  name: string;
  parentId: string | null;
  type: TransactionType;
};

export type UpdateCategoryValues = {
  categoryId: string;
  iconName: string;
  name: string;
};

export type ArchiveCategoryValues = {
  categoryId: string;
};

export type ReorderCategoryValues = {
  categoryIds: string[];
  parentId: string | null;
  type: TransactionType;
};

type CategoryFormFailure = {
  categoryId?: string;
  error: CategoryValidationErrorCode;
  ok: false;
};

type CategoryFormResult<T> = { ok: true; value: T } | CategoryFormFailure;

function invalidWithCategoryId(
  error: CategoryValidationErrorCode,
  categoryId: string,
): CategoryFormFailure {
  return categoryId.length > 0
    ? { categoryId, error, ok: false }
    : { error, ok: false };
}

function parseCategoryName(
  formData: FormData,
): ValidationResult<
  string,
  typeof categoryErrorCodes.nameRequired | typeof categoryErrorCodes.nameTooLong
> {
  return parseTextField(formData, "name", {
    maxLength: categoryNameMaxLength,
    maxLengthError: categoryErrorCodes.nameTooLong,
    requiredError: categoryErrorCodes.nameRequired,
  });
}

function parseCategoryIcon(
  formData: FormData,
): ValidationResult<string, typeof categoryErrorCodes.iconInvalid> {
  const iconName = getFormText(formData, "iconName").trim();

  return categoryEmojiValues.has(iconName)
    ? valid(iconName)
    : invalid(categoryErrorCodes.iconInvalid);
}

function validateStoredCategoryNameLength(
  name: string,
  iconName: string,
): ValidationResult<string, typeof categoryErrorCodes.nameTooLong> {
  return getUnicodeCharacterCount(getCategoryStoredName(name, iconName)) <=
    categoryNameMaxLength
    ? valid(name)
    : invalid(categoryErrorCodes.nameTooLong);
}

function parseCategoryOrder(
  formData: FormData,
): ValidationResult<string[], typeof categoryErrorCodes.orderInvalid> {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(getFormText(formData, "categoryIds"));
  } catch {
    return invalid(categoryErrorCodes.orderInvalid);
  }

  if (
    !Array.isArray(parsedValue) ||
    parsedValue.length === 0 ||
    parsedValue.length > maxReorderCategoryCount ||
    !parsedValue.every((value): value is string =>
      typeof value === "string" ? isUuid(value) : false,
    ) ||
    new Set(parsedValue).size !== parsedValue.length
  ) {
    return invalid(categoryErrorCodes.orderInvalid);
  }

  return valid(parsedValue);
}

export function validateCreateCategoryForm(
  formData: FormData,
): ValidationResult<CreateCategoryValues, CategoryValidationErrorCode> {
  const nameResult = parseCategoryName(formData);

  if (!nameResult.ok) {
    return nameResult;
  }

  const iconResult = parseCategoryIcon(formData);

  if (!iconResult.ok) {
    return iconResult;
  }

  const storedNameResult = validateStoredCategoryNameLength(
    nameResult.value,
    iconResult.value,
  );

  if (!storedNameResult.ok) {
    return storedNameResult;
  }

  const typeResult = parseEnumValue(
    getFormText(formData, "type"),
    categoryTypeValues,
    categoryErrorCodes.typeInvalid,
  );

  if (!typeResult.ok) {
    return typeResult;
  }

  const parentIdResult = parseOptionalUuidText(
    getFormText(formData, "parentId"),
    categoryErrorCodes.parentInvalid,
  );

  if (!parentIdResult.ok) {
    return parentIdResult;
  }

  return valid({
    iconName: iconResult.value,
    name: nameResult.value,
    parentId: parentIdResult.value,
    type: typeResult.value,
  });
}

export function validateUpdateCategoryForm(
  formData: FormData,
): CategoryFormResult<UpdateCategoryValues> {
  const categoryIdText = getFormText(formData, "categoryId");
  const categoryIdResult = parseRequiredUuidField(
    formData,
    "categoryId",
    categoryErrorCodes.categoryInvalid,
  );

  if (!categoryIdResult.ok) {
    return categoryIdResult;
  }

  const nameResult = parseCategoryName(formData);

  if (!nameResult.ok) {
    return invalidWithCategoryId(nameResult.error, categoryIdText);
  }

  const iconResult = parseCategoryIcon(formData);

  if (!iconResult.ok) {
    return invalidWithCategoryId(iconResult.error, categoryIdText);
  }

  const storedNameResult = validateStoredCategoryNameLength(
    nameResult.value,
    iconResult.value,
  );

  if (!storedNameResult.ok) {
    return invalidWithCategoryId(storedNameResult.error, categoryIdText);
  }

  return valid({
    categoryId: categoryIdResult.value,
    iconName: iconResult.value,
    name: nameResult.value,
  });
}

export function validateArchiveCategoryForm(
  formData: FormData,
): ValidationResult<
  ArchiveCategoryValues,
  typeof categoryErrorCodes.categoryInvalid
> {
  const categoryIdResult = parseRequiredUuidField(
    formData,
    "categoryId",
    categoryErrorCodes.categoryInvalid,
  );

  if (!categoryIdResult.ok) {
    return categoryIdResult;
  }

  return valid({ categoryId: categoryIdResult.value });
}

export function validateReorderCategoryForm(
  formData: FormData,
): ValidationResult<ReorderCategoryValues, CategoryValidationErrorCode> {
  const categoryIdsResult = parseCategoryOrder(formData);

  if (!categoryIdsResult.ok) {
    return categoryIdsResult;
  }

  const typeResult = parseEnumValue(
    getFormText(formData, "type"),
    categoryTypeValues,
    categoryErrorCodes.typeInvalid,
  );

  if (!typeResult.ok) {
    return typeResult;
  }

  const parentIdResult = parseOptionalUuidText(
    getFormText(formData, "parentId"),
    categoryErrorCodes.parentInvalid,
  );

  if (!parentIdResult.ok) {
    return parentIdResult;
  }

  return valid({
    categoryIds: categoryIdsResult.value,
    parentId: parentIdResult.value,
    type: typeResult.value,
  });
}
