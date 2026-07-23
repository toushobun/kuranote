import { z } from "@hono/zod-openapi";

const uuidSchema = z.string().uuid();
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const statisticsLedgerParamsSchema = z.object({
  ledgerId: uuidSchema,
});

export const statisticsMonthQuerySchema = z.object({
  month: monthSchema.optional(),
});

const amountSummarySchema = z.object({
  balance: z.string(),
  currency: z.string(),
  expense: z.string(),
  income: z.string(),
});

const categoryItemSchema = z.object({
  amount: z.string(),
  categoryName: z.string(),
  categoryType: z.enum(["expense", "income"]).optional(),
  parentCategoryName: z.string().nullable(),
});

const transactionListItemSchema = z.object({
  account_color: z.string().nullable().optional(),
  account_currency: z.string(),
  account_name: z.string(),
  amount: z.string(),
  canEdit: z.boolean().optional(),
  categoryItems: z.array(categoryItemSchema),
  created_at: z.string(),
  id: z.string(),
  merchant_icon_url: z.string().nullable(),
  merchant_name: z.string().nullable(),
  note: z.string().nullable(),
  recorder_color: z.string().nullable().optional(),
  recorder_name: z.string().nullable(),
  show_recorder: z.boolean().optional(),
  tagNames: z.array(z.string()),
  transaction_at: z.string(),
  type: z.enum(["expense", "income", "transfer"]),
});

export const dashboardResponseSchema = z.object({
  accountSummaries: z.array(
    z.object({
      balance: z.union([z.number(), z.string()]),
      currency: z.string(),
      id: z.string(),
      name: z.string(),
      type: z.string(),
    }),
  ),
  hasLedger: z.boolean().optional(),
  monthLabel: z.string(),
  monthSummary: amountSummarySchema,
  recentTransactions: z.array(transactionListItemSchema),
});

const rankingItemSchema = z.object({
  amount: z.string(),
  id: z.string(),
  name: z.string(),
  transactionCount: z.number().int().nonnegative(),
});

export const statisticsResponseSchema = z.object({
  categoryExpenseRanking: z.array(rankingItemSchema),
  ledgerName: z.string(),
  merchantExpenseRanking: z.array(rankingItemSchema),
  month: monthSchema,
  monthLabel: z.string(),
  nextMonth: monthSchema,
  previousMonth: monthSchema,
  summary: amountSummarySchema,
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    details: z.unknown().optional(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
