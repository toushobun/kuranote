import type {
  TransactionBusinessStatus,
  TransactionSpecialStatus,
} from "internal/transaction";

export {
  transactionBusinessBadgeConfig,
  transactionBusinessBadgeStatuses,
} from "atoms/TransactionBusinessBadge/transactionBusinessBadgeConfig";

export type TransactionBusinessBadgeStatus = TransactionBusinessStatus;
export type TransactionSpecialStatusValue = TransactionSpecialStatus | null;
