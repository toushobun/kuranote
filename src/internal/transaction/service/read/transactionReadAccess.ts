import type { CurrentLedger } from "internal/ledger";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import { AuthenticationError } from "internal/shared/errors/appError";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";

export type TransactionReadAccessDependencies<TRepository> = Omit<
  TransactionReadDependencies<TRepository>,
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

export function getTransactionReadDependencies<TRepository>({
  accountQueryService,
  categoryQueryService,
  currentUserId,
  merchantQueryService,
  transactionRepository,
}: TransactionReadAccessDependencies<TRepository>): TransactionReadDependencies<TRepository> {
  return {
    accountQueryService,
    categoryQueryService,
    currentUserId: requireTransactionUserId(currentUserId),
    merchantQueryService,
    transactionRepository,
  };
}

export async function requireTransactionReadLedger(
  {
    currentUserId,
    ledgerAccessService,
  }: Pick<
    TransactionReadAccessDependencies<unknown>,
    "currentUserId" | "ledgerAccessService"
  >,
  currentLedger: CurrentLedger,
): Promise<CurrentLedger> {
  const userId = requireTransactionUserId(currentUserId);
  const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
    ledgerId: currentLedger.id,
    userId,
  });

  return { ...currentLedger, currentUserId: userId, currentUserRole: role };
}
