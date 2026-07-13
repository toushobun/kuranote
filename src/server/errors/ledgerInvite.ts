export const ledgerInviteErrorCodes = {
  authRequired: "auth_required",
  createFailed: "create_failed",
  inviteInvalid: "invite_invalid",
  inviteUsed: "invite_already_used",
  permissionDenied: "permission_denied",
} as const;

export type LedgerInviteErrorCode =
  (typeof ledgerInviteErrorCodes)[keyof typeof ledgerInviteErrorCodes];

const messages: Record<LedgerInviteErrorCode, string> = {
  auth_required: "请先登录后再继续。",
  create_failed: "邀请链接生成失败，请稍后重试。",
  invite_invalid: "该邀请链接无效或已失效。",
  invite_already_used: "该邀请链接已经被使用。",
  permission_denied: "只有账本所有者或管理员可以邀请成员。",
};

export function getLedgerInviteErrorMessage(code?: string) {
  return code && code in messages
    ? messages[code as LedgerInviteErrorCode]
    : null;
}
