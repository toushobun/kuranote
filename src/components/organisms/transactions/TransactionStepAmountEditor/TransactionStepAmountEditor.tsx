"use client";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { useTransactionItemsStep } from "../TransactionItemsStep/useTransactionItemsStep";
import type { TransactionItemsStepProps } from "../TransactionItemsStep/TransactionItemsStep.types";
import { formatStepItemCategory } from "../transactionStepFlowFormat";
export function TransactionStepAmountEditor(props: TransactionItemsStepProps) {
  const w = useTransactionItemsStep(props);
  return (
    <TransactionItemAmountDrawer
      open={!!w.amountItem}
      title={formatStepItemCategory(w.amountItem?.category)}
      categoryId={w.amountItem?.categoryId}
      currency={w.currency ?? ""}
      value={w.amountItem?.amount ?? ""}
      quickAmounts={props.suggestions?.quickAmounts}
      onChange={w.updateAmount}
      onConfirm={w.confirmAmount}
      onClose={() => w.setAmountItemId(null)}
    />
  );
}
