import type { LedgerInviteRole } from "types/ledgers";

export type LedgerInviteStatus =
  | "valid"
  | "already_member"
  | "accepted"
  | "revoked"
  | "invalid";

export type LedgerInvitePreview = {
  inviteRole: LedgerInviteRole | null;
  inviterName: string | null;
  ledgerName: string | null;
  status: LedgerInviteStatus;
};

export const invalidLedgerInvitePreview: LedgerInvitePreview = {
  inviteRole: null,
  inviterName: null,
  ledgerName: null,
  status: "invalid",
};
