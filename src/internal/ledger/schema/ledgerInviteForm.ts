import { getFormText } from "utils/formData";

import { ledgerPlaceholderMemberNameMaxLength } from "internal/ledger/entity/ledgerPlaceholderMember";
import {
  isLedgerInviteRole,
  type LedgerInviteRole,
} from "internal/ledger/entity/ledgerInviteRole";
import { ledgerInviteErrorCodes } from "internal/ledger/errors/ledgerInvite";
import { ledgerPlaceholderMemberErrorCodes } from "internal/ledger/errors/ledgerPlaceholderMember";
import {
  invalid,
  parseTextField,
  parseUuid,
  valid,
  type ValidationResult,
} from "internal/shared/schema/formValidation";

type RoleResult = ValidationResult<
  LedgerInviteRole,
  typeof ledgerInviteErrorCodes.inviteRoleInvalid
>;

export type InviteMemberFormValues = {
  displayName: string;
  role: LedgerInviteRole;
};

export type RegenerateLedgerInviteFormValues = {
  placeholderId: string;
  role: LedgerInviteRole;
};

/** 角色缺省为 member，与 RPC 默认值一致。 */
function parseRole(formData: FormData): RoleResult {
  const role = getFormText(formData, "role") || "member";
  return isLedgerInviteRole(role)
    ? valid(role)
    : invalid(ledgerInviteErrorCodes.inviteRoleInvalid);
}

/**
 * 解析「邀请成员」表单：名字必填，沿用待邀请成员的 trim 与 100 字上限规则。
 * 名字相关错误码与文案来自 `errors/ledgerPlaceholderMember.ts`。
 */
export function parseInviteMemberForm(
  formData: FormData,
): ValidationResult<
  InviteMemberFormValues,
  | typeof ledgerInviteErrorCodes.inviteRoleInvalid
  | typeof ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid
  | typeof ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong
> {
  const displayName = parseTextField(formData, "displayName", {
    maxLength: ledgerPlaceholderMemberNameMaxLength,
    maxLengthError: ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong,
    requiredError: ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid,
  });
  if (!displayName.ok) return displayName;
  const role = parseRole(formData);
  if (!role.ok) return role;

  return valid({ displayName: displayName.value, role: role.value });
}

/**
 * 解析「为已有待邀请成员重新生成链接」表单：placeholderId 必填，
 * 留空返回 placeholder_required，非法 UUID 按占位不存在处理，不把原始输入传给 Service。
 */
export function parseRegenerateLedgerInviteForm(
  formData: FormData,
): ValidationResult<
  RegenerateLedgerInviteFormValues,
  | typeof ledgerInviteErrorCodes.inviteRoleInvalid
  | typeof ledgerInviteErrorCodes.placeholderNotFound
  | typeof ledgerInviteErrorCodes.placeholderRequired
> {
  const role = parseRole(formData);
  if (!role.ok) return role;
  const placeholderIdText = getFormText(formData, "placeholderId");
  if (!placeholderIdText) {
    return invalid(ledgerInviteErrorCodes.placeholderRequired);
  }
  const placeholderId = parseUuid(
    placeholderIdText,
    ledgerInviteErrorCodes.placeholderNotFound,
  );
  if (!placeholderId.ok) return placeholderId;

  return valid({ placeholderId: placeholderId.value, role: role.value });
}
