export const currentLedgerErrorCodes = {
  ledgerInvalid: "ledger_invalid",
  updateFailed: "update_failed",
} as const;

export type CurrentLedgerErrorCode =
  (typeof currentLedgerErrorCodes)[keyof typeof currentLedgerErrorCodes];

export type CurrentLedgerValidationErrorCode =
  typeof currentLedgerErrorCodes.ledgerInvalid;

export const currentLedgerAccessErrorMessage = "账本不存在或当前用户无权访问。";

const currentLedgerErrorMessages: Record<CurrentLedgerErrorCode, string> = {
  [currentLedgerErrorCodes.ledgerInvalid]:
    "无法切换到该账本。请确认你仍是该账本成员。",
  [currentLedgerErrorCodes.updateFailed]: "账本切换失败，请稍后重试。",
};

export function getCurrentLedgerErrorMessage(error?: string) {
  return error
    ? (currentLedgerErrorMessages[error as CurrentLedgerErrorCode] ?? null)
    : null;
}
