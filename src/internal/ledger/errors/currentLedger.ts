export const currentLedgerErrorCodes = {
  ledgerInvalid: "ledger_invalid",
  updateFailed: "update_failed",
} as const;

export type CurrentLedgerErrorCode =
  (typeof currentLedgerErrorCodes)[keyof typeof currentLedgerErrorCodes];

export type CurrentLedgerValidationErrorCode =
  typeof currentLedgerErrorCodes.ledgerInvalid;

export const currentLedgerAccessErrorMessage = "账本不存在或当前用户无权访问。";

export const currentLedgerActionErrorMessages = {
  operationFailed: "账本操作失败，请稍后重试。",
  validationFailed: "无法切换到该账本，请刷新页面后重试。",
} as const;

export const currentLedgerErrorMessages: Record<CurrentLedgerErrorCode, string> = {
  [currentLedgerErrorCodes.ledgerInvalid]:
    "无法切换到该账本。请确认你仍是该账本成员。",
  [currentLedgerErrorCodes.updateFailed]: "账本切换失败，请稍后重试。",
};

export const currentLedgerRepositoryErrorMessages = {
  memberLoadFailed: "账本成员信息读取失败，请稍后重试。",
  updateFailed: "当前账本切换失败，请稍后重试。",
} as const;

export function getCurrentLedgerErrorMessage(error?: string) {
  return error
    ? (currentLedgerErrorMessages[error as CurrentLedgerErrorCode] ?? null)
    : null;
}
