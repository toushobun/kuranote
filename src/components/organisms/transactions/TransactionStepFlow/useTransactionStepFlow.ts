"use client";
import { useState } from "react";
import { useTransactionForm } from "organisms/transactions/TransactionForm/useTransactionForm";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [step, setStep] = useState(props.initialStep ?? 1);
  const [completed, setCompleted] = useState<number[]>(
    props.initialCompletedSteps ?? [],
  );
  const itemsOptions = props.itemsOptions ?? { categoryOptions: [] };
  const [amountItemId, setAmountItemId] = useState<number | null>(null);
  function automaticCategoryIds() {
    return itemsOptions.prefillAutomaticItems
      ? (props.suggestions?.automaticCategoryIds ?? []).filter((id) =>
          itemsOptions.categoryOptions.some((category) => category.id === id),
        )
      : [];
  }
  const [initial] = useState(() => {
    const items = [...(itemsOptions.initialItems ?? [])];
    const automaticIds: number[] = [];
    if ((props.initialStep ?? 1) >= 3) {
      for (const categoryId of automaticCategoryIds()) {
        items.push({ categoryId, amount: "" });
        automaticIds.push(items.length);
      }
    }
    const values: TransactionFormInitialValues = {
      items,
      merchantId: props.initialMerchantId ?? "",
      note: "",
      payments: itemsOptions.initialPayments ?? [
        { accountId: props.initialAccountId ?? "", amount: null },
      ],
      transactionAt: "",
      type: "expense",
    };
    return { values, automaticIds };
  });
  const [automaticItemIds, setAutomaticItemIds] = useState(
    initial.automaticIds,
  );
  const [automaticItemsInitialized, setAutomaticItemsInitialized] = useState(
    (props.initialStep ?? 1) >= 3,
  );
  const form = useTransactionForm({
    accountOptions: props.accounts,
    categoryOptions: itemsOptions.categoryOptions,
    merchantOptions: [],
    initialValues: initial.values,
    deferPickerAmount: true,
    onPickerItemCommit: setAmountItemId,
  });
  const [returning, setReturning] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [merchantId, setMerchantId] = useState(props.initialMerchantId);
  const merchant = props.merchants.find((item) => item.id === merchantId);
  const account = form.selectedAccount;
  function goToStep(target: number) {
    if (target === 3 && !automaticItemsInitialized) {
      setAutomaticItemIds(
        automaticCategoryIds().map((categoryId) =>
          form.addItem(categoryId, "", null, null, null),
        ),
      );
      setAutomaticItemsInitialized(true);
    }
    if (step === 4 && target !== 4) setReturning(true);
    if (target === 4) setReturning(false);
    setStep(target);
  }
  function advance(from: number) {
    setCompleted((current) =>
      current.includes(from) ? current : [...current, from],
    );
    goToStep(returning ? 4 : from + 1);
  }
  function selectMerchant(value: FlowMerchant) {
    setMerchantId(value.id);
    props.onMerchantSelect(value);
    setCompleted((current) =>
      current.includes(1) ? current : [...current, 1],
    );
    setStep(2);
  }
  function selectAccount(value: TransactionAccountOption) {
    const primary = form.payments[0];
    if (primary) form.handlePaymentAccountChange(primary.key, value.id);
    props.onAccountSelect(value);
    if (!returning) advance(2);
  }
  async function requestClose() {
    if (
      await confirm({
        title: m.abandonTitle,
        description: m.abandonDescription,
        cancelLabel: m.continue,
        confirmLabel: m.abandon,
      })
    )
      props.onClose();
  }
  return {
    step,
    form,
    itemsOptions,
    automaticItemIds,
    amountItemId,
    setAmountItemId,
    completed,
    returning,
    methodOpen,
    setMethodOpen,
    merchant,
    account,
    goToStep,
    advance,
    selectMerchant,
    selectAccount,
    requestClose,
  };
}
