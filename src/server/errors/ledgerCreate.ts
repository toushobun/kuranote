export const ledgerCreateErrorCodes = {
  createFailed: "create_failed",
  currencyInvalid: "currency_invalid",
  displayColorInvalid: "display_color_invalid",
  displayNameRequired: "display_name_required",
  displayNameTooLong: "display_name_too_long",
  nameRequired: "name_required",
  nameTooLong: "name_too_long",
} as const;

export type LedgerCreateErrorCode =
  (typeof ledgerCreateErrorCodes)[keyof typeof ledgerCreateErrorCodes];

const ledgerCreateErrorMessages: Record<LedgerCreateErrorCode, string> = {
  [ledgerCreateErrorCodes.createFailed]: "账本创建失败。请确认内容后稍后重试。",
  [ledgerCreateErrorCodes.currencyInvalid]: "默认货币指定不正确。",
  [ledgerCreateErrorCodes.displayColorInvalid]: "个性色指定不正确。",
  [ledgerCreateErrorCodes.displayNameRequired]: "请输入我的显示名。",
  [ledgerCreateErrorCodes.displayNameTooLong]:
    "我的显示名不能超过 100 个字符。",
  [ledgerCreateErrorCodes.nameRequired]: "请输入账本名称。",
  [ledgerCreateErrorCodes.nameTooLong]: "账本名称不能超过 100 个字符。",
};

export function getLedgerCreateErrorMessage(error?: string) {
  return error
    ? (ledgerCreateErrorMessages[error as LedgerCreateErrorCode] ?? null)
    : null;
}
