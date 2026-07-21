import {
  accountErrorCodes,
  type AccountErrorCode,
} from "server/account/errors";
import {
  categoryErrorCodes,
  type CategoryErrorCode,
} from "server/category/categoryErrors";
import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "server/errors/currentLedger";
import {
  ledgerSettingsErrorCodes,
  type LedgerSettingsErrorCode,
} from "server/errors/ledgerSettings";
import {
  merchantErrorCodes,
  type MerchantPageErrorCode,
} from "server/merchant/errors";
import {
  transactionErrorCodes,
  type EditTransactionErrorCode,
  type NewTransactionErrorCode,
  type TransactionListErrorCode,
} from "server/errors/transactions";
import {
  editTransactionPageErrorMessages,
  newTransactionPageErrorMessages,
  transactionListPageErrorMessages,
} from "utils/transactionMessages";

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

const categoryErrorMessages: Record<CategoryErrorCode, string> = {
  [categoryErrorCodes.archiveFailed]: "分类隐藏失败。",
  [categoryErrorCodes.categoryInvalid]: "分类指定不正确。",
  [categoryErrorCodes.createFailed]:
    "分类新增失败。请确认分类名称是否重复，或稍后重试。",
  [categoryErrorCodes.iconInvalid]: "请选择图标库中的分类图标。",
  [categoryErrorCodes.nameRequired]: "请输入分类名称。",
  [categoryErrorCodes.nameTooLong]: "分类名称不能超过 100 个字符。",
  [categoryErrorCodes.orderInvalid]: "分类排序内容不正确。",
  [categoryErrorCodes.parentInvalid]: "大分类指定不正确。",
  [categoryErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护分类。",
  [categoryErrorCodes.reorderFailed]: "分类排序保存失败，请稍后重试。",
  [categoryErrorCodes.typeInvalid]: "分类类型不正确。",
  [categoryErrorCodes.updateFailed]:
    "分类更新失败。请确认分类名称是否重复，或稍后重试。",
};

const currentLedgerErrorMessages: Record<CurrentLedgerErrorCode, string> = {
  [currentLedgerErrorCodes.ledgerInvalid]:
    "无法切换到该账本。请确认你仍是该账本成员。",
  [currentLedgerErrorCodes.updateFailed]: "账本切换失败，请稍后重试。",
};

const ledgerSettingsErrorMessages: Record<LedgerSettingsErrorCode, string> = {
  [ledgerSettingsErrorCodes.authRequired]: "登录状态已失效，请重新登录。",
  [ledgerSettingsErrorCodes.currencyInvalid]:
    "默认货币必须是 3 位大写字母，例如 JPY。",
  [ledgerSettingsErrorCodes.displayColorInvalid]: "个性色指定不正确。",
  [ledgerSettingsErrorCodes.displayNameRequired]: "请输入当前账本昵称。",
  [ledgerSettingsErrorCodes.displayNameTooLong]:
    "当前账本昵称不能超过 100 个字符。",
  [ledgerSettingsErrorCodes.ledgerInvalid]: "账本指定不正确。",
  [ledgerSettingsErrorCodes.memberInvalid]: "成员指定不正确。",
  [ledgerSettingsErrorCodes.nameRequired]: "请输入账本名称。",
  [ledgerSettingsErrorCodes.nameTooLong]: "账本名称不能超过 100 个字符。",
  [ledgerSettingsErrorCodes.permissionDenied]:
    "你没有权限修改该账本或成员设置。",
  [ledgerSettingsErrorCodes.roleInvalid]: "成员权限指定不正确。",
  [ledgerSettingsErrorCodes.updateFailed]:
    "账本设置保存失败。请确认内容后稍后重试。",
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

const newTransactionErrorMessages: Partial<
  Record<NewTransactionErrorCode, string>
> = {
  [transactionErrorCodes.accountInvalid]:
    newTransactionPageErrorMessages.accountInvalid,
  [transactionErrorCodes.amountInvalid]:
    newTransactionPageErrorMessages.amountInvalid,
  [transactionErrorCodes.categoryInvalid]:
    newTransactionPageErrorMessages.categoryInvalid,
  [transactionErrorCodes.createFailed]:
    newTransactionPageErrorMessages.createFailed,
  [transactionErrorCodes.dateInvalid]:
    newTransactionPageErrorMessages.dateInvalid,
  [transactionErrorCodes.merchantInvalid]:
    newTransactionPageErrorMessages.merchantInvalid,
  [transactionErrorCodes.noteTooLong]:
    newTransactionPageErrorMessages.noteTooLong,
  [transactionErrorCodes.permissionDenied]:
    newTransactionPageErrorMessages.permissionDenied,
  [transactionErrorCodes.tagInvalid]:
    newTransactionPageErrorMessages.tagInvalid,
  [transactionErrorCodes.typeInvalid]:
    newTransactionPageErrorMessages.typeInvalid,
};

const editTransactionErrorMessages: Partial<
  Record<EditTransactionErrorCode, string>
> = {
  [transactionErrorCodes.accountInvalid]:
    editTransactionPageErrorMessages.accountInvalid,
  [transactionErrorCodes.amountInvalid]:
    editTransactionPageErrorMessages.amountInvalid,
  [transactionErrorCodes.categoryInvalid]:
    editTransactionPageErrorMessages.categoryInvalid,
  [transactionErrorCodes.dateInvalid]:
    editTransactionPageErrorMessages.dateInvalid,
  [transactionErrorCodes.merchantInvalid]:
    editTransactionPageErrorMessages.merchantInvalid,
  [transactionErrorCodes.noteTooLong]:
    editTransactionPageErrorMessages.noteTooLong,
  [transactionErrorCodes.permissionDenied]:
    editTransactionPageErrorMessages.permissionDenied,
  [transactionErrorCodes.tagInvalid]:
    editTransactionPageErrorMessages.tagInvalid,
  [transactionErrorCodes.typeInvalid]:
    editTransactionPageErrorMessages.typeInvalid,
  [transactionErrorCodes.updateFailed]:
    editTransactionPageErrorMessages.updateFailed,
  [transactionErrorCodes.updateInvalid]:
    editTransactionPageErrorMessages.updateInvalid,
};

const transactionErrorMessages: Record<TransactionListErrorCode, string> = {
  [transactionErrorCodes.permissionDenied]:
    transactionListPageErrorMessages.permissionDenied,
  [transactionErrorCodes.voidFailed]:
    transactionListPageErrorMessages.voidFailed,
  [transactionErrorCodes.voidInvalid]:
    transactionListPageErrorMessages.voidInvalid,
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

export function getCategoryErrorMessage(error?: string) {
  return getPageErrorMessage(categoryErrorMessages, error);
}

export function getCurrentLedgerErrorMessage(error?: string) {
  return getPageErrorMessage(currentLedgerErrorMessages, error);
}

export function getLedgerSettingsErrorMessage(error?: string) {
  return getPageErrorMessage(ledgerSettingsErrorMessages, error);
}

export function getMerchantErrorMessage(error?: string) {
  return getPageErrorMessage(merchantErrorMessages, error);
}

export function getNewTransactionErrorMessage(error?: string) {
  return getPageErrorMessage(newTransactionErrorMessages, error);
}

export function getEditTransactionErrorMessage(error?: string) {
  return getPageErrorMessage(editTransactionErrorMessages, error);
}

export function getTransactionErrorMessage(error?: string) {
  return getPageErrorMessage(transactionErrorMessages, error);
}
