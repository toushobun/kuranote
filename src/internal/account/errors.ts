export const accountErrorCodes = {
  accountInvalid: "account_invalid",
  accountNotFound: "account_not_found",
  archiveFailed: "archive_failed",
  createFailed: "create_failed",
  currencyInvalid: "currency_invalid",
  holderInvalid: "holder_invalid",
  initialBalanceInvalid: "initial_balance_invalid",
  ledgerInvalid: "ledger_invalid",
  nameRequired: "name_required",
  permissionDenied: "permission_denied",
  typeInvalid: "type_invalid",
  updateFailed: "update_failed",
} as const;

export type AccountErrorCode =
  (typeof accountErrorCodes)[keyof typeof accountErrorCodes];

const accountErrorMessages: Record<AccountErrorCode, string> = {
  [accountErrorCodes.accountInvalid]: "账户指定不正确。",
  [accountErrorCodes.accountNotFound]: "账户不存在或已删除。",
  [accountErrorCodes.archiveFailed]: "账户删除失败，请稍后重试。",
  [accountErrorCodes.createFailed]:
    "账户新增失败。请确认账户名称是否重复，或稍后重试。",
  [accountErrorCodes.currencyInvalid]: "货币必须是 3 位大写字母，例如 JPY。",
  [accountErrorCodes.holderInvalid]: "账户持有人必须是当前账本的有效成员。",
  [accountErrorCodes.initialBalanceInvalid]:
    "初始余额必须是最多两位小数的数字。",
  [accountErrorCodes.ledgerInvalid]: "账本不存在、已停用或您无法访问。",
  [accountErrorCodes.nameRequired]: "请输入账户名称。",
  [accountErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护账户。",
  [accountErrorCodes.typeInvalid]: "账户类型不正确。",
  [accountErrorCodes.updateFailed]:
    "账户更新失败。请确认账户名称是否重复，或稍后重试。",
};

export function getAccountErrorMessage(code?: string) {
  return code && code in accountErrorMessages
    ? accountErrorMessages[code as AccountErrorCode]
    : null;
}
