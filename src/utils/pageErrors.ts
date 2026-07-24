import { accountErrorCodes, type AccountErrorCode } from "internal/account";
import {
  merchantErrorCodes,
  type MerchantPageErrorCode,
} from "internal/merchant";

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

const merchantErrorMessages: Record<MerchantPageErrorCode, string> = {
  [merchantErrorCodes.aliasArchiveFailed]: "商家别名归档失败。",
  [merchantErrorCodes.aliasCreateFailed]:
    "商家别名新增失败。请确认别名是否重复，或稍后重试。",
  [merchantErrorCodes.aliasInvalid]: "商家别名指定不正确。",
  [merchantErrorCodes.aliasRequired]: "请输入商家别名。",
  [merchantErrorCodes.aliasTooLong]: "商家别名不能超过 100 个字符。",
  [merchantErrorCodes.archiveFailed]: "商家归档失败。",
  [merchantErrorCodes.createFailed]:
    "商家新增失败。请确认商家名称是否重复，或稍后重试。",
  [merchantErrorCodes.merchantInvalid]: "商家指定不正确。",
  [merchantErrorCodes.nameRequired]: "请输入商家名称。",
  [merchantErrorCodes.nameTooLong]: "商家名称不能超过 100 个字符。",
  [merchantErrorCodes.noteTooLong]: "备注不能超过 1000 个字符。",
  [merchantErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护商家。",
  [merchantErrorCodes.updateFailed]:
    "商家更新失败。请确认商家名称是否重复，或稍后重试。",
  [merchantErrorCodes.websiteUrlInvalid]:
    "商家网址必须以 http:// 或 https:// 开头。",
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

export function getMerchantErrorMessage(error?: string) {
  return getPageErrorMessage(merchantErrorMessages, error);
}
