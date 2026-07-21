export const accountErrorCodes = {
  accountInvalid: "account_invalid",
  archiveFailed: "archive_failed",
  createFailed: "create_failed",
  currencyInvalid: "currency_invalid",
  holderInvalid: "holder_invalid",
  initialBalanceInvalid: "initial_balance_invalid",
  ledgerInvalid: "ledger_invalid",
  loadFailed: "load_failed",
  nameRequired: "name_required",
  permissionDenied: "permission_denied",
  typeInvalid: "type_invalid",
  updateFailed: "update_failed",
} as const;

export type AccountErrorCode =
  (typeof accountErrorCodes)[keyof typeof accountErrorCodes];

export function isAccountErrorCode(value: string): value is AccountErrorCode {
  return (Object.values(accountErrorCodes) as readonly string[]).includes(
    value,
  );
}
