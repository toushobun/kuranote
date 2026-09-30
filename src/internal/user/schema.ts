import { z } from "@hono/zod-openapi";

import {
  transactionColorSchemes,
  userStatuses,
} from "internal/user/entity/userProfile";
import { displayNameMaxLength, userErrorMessages } from "internal/user/errors";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(isHttpsUrl, { message: "头像地址必须使用 HTTPS。" });
const transactionColorSchemeSchema = z.enum(transactionColorSchemes, {
  error: userErrorMessages.transactionColorSchemeInvalid,
});

export const updateUserProfileRequestSchema = z
  .object({
    avatarUrl: httpsUrlSchema.nullable().optional(),
    displayName: z.string().trim().min(1).max(100).optional(),
    transactionColorScheme: transactionColorSchemeSchema.optional(),
  })
  .refine(
    (input) =>
      input.avatarUrl !== undefined ||
      input.displayName !== undefined ||
      input.transactionColorScheme !== undefined,
    { message: "请至少提供一项需要更新的用户资料。" },
  );

export const userProfileResponseSchema = z.object({
  avatarUrl: httpsUrlSchema.nullable(),
  displayName: z.string().min(1).max(100),
  email: z.string().email().nullable(),
  id: z.string().uuid(),
  status: z.enum(userStatuses),
  transactionColorScheme: transactionColorSchemeSchema,
});

export function parseTransactionColorSchemeForm(formData: FormData) {
  const result = z
    .object({
      transactionColorScheme: transactionColorSchemeSchema,
    })
    .safeParse({
      transactionColorScheme: formData.get("transactionColorScheme"),
    });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        userErrorMessages.transactionColorSchemeInvalid,
      ok: false as const,
    };
  }

  return { ok: true as const, value: result.data };
}

const updateDisplayNameFormSchema = z.object({
  displayName: z
    .string({ error: userErrorMessages.displayNameRequired })
    .trim()
    .min(1, { error: userErrorMessages.displayNameRequired })
    .max(displayNameMaxLength, { error: userErrorMessages.displayNameTooLong }),
  syncLedgerIds: z
    .array(
      z.string().uuid({ error: userErrorMessages.displayNameLedgerInvalid }),
    )
    .max(100, { error: userErrorMessages.displayNameLedgerInvalid }),
});

export function parseUpdateDisplayNameForm(formData: FormData) {
  const result = updateDisplayNameFormSchema.safeParse({
    displayName: formData.get("displayName") ?? undefined,
    syncLedgerIds: formData.getAll("syncLedgerIds"),
  });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        userErrorMessages.displayNameUpdateFailed,
      ok: false as const,
    };
  }

  return { ok: true as const, value: result.data };
}

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
