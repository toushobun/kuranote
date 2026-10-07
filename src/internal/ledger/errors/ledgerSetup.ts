export const ledgerSetupErrorCodes = {
  draftInvalid: "setup_draft_invalid",
  draftTooLarge: "setup_draft_too_large",
  inProgressExists: "setup_in_progress_exists",
  notFound: "setup_not_found",
  notInProgress: "setup_not_in_progress",
  stepInvalid: "setup_step_invalid",
} as const;

export type LedgerSetupErrorCode =
  (typeof ledgerSetupErrorCodes)[keyof typeof ledgerSetupErrorCodes];

export const ledgerSetupErrorMessages: Record<LedgerSetupErrorCode, string> = {
  [ledgerSetupErrorCodes.draftInvalid]: "创建进度格式不正确，请重新操作。",
  [ledgerSetupErrorCodes.draftTooLarge]: "创建进度内容过多，请减少选择后重试。",
  [ledgerSetupErrorCodes.inProgressExists]:
    "你有一个账本还没创建完，请先继续创建。",
  [ledgerSetupErrorCodes.notFound]: "创建中的账本不存在或无法访问。",
  [ledgerSetupErrorCodes.notInProgress]: "该账本已完成创建。",
  [ledgerSetupErrorCodes.stepInvalid]: "创建步骤不正确，请重新操作。",
};

/** 创建中账本读取查询失败时的文案。 */
export const ledgerSetupLoadErrorMessages = {
  loadFailed: "创建中的账本加载失败，请稍后重试。",
} as const;

/** 创建中账本写入查询失败时的文案。 */
export const ledgerSetupWriteErrorMessages = {
  basicInfoUpdateFailed: "账本基本信息保存失败，请稍后重试。",
  createFailed: "账本创建失败，请稍后重试。",
  draftSaveFailed: "创建进度保存失败，请稍后重试。",
} as const;
