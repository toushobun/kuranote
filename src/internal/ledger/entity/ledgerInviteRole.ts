export const ledgerInviteRoles = ["admin", "member", "viewer"] as const;

export type LedgerInviteRole = (typeof ledgerInviteRoles)[number];

export function isLedgerInviteRole(value: unknown): value is LedgerInviteRole {
  return ledgerInviteRoles.some((role) => role === value);
}
