import { z } from "@hono/zod-openapi";

import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";
import {
  dataImportErrorCodes,
  type DataImportErrorCode,
} from "internal/dataImport/errors";
import {
  importBatchSize,
  importCurrencyPattern,
  importNoteMaxLength,
} from "internal/dataImport/schema";
import { parseImportDate } from "internal/dataImport/util/parseImportDate";
import {
  invalid,
  valid,
  type ValidationResult,
} from "internal/shared/schema/formValidation";

export type DataImportBatchFormFields = {
  timeZoneOffsetMinutes: number;
  units: ImportExecutionUnit[];
};

const nameSchema = z.string().min(1).max(200);
const holderSchema = z.string().min(1).max(200).nullable();
const currencySchema = z.string().regex(importCurrencyPattern);
const noteSchema = z.string().max(importNoteMaxLength).nullable();
const amountSchema = z.number().finite().nonnegative();
const rowNumberSchema = z.number().int().positive();
const transactionAtSchema = z
  .string()
  .refine((value) => parseImportDate(value).ok);

const incomeExpenseRowSchema = z.object({
  accountCurrency: currencySchema,
  accountHolder: holderSchema,
  accountName: nameSchema,
  amount: amountSchema,
  billRef: z.string().max(200).nullable(),
  childCategoryName: nameSchema.nullable(),
  merchantName: nameSchema,
  merchantTag: nameSchema.nullable(),
  note: noteSchema,
  parentCategoryName: nameSchema,
  rowNumber: rowNumberSchema,
  transactionAt: transactionAtSchema,
  transactionType: z.enum(["expense", "income"]),
});

const transferRowSchema = z.object({
  amount: amountSchema,
  fromAccountCurrency: currencySchema,
  fromAccountHolder: holderSchema,
  fromAccountName: nameSchema,
  note: noteSchema,
  rowNumber: rowNumberSchema,
  toAccountCurrency: currencySchema,
  toAccountHolder: holderSchema,
  toAccountName: nameSchema,
  transactionAt: transactionAtSchema,
});

const executionUnitSchema = z.discriminatedUnion("kind", [
  z.object({
    group: z.object({
      items: z.array(incomeExpenseRowSchema).min(1),
      rowNumbers: z.array(rowNumberSchema).min(1),
    }),
    kind: z.literal("incomeExpense"),
  }),
  z.object({ kind: z.literal("transfer"), row: transferRowSchema }),
]);

const unitsSchema = z.array(executionUnitSchema).min(1).max(importBatchSize);

function parseUnits(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  let json: unknown;
  try {
    json = JSON.parse(value);
  } catch {
    return null;
  }

  const result = unitsSchema.safeParse(json);
  return result.success ? result.data : null;
}

/** 解析「开始导入」单批请求：`units` 为这一批行数据的 JSON，不再包含文件。 */
export function parseExecuteDataImportBatchForm(
  formData: FormData,
): ValidationResult<DataImportBatchFormFields, DataImportErrorCode> {
  const units = parseUnits(formData.get("units"));
  if (!units) {
    return invalid(dataImportErrorCodes.executionInvalid);
  }

  const timeZoneOffsetText = formData.get("timeZoneOffsetMinutes");
  const timeZoneOffsetMinutes =
    typeof timeZoneOffsetText === "string" ? Number(timeZoneOffsetText) : NaN;
  if (
    !Number.isInteger(timeZoneOffsetMinutes) ||
    timeZoneOffsetMinutes < -840 ||
    timeZoneOffsetMinutes > 840
  ) {
    return invalid(dataImportErrorCodes.executionInvalid);
  }

  return valid({ timeZoneOffsetMinutes, units });
}
