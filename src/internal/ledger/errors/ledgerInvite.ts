export const ledgerInviteErrorCodes = {
  acceptFailed: "accept_failed",
  authRequired: "auth_required",
  createFailed: "create_failed",
  inviteAlreadyRevoked: "invite_already_revoked",
  inviteInvalid: "invite_invalid",
  inviteRoleInvalid: "invite_role_invalid",
  inviteUsed: "invite_already_used",
  loadFailed: "load_failed",
  permissionDenied: "permission_denied",
  placeholderAlreadyClaimed: "placeholder_already_claimed",
  placeholderClaimAccountNameConflict:
    "placeholder_claim_account_name_conflict",
  placeholderClaimExistingMember: "placeholder_claim_existing_member",
  placeholderInvitePending: "placeholder_invite_pending",
  placeholderNotFound: "placeholder_not_found",
  revokeFailed: "revoke_failed",
} as const;

export type LedgerInviteErrorCode =
  (typeof ledgerInviteErrorCodes)[keyof typeof ledgerInviteErrorCodes];

const messages: Record<LedgerInviteErrorCode, string> = {
  accept_failed: "加入账本失败，请稍后重试。",
  auth_required: "请先登录后再继续。",
  create_failed: "邀请链接生成失败，请稍后重试。",
  invite_already_revoked: "该邀请已经撤销。",
  invite_invalid: "该邀请链接无效或已失效。",
  invite_role_invalid: "请选择有效的邀请权限。",
  invite_already_used: "该邀请链接已经被使用。",
  load_failed: "待接受邀请加载失败，请稍后重试。",
  permission_denied: "只有账本所有者或管理员可以管理邀请。",
  placeholder_already_claimed: "该待邀请成员已被认领。",
  placeholder_claim_account_name_conflict:
    "要接管的账户与您名下已有账户同名（相同账户类型和货币），请联系账本管理员修改其中一个账户名称后再接受邀请。",
  placeholder_claim_existing_member:
    "您已经是该账本的成员，不能通过此邀请接管待邀请成员的账户。",
  placeholder_invite_pending:
    "该待邀请成员已有一条有效邀请，请先撤销后再重新生成。",
  placeholder_not_found: "待邀请成员不存在或已删除。",
  revoke_failed: "邀请撤销失败，请稍后重试。",
};

export function getLedgerInviteErrorMessage(code?: string) {
  return code && code in messages
    ? messages[code as LedgerInviteErrorCode]
    : null;
}
