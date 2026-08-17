export const ledgerSettingsErrorCodes = {
  authRequired: "auth_required",
  currencyInvalid: "currency_invalid",
  displayColorInvalid: "display_color_invalid",
  displayNameRequired: "display_name_required",
  displayNameTooLong: "display_name_too_long",
  ledgerInvalid: "ledger_invalid",
  memberInvalid: "member_invalid",
  nameRequired: "name_required",
  nameTooLong: "name_too_long",
  permissionDenied: "permission_denied",
  roleInvalid: "role_invalid",
  specialStatusHasActiveItems: "special_status_has_active_items",
  updateFailed: "update_failed",
} as const;

export type LedgerSettingsErrorCode =
  (typeof ledgerSettingsErrorCodes)[keyof typeof ledgerSettingsErrorCodes];

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
  [ledgerSettingsErrorCodes.specialStatusHasActiveItems]:
    "账本内仍有退款/报销关联或处于报销流程的明细，请先处理完成后再关闭该功能。",
  [ledgerSettingsErrorCodes.updateFailed]:
    "账本设置保存失败。请确认内容后稍后重试。",
};

export function getLedgerSettingsErrorMessage(error?: string) {
  return error
    ? (ledgerSettingsErrorMessages[error as LedgerSettingsErrorCode] ?? null)
    : null;
}
