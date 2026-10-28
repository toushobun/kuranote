"use client";
import { canAddPaymentRow } from "organisms/transactions/TransactionPaymentFields/useTransactionPaymentFields";
import type { TransactionItemsStepProps } from "./TransactionItemsStep.types";

export function useTransactionItemsStep(props: TransactionItemsStepProps) {
  const { form, amountItemId, onAmountItemChange: setAmountItemId } = props;
  const amountItem = form.itemSummaries.find(
    (item) => item.id === amountItemId,
  );
  const automaticItemIds = props.automaticItemIds.filter((id) =>
    form.itemSummaries.some((item) => item.id === id),
  );
  const currency = form.selectedAccount?.currency;
  const canAddPayment =
    !!props.multiAccountPaymentEnabled &&
    !form.itemSummaries.some((item) => item.category?.type === "income") &&
    canAddPaymentRow({
      accountOptions: props.accountOptions,
      payments: form.payments,
      primaryCurrency: currency,
    });
  function updateAmount(amount: string) {
    if (amountItem) form.updateItem(amountItem.id, { amount });
  }
  function confirmAmount(amount: string) {
    if (!amountItem) return;
    form.updateItem(amountItem.id, { amount });
    const next = form.itemSummaries.find(
      (item) => item.id !== amountItem.id && !item.amount.trim(),
    );
    setAmountItemId(next?.id ?? null);
  }
  return {
    form,
    amountItem,
    automaticItemIds,
    currency,
    canAddPayment,
    updateAmount,
    confirmAmount,
    setAmountItemId,
    ready: form.hasValidItems && !form.accountFieldError,
  };
}
