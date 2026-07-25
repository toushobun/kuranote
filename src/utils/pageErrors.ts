import { accountErrorCodes, type AccountErrorCode } from "internal/account";

const accountErrorMessages: Record<AccountErrorCode, string> = {
  [accountErrorCodes.accountInvalid]: "账户指定不正确。",
  [accountErrorCodes.archiveFailed]: "账户归档失败。",
  [accountErrorCodes.createFailed]:
    "账户新增失败。请确认账户名称是否重复，或稍后重试。",
  [accountErrorCodes.currencyInvalid]: "货币必须是 3 位大写字母，例如 JPY。",
  [accountErrorCodes.holderInvalid]: "账户持有人指定不正确。",
  [accountErrorCodes.initialBalanceInvalid]: "初始余额必须是数字。",
  [accountErrorCodes.ledgerInvalid]: "账本不存在或您不是该账本成员。",
  [accountErrorCodes.nameRequired]: "请输入账户名称。",
  [accountErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护账户。",
  [accountErrorCodes.typeInvalid]: "账户类型不正确。",
  [accountErrorCodes.updateFailed]:
    "账户更新失败。请确认账户名称是否重复，或稍后重试。",
};

function getPageErrorMessage<TError extends string>(
  messages: Partial<Record<TError, string>>,
  error?: string,
) {
  return error ? (messages[error as TError] ?? null) : null;
}

export function getAccountErrorMessage(error?: string) {
  return getPageErrorMessage(accountErrorMessages, error);
}
