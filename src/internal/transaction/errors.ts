export const transactionErrorCodes = {
  accountInvalid: "account_invalid",
  amountInvalid: "amount_invalid",
  categoryInvalid: "category_invalid",
  createFailed: "create_failed",
  dateInvalid: "date_invalid",
  incomeLinkCategoryInvalid: "income_link_category_invalid",
  // 只约束同一收入明细不能同时作为退款来源和报销来源。
  incomeLinkConflict: "income_link_conflict",
  ledgerInvalid: "ledger_invalid",
  linkedDeleteForbidden: "linked_delete_forbidden",
  linkedEditRequiresUnlink: "linked_edit_requires_unlink",
  linkedSyncConfirmationRequired: "linked_sync_confirmation_required",
  linkedVersionInvalid: "linked_version_invalid",
  merchantInvalid: "merchant_invalid",
  noteTooLong: "note_too_long",
  refundLinkInvalid: "refund_link_invalid",
  reimbursementLinkInvalid: "reimbursement_link_invalid",
  permissionDenied: "permission_denied",
  specialStatusInvalid: "special_status_invalid",
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
  | typeof transactionErrorCodes.refundLinkInvalid
  | typeof transactionErrorCodes.reimbursementLinkInvalid
  | typeof transactionErrorCodes.specialStatusInvalid
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
  [transactionErrorCodes.refundLinkInvalid]: "退款金额必须大于 0。",
  [transactionErrorCodes.reimbursementLinkInvalid]: "报销目标明细不正确。",
  [transactionErrorCodes.specialStatusInvalid]:
    "特殊状态不正确；待报销只能用于支出明细，结清状态只能由有效退款或报销核销自动派生。",
  [transactionErrorCodes.typeInvalid]: "记账类型不正确。",
};

export const transactionLinkedEditErrorMessages = {
  confirmationRequired:
    "该交易包含退款 / 报销关联，请确认同步修改关联数据后再保存。",
  deleteForbidden:
    "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
  inputInvalid: "关联编辑确认信息不正确，请刷新页面后重试。",
  refundAccountMismatch:
    "退款关联要求收入与目标支出使用同一账户，请先解除关联后再修改账户。",
  reimbursementCurrencyMismatch:
    "报销收入与目标支出的账户币种必须一致，请选择相同币种的账户。",
  specialStatusLocked:
    "待报销及已结算状态不能直接修改；如需改变业务关系，请先解除关联。",
  unlinkRequired:
    "该修改会破坏现有退款 / 报销关联，请先解除关联后再修改。",
  unsupportedSiblingEdit:
    "包含关联明细的交易暂不能同时增删或修改其他未关联明细，请先解除关联后再调整。",
  versionInvalid: "关联明细版本信息缺失或已过期，请刷新页面后重试。",
} as const;

export function getTransactionValidationErrorMessage(error?: string) {
  return error && error in transactionValidationErrorMessages
    ? transactionValidationErrorMessages[error as TransactionValidationErrorCode]
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
