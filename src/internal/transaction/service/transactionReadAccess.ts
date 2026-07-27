import type { CurrentLedger } from "lib/ledger/current-ledger";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import { AuthenticationError } from "internal/shared/errors/appError";
import type { TransactionReadDependencies } from "internal/transaction/service/transactionContext";

export type TransactionReadAccessDependencies = Omit<
  TransactionReadDependencies,
  "currentUserId"
> & {
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
};

export function requireTransactionUserId(currentUserId: string | null): string {
  if (!currentUserId) {
    throw new AuthenticationError("auth_required", "请先登录。");
  }

  return currentUserId;
}

export function getTransactionReadDependencies({
  accountQueryService,
  categoryQueryService,
  currentUserId,
  merchantQueryService,
  transactionRepository,
}: TransactionReadAccessDependencies): TransactionReadDependencies {
  return {
    accountQueryService,
    categoryQueryService,
    currentUserId: requireTransactionUserId(currentUserId),
    merchantQueryService,
    transactionRepository,
  };
}

export async function requireTransactionReadLedger(
  { currentUserId, ledgerAccessService }: TransactionReadAccessDependencies,
  currentLedger: CurrentLedger,
): Promise<CurrentLedger> {
  const userId = requireTransactionUserId(currentUserId);
  const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
    ledgerId: currentLedger.id,
    userId,
  });

  return { ...currentLedger, currentUserId: userId, currentUserRole: role };
}
