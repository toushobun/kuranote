import type { TransactionFormItem } from "../TransactionForm/TransactionForm.types";
import type { TransactionPaymentRow } from "../TransactionPaymentFields/useTransactionPaymentFields";

export type ReceiptSnapshot = {
  items: Pick<
    TransactionFormItem,
    | "id"
    | "categoryId"
    | "amount"
    | "specialStatus"
    | "refundCandidate"
    | "reimbursementCandidate"
  >[];
  payments: TransactionPaymentRow[];
  note: string;
  transactionAt: string;
};

export function hasReceiptChanges(
  baseline: ReceiptSnapshot,
  current: ReceiptSnapshot,
  automaticItemIds: readonly number[],
  automaticPaymentKey: number | null,
) {
  const expected: ReceiptSnapshot = {
    items: baseline.items.filter(
      ({ id }) =>
        !automaticItemIds.includes(id) ||
        current.items.some((item) => item.id === id),
    ),
    payments: baseline.payments.map((payment, index) =>
      payment.key === automaticPaymentKey &&
      current.payments[index]?.accountId === ""
        ? { ...payment, accountId: "" }
        : payment,
    ),
    note: baseline.note,
    transactionAt: baseline.transactionAt,
  };
  return JSON.stringify(current) !== JSON.stringify(expected);
}
