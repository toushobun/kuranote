import {
  maxTransactionTagCount,
  maxTransactionTagNameLength,
} from "@/constants/transactions";

export const transactionErrorCodes = {
  accountInvalid: "account_invalid",
  amountInvalid: "amount_invalid",
  categoryInvalid: "category_invalid",
  createFailed: "create_failed",
  dateInvalid: "date_invalid",
  merchantInvalid: "merchant_invalid",
  noteTooLong: "note_too_long",
  permissionDenied: "permission_denied",
  tagInvalid: "tag_invalid",
  typeInvalid: "type_invalid",
  updateFailed: "update_failed",
  updateInvalid: "update_invalid",
  voidFailed: "void_failed",
  voidInvalid: "void_invalid",
} as const;

export type TransactionValidationErrorCode =
  | typeof transactionErrorCodes.accountInvalid
  | typeof transactionErrorCodes.amountInvalid
  | typeof transactionErrorCodes.categoryInvalid
  | typeof transactionErrorCodes.dateInvalid
  | typeof transactionErrorCodes.merchantInvalid
  | typeof transactionErrorCodes.noteTooLong
  | typeof transactionErrorCodes.tagInvalid
  | typeof transactionErrorCodes.typeInvalid;

export type UpdateTransactionValidationErrorCode =
  | TransactionValidationErrorCode
  | typeof transactionErrorCodes.updateInvalid;

export type VoidTransactionValidationErrorCode =
  typeof transactionErrorCodes.voidInvalid;

export type TransactionServiceErrorCode =
  | typeof transactionErrorCodes.createFailed
  | typeof transactionErrorCodes.permissionDenied
  | typeof transactionErrorCodes.updateFailed
  | typeof transactionErrorCodes.voidFailed;

const transactionValidationErrorMessages: Record<
  TransactionValidationErrorCode,
  string
> = {
  [transactionErrorCodes.accountInvalid]: "账户指定不正确。",
  [transactionErrorCodes.amountInvalid]: "金额不能为负数，且最多两位小数。",
  [transactionErrorCodes.categoryInvalid]: "分类指定不正确。",
  [transactionErrorCodes.dateInvalid]: "发生时间不正确。",
  [transactionErrorCodes.merchantInvalid]: "商家指定不正确。",
  [transactionErrorCodes.noteTooLong]: "备注不能超过 2000 个字符。",
  [transactionErrorCodes.tagInvalid]:
    `标签最多 ${maxTransactionTagCount} 个，单个标签不能超过 ${maxTransactionTagNameLength} 个字符。`,
  [transactionErrorCodes.typeInvalid]: "记账类型不正确。",
};

export function getTransactionValidationErrorMessage(error?: string) {
  return error && error in transactionValidationErrorMessages
    ? transactionValidationErrorMessages[
        error as TransactionValidationErrorCode
      ]
    : null;
}

export function getUpdateTransactionValidationErrorMessage(error?: string) {
  if (error === transactionErrorCodes.updateInvalid) {
    return "编辑对象不正确。";
  }

  return getTransactionValidationErrorMessage(error);
}

export function getVoidTransactionValidationErrorMessage(error?: string) {
  return error === transactionErrorCodes.voidInvalid
    ? "删除对象不正确。"
    : null;
}
