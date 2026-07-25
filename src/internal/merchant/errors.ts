export const merchantErrorCodes = {
  aliasArchiveFailed: "alias_archive_failed",
  aliasCreateFailed: "alias_create_failed",
  aliasInvalid: "alias_invalid",
  aliasRequired: "alias_required",
  aliasTooLong: "alias_too_long",
  archiveFailed: "archive_failed",
  createFailed: "create_failed",
  ledgerInvalid: "ledger_invalid",
  merchantAliasListFailed: "merchant_alias_list_failed",
  merchantAliasReadFailed: "merchant_alias_read_failed",
  merchantInvalid: "merchant_invalid",
  merchantListFailed: "merchant_list_failed",
  merchantReadFailed: "merchant_read_failed",
  nameRequired: "name_required",
  nameTooLong: "name_too_long",
  noteTooLong: "note_too_long",
  permissionDenied: "permission_denied",
  updateFailed: "update_failed",
  websiteUrlInvalid: "website_url_invalid",
} as const;

export type MerchantErrorCode =
  (typeof merchantErrorCodes)[keyof typeof merchantErrorCodes];

export type MerchantValidationErrorCode =
  | typeof merchantErrorCodes.aliasInvalid
  | typeof merchantErrorCodes.aliasRequired
  | typeof merchantErrorCodes.aliasTooLong
  | typeof merchantErrorCodes.merchantInvalid
  | typeof merchantErrorCodes.nameRequired
  | typeof merchantErrorCodes.nameTooLong
  | typeof merchantErrorCodes.noteTooLong
  | typeof merchantErrorCodes.websiteUrlInvalid;

export type MerchantActionErrorCode =
  | MerchantValidationErrorCode
  | typeof merchantErrorCodes.aliasArchiveFailed
  | typeof merchantErrorCodes.aliasCreateFailed
  | typeof merchantErrorCodes.archiveFailed
  | typeof merchantErrorCodes.createFailed
  | typeof merchantErrorCodes.permissionDenied
  | typeof merchantErrorCodes.updateFailed;

const merchantActionErrorCodeSet = new Set<string>([
  merchantErrorCodes.aliasArchiveFailed,
  merchantErrorCodes.aliasCreateFailed,
  merchantErrorCodes.aliasInvalid,
  merchantErrorCodes.aliasRequired,
  merchantErrorCodes.aliasTooLong,
  merchantErrorCodes.archiveFailed,
  merchantErrorCodes.createFailed,
  merchantErrorCodes.merchantInvalid,
  merchantErrorCodes.nameRequired,
  merchantErrorCodes.nameTooLong,
  merchantErrorCodes.noteTooLong,
  merchantErrorCodes.permissionDenied,
  merchantErrorCodes.updateFailed,
  merchantErrorCodes.websiteUrlInvalid,
]);

const merchantActionErrorMessages: Partial<Record<MerchantErrorCode, string>> =
  {
    [merchantErrorCodes.aliasArchiveFailed]: "商家别名归档失败，请稍后重试。",
    [merchantErrorCodes.aliasCreateFailed]:
      "商家别名新增失败。请确认别名是否重复，或稍后重试。",
    [merchantErrorCodes.aliasInvalid]: "商家别名指定不正确。",
    [merchantErrorCodes.aliasRequired]: "请输入商家别名。",
    [merchantErrorCodes.aliasTooLong]: "商家别名不能超过 100 个字符。",
    [merchantErrorCodes.archiveFailed]: "商家归档失败，请稍后重试。",
    [merchantErrorCodes.createFailed]:
      "商家新增失败。请确认商家名称是否重复，或稍后重试。",
    [merchantErrorCodes.merchantInvalid]: "商家指定不正确。",
    [merchantErrorCodes.nameRequired]: "请输入商家名称。",
    [merchantErrorCodes.nameTooLong]: "商家名称不能超过 100 个字符。",
    [merchantErrorCodes.noteTooLong]: "备注不能超过 1000 个字符。",
    [merchantErrorCodes.permissionDenied]:
      "只有账本所有者或管理员可以维护商家。",
    [merchantErrorCodes.updateFailed]:
      "商家更新失败。请确认商家名称是否重复，或稍后重试。",
    [merchantErrorCodes.websiteUrlInvalid]:
      "商家网址必须以 http:// 或 https:// 开头。",
  };

export function isMerchantActionErrorCode(
  value: string,
): value is MerchantActionErrorCode {
  return merchantActionErrorCodeSet.has(value);
}

export function getMerchantActionErrorMessage(error: MerchantErrorCode) {
  return merchantActionErrorMessages[error] ?? null;
}
