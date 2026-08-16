export const transactionSpecialStatuses = [
  "pendingReimbursement",
  "reimbursed",
] as const;

export type TransactionSpecialStatus =
  (typeof transactionSpecialStatuses)[number];

export const transactionIncomeLinkRoles = ["refund", "reimbursement"] as const;

export type TransactionIncomeLinkRole =
  (typeof transactionIncomeLinkRoles)[number];

export type TransactionOffsetComposition = {
  refundAmount: string;
  reimbursementAmount: string;
};

export type TransactionBusinessStatus = {
  incomeLinkRole: TransactionIncomeLinkRole | null;
  offsetComposition: TransactionOffsetComposition;
  settlementStatus: TransactionSpecialStatus | null;
};

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

export function resolveTransactionBusinessStatus({
  isRefundIncome = false,
  isReimbursementIncome = false,
  refundedAmount,
  reimbursementAmount,
  specialStatus = null,
}: {
  isRefundIncome?: boolean;
  isReimbursementIncome?: boolean;
  refundedAmount?: string;
  reimbursementAmount?: string;
  specialStatus?:
    | TransactionSpecialStatus
    | TransactionSpecialStatusStorageValue
    | null;
}): TransactionBusinessStatus | null {
  const settlementStatus =
    specialStatus === "pending_reimbursement"
      ? "pendingReimbursement"
      : specialStatus;
  const refundAmount = normalizePositiveAmount(refundedAmount);
  const effectiveReimbursementAmount = settlementStatus
    ? normalizePositiveAmount(reimbursementAmount)
    : "0";
  const incomeLinkRole = isRefundIncome
    ? "refund"
    : isReimbursementIncome
      ? "reimbursement"
      : null;

  if (
    settlementStatus === null &&
    incomeLinkRole === null &&
    refundAmount === "0" &&
    effectiveReimbursementAmount === "0"
  ) {
    return null;
  }

  return {
    incomeLinkRole,
    offsetComposition: {
      refundAmount,
      reimbursementAmount: effectiveReimbursementAmount,
    },
    settlementStatus,
  };
}

function normalizePositiveAmount(amount: string | undefined) {
  const value = Number(amount ?? "0");
  if (!Number.isFinite(value) || value <= 0) return "0";
  return String(Number(value.toFixed(2)));
}
