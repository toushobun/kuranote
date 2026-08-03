import { z } from "@hono/zod-openapi";
import {
  transactionErrorCodes,
  type TransactionValidationErrorCode,
  type UpdateTransactionValidationErrorCode,
  type VoidTransactionValidationErrorCode,
} from "internal/transaction/errors";
import {
  transactionTypes,
  type TransactionType,
} from "internal/transaction/entity/transactionType";
import {
  transactionWritableSpecialStatuses,
  type TransactionSpecialStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import { getFormText } from "utils/formData";

import {
  invalid,
  parseEnumValue,
  parseMoneyAmount,
  parseOptionalTextField,
  parseOptionalUuidText,
  parseRequiredUuidField,
  type ValidationResult,
  valid,
} from "internal/shared/schema/formValidation";

export type { TransactionValidationErrorCode };

type TransactionRecordType = TransactionType | "transfer";

const createTransactionTypeValues = [...transactionTypes, "transfer"] as const;
const transactionRecordTypeValues = ["expense", "income", "transfer"] as const;

export type TransactionFormValues = {
  type: TransactionType;
  transactionAt: string;
  accountId: string;
  items: TransactionFormItemValues[];
  merchantId: string;
  note: string | null;
};

export type TransferTransactionFormValues = {
  type: "transfer";
  transactionAt: string;
  accountId: string;
  transferTargetAccountId: string;
  transferAmount: number;
  note: string | null;
};

export type CreateTransactionFormValues =
  | TransactionFormValues
  | TransferTransactionFormValues;

export type TransactionFormItemValues = {
  amount: number;
  categoryId: string;
  refundedItemId?: string | null;
  reimbursementItemIds?: string[];
  specialStatus?: TransactionSpecialStatus | null;
};

export type UpdateTransactionValues = TransactionFormValues & {
  transactionRecordId: string;
};

export type UpdateTransferTransactionValues = TransferTransactionFormValues & {
  transactionRecordId: string;
};

export type ConvertTransactionToTransferValues =
  TransferTransactionFormValues & {
    sourceType: TransactionRecordType;
    targetType: "transfer";
    transactionRecordId: string;
  };

export type ConvertTransactionToNormalValues = TransactionFormValues & {
  sourceType: TransactionRecordType;
  targetType: TransactionType;
  transactionRecordId: string;
};

export type ConvertTransactionTypeValues =
  | ConvertTransactionToTransferValues
  | ConvertTransactionToNormalValues;

export type VoidTransactionValues = {
  transactionRecordId: string;
};

function parseTimeZoneOffsetMinutes(value: string) {
  if (!/^-?\d+$/.test(value)) {
    return null;
  }

  const offset = Number(value);

  if (!Number.isInteger(offset) || offset < -840 || offset > 840) {
    return null;
  }

  return offset;
}

function parseTransactionAt(value: string, offsetMinutes: number) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? "0");

  const utcLikeDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );

  if (
    utcLikeDate.getUTCFullYear() !== year ||
    utcLikeDate.getUTCMonth() !== month - 1 ||
    utcLikeDate.getUTCDate() !== day ||
    utcLikeDate.getUTCHours() !== hour ||
    utcLikeDate.getUTCMinutes() !== minute ||
    utcLikeDate.getUTCSeconds() !== second
  ) {
    return null;
  }

  return new Date(
    utcLikeDate.getTime() + offsetMinutes * 60 * 1000,
  ).toISOString();
}

function parseTransactionItems(
  formData: FormData,
): ValidationResult<
  TransactionFormItemValues[],
  TransactionValidationErrorCode
> {
  const categoryValues = formData.getAll("itemCategoryId");
  const amountValues = formData.getAll("itemAmount");
  const submittedSpecialStatusValues = formData.getAll("itemSpecialStatus");
  const submittedReimbursementValues = formData.getAll(
    "itemReimbursementItemIds",
  );
  const submittedRefundedItemValues = formData.getAll("itemRefundedItemId");
  const specialStatusValues =
    submittedSpecialStatusValues.length === 0
      ? categoryValues.map(() => "")
      : submittedSpecialStatusValues;

  if (
    categoryValues.length === 0 ||
    categoryValues.length !== amountValues.length ||
    categoryValues.length !== specialStatusValues.length ||
    (submittedReimbursementValues.length > 0 &&
      categoryValues.length !== submittedReimbursementValues.length) ||
    (submittedRefundedItemValues.length > 0 &&
      categoryValues.length !== submittedRefundedItemValues.length)
  ) {
    return invalid(transactionErrorCodes.amountInvalid);
  }

  const items: TransactionFormItemValues[] = [];

  for (const [index, categoryValue] of categoryValues.entries()) {
    const categoryResult = parseOptionalUuidText(
      String(categoryValue).trim(),
      transactionErrorCodes.categoryInvalid,
    );

    if (!categoryResult.ok || !categoryResult.value) {
      return invalid(transactionErrorCodes.categoryInvalid);
    }

    const amountResult = parseMoneyAmount(amountValues[index], {
      allowNegative: false,
      allowZero: true,
      error: transactionErrorCodes.amountInvalid,
    });

    if (!amountResult.ok) {
      return amountResult;
    }

    const specialStatusText = String(specialStatusValues[index] ?? "").trim();
    let specialStatus: TransactionSpecialStatus | null = null;
    if (specialStatusText) {
      if (
        !(transactionWritableSpecialStatuses as readonly string[]).includes(
          specialStatusText,
        )
      ) {
        return invalid(transactionErrorCodes.specialStatusInvalid);
      }
      specialStatus = specialStatusText as TransactionSpecialStatus;
    }

    const reimbursementItemIds = parseUuidArray(
      submittedReimbursementValues[index],
    );
    if (reimbursementItemIds === null) {
      return invalid(transactionErrorCodes.specialStatusInvalid);
    }
    const refundedItemIdText = String(
      submittedRefundedItemValues[index] ?? "",
    ).trim();
    const refundedItemIdResult = parseOptionalUuidText(
      refundedItemIdText,
      transactionErrorCodes.specialStatusInvalid,
    );
    if (!refundedItemIdResult.ok) return refundedItemIdResult;

    items.push({
      amount: amountResult.value,
      categoryId: categoryResult.value,
      ...(reimbursementItemIds.length > 0 ? { reimbursementItemIds } : {}),
      ...(refundedItemIdResult.value
        ? { refundedItemId: refundedItemIdResult.value }
        : {}),
      ...(submittedSpecialStatusValues.length > 0 ? { specialStatus } : {}),
    });
  }

  return valid(items);
}

function parseUuidArray(
  value: FormDataEntryValue | undefined,
): string[] | null {
  if (value === undefined || String(value).trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(String(value));
    if (!Array.isArray(parsed) || parsed.length > 100) return null;
    const ids = [...new Set(parsed)];
    if (
      ids.some(
        (id) =>
          typeof id !== "string" || !z.string().uuid().safeParse(id).success,
      )
    ) {
      return null;
    }
    return ids as string[];
  } catch {
    return null;
  }
}

export function validateTransactionForm(
  formData: FormData,
): ValidationResult<
  CreateTransactionFormValues,
  TransactionValidationErrorCode
> {
  const typeResult = parseEnumValue(
    getFormText(formData, "type"),
    createTransactionTypeValues,
    transactionErrorCodes.typeInvalid,
  );

  if (!typeResult.ok) {
    return typeResult;
  }

  const offsetMinutes = parseTimeZoneOffsetMinutes(
    getFormText(formData, "timeZoneOffsetMinutes"),
  );

  if (offsetMinutes === null) {
    return invalid(transactionErrorCodes.dateInvalid);
  }

  const transactionAt = parseTransactionAt(
    getFormText(formData, "transactionAt"),
    offsetMinutes,
  );

  if (!transactionAt) {
    return invalid(transactionErrorCodes.dateInvalid);
  }

  const accountIdResult = parseRequiredUuidField(
    formData,
    "accountId",
    transactionErrorCodes.accountInvalid,
  );

  if (!accountIdResult.ok) {
    return accountIdResult;
  }

  if (typeResult.value === "transfer") {
    const targetAccountIdResult = parseRequiredUuidField(
      formData,
      "transferTargetAccountId",
      transactionErrorCodes.accountInvalid,
    );

    if (!targetAccountIdResult.ok) {
      return targetAccountIdResult;
    }

    if (targetAccountIdResult.value === accountIdResult.value) {
      return invalid(transactionErrorCodes.accountInvalid);
    }

    const transferAmountResult = parseMoneyAmount(
      formData.get("transferAmount"),
      {
        allowNegative: false,
        allowZero: false,
        error: transactionErrorCodes.amountInvalid,
      },
    );

    if (!transferAmountResult.ok) {
      return transferAmountResult;
    }

    const noteResult = parseOptionalTextField(
      formData,
      "note",
      2000,
      transactionErrorCodes.noteTooLong,
    );

    if (!noteResult.ok) {
      return noteResult;
    }

    return valid({
      accountId: accountIdResult.value,
      note: noteResult.value,
      transactionAt,
      transferAmount: transferAmountResult.value,
      transferTargetAccountId: targetAccountIdResult.value,
      type: "transfer",
    });
  }

  const itemsResult = parseTransactionItems(formData);

  if (!itemsResult.ok) {
    return itemsResult;
  }

  const merchantIdResult = parseRequiredUuidField(
    formData,
    "merchantId",
    transactionErrorCodes.merchantInvalid,
  );

  if (!merchantIdResult.ok) {
    return merchantIdResult;
  }

  const noteResult = parseOptionalTextField(
    formData,
    "note",
    2000,
    transactionErrorCodes.noteTooLong,
  );

  if (!noteResult.ok) {
    return noteResult;
  }

  return valid({
    accountId: accountIdResult.value,
    items: itemsResult.value,
    merchantId: merchantIdResult.value,
    note: noteResult.value,
    transactionAt,
    type: typeResult.value,
  });
}

export function validateUpdateTransactionForm(
  formData: FormData,
): ValidationResult<
  UpdateTransactionValues,
  UpdateTransactionValidationErrorCode
> {
  const transactionRecordIdResult = parseRequiredUuidField(
    formData,
    "transactionRecordId",
    transactionErrorCodes.updateInvalid,
  );

  if (!transactionRecordIdResult.ok) {
    return transactionRecordIdResult;
  }

  if (String(formData.get("type") ?? "").trim() === "transfer") {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  const transactionResult = validateTransactionForm(formData);

  if (!transactionResult.ok) {
    return transactionResult;
  }

  // raw type=transfer 已提前拒绝；这里保留用于将 validateTransactionForm 的 union 返回值缩窄为普通交易。
  if (transactionResult.value.type === "transfer") {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  return valid({
    ...transactionResult.value,
    transactionRecordId: transactionRecordIdResult.value,
  });
}

export function validateUpdateTransferTransactionForm(
  formData: FormData,
): ValidationResult<
  UpdateTransferTransactionValues,
  UpdateTransactionValidationErrorCode
> {
  const transactionRecordIdResult = parseRequiredUuidField(
    formData,
    "transactionRecordId",
    transactionErrorCodes.updateInvalid,
  );

  if (!transactionRecordIdResult.ok) {
    return transactionRecordIdResult;
  }

  if (String(formData.get("type") ?? "").trim() !== "transfer") {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  const formResult = validateTransactionForm(formData);

  if (!formResult.ok) {
    return formResult;
  }

  // 已确认 type=transfer，这里用于收窄 union 类型。
  if (formResult.value.type !== "transfer") {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  return valid({
    ...formResult.value,
    transactionRecordId: transactionRecordIdResult.value,
  });
}

export function validateConvertTransactionTypeForm(
  formData: FormData,
): ValidationResult<
  ConvertTransactionTypeValues,
  UpdateTransactionValidationErrorCode
> {
  const transactionRecordIdResult = parseRequiredUuidField(
    formData,
    "transactionRecordId",
    transactionErrorCodes.updateInvalid,
  );

  if (!transactionRecordIdResult.ok) {
    return transactionRecordIdResult;
  }

  const sourceTypeResult = parseEnumValue(
    getFormText(formData, "sourceType"),
    transactionRecordTypeValues,
    transactionErrorCodes.updateInvalid,
  );

  if (!sourceTypeResult.ok) {
    return sourceTypeResult;
  }

  const targetTypeResult = parseEnumValue(
    getFormText(formData, "targetType") || getFormText(formData, "type"),
    transactionRecordTypeValues,
    transactionErrorCodes.updateInvalid,
  );

  if (!targetTypeResult.ok) {
    return targetTypeResult;
  }

  if (sourceTypeResult.value === targetTypeResult.value) {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  const formResult = validateTransactionForm(formData);

  if (!formResult.ok) {
    return formResult;
  }

  if (targetTypeResult.value === "transfer") {
    if (formResult.value.type !== "transfer") {
      return invalid(transactionErrorCodes.updateInvalid);
    }

    return valid({
      ...formResult.value,
      sourceType: sourceTypeResult.value,
      targetType: "transfer",
      transactionRecordId: transactionRecordIdResult.value,
    });
  }

  if (formResult.value.type === "transfer") {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  if (formResult.value.type !== targetTypeResult.value) {
    return invalid(transactionErrorCodes.updateInvalid);
  }

  return valid({
    ...formResult.value,
    sourceType: sourceTypeResult.value,
    targetType: targetTypeResult.value,
    transactionRecordId: transactionRecordIdResult.value,
  });
}

export function validateVoidTransactionForm(
  formData: FormData,
): ValidationResult<VoidTransactionValues, VoidTransactionValidationErrorCode> {
  const transactionRecordIdResult = parseRequiredUuidField(
    formData,
    "transactionRecordId",
    transactionErrorCodes.voidInvalid,
  );

  if (!transactionRecordIdResult.ok) {
    return transactionRecordIdResult;
  }

  return valid({ transactionRecordId: transactionRecordIdResult.value });
}

// 与 parseMoneyAmount 的 `^-?\d+(\.\d{1,2})?$` 保持一致，避免 JSON 接口接受超过 2 位小数的金额。
const moneyAmountPrecisionPattern = /^-?\d+(\.\d{1,2})?$/;

function hasValidMoneyPrecision(value: number): boolean {
  return moneyAmountPrecisionPattern.test(String(value));
}

function addSameAccountTransferIssue(context: z.RefinementCtx) {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: transactionErrorCodes.accountInvalid,
    path: ["transferTargetAccountId"],
  });
}

const transactionItemRequestSchema = z
  .object({
    amount: z.number().nonnegative().refine(hasValidMoneyPrecision, {
      message: transactionErrorCodes.amountInvalid,
    }),
    categoryId: z.string().uuid(),
    refundedItemId: z.string().uuid().nullable().optional(),
    reimbursementItemIds: z.array(z.string().uuid()).max(100).optional(),
    specialStatus: z
      .enum(transactionWritableSpecialStatuses)
      .nullable()
      .optional(),
  })
  .refine((item) => !item.refundedItemId || item.amount > 0, {
    message: transactionErrorCodes.refundLinkInvalid,
    path: ["amount"],
  });

const normalTransactionRequestSchema = z.object({
  accountId: z.string().uuid(),
  items: z.array(transactionItemRequestSchema).min(1),
  ledgerId: z.string().uuid(),
  merchantId: z.string().uuid(),
  note: z.string().max(2000).nullable(),
  transactionAt: z.string().datetime({ offset: true }),
  type: z.enum(["expense", "income"]),
});

const transferTransactionRequestSchema = z.object({
  accountId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  note: z.string().max(2000).nullable(),
  transactionAt: z.string().datetime({ offset: true }),
  transferAmount: z.number().positive().refine(hasValidMoneyPrecision, {
    message: transactionErrorCodes.amountInvalid,
  }),
  transferTargetAccountId: z.string().uuid(),
  type: z.literal("transfer"),
});

export const createTransactionRequestSchema = z
  .discriminatedUnion("type", [
    normalTransactionRequestSchema,
    transferTransactionRequestSchema,
  ])
  .superRefine((value, context) => {
    if (
      value.type === "transfer" &&
      value.transferTargetAccountId === value.accountId
    ) {
      addSameAccountTransferIssue(context);
    }
  });

export const updateTransactionRequestSchema = createTransactionRequestSchema;

export const convertTransactionRequestSchema = z
  .discriminatedUnion("targetType", [
    normalTransactionRequestSchema.omit({ type: true }).extend({
      targetType: z.enum(["expense", "income"]),
    }),
    transferTransactionRequestSchema.omit({ type: true }).extend({
      targetType: z.literal("transfer"),
    }),
  ])
  .superRefine((value, context) => {
    if (
      value.targetType === "transfer" &&
      value.transferTargetAccountId === value.accountId
    ) {
      addSameAccountTransferIssue(context);
    }
  });

export const transactionIdParamsSchema = z.object({
  transactionRecordId: z.string().uuid(),
});

export const transactionLedgerQuerySchema = z.object({
  ledgerId: z.string().uuid(),
});

export const okResponseSchema = z.object({ ok: z.literal(true) });
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    status: z.number().int(),
  }),
});
