import { z } from "@hono/zod-openapi";

import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";

export const acceptLedgerInviteRequestSchema = z.object({
  token: z
    .string()
    .min(1)
    .refine(isValidLedgerInviteToken, { message: "邀请 token 格式无效。" })
    .openapi({
      example: "0".repeat(64),
    }),
});

export const acceptLedgerInviteResponseSchema = z.object({
  ok: z.literal(true),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});

export type AcceptLedgerInviteRequest = z.infer<
  typeof acceptLedgerInviteRequestSchema
>;
