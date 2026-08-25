import { z } from "@hono/zod-openapi";

import {
  transactionColorSchemes,
  userStatuses,
} from "internal/user/entity/userProfile";
import { userErrorMessages } from "internal/user/errors";

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

export const updateUserProfileRequestSchema = z
  .object({
    avatarUrl: httpsUrlSchema.nullable().optional(),
    displayName: z.string().trim().min(1).max(100).optional(),
    transactionColorScheme: z.enum(transactionColorSchemes).optional(),
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
  transactionColorScheme: z.enum(transactionColorSchemes),
});

export function parseTransactionColorSchemeForm(formData: FormData) {
  const result = z
    .object({
      transactionColorScheme: z.enum(transactionColorSchemes, {
        error: userErrorMessages.transactionColorSchemeInvalid,
      }),
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

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
