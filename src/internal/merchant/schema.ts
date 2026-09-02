import { z } from "@hono/zod-openapi";

import { merchantTagEmojiValues } from "config/merchantTagEmojis";
import {
  merchantErrorCodes,
  type MerchantValidationErrorCode,
} from "internal/merchant/errors";
import {
  invalid,
  parseOptionalTextField,
  parseRequiredUuidField,
  parseTextField,
  type ValidationResult,
  valid,
} from "internal/shared/schema/formValidation";
import { getFormText } from "utils/formData";
import { parseWebsiteUrl } from "utils/merchants";

export const merchantNameMaxLength = 100;
export const merchantNoteMaxLength = 1000;
export const merchantAliasMaxLength = 100;
export const merchantTagNameMaxLength = 100;
export const merchantTagIconMaxLength = 32;

export type CreateMerchantValues = {
  name: string;
  note: string | null;
  siteUrl: string | null;
  tagIds: string[];
};

export type UpdateMerchantValues = CreateMerchantValues & {
  merchantId: string;
};

export type ArchiveMerchantValues = {
  merchantId: string;
};

export type CreateMerchantAliasValues = {
  alias: string;
  merchantId: string;
};

export type ArchiveMerchantAliasValues = {
  aliasId: string;
};

export type SetPreferredMerchantAliasValues = {
  aliasId: string | null;
  merchantId: string;
};

export type CreateMerchantTagValues = { icon: string; name: string };
export type UpdateMerchantTagValues = CreateMerchantTagValues & {
  tagId: string;
};
export type ArchiveMerchantTagValues = { tagId: string };
export type ReorderMerchantTagsValues = { tagIds: string[] };

const merchantTagIdsSchema = z
  .array(z.string().uuid())
  .max(100)
  .refine((values) => new Set(values).size === values.length);

function parseMerchantTagIds(
  formData: FormData,
): ValidationResult<string[], typeof merchantErrorCodes.merchantTagInvalid> {
  const tagIds = formData
    .getAll("tagIds")
    .filter((value): value is string => typeof value === "string");
  const result = merchantTagIdsSchema.safeParse(tagIds);
  return result.success
    ? valid(result.data)
    : invalid(merchantErrorCodes.merchantTagInvalid);
}

function parseMerchantName(
  formData: FormData,
): ValidationResult<
  string,
  typeof merchantErrorCodes.nameRequired | typeof merchantErrorCodes.nameTooLong
> {
  return parseTextField(formData, "name", {
    maxLength: merchantNameMaxLength,
    maxLengthError: merchantErrorCodes.nameTooLong,
    requiredError: merchantErrorCodes.nameRequired,
  });
}

function parseMerchantSiteUrl(
  formData: FormData,
): ValidationResult<
  string | null,
  typeof merchantErrorCodes.websiteUrlInvalid
> {
  const siteUrl = parseWebsiteUrl(getFormText(formData, "websiteUrl"));

  return siteUrl === undefined
    ? invalid(merchantErrorCodes.websiteUrlInvalid)
    : valid(siteUrl ?? null);
}

function parseMerchantNote(
  formData: FormData,
): ValidationResult<string | null, typeof merchantErrorCodes.noteTooLong> {
  return parseOptionalTextField(
    formData,
    "note",
    merchantNoteMaxLength,
    merchantErrorCodes.noteTooLong,
  );
}

function parseMerchantValues(
  formData: FormData,
): ValidationResult<CreateMerchantValues, MerchantValidationErrorCode> {
  const nameResult = parseMerchantName(formData);
  if (!nameResult.ok) return nameResult;

  const siteUrlResult = parseMerchantSiteUrl(formData);
  if (!siteUrlResult.ok) return siteUrlResult;

  const noteResult = parseMerchantNote(formData);
  if (!noteResult.ok) return noteResult;

  const tagIdsResult = parseMerchantTagIds(formData);
  if (!tagIdsResult.ok) return tagIdsResult;

  return valid({
    name: nameResult.value,
    note: noteResult.value,
    siteUrl: siteUrlResult.value,
    tagIds: tagIdsResult.value,
  });
}

export function validateCreateMerchantForm(
  formData: FormData,
): ValidationResult<CreateMerchantValues, MerchantValidationErrorCode> {
  return parseMerchantValues(formData);
}

export function validateUpdateMerchantForm(
  formData: FormData,
): ValidationResult<UpdateMerchantValues, MerchantValidationErrorCode> {
  const merchantIdResult = parseRequiredUuidField(
    formData,
    "merchantId",
    merchantErrorCodes.merchantInvalid,
  );
  if (!merchantIdResult.ok) return merchantIdResult;

  const merchantValuesResult = parseMerchantValues(formData);
  if (!merchantValuesResult.ok) return merchantValuesResult;

  return valid({
    merchantId: merchantIdResult.value,
    ...merchantValuesResult.value,
  });
}

export function validateArchiveMerchantForm(
  formData: FormData,
): ValidationResult<
  ArchiveMerchantValues,
  typeof merchantErrorCodes.merchantInvalid
> {
  const merchantIdResult = parseRequiredUuidField(
    formData,
    "merchantId",
    merchantErrorCodes.merchantInvalid,
  );
  return merchantIdResult.ok
    ? valid({ merchantId: merchantIdResult.value })
    : merchantIdResult;
}

export function validateCreateMerchantAliasForm(
  formData: FormData,
): ValidationResult<CreateMerchantAliasValues, MerchantValidationErrorCode> {
  const merchantIdResult = parseRequiredUuidField(
    formData,
    "merchantId",
    merchantErrorCodes.merchantInvalid,
  );
  if (!merchantIdResult.ok) return merchantIdResult;

  const aliasResult = parseTextField(formData, "alias", {
    maxLength: merchantAliasMaxLength,
    maxLengthError: merchantErrorCodes.aliasTooLong,
    requiredError: merchantErrorCodes.aliasRequired,
  });
  if (!aliasResult.ok) return aliasResult;

  return valid({
    alias: aliasResult.value,
    merchantId: merchantIdResult.value,
  });
}

export function validateArchiveMerchantAliasForm(
  formData: FormData,
): ValidationResult<
  ArchiveMerchantAliasValues,
  typeof merchantErrorCodes.aliasInvalid
> {
  const aliasIdResult = parseRequiredUuidField(
    formData,
    "aliasId",
    merchantErrorCodes.aliasInvalid,
  );
  return aliasIdResult.ok
    ? valid({ aliasId: aliasIdResult.value })
    : aliasIdResult;
}

export function validateSetPreferredMerchantAliasForm(
  formData: FormData,
): ValidationResult<
  SetPreferredMerchantAliasValues,
  | typeof merchantErrorCodes.aliasInvalid
  | typeof merchantErrorCodes.merchantInvalid
> {
  const merchantIdResult = parseRequiredUuidField(
    formData,
    "merchantId",
    merchantErrorCodes.merchantInvalid,
  );
  if (!merchantIdResult.ok) return merchantIdResult;

  const aliasId = getFormText(formData, "aliasId").trim();
  if (aliasId.length > 0 && !z.string().uuid().safeParse(aliasId).success) {
    return invalid(merchantErrorCodes.aliasInvalid);
  }

  return valid({
    aliasId: aliasId || null,
    merchantId: merchantIdResult.value,
  });
}

function parseMerchantTagValues(
  formData: FormData,
): ValidationResult<CreateMerchantTagValues, MerchantValidationErrorCode> {
  const nameResult = parseTextField(formData, "name", {
    maxLength: merchantTagNameMaxLength,
    maxLengthError: merchantErrorCodes.merchantTagNameTooLong,
    requiredError: merchantErrorCodes.merchantTagNameRequired,
  });
  if (!nameResult.ok) return nameResult;

  const iconResult = parseTextField(formData, "icon", {
    maxLength: merchantTagIconMaxLength,
    maxLengthError: merchantErrorCodes.merchantTagIconInvalid,
    requiredError: merchantErrorCodes.merchantTagIconInvalid,
  });
  if (!iconResult.ok) return iconResult;
  if (!merchantTagEmojiValues.has(iconResult.value)) {
    return invalid(merchantErrorCodes.merchantTagIconInvalid);
  }
  return valid({ icon: iconResult.value, name: nameResult.value });
}

export function validateCreateMerchantTagForm(
  formData: FormData,
): ValidationResult<CreateMerchantTagValues, MerchantValidationErrorCode> {
  return parseMerchantTagValues(formData);
}

export function validateUpdateMerchantTagForm(
  formData: FormData,
): ValidationResult<UpdateMerchantTagValues, MerchantValidationErrorCode> {
  const tagIdResult = parseRequiredUuidField(
    formData,
    "tagId",
    merchantErrorCodes.merchantTagInvalid,
  );
  if (!tagIdResult.ok) return tagIdResult;
  const valuesResult = parseMerchantTagValues(formData);
  return valuesResult.ok
    ? valid({ tagId: tagIdResult.value, ...valuesResult.value })
    : valuesResult;
}

export function validateArchiveMerchantTagForm(
  formData: FormData,
): ValidationResult<
  ArchiveMerchantTagValues,
  typeof merchantErrorCodes.merchantTagInvalid
> {
  const result = parseRequiredUuidField(
    formData,
    "tagId",
    merchantErrorCodes.merchantTagInvalid,
  );
  return result.ok ? valid({ tagId: result.value }) : result;
}

export function validateReorderMerchantTagsForm(
  formData: FormData,
): ValidationResult<
  ReorderMerchantTagsValues,
  typeof merchantErrorCodes.merchantTagOrderInvalid
> {
  let tagIds: unknown;
  try {
    tagIds = JSON.parse(getFormText(formData, "tagIds"));
  } catch {
    return invalid(merchantErrorCodes.merchantTagOrderInvalid);
  }
  const result = z
    .array(z.string().uuid())
    .min(1)
    .max(200)
    .refine((values) => new Set(values).size === values.length)
    .safeParse(tagIds);
  return result.success
    ? valid({ tagIds: result.data })
    : invalid(merchantErrorCodes.merchantTagOrderInvalid);
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const optionalWebsiteUrlSchema = z
  .string()
  .trim()
  .refine(isHttpUrl, { message: "商家网址必须使用 HTTP 或 HTTPS。" })
  .nullable();

export const merchantLedgerParamsSchema = z.object({
  ledgerId: z.string().uuid(),
});
export const merchantParamsSchema = merchantLedgerParamsSchema.extend({
  merchantId: z.string().uuid(),
});
export const merchantAliasParamsSchema = merchantLedgerParamsSchema.extend({
  aliasId: z.string().uuid(),
});
export const merchantListQuerySchema = z.object({
  q: z.string().optional().default(""),
  tagId: z.string().uuid().optional(),
});

export const createMerchantRequestSchema = z.object({
  name: z.string().trim().min(1).max(merchantNameMaxLength),
  note: z.string().trim().max(merchantNoteMaxLength).nullable(),
  siteUrl: optionalWebsiteUrlSchema,
  tagIds: merchantTagIdsSchema.optional().default([]),
});

export const updateMerchantRequestSchema = createMerchantRequestSchema;
export const createMerchantAliasRequestSchema = z.object({
  alias: z.string().trim().min(1).max(merchantAliasMaxLength),
});

export const merchantIconQuerySchema = z.object({
  websiteUrl: z.string().url().max(2048),
});

export const merchantAliasSchema = z.object({
  alias: z.string(),
  created_at: z.string(),
  id: z.string().uuid(),
  is_preferred: z.boolean(),
  merchant_id: z.string().uuid(),
  sort_order: z.number().int(),
});

export const merchantSchema = z.object({
  aliases: z.array(merchantAliasSchema),
  created_at: z.string(),
  display_name: z.string(),
  icon_url: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string(),
  note: z.string().nullable(),
  sort_order: z.number().int(),
  tags: z.array(
    z.object({
      icon: z.string(),
      id: z.string().uuid(),
      merchant_count: z.number().int().nonnegative(),
      name: z.string(),
      sort_order: z.number().int(),
    }),
  ),
  website_url: z.string().nullable(),
});

export const merchantSummarySchema = z.object({
  icon_url: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string(),
});

export const merchantListResponseSchema = z.object({
  canManageMerchants: z.boolean(),
  merchants: z.array(merchantSchema),
  selectedTag: z
    .object({
      icon: z.string(),
      id: z.string().uuid(),
      merchant_count: z.number().int().nonnegative(),
      name: z.string(),
      sort_order: z.number().int(),
    })
    .nullable(),
  tagFilterError: z.string().nullable(),
  tags: z.array(
    z.object({
      icon: z.string(),
      id: z.string().uuid(),
      merchant_count: z.number().int().nonnegative(),
      name: z.string(),
      sort_order: z.number().int(),
    }),
  ),
});
export const merchantOptionsResponseSchema = z.object({
  merchants: z.array(merchantSummarySchema),
});
export const okResponseSchema = z.object({ ok: z.literal(true) });
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
