"use client";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import type { TransactionReceiptProps } from "../TransactionConfirmStep/TransactionConfirmStep.types";
import { formatStepItemCategory } from "../transactionStepFlowFormat";

/** 明细的金额键盘：逐键同步到明细，确定后跳到下一条未填金额的明细。 */
export function TransactionStepAmountEditor({
  form,
  amountItemId,
  onAmountItemChange,
  suggestions,
}: TransactionReceiptProps) {
  const amountItem = form.itemSummaries.find(
    (item) => item.id === amountItemId,
  );
  function confirmAmount(amount: string) {
    if (!amountItem) return;
    form.updateItem(amountItem.id, { amount });
    const next = form.itemSummaries.find(
      (item) => item.id !== amountItem.id && !item.amount.trim(),
    );
    onAmountItemChange(next?.id ?? null);
  }
  return (
    <TransactionItemAmountDrawer
      open={!!amountItem}
      title={formatStepItemCategory(amountItem?.category)}
      categoryId={amountItem?.categoryId}
      currency={form.selectedAccount?.currency ?? ""}
      value={amountItem?.amount ?? ""}
      quickAmounts={suggestions?.quickAmounts}
      onChange={(amount) =>
        amountItem && form.updateItem(amountItem.id, { amount })
      }
      onConfirm={confirmAmount}
      onClose={() => onAmountItemChange(null)}
    />
  );
}
