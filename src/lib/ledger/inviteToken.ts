const ledgerInviteTokenPattern = /^[0-9a-f]{64}$/;

export function isValidLedgerInviteToken(value: string): boolean {
  return ledgerInviteTokenPattern.test(value);
}
