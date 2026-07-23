export const currentLedgerErrorCodes = {
  ledgerInvalid: "ledger_invalid",
  updateFailed: "update_failed",
} as const;

export type CurrentLedgerErrorCode =
  (typeof currentLedgerErrorCodes)[keyof typeof currentLedgerErrorCodes];

export type CurrentLedgerValidationErrorCode =
  typeof currentLedgerErrorCodes.ledgerInvalid;
