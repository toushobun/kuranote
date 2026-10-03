import { sharedErrorMessages } from "internal/shared";
export const transactionErrorCodes = {
  balanceAdjustmentAccountArchived: "balance_adjustment_account_archived",
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

export const transactionValidationErrorMessages: Record<
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

/** 编辑 / 删除对象本身不正确时的文案。 */
export const transactionTargetErrorMessages = {
  updateInvalid: "编辑对象不正确。",
  voidInvalid: "删除对象不正确。",
} as const;

/** 交易模块各层共用的登录、权限、对象存在性与未知失败兜底文案。 */
export const transactionAccessErrorMessages = {
  authRequired: sharedErrorMessages.authRequired,
  itemNotFound: "交易明细不存在或已删除。",
  operationFailed: "交易操作失败，请稍后重试。",
  permissionDenied: "没有权限执行此交易操作。",
  recordNotFound: "交易记录不存在或已删除。",
} as const;

/** 交易写入 RPC 返回业务错误时转换出的文案。 */
export const transactionWriteErrorMessages = {
  accountInvalid: "账户信息不正确，请确认后重试。",
  amountInvalid: "金额格式不正确，请确认后重试。",
  categoryInvalid: "分类信息不正确，请确认后重试。",
  dateInvalid: "交易时间不正确，请确认后重试。",
  incomeLinkCategoryInvalid: "只有收入明细才能关联报销或退款。",
  incomeLinkConflict: "同一个收入明细不能同时作为退款来源和报销来源。",
  incomeLinksCreateOnly: "报销关联只能在新建收入交易时设置。",
  inputInvalid: "交易内容不正确，请确认后重试。",
  itemsInvalid: "交易明细不正确，请确认后重试。",
  linkedEditForbidden: "已有关联报销或退款的交易暂不能修改或作废。",
  merchantInvalid: "商家信息不正确，请确认后重试。",
  refundAccountMismatch: "退款收入与支出明细必须使用同一账户。",
  refundAllocationInvalid: "退款金额不正确，请重新选择退款明细。",
  refundCurrencyMismatch: "退款收入与支出明细的账户币种必须一致。",
  refundedItemInvalid: "退款关联的支出明细无效，请重新选择。",
  refundLinkConstraintInvalid: "退款关联的金额或明细不正确，请确认后重试。",
  refundLinkDuplicate: "同一退款收入最多只能关联一条支出明细，请刷新后重试。",
  reimbursementCurrencyMismatch: "报销收入与待报销明细的账户币种必须一致。",
  reimbursementItemUnavailable:
    "待报销明细已被处理或不属于当前账本，请刷新后重试。",
  reimbursementLinkExists: "该支出仍有关联的报销收入，请先解除关联。",
  transferCurrencyMismatch: "转账账户币种必须一致。",
  typeInvalid: "交易类型不正确，请确认后重试。",
  typeNotChanged: "交易类型没有发生变化，请刷新页面后重试。",
} as const;

/** 新增 / 编辑交易时特殊状态与收入关联的业务校验文案。 */
export const transactionSpecialStatusErrorMessages = {
  derivedStatusForbidden: "结算派生状态只能由有效退款或报销核销自动判定。",
  disabled: "当前账本未启用特殊状态功能。",
  incomeLinkConflict: "同一条收入明细不能同时作为报销和退款。",
  incomeLinkIncomeOnly: "报销或退款关联只能设置在收入明细上。",
  pendingReimbursementExpenseOnly: "待报销只能用于支出明细。",
  refundAmountInvalid: "退款收入金额必须大于 0。",
} as const;

/** 交易读取查询失败时的文案。 */
export const transactionLoadErrorMessages = {
  dashboardRecentAccountsLoadFailed: "最近使用账户加载失败，请稍后重试。",
  dashboardSummaryLoadFailed: "本月收支汇总加载失败，请稍后重试。",
  frequentCategoriesLoadFailed: "常用分类加载失败，请稍后重试。",
  groupSummariesLoadFailed: "交易分组加载失败，请稍后重试。",
  incomeLinksLoadFailed: "收入关联信息加载失败，请稍后重试。",
  itemsLoadFailed: "交易明细加载失败，请稍后重试。",
  linkedItemLoadFailed: "交易明细读取失败，请稍后重试。",
  membersLoadFailed: "账本成员加载失败，请稍后重试。",
  recordersLoadFailed: "交易记录人信息加载失败，请稍后重试。",
  recordLoadFailed: "交易记录读取失败，请稍后重试。",
  recordsLoadFailed: "交易记录加载失败，请稍后重试。",
  specialStatusSettingLoadFailed: "账本特殊状态设置读取失败，请稍后重试。",
} as const;

export const transactionLinkedEditErrorMessages = {
  confirmationRequired:
    "该交易包含退款 / 报销关联，请确认同步修改关联数据后再保存。",
  deleteForbidden: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
  inputInvalid: "关联编辑确认信息不正确，请刷新页面后重试。",
  itemNotEditable: "该明细当前不属于可受控编辑的退款 / 报销关联。",
  itemsInvalid: "交易明细不正确，请刷新页面后重试。",
  itemVersionConflict: "交易明细已被其他操作更新，请刷新后重试。",
  linkBroken: "分类或收支类型会破坏现有退款 / 报销关联。",
  refundAccountMismatch:
    "退款关联要求收入与目标支出使用同一账户，请先解除关联后再修改账户。",
  refundAccountOrCurrencyMismatch:
    "退款关联要求收入与目标支出使用同一账户和币种。",
  reimbursementCurrencyMismatch:
    "报销收入与目标支出的账户币种必须一致，请选择相同币种的账户。",
  reimbursementTargetCurrencyMismatch: "报销收入与目标支出的账户币种必须一致。",
  specialStatusLocked:
    "待报销及已结算状态不能直接修改；如需改变业务关系，请先解除关联。",
  unlinkRequired: "该修改会破坏现有退款 / 报销关联，请先解除关联后再修改。",
  unsupportedSiblingEdit:
    "包含关联明细的交易暂不能同时增删或修改其他未关联明细，请先解除关联后再调整。",
  versionInvalid: "关联明细版本信息缺失或已过期，请刷新页面后重试。",
} as const;

/** 交易 Server Action 的表单校验兜底与未知异常兜底文案。 */
export const transactionActionErrorMessages = {
  convertFailed: "交易类型转换失败，请稍后重试。",
  convertInputInvalid: "交易类型转换内容不正确，请确认后重试。",
  createFailed: "交易新增失败，请稍后重试。",
  inputInvalid: transactionWriteErrorMessages.inputInvalid,
  transferInputInvalid: "转账内容不正确，请确认后重试。",
  transferUpdateFailed: "转账更新失败，请稍后重试。",
  typeInvalid: "交易类型指定不正确，请刷新页面后重试。",
  updateFailed: "交易更新失败，请稍后重试。",
  voidFailed: "交易删除失败，请稍后重试。",
  voidInputInvalid: "交易指定不正确，请刷新页面后重试。",
} as const;

/**
 * Server Action 失败态中前端需要按错误码分支的稳定业务码（通过 errorCode 字段返回）。
 * 其余错误只返回 error 文案，不对前端暴露错误码。
 */
export const transactionActionErrorCodes = [
  transactionErrorCodes.linkedSyncConfirmationRequired,
  transactionErrorCodes.linkedDeleteForbidden,
] as const;

export type TransactionActionErrorCode =
  (typeof transactionActionErrorCodes)[number];

export function toTransactionActionErrorCode(
  code: string,
): TransactionActionErrorCode | undefined {
  return transactionActionErrorCodes.find((actionCode) => actionCode === code);
}

export const transactionLinkedEditErrorTitles = {
  deleteForbidden: "无法删除已关联明细",
} as const;

export function getTransactionValidationErrorMessage(error?: string) {
  return error && error in transactionValidationErrorMessages
    ? transactionValidationErrorMessages[
        error as TransactionValidationErrorCode
      ]
    : null;
}

export function getUpdateTransactionValidationErrorMessage(error?: string) {
  if (error === transactionErrorCodes.updateInvalid) {
    return transactionTargetErrorMessages.updateInvalid;
  }

  return getTransactionValidationErrorMessage(error);
}

export function getVoidTransactionValidationErrorMessage(error?: string) {
  return error === transactionErrorCodes.voidInvalid
    ? transactionTargetErrorMessages.voidInvalid
    : null;
}

export const balanceAdjustmentErrorMessages = {
  archivedAccount: "该账户已归档，无法撤销余额调整",
  archivedCreate: "该账户已归档，无法导入余额变更。",
  amountInvalid: "余额变更金额必须非零、绝对值小于 1 万亿且最多两位小数。",
  invalid: "余额调整记录不正确，请刷新页面后重试。",
  dateInvalid:
    transactionValidationErrorMessages[transactionErrorCodes.dateInvalid],
  noteTooLong:
    transactionValidationErrorMessages[transactionErrorCodes.noteTooLong],
  updateFailed: "余额调整更新失败，请稍后重试。",
} as const;
