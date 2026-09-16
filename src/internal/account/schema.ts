import { isValidTargetBalance } from "./util/accountBalance";
import { z } from "@hono/zod-openapi";

import { accountHolderRoles } from "internal/account/entity/accountHolderRole";
import { accountTypes } from "internal/account/entity/accountType";
import { themeColorKeys } from "theme/themeColorTokens";
import {
  accountErrorCodes,
  getAccountErrorMessage,
  type AccountErrorCode,
} from "./errors";

export const accountBalanceAdjustmentSchema = z.object({
  targetBalance: z
    .number()
    .finite()
    .refine(isValidTargetBalance, {
      message: getAccountErrorMessage(accountErrorCodes.balanceInvalid)!,
    })
    .optional(),
  balanceAdjustmentNote: z
    .string()
    .trim()
    .max(2000, getAccountErrorMessage(accountErrorCodes.adjustmentNoteInvalid)!)
    .nullable()
    .optional(),
});

/**
 * zod 的失败原因只按字段路径映射错误码，不依赖 issue.message 的具体文本，
 * 因此当 targetBalance 在到达 refine 前就被 `.finite()` 拦下（例如 NaN、Infinity）
 * 时也能得到正确的错误码。formParser 和 Service 共用同一份判定逻辑。
 */
export function getAccountBalanceAdjustmentErrorCode(
  error: z.ZodError,
): AccountErrorCode {
  return error.issues[0]?.path[0] === "balanceAdjustmentNote"
    ? accountErrorCodes.adjustmentNoteInvalid
    : accountErrorCodes.balanceInvalid;
}

const moneyValueSchema = z.union([z.number(), z.string()]);

export const accountLedgerParamsSchema = z.object({
  ledgerId: z.string().uuid(),
});

export const accountParamsSchema = accountLedgerParamsSchema.extend({
  accountId: z.string().uuid(),
});

const accountFieldsSchema = z.object({
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/),
  holderUserIds: z.array(z.string().uuid()).max(1),
  name: z.string().trim().min(1),
  type: z.enum(accountTypes),
});

export const createAccountRequestSchema = accountFieldsSchema.extend({
  initialBalance: z.number().finite(),
});

export const updateAccountRequestSchema = accountFieldsSchema.extend(
  accountBalanceAdjustmentSchema.shape,
);

const accountHolderSchema = z.object({
  display_color: z.enum(themeColorKeys),
  display_name: z.string(),
  email: z.string().email().nullable(),
  id: z.string().uuid(),
  role: z.enum(accountHolderRoles),
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
  type: z.enum(accountTypes),
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
