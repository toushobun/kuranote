import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import { canModifyTransaction } from "lib/ledger/permissions";

export function getDashboardTransactionCanEdit({
  createdBy,
  role,
  userId,
}: {
  createdBy: string | null;
  role: CurrentLedgerRole;
  userId?: string;
}) {
  if (!userId) return false;

  return canModifyTransaction({ createdBy, role, userId });
}
