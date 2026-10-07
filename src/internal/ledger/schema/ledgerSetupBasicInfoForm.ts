import type { LedgerCreateErrorCode } from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import {
  validateCreateLedgerForm,
  type CreateLedgerValues,
} from "internal/ledger/schema/ledgerCreateForm";
import {
  invalid,
  valid,
  type ValidationResult,
} from "internal/shared/schema/formValidation";
import { getFormText, isUuid } from "utils/formData";

export type LedgerSetupBasicInfoValues = CreateLedgerValues & {
  /** 已有创建中账本时为该账本 ID（更新基本信息）；尚未创建时为 null（创建账本）。 */
  ledgerId: string | null;
};

/**
 * 向导第 1 步「基本信息」的表单解析。字段与校验沿用账本创建表单，
 * 另外解析可选的创建中账本 ID；owner 与创建中状态由 RPC 在数据库内校验。
 */
export function validateLedgerSetupBasicInfoForm(
  formData: FormData,
): ValidationResult<
  LedgerSetupBasicInfoValues,
  LedgerCreateErrorCode | LedgerSetupErrorCode
> {
  const basicInfo = validateCreateLedgerForm(formData);

  if (!basicInfo.ok) {
    return basicInfo;
  }

  const ledgerId = getFormText(formData, "ledgerId");

  if (ledgerId.length > 0 && !isUuid(ledgerId)) {
    return invalid(ledgerSetupErrorCodes.notFound);
  }

  return valid({ ...basicInfo.value, ledgerId: ledgerId || null });
}
