import { z } from "@hono/zod-openapi";

import { categoryEmojiValues } from "config/categoryEmojis";
import {
  categoryErrorCodes,
  type CategoryValidationErrorCode,
} from "server/category/categoryErrors";
import {
  getCategoryStoredName,
  getUnicodeCharacterCount,
} from "utils/categoryNames";

export const categoryNameMaxLength = 100;
export const maxReorderCategoryCount = 200;

const uuidSchema = z.string().uuid({
  message: categoryErrorCodes.categoryInvalid,
});
const parentIdSchema = z
  .string()
  .uuid({ message: categoryErrorCodes.parentInvalid })
  .nullable();
const categoryTypeSchema = z.enum(["expense", "income"]);
const categoryIconSchema = z
  .string()
  .refine((value) => categoryEmojiValues.has(value), {
    message: categoryErrorCodes.iconInvalid,
  });
const categoryNameSchema = z
  .string()
  .trim()
  .min(1, { message: categoryErrorCodes.nameRequired })
  .max(categoryNameMaxLength, {
    message: categoryErrorCodes.nameTooLong,
  });

function validateStoredNameLength(
  value: { iconName: string; name: string },
  context: z.RefinementCtx,
) {
  if (
    getUnicodeCharacterCount(
      getCategoryStoredName(value.name, value.iconName),
    ) > categoryNameMaxLength
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: categoryErrorCodes.nameTooLong,
      path: ["name"],
    });
  }
}

export const categoryLedgerParamsSchema = z.object({
  ledgerId: uuidSchema,
});
export const categoryParamsSchema = z.object({
  categoryId: uuidSchema,
  ledgerId: uuidSchema,
});

export const createCategoryRequestSchema = z
  .object({
    iconName: categoryIconSchema,
    name: categoryNameSchema,
    parentId: parentIdSchema,
    type: categoryTypeSchema,
  })
  .superRefine(validateStoredNameLength);

export const updateCategoryRequestSchema = z
  .object({
    iconName: categoryIconSchema,
    name: categoryNameSchema,
  })
  .superRefine(validateStoredNameLength);

export const reorderCategoriesRequestSchema = z.object({
  categoryIds: z
    .array(uuidSchema)
    .min(1, { message: categoryErrorCodes.orderInvalid })
    .max(maxReorderCategoryCount, {
      message: categoryErrorCodes.orderInvalid,
    })
    .refine((values) => new Set(values).size === values.length, {
      message: categoryErrorCodes.orderInvalid,
    }),
  parentId: parentIdSchema,
  type: categoryTypeSchema,
});

export const okResponseSchema = z.object({ ok: z.literal(true) });
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    details: z.unknown().optional(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type ReorderCategoriesRequest = z.infer<
  typeof reorderCategoriesRequestSchema
>;

type FormParseFailure = {
  categoryId?: string;
  error: CategoryValidationErrorCode;
  ok: false;
};
export type FormParseResult<T> = { ok: true; value: T } | FormParseFailure;

function firstValidationCode(
  error: z.ZodError,
  fallback: CategoryValidationErrorCode,
): CategoryValidationErrorCode {
  const issue = error.issues[0];
  const message = issue?.message;

  if (issue?.path[0] === "categoryIds") {
    return categoryErrorCodes.orderInvalid;
  }

  if (
    Object.values(categoryErrorCodes).includes(
      message as (typeof categoryErrorCodes)[keyof typeof categoryErrorCodes],
    )
  ) {
    return message as CategoryValidationErrorCode;
  }

  switch (issue?.path[0]) {
    case "categoryId":
      return categoryErrorCodes.categoryInvalid;
    case "iconName":
      return categoryErrorCodes.iconInvalid;
    case "name":
      return categoryErrorCodes.nameRequired;
    case "parentId":
      return categoryErrorCodes.parentInvalid;
    case "type":
      return categoryErrorCodes.typeInvalid;
    default:
      return fallback;
  }
}

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseCreateCategoryForm(
  formData: FormData,
): FormParseResult<CreateCategoryRequest> {
  const result = createCategoryRequestSchema.safeParse({
    iconName: formText(formData, "iconName").trim(),
    name: formText(formData, "name"),
    parentId: formText(formData, "parentId").trim() || null,
    type: formText(formData, "type"),
  });

  return result.success
    ? { ok: true, value: result.data }
    : {
        error: firstValidationCode(
          result.error,
          categoryErrorCodes.categoryInvalid,
        ),
        ok: false,
      };
}

export function parseUpdateCategoryForm(
  formData: FormData,
): FormParseResult<UpdateCategoryRequest & { categoryId: string }> {
  const categoryId = formText(formData, "categoryId").trim();
  const categoryIdResult = categoryParamsSchema
    .pick({ categoryId: true })
    .safeParse({ categoryId });
  const result = categoryParamsSchema
    .pick({ categoryId: true })
    .and(updateCategoryRequestSchema)
    .safeParse({
      categoryId,
      iconName: formText(formData, "iconName").trim(),
      name: formText(formData, "name"),
    });

  return result.success
    ? { ok: true, value: result.data }
    : {
        ...(categoryIdResult.success
          ? { categoryId: categoryIdResult.data.categoryId }
          : {}),
        error: firstValidationCode(
          result.error,
          categoryErrorCodes.categoryInvalid,
        ),
        ok: false,
      };
}

export function parseArchiveCategoryForm(
  formData: FormData,
): FormParseResult<{ categoryId: string }> {
  const result = categoryParamsSchema
    .pick({ categoryId: true })
    .safeParse({ categoryId: formText(formData, "categoryId").trim() });

  return result.success
    ? { ok: true, value: result.data }
    : { error: categoryErrorCodes.categoryInvalid, ok: false };
}

export function parseReorderCategoriesForm(
  formData: FormData,
): FormParseResult<ReorderCategoriesRequest> {
  let categoryIds: unknown;

  try {
    categoryIds = JSON.parse(formText(formData, "categoryIds"));
  } catch {
    return { error: categoryErrorCodes.orderInvalid, ok: false };
  }

  const result = reorderCategoriesRequestSchema.safeParse({
    categoryIds,
    parentId: formText(formData, "parentId").trim() || null,
    type: formText(formData, "type"),
  });

  return result.success
    ? { ok: true, value: result.data }
    : {
        error: firstValidationCode(
          result.error,
          categoryErrorCodes.orderInvalid,
        ),
        ok: false,
      };
}
