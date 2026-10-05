export const currentLedgerErrorCodes = {
  ledgerInvalid: "ledger_invalid",
  updateFailed: "update_failed",
} as const;

export type CurrentLedgerErrorCode =
  (typeof currentLedgerErrorCodes)[keyof typeof currentLedgerErrorCodes];

export type CurrentLedgerValidationErrorCode =
  typeof currentLedgerErrorCodes.ledgerInvalid;

export const currentLedgerAccessErrorMessage = "账本不存在或当前用户无权访问。";

export const currentLedgerErrorMessages: Record<
  CurrentLedgerErrorCode,
  string
> = {
  [currentLedgerErrorCodes.ledgerInvalid]:
    "无法切换到该账本。请确认你仍是该账本成员。",
  [currentLedgerErrorCodes.updateFailed]: "账本切换失败，请稍后重试。",
};

/** 当前账本与账本列表读取查询失败时的文案。 */
export const currentLedgerLoadErrorMessages = {
  ledgerLoadFailed: "账本信息读取失败，请稍后重试。",
  memberCountLoadFailed: "账本成员数量加载失败，请稍后重试。",
  memberLoadFailed: "账本成员信息读取失败，请稍后重试。",
} as const;

/** 当前账本切换写入查询失败时的文案。 */
export const currentLedgerWriteErrorMessages = {
  updateFailed: "当前账本切换失败，请稍后重试。",
} as const;
