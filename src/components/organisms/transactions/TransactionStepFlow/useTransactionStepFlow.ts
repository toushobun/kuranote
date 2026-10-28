"use client";
import type { ItemsStepSnapshot } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep.types";
import { useCallback, useState } from "react";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
export function useTransactionStepFlow(props: TransactionStepFlowProps) {
  const confirm = useConfirmDialog();
  const [accountId, setAccountId] = useState(props.initialAccountId);
  const [step, setStep] = useState(props.initialStep ?? 1);
  const [completed, setCompleted] = useState<number[]>(
    props.initialCompletedSteps ?? [],
  );
  const [itemsStarted, setItemsStarted] = useState(
    (props.initialStep ?? 1) >= 3,
  );
  const [itemsSnapshot, setItemsSnapshot] = useState<ItemsStepSnapshot | null>(
    null,
  );
  if (step === 3 && !itemsStarted) setItemsStarted(true);
  const onItemsChange = props.onItemsChange;
  const updateItemsSnapshot = useCallback(
    (snapshot: ItemsStepSnapshot) => {
      setItemsSnapshot(snapshot);
      setAccountId(snapshot.payments[0]?.accountId || undefined);
      onItemsChange?.(snapshot);
    },
    [onItemsChange],
  );
  const [returning, setReturning] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [merchantId, setMerchantId] = useState(props.initialMerchantId);
  const merchant = props.merchants.find((item) => item.id === merchantId);
  const account = props.accounts.find((item) => item.id === accountId);
  function goToStep(target: number) {
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
    setAccountId(value.id);
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
    itemsStarted,
    itemsSnapshot,
    updateItemsSnapshot,
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
