"use client";
import { useState, type RefObject } from "react";
import { isValidTransactionFormItem } from "../TransactionForm/TransactionForm.utils";
import {
  canAddPaymentRow,
  isPaymentAccountSelectable,
} from "../TransactionPaymentFields/useTransactionPaymentFields";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { exceedsCurrencyDecimalPlaces } from "utils/transactionAmountInput";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionConfirmStepProps } from "./TransactionConfirmStep.types";

export function useTransactionConfirmStep(
  props: TransactionConfirmStepProps,
  paymentSectionRef: RefObject<HTMLDivElement | null>,
) {
  const form = props.form;
  const [editor, setEditor] = useState<"note" | "time" | null>(null);
  // 正在换账户 / 填金额的付款行（`TransactionPaymentRow.key`）。
  const [accountPickerKey, setAccountPickerKey] = useState<number | null>(null);
  const [paymentAmountKey, setPaymentAmountKey] = useState<number | null>(null);
  // 单账户点 × 清空的账户：再选账户时仍按它的币种判断是否需要确认换币种。
  const [clearedAccount, setClearedAccount] =
    useState<TransactionAccountOption>();
  const currency = form.selectedAccount?.currency;
  const automaticItemIds = props.automaticItemIds.filter((id) =>
    form.itemSummaries.some((item) => item.id === id),
  );
  const invalidItems = form.itemSummaries.filter(
    (item) => !item.category || !isValidTransactionFormItem(item, currency),
  );
  // 换币种后小数位超出的金额单独提示，点一下重新输入。
  const excessDecimalItems = invalidItems.filter((item) =>
    exceedsCurrencyDecimalPlaces(item.amount, currency),
  );
  const otherInvalidItems = invalidItems.filter(
    (item) => !excessDecimalItems.includes(item),
  );
  const missingAmounts = invalidItems.filter((item) => !item.amount.trim());
  // 入口条件与标准表单一致（#930 / #931），另外未选账户或明细里有收入时不显示。
  const canAddPayment =
    !!props.multiAccountPaymentEnabled &&
    !!form.selectedAccount &&
    !form.itemSummaries.some((item) => item.category?.type === "income") &&
    canAddPaymentRow({
      accountOptions: props.accountOptions,
      payments: form.payments,
      primaryCurrency: currency,
    });
  const accountError = !!form.accountFieldError || !form.selectedAccount;
  const pickerPayment = form.payments.find(
    (payment) => payment.key === accountPickerKey,
  );
  // 多账户时只能换成同币种、未被其他行选中的账户；单账户时可选全部账户（换币种时确认）。
  const pickerAccounts = form.isMultiAccount
    ? props.accountOptions.filter(
        (account) =>
          (!currency || account.currency === currency) &&
          isPaymentAccountSelectable({
            account,
            payments: form.payments,
            primaryCurrency: currency,
            rowKey: accountPickerKey ?? undefined,
          }),
      )
    : props.accountOptions;
  const pickerSelectedAccount =
    props.accountOptions.find(
      (account) => account.id === pickerPayment?.accountId,
    ) ?? (form.isMultiAccount ? undefined : clearedAccount);
  function selectAccount(account: TransactionAccountOption) {
    if (accountPickerKey === null) return;
    form.handlePaymentAccountChange(accountPickerKey, account.id);
    props.onAccountSelect?.(account);
    setClearedAccount(undefined);
    setAccountPickerKey(null);
  }
  // 只剩一个付款账户时删除即清空账户，支付行回到「选择收支账户」。
  function removePayment(key: number) {
    if (form.isMultiAccount) form.handleRemovePayment(key);
    else {
      setClearedAccount(form.selectedAccount ?? clearedAccount);
      form.handlePaymentAccountChange(key, "");
    }
  }
  function focusPayments() {
    const section = paymentSectionRef.current;
    section?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    section?.focus();
  }
  const emptyPayment = form.payments.find((payment) => !payment.accountId);
  const issues = [
    ...(!form.selectedMerchant
      ? [{ message: m.selectMerchant, onClick: props.onMerchantClick }]
      : []),
    ...(accountError
      ? [
          {
            message: !form.selectedAccount
              ? m.selectAccount
              : form.isMultiAccount && !form.paymentReconciliation.isBalanced
                ? m.unbalanced
                : m.checkAccount,
            onClick: () =>
              emptyPayment
                ? setAccountPickerKey(emptyPayment.key)
                : focusPayments(),
          },
        ]
      : []),
    ...(!form.itemSummaries.length
      ? [{ message: m.missingItems, onClick: form.openSheet }]
      : []),
    ...(excessDecimalItems.length
      ? [
          {
            message: m.excessDecimals(excessDecimalItems.length),
            onClick: () => props.onAmountItemChange(excessDecimalItems[0]!.id),
          },
        ]
      : []),
    ...(otherInvalidItems.length
      ? [
          {
            message: missingAmounts.length
              ? m.missingAmounts(missingAmounts.length)
              : m.invalidItems,
            onClick: () =>
              missingAmounts[0]
                ? props.onAmountItemChange(missingAmounts[0].id)
                : form.openItemSheet(otherInvalidItems[0]!.id),
          },
        ]
      : []),
    ...(!form.transactionAtValue
      ? [{ message: m.invalidTime, onClick: () => setEditor("time") }]
      : []),
  ];
  return {
    editor,
    setEditor,
    currency,
    automaticItemIds,
    invalidItems,
    canAddPayment,
    accountPickerKey,
    setAccountPickerKey,
    pickerPayment,
    pickerAccounts,
    pickerSelectedAccount,
    selectAccount,
    paymentAmountKey,
    setPaymentAmountKey,
    removePayment,
    issues,
  };
}
