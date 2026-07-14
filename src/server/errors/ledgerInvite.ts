export const ledgerInviteErrorCodes = {
  authRequired: "auth_required",
  createFailed: "create_failed",
  inviteAlreadyRevoked: "invite_already_revoked",
  inviteInvalid: "invite_invalid",
  inviteUsed: "invite_already_used",
  loadFailed: "load_failed",
  permissionDenied: "permission_denied",
  revokeFailed: "revoke_failed",
} as const;

export type LedgerInviteErrorCode =
  (typeof ledgerInviteErrorCodes)[keyof typeof ledgerInviteErrorCodes];

const messages: Record<LedgerInviteErrorCode, string> = {
  auth_required: "请先登录后再继续。",
  create_failed: "邀请链接生成失败，请稍后重试。",
  invite_already_revoked: "该邀请已经撤销。",
  invite_invalid: "该邀请链接无效或已失效。",
  invite_already_used: "该邀请链接已经被使用，无法撤销。",
  load_failed: "待接受邀请加载失败，请稍后重试。",
  permission_denied: "只有账本所有者或管理员可以管理邀请。",
  revoke_failed: "邀请撤销失败，请稍后重试。",
};

export function getLedgerInviteErrorMessage(code?: string) {
  return code && code in messages
    ? messages[code as LedgerInviteErrorCode]
    : null;
}
