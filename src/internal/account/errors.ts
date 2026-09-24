export const accountErrorCodes = {
  balanceInvalid: "account_balance_invalid",
  adjustmentNoteInvalid: "account_adjustment_note_invalid",
  accountInvalid: "account_invalid",
  accountNotFound: "account_not_found",
  archiveFailed: "archive_failed",
  createFailed: "create_failed",
  currencyInvalid: "currency_invalid",
  holderChanged: "account_holder_changed",
  holderIdentityInvalid: "account_holder_identity_invalid",
  holderInvalid: "holder_invalid",
  holderTooMany: "holder_too_many",
  initialBalanceInvalid: "initial_balance_invalid",
  ledgerInvalid: "ledger_invalid",
  nameDuplicate: "account_name_duplicate",
  nameRequired: "name_required",
  permissionDenied: "permission_denied",
  placeholderAlreadyClaimed: "placeholder_already_claimed",
  placeholderNotFound: "placeholder_not_found",
  placeholderUnavailable: "placeholder_unavailable",
  typeInvalid: "type_invalid",
  updateFailed: "update_failed",
} as const;

export type AccountErrorCode =
  (typeof accountErrorCodes)[keyof typeof accountErrorCodes];

const accountErrorMessages: Record<AccountErrorCode, string> = {
  [accountErrorCodes.balanceInvalid]:
    "当前余额必须是绝对值小于一万亿、最多两位小数的数字。",
  [accountErrorCodes.adjustmentNoteInvalid]:
    "余额调整备注不能超过 2000 个字符。",
  [accountErrorCodes.accountInvalid]: "账户指定不正确。",
  [accountErrorCodes.accountNotFound]: "账户不存在或已删除。",
  [accountErrorCodes.archiveFailed]: "账户删除失败，请稍后重试。",
  [accountErrorCodes.createFailed]: "账户新增失败，请稍后重试。",
  [accountErrorCodes.currencyInvalid]: "货币必须是 3 位大写字母，例如 JPY。",
  [accountErrorCodes.holderChanged]:
    "账户持有人已被其他人修改，请刷新页面后重新选择持有人。",
  [accountErrorCodes.holderIdentityInvalid]:
    "持有人只能选择一位成员或一位待邀请成员。",
  [accountErrorCodes.holderInvalid]: "账户持有人必须是当前账本的有效成员。",
  [accountErrorCodes.holderTooMany]: "账户持有人最多只能选择 1 个。",
  [accountErrorCodes.initialBalanceInvalid]:
    "初始余额必须是最多两位小数的数字。",
  [accountErrorCodes.ledgerInvalid]: "账本不存在、已停用或您无法访问。",
  [accountErrorCodes.nameDuplicate]:
    "同一账本中，相同账户类型、货币和持有人下已存在同名账户（不区分大小写），请修改账户名称。",
  [accountErrorCodes.nameRequired]: "请输入账户名称。",
  [accountErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护账户。",
  [accountErrorCodes.placeholderAlreadyClaimed]:
    "所选待邀请成员已被认领，请重新选择持有人。",
  [accountErrorCodes.placeholderNotFound]:
    "所选待邀请成员已被删除，请重新选择持有人。",
  [accountErrorCodes.placeholderUnavailable]:
    "所选待邀请成员已被认领或删除，请重新选择持有人。",
  [accountErrorCodes.typeInvalid]: "账户类型不正确。",
  [accountErrorCodes.updateFailed]: "账户更新失败，请稍后重试。",
};

export function getAccountErrorMessage(code?: string) {
  return code && code in accountErrorMessages
    ? accountErrorMessages[code as AccountErrorCode]
    : null;
}
