import { z } from "zod";

import {
  ledgerSetupDraftMaxBytes,
  ledgerSetupStepRange,
  type LedgerSetupDraft,
} from "internal/ledger/entity/ledgerSetup";
import {
  ledgerSetupErrorCodes,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import {
  invalid,
  valid,
  type ValidationResult,
} from "internal/shared/schema/formValidation";

const ledgerSetupStepSchema = z
  .number()
  .int()
  .min(ledgerSetupStepRange.min)
  .max(ledgerSetupStepRange.max);

/** 草稿结构只约定为 JSON object；内容的业务校验由后续步骤定义。 */
export const ledgerSetupDraftSchema = z.record(z.string(), z.unknown());

export type LedgerSetupDraftValues = {
  draft: LedgerSetupDraft;
  step: number;
};

/**
 * 保存草稿前的边界校验。大小按 JSON 文本的 UTF-8 字节数粗略判断，
 * 数据库按 jsonb 文本表示做最终判断（两者格式不同，数据库为准）。
 */
export function validateLedgerSetupDraftInput(input: {
  draft: unknown;
  step: unknown;
}): ValidationResult<LedgerSetupDraftValues, LedgerSetupErrorCode> {
  const stepResult = ledgerSetupStepSchema.safeParse(input.step);

  if (!stepResult.success) {
    return invalid(ledgerSetupErrorCodes.stepInvalid);
  }

  const draftResult = ledgerSetupDraftSchema.safeParse(input.draft);

  if (!draftResult.success) {
    return invalid(ledgerSetupErrorCodes.draftInvalid);
  }

  const draftBytes = new TextEncoder().encode(
    JSON.stringify(draftResult.data),
  ).length;

  if (draftBytes > ledgerSetupDraftMaxBytes) {
    return invalid(ledgerSetupErrorCodes.draftTooLarge);
  }

  return valid({ draft: draftResult.data, step: stepResult.data });
}
