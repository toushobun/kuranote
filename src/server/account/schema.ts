import { z } from "@hono/zod-openapi";

import { themeColorKeys } from "theme/themeColorTokens";
import { accountTypeOptions } from "types/accounts";

const accountTypeValues = accountTypeOptions.map((option) => option.value) as [
  (typeof accountTypeOptions)[number]["value"],
  ...(typeof accountTypeOptions)[number]["value"][],
];
const accountHolderRoleValues = ["owner", "co_owner"] as const;
const moneyValueSchema = z.union([z.number(), z.string()]);

export const accountLedgerParamsSchema = z.object({
  ledgerId: z.string().uuid(),
});

export const accountParamsSchema = accountLedgerParamsSchema.extend({
  accountId: z.string().uuid(),
});

const accountFieldsSchema = z.object({
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  holderUserIds: z.array(z.string().uuid()).min(1),
  name: z.string().trim().min(1),
  type: z.enum(accountTypeValues),
});

export const createAccountRequestSchema = accountFieldsSchema.extend({
  initialBalance: z.number().finite(),
});

export const updateAccountRequestSchema = accountFieldsSchema;

const accountHolderSchema = z.object({
  display_color: z.enum(themeColorKeys),
  display_name: z.string(),
  email: z.string().email().nullable(),
  id: z.string().uuid(),
  role: z.enum(accountHolderRoleValues),
  share_ratio: moneyValueSchema.nullable(),
  user_id: z.string().uuid(),
});

const accountSchema = z.object({
  created_at: z.string(),
  currency: z.string(),
  current_balance: moneyValueSchema,
  holders: z.array(accountHolderSchema),
  id: z.string().uuid(),
  initial_balance: moneyValueSchema,
  name: z.string(),
  sort_order: z.number(),
  type: z.enum(accountTypeValues),
});

const holderOptionSchema = z.object({
  display_name: z.string(),
  email: z.string().email().nullable(),
  user_id: z.string().uuid(),
});

export const accountsViewResponseSchema = z.object({
  accounts: z.array(accountSchema),
  baseCurrency: z.string(),
  canManageAccounts: z.boolean(),
  canWriteTransactions: z.boolean(),
  holderOptions: z.array(holderOptionSchema),
  ledgerName: z.string(),
});

export const createdAccountResponseSchema = z.object({
  accountId: z.string().uuid(),
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
