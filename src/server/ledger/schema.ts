import { z } from "@hono/zod-openapi";

export const acceptLedgerInviteRequestSchema = z.object({
  token: z.string().min(1).openapi({ example: "abc123" }),
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
