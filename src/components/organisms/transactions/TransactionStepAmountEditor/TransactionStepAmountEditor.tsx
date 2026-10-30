"use client";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import type { TransactionReceiptProps } from "../TransactionConfirmStep/TransactionConfirmStep.types";
import { formatStepItemCategory } from "../transactionStepFlowFormat";
import { exceedsCurrencyDecimalPlaces } from "utils/transactionAmountInput";

/** 明细的金额键盘：点「确定」才写入这一条明细并关闭键盘，不自动打开下一条。 */
export function TransactionStepAmountEditor({
  form,
  amountItemId,
  onAmountItemChange,
  suggestions,
}: TransactionReceiptProps) {
  const amountItem = form.itemSummaries.find(
    (item) => item.id === amountItemId,
  );
  const currency = form.selectedAccount?.currency ?? "";
  function confirmAmount(amount: string) {
    if (!amountItem) return;
    form.updateItem(amountItem.id, { amount });
    onAmountItemChange(null);
  }
  return (
    <TransactionItemAmountDrawer
      open={!!amountItem}
      title={formatStepItemCategory(amountItem?.category)}
      categoryId={amountItem?.categoryId}
      currency={currency}
      value={
        // 换币种后小数位超出的金额从空白重新输入；不输入就关闭时保留原值。
        amountItem && !exceedsCurrencyDecimalPlaces(amountItem.amount, currency)
          ? amountItem.amount
          : ""
      }
      quickAmounts={suggestions?.quickAmounts}
      onConfirm={confirmAmount}
      onClose={() => onAmountItemChange(null)}
    />
  );
}
