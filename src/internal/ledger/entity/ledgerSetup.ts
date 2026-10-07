/** 账本创建状态。取值与 ledger.setup_status 的 check 约束一致。 */
export const ledgerSetupStatuses = {
  completed: "completed",
  inProgress: "in_progress",
} as const;

/** 创建中账本可记录的向导步骤范围。与 ledger_setup_state_check 一致。 */
export const ledgerSetupStepRange = { max: 5, min: 1 } as const;

/** 草稿大小上限（字节）。与 public.ledger_setup_draft_max_bytes() 一致。 */
export const ledgerSetupDraftMaxBytes = 65536;

/** 向导草稿。本阶段只约定为 JSON object，内容结构由后续步骤定义。 */
export type LedgerSetupDraft = Record<string, unknown>;

/** 当前用户的创建中账本。 */
export type LedgerSetup = {
  baseCurrency: string;
  draft: LedgerSetupDraft;
  id: string;
  name: string;
  step: number;
};
