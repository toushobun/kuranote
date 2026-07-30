import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";

const ledgerAdminRoles = new Set<CurrentLedgerRole>(["owner", "admin"]);
const ledgerWriteRoles = new Set<CurrentLedgerRole>([
  "owner",
  "admin",
  "member",
]);

export function canViewLedger(role: CurrentLedgerRole) {
  return ledgerWriteRoles.has(role) || role === "viewer";
}

export function canWriteTransaction(role: CurrentLedgerRole) {
  return ledgerWriteRoles.has(role);
}

export function canManageMasterData(role: CurrentLedgerRole) {
  return ledgerAdminRoles.has(role);
}

export function canManageLedger(role: CurrentLedgerRole) {
  return ledgerAdminRoles.has(role);
}

export function canManageMembers(role: CurrentLedgerRole) {
  return ledgerAdminRoles.has(role);
}

export function canModifyTransaction({
  createdBy,
  role,
  userId,
}: {
  createdBy: string | null;
  role: CurrentLedgerRole;
  userId: string;
}) {
  if (ledgerAdminRoles.has(role)) return true;

  return role === "member" && createdBy !== null && createdBy === userId;
}
