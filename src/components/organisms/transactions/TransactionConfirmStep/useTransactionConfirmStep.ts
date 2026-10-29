"use client";
import { useState } from "react";
import type { useTransactionForm } from "../TransactionForm/useTransactionForm";
import { isValidTransactionFormItem } from "../TransactionForm/TransactionForm.utils";
import { flowMessages as m } from "config/transactionStepFlowMessages";

export function useTransactionConfirmStep(
  form: ReturnType<typeof useTransactionForm>,
  goToStep: (step: number) => void,
  onAmount: (id: number) => void,
) {
  const [editor, setEditor] = useState<"note" | "time" | null>(null);
  const invalidItems = form.itemSummaries.filter(
    (item) =>
      !item.category ||
      !isValidTransactionFormItem(item, form.selectedAccount?.currency),
  );
  const missingAmounts = invalidItems.filter((item) => !item.amount.trim());
  // 金额待输入的明细（如快速路线自动加入的）直接打开金额键盘，其余打开明细编辑。
  function editItem(item: (typeof form.itemSummaries)[number]) {
    if (item.category && !item.amount.trim() && form.selectedAccount)
      onAmount(item.id);
    else form.openItemSheet(item.id);
  }
  const accountError = !!form.accountFieldError || !form.selectedAccount;
  const issues = [
    ...(!form.selectedMerchant
      ? [{ message: m.selectMerchant, onClick: () => goToStep(1) }]
      : []),
    ...(accountError
      ? [
          {
            message:
              form.isMultiAccount && !form.paymentReconciliation.isBalanced
                ? m.unbalanced
                : m.checkAccount,
            onClick: () => goToStep(form.isMultiAccount ? 3 : 2),
          },
        ]
      : []),
    ...(!form.itemSummaries.length
      ? [{ message: m.missingItems, onClick: () => goToStep(3) }]
      : []),
    ...(invalidItems.length
      ? [
          {
            message: missingAmounts.length
              ? m.missingAmounts(missingAmounts.length)
              : m.invalidItems,
            onClick: () =>
              missingAmounts[0] && form.selectedAccount
                ? onAmount(missingAmounts[0].id)
                : goToStep(3),
          },
        ]
      : []),
    ...(!form.transactionAtValue
      ? [{ message: m.invalidTime, onClick: () => setEditor("time") }]
      : []),
  ];
  return { editor, setEditor, editItem, invalidItems, accountError, issues };
}
