import { z } from "@hono/zod-openapi";
import { ledgerCurrencies } from "internal/ledger";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });

export const dailyExchangeRateQuerySchema = z.object({
  from: z.enum(ledgerCurrencies),
  to: z.enum(ledgerCurrencies),
  date: dateSchema,
});
export type DailyExchangeRateQuery = z.infer<
  typeof dailyExchangeRateQuerySchema
>;

export const dailyExchangeRateResponseSchema = z.object({
  rate: z.number().positive().nullable(),
  rateDate: dateSchema.nullable(),
});
export type DailyExchangeRateResult = z.infer<
  typeof dailyExchangeRateResponseSchema
>;

export const exchangeRateErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    details: z.unknown().optional(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number(),
  }),
});
