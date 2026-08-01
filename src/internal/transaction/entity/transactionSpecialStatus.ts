export const transactionSpecialStatuses = [
  "pendingReimbursement",
  "pendingRefund",
  "reimbursed",
  "refunded",
  "excluded",
] as const;

export type TransactionSpecialStatus =
  (typeof transactionSpecialStatuses)[number];

export type TransactionSpecialStatusFilterValue =
  | TransactionSpecialStatus
  | "none";

export const transactionSpecialStatusStorageValues = [
  "pending_reimbursement",
  "pending_refund",
  "reimbursed",
  "refunded",
  "excluded",
] as const;

export type TransactionSpecialStatusStorageValue =
  (typeof transactionSpecialStatusStorageValues)[number];

const storageValueByStatus = {
  excluded: "excluded",
  pendingRefund: "pending_refund",
  pendingReimbursement: "pending_reimbursement",
  refunded: "refunded",
  reimbursed: "reimbursed",
} as const satisfies Record<
  TransactionSpecialStatus,
  TransactionSpecialStatusStorageValue
>;

const statusByStorageValue = Object.fromEntries(
  Object.entries(storageValueByStatus).map(([status, storageValue]) => [
    storageValue,
    status,
  ]),
) as Record<TransactionSpecialStatusStorageValue, TransactionSpecialStatus>;

export function toTransactionSpecialStatusStorageValue(
  status: TransactionSpecialStatus | null,
): TransactionSpecialStatusStorageValue | null {
  return status === null ? null : storageValueByStatus[status];
}

export function fromTransactionSpecialStatusStorageValue(
  value: TransactionSpecialStatusStorageValue | null,
): TransactionSpecialStatus | null {
  return value === null ? null : statusByStorageValue[value];
}
