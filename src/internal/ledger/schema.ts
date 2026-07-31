import { z } from "@hono/zod-openapi";

import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { ledgerCurrencies } from "internal/ledger/entity/ledgerCurrency";
import { ledgerInviteRoles } from "internal/ledger/entity/ledgerInviteRole";
import { themeColorKeys } from "theme/themeColorTokens";

const uuidSchema = z.string().uuid();
const currencySchema = z.enum(ledgerCurrencies);
const themeColorSchema = z.enum(themeColorKeys);
const memberRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);
const inviteRoleSchema = z.enum(ledgerInviteRoles);

export const acceptLedgerInviteRequestSchema = z.object({
  token: z.string().refine(isValidLedgerInviteToken, {
    message: "邀请 token 格式无效。",
  }),
});

export const createLedgerRequestSchema = z.object({
  baseCurrency: currencySchema,
  displayColor: themeColorSchema,
  displayName: z.string().trim().min(1).max(100),
  ledgerName: z.string().trim().min(1).max(100),
});

export const switchCurrentLedgerRequestSchema = z.object({
  ledgerId: uuidSchema,
});

export const ledgerIdParamsSchema = z.object({ ledgerId: uuidSchema });
export const ledgerInviteParamsSchema = z.object({
  inviteId: uuidSchema,
  ledgerId: uuidSchema,
});

export const createLedgerInviteRequestSchema = z.object({
  role: inviteRoleSchema,
});

export const updateLedgerSettingsRequestSchema = z.discriminatedUnion(
  "intent",
  [
    z.object({
      intent: z.literal("ledger"),
      baseCurrency: currencySchema,
      ledgerName: z.string().trim().min(1).max(100),
    }),
    z.object({
      intent: z.literal("member"),
      displayColor: themeColorSchema,
      displayName: z.string().trim().min(1).max(100),
      role: memberRoleSchema,
      userId: uuidSchema,
    }),
  ],
);

export const okResponseSchema = z.object({ ok: z.literal(true) });
export const acceptLedgerInviteResponseSchema = okResponseSchema;
export const createdLedgerInviteResponseSchema = z.object({
  inviteId: uuidSchema,
  role: inviteRoleSchema,
  token: z.string().refine(isValidLedgerInviteToken),
});
export const pendingLedgerInvitesResponseSchema = z.object({
  invites: z.array(
    z.object({
      createdAt: z.string(),
      id: uuidSchema,
      role: inviteRoleSchema,
      token: z.string().nullable(),
    }),
  ),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
