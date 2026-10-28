"use client";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { useTransactionItemsStep } from "../TransactionItemsStep/useTransactionItemsStep";
import type { TransactionItemsStepProps } from "../TransactionItemsStep/TransactionItemsStep.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
export function TransactionStepAmountEditor(props: TransactionItemsStepProps) {
  const w = useTransactionItemsStep(props);
  return (
    <TransactionItemAmountDrawer
      open={!!w.amountItem}
      title={
        w.amountItem?.category
          ? [w.amountItem.category.parentName, w.amountItem.category.name]
              .filter(Boolean)
              .join(" · ")
          : m.missingCategory
      }
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
