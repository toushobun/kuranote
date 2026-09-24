import type { LedgerInviteRole } from "internal/ledger/entity/ledgerInviteRole";

export type LedgerInviteStatus =
  | "valid"
  | "already_member"
  | "accepted"
  | "revoked"
  | "invalid";

export type LedgerInvitePreview = {
  inviteRole: LedgerInviteRole | null;
  inviterName: string | null;
  /** 有效的绑定占位邀请为 true；匿名或已失效的绑定邀请为 false。 */
  isPlaceholderBound: boolean;
  ledgerName: string | null;
  /** 仅在 isPlaceholderBound 为 true 时返回占位当前的显示名。 */
  placeholderDisplayName: string | null;
  status: LedgerInviteStatus;
};

export const invalidLedgerInvitePreview: LedgerInvitePreview = {
  inviteRole: null,
  inviterName: null,
  isPlaceholderBound: false,
  ledgerName: null,
  placeholderDisplayName: null,
  status: "invalid",
};
