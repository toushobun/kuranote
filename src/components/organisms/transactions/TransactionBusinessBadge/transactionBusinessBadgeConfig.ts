import type {
  TransactionBusinessStatus,
  TransactionSpecialStatus,
} from "internal/transaction";
import { transactionSpecialStatuses } from "internal/transaction";

export { transactionBusinessBadgeConfig } from "atoms/TransactionBusinessBadge/transactionBusinessBadgeConfig";

export const transactionBusinessBadgeStatuses = transactionSpecialStatuses;

export type TransactionBusinessBadgeStatus = TransactionBusinessStatus;
export type TransactionSpecialStatusValue = TransactionSpecialStatus | null;
