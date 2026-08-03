export const transactionSpecialStatuses = [
  "pendingReimbursement",
  "reimbursed",
] as const;

export type TransactionSpecialStatus =
  (typeof transactionSpecialStatuses)[number];

export const transactionWritableSpecialStatuses = [
  "pendingReimbursement",
] as const;

export type TransactionWritableSpecialStatus =
  (typeof transactionWritableSpecialStatuses)[number];

export type TransactionSpecialStatusFilterValue = TransactionSpecialStatus;

export const transactionSpecialStatusStorageValues = [
  "pending_reimbursement",
  "reimbursed",
] as const;

export type TransactionSpecialStatusStorageValue =
  (typeof transactionSpecialStatusStorageValues)[number];

const storageValueByStatus = {
  pendingReimbursement: "pending_reimbursement",
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
