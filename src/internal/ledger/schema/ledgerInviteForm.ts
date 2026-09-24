import { getFormText } from "utils/formData";

import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import {
  parseOptionalUuidText,
  type ValidationResult,
} from "internal/shared/schema/formValidation";

/**
 * 解析生成邀请表单中的可选 placeholderId：留空表示匿名邀请，
 * 非法 UUID 按占位不存在处理，不把原始输入传给 Service。
 */
export function parseLedgerInvitePlaceholderIdForm(
  formData: FormData,
): ValidationResult<
  string | null,
  typeof ledgerInviteErrorCodes.placeholderNotFound
> {
  return parseOptionalUuidText(
    getFormText(formData, "placeholderId"),
    ledgerInviteErrorCodes.placeholderNotFound,
  );
}
