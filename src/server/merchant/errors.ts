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

export type MerchantPageErrorCode = Exclude<
  MerchantErrorCode,
  | typeof merchantErrorCodes.ledgerInvalid
  | typeof merchantErrorCodes.merchantAliasListFailed
  | typeof merchantErrorCodes.merchantAliasReadFailed
  | typeof merchantErrorCodes.merchantListFailed
  | typeof merchantErrorCodes.merchantReadFailed
>;

export type MerchantValidationErrorCode =
  | typeof merchantErrorCodes.aliasInvalid
  | typeof merchantErrorCodes.aliasRequired
  | typeof merchantErrorCodes.aliasTooLong
  | typeof merchantErrorCodes.merchantInvalid
  | typeof merchantErrorCodes.nameRequired
  | typeof merchantErrorCodes.nameTooLong
  | typeof merchantErrorCodes.noteTooLong
  | typeof merchantErrorCodes.websiteUrlInvalid;

const merchantPageErrorCodeSet = new Set<string>([
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

export function isMerchantPageErrorCode(
  value: string,
): value is MerchantPageErrorCode {
  return merchantPageErrorCodeSet.has(value);
}
