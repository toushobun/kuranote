export const ledgerSetupErrorCodes = {
  ownerRequired: "setup_owner_required",
  hasMembers: "setup_has_members",
  hasTransactions: "setup_has_transactions",
  accountNameDuplicate: "setup_account_name_duplicate",
  currencyMismatch: "setup_currency_mismatch",
  draftInvalid: "setup_draft_invalid",
  draftTooLarge: "setup_draft_too_large",
  inProgressExists: "setup_in_progress_exists",
  notFound: "setup_not_found",
  notInProgress: "setup_not_in_progress",
  payloadInvalid: "setup_payload_invalid",
  stepInvalid: "setup_step_invalid",
  templateOutdated: "setup_template_outdated",
} as const;

export type LedgerSetupErrorCode =
  (typeof ledgerSetupErrorCodes)[keyof typeof ledgerSetupErrorCodes];

export const ledgerSetupErrorMessages: Record<LedgerSetupErrorCode, string> = {
  [ledgerSetupErrorCodes.ownerRequired]: "只有账本所有者可以放弃创建。",
  [ledgerSetupErrorCodes.hasMembers]:
    "该账本已有其他成员或邀请，无法放弃创建。",
  [ledgerSetupErrorCodes.hasTransactions]: "该账本已有交易数据，无法放弃创建。",
  [ledgerSetupErrorCodes.accountNameDuplicate]:
    "同一类型下已有同名账户，请修改账户名称。",
  [ledgerSetupErrorCodes.currencyMismatch]:
    "账本默认货币已变更，请重新选择账户和商家。",
  [ledgerSetupErrorCodes.draftInvalid]: "创建进度格式不正确，请重新操作。",
  [ledgerSetupErrorCodes.draftTooLarge]: "创建进度内容过多，请减少选择后重试。",
  [ledgerSetupErrorCodes.inProgressExists]:
    "你有一个账本还没创建完，请先继续创建。",
  [ledgerSetupErrorCodes.notFound]: "创建中的账本不存在或无法访问。",
  [ledgerSetupErrorCodes.notInProgress]: "该账本已完成创建。",
  [ledgerSetupErrorCodes.payloadInvalid]: "创建内容不正确，请返回检查后重试。",
  [ledgerSetupErrorCodes.stepInvalid]: "创建步骤不正确，请重新操作。",
  [ledgerSetupErrorCodes.templateOutdated]:
    "预设内容已更新，请重新打开创建向导后再选择。",
};

/** 创建中账本与向导数据读取查询失败时的文案。 */
export const ledgerSetupLoadErrorMessages = {
  defaultCategoriesLoadFailed: "默认分类加载失败，请稍后重试。",
  /** 第 6 步「邀请成员」读取待邀请成员与待接受邀请失败。 */
  inviteMembersLoadFailed: "邀请成员加载失败，请稍后重试。",
  loadFailed: "创建中的账本加载失败，请稍后重试。",
} as const;

/** 创建中账本写入查询失败时的文案。 */
export const ledgerSetupWriteErrorMessages = {
  abandonFailed: "放弃创建失败，请稍后重试。",
  basicInfoUpdateFailed: "账本基本信息保存失败，请稍后重试。",
  completeFailed: "账本创建完成失败，请稍后重试。",
  createFailed: "账本创建失败，请稍后重试。",
  draftSaveFailed: "创建进度保存失败，请稍后重试。",
} as const;
