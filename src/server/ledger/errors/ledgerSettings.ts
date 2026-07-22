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
  updateFailed: "update_failed",
} as const;

export type LedgerSettingsErrorCode =
  (typeof ledgerSettingsErrorCodes)[keyof typeof ledgerSettingsErrorCodes];
