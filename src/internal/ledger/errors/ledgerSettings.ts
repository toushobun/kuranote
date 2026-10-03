import { ledgerAccessErrorMessages } from "internal/ledger/errors/ledgerAccess";
import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerPlaceholderMemberErrorCodes,
  ledgerPlaceholderMemberErrorMessages,
} from "internal/ledger/errors/ledgerPlaceholderMember";

export const ledgerSettingsErrorCodes = {
  authRequired: "auth_required",
  currencyInvalid: "currency_invalid",
  displayColorInvalid: "display_color_invalid",
  displayNamePlaceholderConflict: "display_name_placeholder_conflict",
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

export const ledgerSettingsErrorMessages: Record<LedgerSettingsErrorCode, string> = {
  [ledgerSettingsErrorCodes.authRequired]: ledgerAccessErrorMessages.authRequired,
  [ledgerSettingsErrorCodes.currencyInvalid]:
    "默认货币必须是 3 位大写字母，例如 JPY。",
  [ledgerSettingsErrorCodes.displayColorInvalid]:
    ledgerCreateErrorMessages[ledgerCreateErrorCodes.displayColorInvalid],
  [ledgerSettingsErrorCodes.displayNamePlaceholderConflict]:
    ledgerPlaceholderMemberErrorMessages[
      ledgerPlaceholderMemberErrorCodes.placeholderNameConflict
    ],
  [ledgerSettingsErrorCodes.displayNameRequired]: "请输入当前账本昵称。",
  [ledgerSettingsErrorCodes.displayNameTooLong]:
    "当前账本昵称不能超过 100 个字符。",
  [ledgerSettingsErrorCodes.ledgerInvalid]: "账本指定不正确。",
  [ledgerSettingsErrorCodes.memberInvalid]: "成员指定不正确。",
  [ledgerSettingsErrorCodes.nameRequired]:
    ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameRequired],
  [ledgerSettingsErrorCodes.nameTooLong]:
    ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameTooLong],
  [ledgerSettingsErrorCodes.permissionDenied]:
    "你没有权限修改该账本或成员设置。",
  [ledgerSettingsErrorCodes.roleInvalid]: "成员权限指定不正确。",
  [ledgerSettingsErrorCodes.specialStatusHasActiveItems]:
    "账本内仍有退款/报销关联或处于报销流程的明细，请先处理完成后再关闭该功能。",
  [ledgerSettingsErrorCodes.updateFailed]:
    "账本设置保存失败。请确认内容后稍后重试。",
};

export const ledgerSettingsActionErrorMessages = {
  inputInvalid: "账本设置内容不正确，请确认后重试。",
} as const;

export const ledgerSettingsLoadErrorMessages = {
  memberDataInvalid: "账本成员资料格式异常，请稍后重试。",
  memberDisplaySettingsLoadFailed: "账本成员显示设置加载失败，请稍后重试。",
  memberPermissionsLoadFailed: "账本成员权限读取失败，请稍后重试。",
  memberProfilesLoadFailed: "账本成员资料加载失败，请稍后重试。",
  membersLoadFailed: "账本成员加载失败，请稍后重试。",
} as const;

export const ledgerSettingsSaveErrorMessages = {
  memberSettingsSaveFailed: "账本成员设置保存失败，请稍后重试。",
  settingsSaveFailed: "账本设置保存失败，请稍后重试。",
} as const;

export function getLedgerSettingsErrorMessage(error?: string) {
  return error
    ? (ledgerSettingsErrorMessages[error as LedgerSettingsErrorCode] ?? null)
    : null;
}
