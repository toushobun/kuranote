import { z } from "@hono/zod-openapi";

import {
  merchantErrorCodes,
  type MerchantValidationErrorCode,
} from "server/merchant/errors";
import {
  invalid,
  parseOptionalTextField,
  parseRequiredUuidField,
  parseTextField,
  type ValidationResult,
  valid,
} from "server/validators/common";
import { getFormText } from "utils/formData";
import { parseWebsiteUrl } from "utils/merchants";

export const merchantNameMaxLength = 100;
export const merchantNoteMaxLength = 1000;
export const merchantAliasMaxLength = 100;

export type CreateMerchantValues = {
  name: string;
  note: string | null;
  siteUrl: string | null;
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

type MerchantFormFailure = {
  error: MerchantValidationErrorCode;
  merchantId?: string;
  ok: false;
};

type MerchantFormResult<T> = { ok: true; value: T } | MerchantFormFailure;

function invalidWithMerchantId(
  error: MerchantValidationErrorCode,
  merchantId: string,
): MerchantFormFailure {
  return merchantId.length > 0
    ? { error, merchantId, ok: false }
    : { error, ok: false };
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

  return valid({
    name: nameResult.value,
    note: noteResult.value,
    siteUrl: siteUrlResult.value,
  });
}

export function validateCreateMerchantForm(
  formData: FormData,
): ValidationResult<CreateMerchantValues, MerchantValidationErrorCode> {
  return parseMerchantValues(formData);
}

export function validateUpdateMerchantForm(
  formData: FormData,
): MerchantFormResult<UpdateMerchantValues> {
  const merchantIdText = getFormText(formData, "merchantId");
  const merchantIdResult = parseRequiredUuidField(
    formData,
    "merchantId",
    merchantErrorCodes.merchantInvalid,
  );
  if (!merchantIdResult.ok) return merchantIdResult;

  const merchantValuesResult = parseMerchantValues(formData);
  if (!merchantValuesResult.ok) {
    return invalidWithMerchantId(merchantValuesResult.error, merchantIdText);
  }

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
): MerchantFormResult<CreateMerchantAliasValues> {
  const merchantIdText = getFormText(formData, "merchantId");
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
  if (!aliasResult.ok) {
    return invalidWithMerchantId(aliasResult.error, merchantIdText);
  }

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

export const merchantIdParamsSchema = z.object({
  merchantId: z.string().uuid(),
});
export const merchantAliasIdParamsSchema = z.object({
  aliasId: z.string().uuid(),
});
export const merchantLedgerQuerySchema = z.object({
  ledgerId: z.string().uuid(),
});
export const merchantListQuerySchema = merchantLedgerQuerySchema.extend({
  q: z.string().optional().default(""),
});

export const createMerchantRequestSchema = z.object({
  ledgerId: z.string().uuid(),
  name: z.string().trim().min(1).max(merchantNameMaxLength),
  note: z.string().trim().max(merchantNoteMaxLength).nullable(),
  siteUrl: optionalWebsiteUrlSchema,
});

export const updateMerchantRequestSchema = createMerchantRequestSchema;
export const createMerchantAliasRequestSchema = z.object({
  alias: z.string().trim().min(1).max(merchantAliasMaxLength),
  ledgerId: z.string().uuid(),
});

export const merchantAliasSchema = z.object({
  alias: z.string(),
  created_at: z.string(),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  sort_order: z.number().int(),
});

export const merchantSchema = z.object({
  aliases: z.array(merchantAliasSchema),
  created_at: z.string(),
  icon_url: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string(),
  note: z.string().nullable(),
  sort_order: z.number().int(),
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
