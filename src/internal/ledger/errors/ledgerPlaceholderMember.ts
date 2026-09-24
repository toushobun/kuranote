import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
} from "internal/ledger/errors/ledgerInvite";

/**
 * 占位成员管理流程的错误码。placeholder_not_found、placeholder_already_claimed、
 * auth_required、ledger_not_found 与邀请流程语义完全相同，权威文案保留在
 * `errors/ledgerInvite.ts`，这里只引用，不复制文案。
 */
export const ledgerPlaceholderMemberErrorCodes = {
  authRequired: ledgerInviteErrorCodes.authRequired,
  createFailed: "placeholder_create_failed",
  deleteFailed: "placeholder_delete_failed",
  ledgerNotFound: ledgerInviteErrorCodes.ledgerNotFound,
  loadFailed: "placeholder_load_failed",
  permissionDenied: "permission_denied",
  placeholderAlreadyClaimed: ledgerInviteErrorCodes.placeholderAlreadyClaimed,
  placeholderInUse: "placeholder_in_use",
  placeholderNameConflict: "placeholder_name_conflict",
  placeholderNameInvalid: "placeholder_name_invalid",
  placeholderNameTooLong: "placeholder_name_too_long",
  placeholderNotFound: ledgerInviteErrorCodes.placeholderNotFound,
  renameFailed: "placeholder_rename_failed",
} as const;

export type LedgerPlaceholderMemberErrorCode =
  (typeof ledgerPlaceholderMemberErrorCodes)[keyof typeof ledgerPlaceholderMemberErrorCodes];

type SharedInviteErrorCode =
  | typeof ledgerInviteErrorCodes.authRequired
  | typeof ledgerInviteErrorCodes.ledgerNotFound
  | typeof ledgerInviteErrorCodes.placeholderAlreadyClaimed
  | typeof ledgerInviteErrorCodes.placeholderNotFound;

const sharedInviteErrorCodes = new Set<string>([
  ledgerInviteErrorCodes.authRequired,
  ledgerInviteErrorCodes.ledgerNotFound,
  ledgerInviteErrorCodes.placeholderAlreadyClaimed,
  ledgerInviteErrorCodes.placeholderNotFound,
]);

const messages: Record<
  Exclude<LedgerPlaceholderMemberErrorCode, SharedInviteErrorCode>,
  string
> = {
  permission_denied: "只有账本所有者或管理员可以管理待邀请成员。",
  placeholder_create_failed: "待邀请成员添加失败，请稍后重试。",
  placeholder_delete_failed: "待邀请成员删除失败，请稍后重试。",
  placeholder_in_use:
    "该待邀请成员仍是账户持有人，请先把相关账户的持有人改为其他人或无持有人后再删除。",
  placeholder_load_failed: "待邀请成员加载失败，请稍后重试。",
  placeholder_name_conflict: "当前账本已有同名的待邀请成员，请换一个名字。",
  placeholder_name_invalid: "请输入待邀请成员的名字。",
  placeholder_name_too_long: "待邀请成员的名字不能超过 100 个字符。",
  placeholder_rename_failed: "待邀请成员改名失败，请稍后重试。",
};

export function getLedgerPlaceholderMemberErrorMessage(
  code?: string,
): string | null {
  if (!code) return null;
  if (sharedInviteErrorCodes.has(code)) {
    return getLedgerInviteErrorMessage(code);
  }
  return code in messages ? messages[code as keyof typeof messages] : null;
}
