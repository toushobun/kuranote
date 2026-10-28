"use client";
import { useEffect, useState } from "react";
import { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import { canAddPaymentRow } from "organisms/transactions/TransactionPaymentFields/useTransactionPaymentFields";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { TransactionItemsStepProps } from "./TransactionItemsStep.types";

export function useTransactionItemsStep(props: TransactionItemsStepProps) {
  const [amountItemId, setAmountItemId] = useState<number | null>(null);
  const [initial] = useState(() => {
    const items = [...(props.initialItems ?? [])];
    const automaticIds = new Set<number>();
    if (props.prefillAutomaticItems) {
      for (const categoryId of props.suggestions?.automaticCategoryIds ?? []) {
        if (
          !props.categoryOptions.some((category) => category.id === categoryId)
        )
          continue;
        items.push({ categoryId, amount: "" });
        automaticIds.add(items.length);
      }
    }
    const values: TransactionFormInitialValues = {
      items,
      merchantId: "",
      note: "",
      payments: props.initialPayments ?? [
        { accountId: props.selectedAccount?.id ?? "", amount: null },
      ],
      transactionAt: "",
      type: "expense",
    };
    return { values, automaticIds };
  });
  const form = useTransactionForm({
    accountOptions: props.accountOptions,
    categoryOptions: props.categoryOptions,
    merchantOptions: [],
    initialValues: initial.values,
    deferPickerAmount: true,
    onPickerItemCommit: setAmountItemId,
  });
  const [previousAccountId, setPreviousAccountId] = useState(
    props.selectedAccount?.id,
  );
  if (previousAccountId !== props.selectedAccount?.id) {
    setPreviousAccountId(props.selectedAccount?.id);
    const primary = form.payments[0];
    if (primary)
      form.handlePaymentAccountChange(
        primary.key,
        props.selectedAccount?.id ?? "",
      );
  }
  const { onChange } = props;
  useEffect(() => {
    onChange?.({ items: form.itemSummaries, payments: form.payments });
  }, [form.itemSummaries, form.payments, onChange]);
  const amountItem = form.itemSummaries.find(
    (item) => item.id === amountItemId,
  );
  const automaticItemIds = form.itemSummaries
    .filter((item) => initial.automaticIds.has(item.id))
    .map((item) => item.id);
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
