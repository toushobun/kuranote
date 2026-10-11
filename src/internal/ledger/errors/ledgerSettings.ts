import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerPlaceholderMemberErrorCodes,
  ledgerPlaceholderMemberErrorMessages,
} from "internal/ledger/errors/ledgerPlaceholderMember";

export const ledgerSettingsErrorCodes = {
  deleteForbidden: "ledger_delete_forbidden",
  deleteNotCompleted: "ledger_delete_not_completed",
  deleteNameMismatch: "ledger_delete_name_mismatch",
  deleteFailed: "ledger_delete_failed",
  deleteImpactFailed: "ledger_delete_impact_failed",
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

export const ledgerSettingsErrorMessages: Record<
  LedgerSettingsErrorCode,
  string
> = {
  [ledgerSettingsErrorCodes.deleteForbidden]: "只有账本所有者可以删除此账本。",
  [ledgerSettingsErrorCodes.deleteNotCompleted]: "创建中的账本请使用放弃创建。",
  [ledgerSettingsErrorCodes.deleteNameMismatch]:
    "输入的账本名不一致，请重新确认。",
  [ledgerSettingsErrorCodes.deleteFailed]: "账本删除失败，请稍后重试。",
  [ledgerSettingsErrorCodes.deleteImpactFailed]:
    "删除影响读取失败，请稍后重试。",
  [ledgerSettingsErrorCodes.authRequired]:
    ledgerCreateErrorMessages[ledgerCreateErrorCodes.authRequired],
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

/** 账本设置与成员读取查询失败时的文案。 */
export const ledgerSettingsLoadErrorMessages = {
  ledgerLoadFailed: "账本信息读取失败，请稍后重试。",
  memberDisplaySettingsLoadFailed: "账本成员显示设置加载失败，请稍后重试。",
  memberProfilesLoadFailed: "账本成员资料加载失败，请稍后重试。",
  memberRoleInvalid: "账本成员资料格式异常，请稍后重试。",
  memberRoleLoadFailed: "账本成员权限读取失败，请稍后重试。",
  membersLoadFailed: "账本成员加载失败，请稍后重试。",
} as const;

/** 账本设置写入查询失败时的文案。 */
export const ledgerSettingsWriteErrorMessages = {
  baseSettingsUpdateFailed: "账本设置保存失败，请稍后重试。",
  memberSettingsUpdateFailed: "账本成员设置保存失败，请稍后重试。",
} as const;
