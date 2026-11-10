"use client";
import { useState } from "react";
import { isValidTransactionFormItem } from "../TransactionForm/TransactionForm.utils";
import {
  canAddPaymentRow,
  isPaymentAccountSelectable,
} from "../TransactionPaymentFields/useTransactionPaymentFields";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { useReceiptIssueCheck } from "organisms/transactions/ReceiptParts/useReceiptIssueCheck";
import { exceedsCurrencyDecimalPlaces } from "utils/transactionAmountInput";
import type { TransactionAccountOption } from "types/transactions";
import type { TransactionConfirmStepProps } from "./TransactionConfirmStep.types";

export function useTransactionConfirmStep(
  props: TransactionConfirmStepProps,
  focusPayments: () => void,
) {
  const form = props.form;
  const [editor, setEditor] = useState<"time" | null>(null);
  // 新增付款账户用 "add"，更换账户用付款行的 key。
  const [accountPickerKey, setAccountPickerKey] = useState<
    number | "add" | null
  >(null);
  const addingPayment = accountPickerKey === "add";
  const [paymentAmountKey, setPaymentAmountKey] = useState<number | null>(null);
  // 单账户点 × 清空后，只保留换币种确认需要的原币种。
  const [previousCurrency, setPreviousCurrency] = useState<string>();
  const currency = form.selectedAccount?.currency;
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
  const primaryPayment = form.payments[0];
  const multiAccountAvailable = Boolean(
    props.multiAccountPaymentEnabled && form.selectedAccount,
  );
  const canAddPayment =
    !primaryPayment?.accountId ||
    (multiAccountAvailable &&
      !form.hasMixedPaymentItems &&
      canAddPaymentRow({
        accountOptions: props.accountOptions,
        payments: form.payments,
        primaryCurrency: currency,
      }));
  const showMixedPaymentHint =
    multiAccountAvailable && form.hasMixedPaymentItems;
  function openAddPayment() {
    setAccountPickerKey(
      form.selectedAccount ? "add" : (primaryPayment?.key ?? null),
    );
  }
  const accountError = !!form.accountFieldError || !form.selectedAccount;
  const pickerPayment = form.payments.find(
    (payment) => payment.key === accountPickerKey,
  );
  // 新增第二个账户或已有多账户时只可选同币种、未被其他行选中的账户。
  const pickerAccounts =
    form.isMultiAccount || addingPayment
      ? props.accountOptions.filter(
          (account) =>
            (!currency || account.currency === currency) &&
            isPaymentAccountSelectable({
              account,
              payments: form.payments,
              primaryCurrency: currency,
              rowKey: pickerPayment?.key,
            }),
        )
      : props.accountOptions;
  const pickerSelectedAccount = props.accountOptions.find(
    (account) => account.id === pickerPayment?.accountId,
  );
  function selectAccount(account: TransactionAccountOption) {
    if (accountPickerKey === null) return;
    setAccountPickerKey(null);
    if (accountPickerKey === "add") {
      if (!form.addPayment(account.id)) return;
    } else {
      form.handlePaymentAccountChange(accountPickerKey, account.id);
    }
    props.onAccountSelect?.(account);
    setPreviousCurrency(undefined);
  }
  // 只剩一个付款账户时删除即清空账户，支付区只显示添加按钮。
  function removePayment(key: number) {
    if (form.isMultiAccount) form.handleRemovePayment(key);
    else {
      setPreviousCurrency(currency ?? previousCurrency);
      form.handlePaymentAccountChange(key, "");
    }
  }
  const issues = [
    ...(!form.selectedMerchant
      ? [
          {
            id: "merchant",
            message: m.selectMerchant,
            onClick: props.onMerchantClick,
          },
        ]
      : []),
    ...(accountError
      ? [
          {
            id: "account",
            message: !form.selectedAccount
              ? m.selectAccount(form.isIncomePayment)
              : form.isMultiAccount && !form.paymentReconciliation.isBalanced
                ? m.unbalanced(form.isIncomePayment)
                : m.checkAccount,
            onClick: form.selectedAccount ? focusPayments : openAddPayment,
          },
        ]
      : []),
    ...(!form.itemSummaries.length
      ? [{ id: "items", message: m.missingItems, onClick: form.openSheet }]
      : []),
    ...(excessDecimalItems.length
      ? [
          {
            id: "decimals",
            message: m.excessDecimals(excessDecimalItems.length),
            onClick: () => props.onAmountItemChange(excessDecimalItems[0]!.id),
          },
        ]
      : []),
    ...(otherInvalidItems.length
      ? [
          {
            id: "invalidItems",
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
      ? [
          {
            id: "time",
            message: m.invalidTime,
            onClick: () => setEditor("time"),
          },
        ]
      : []),
  ];
  // 付款区只标记已显示的行（账户不可用，或多账户时未填金额）。
  const invalidPaymentKeys = form.payments
    .filter(
      (payment) =>
        payment.accountId &&
        (!props.accountOptions.some(
          (account) => account.id === payment.accountId,
        ) ||
          (form.isMultiAccount && !payment.amount.trim())),
    )
    .map((payment) => payment.key);
  const issueCheck = useReceiptIssueCheck([
    ...issues.map((issue) => issue.id),
    ...invalidItems.map((item) => itemMarkKey(item.id)),
    ...invalidPaymentKeys.map(paymentMarkKey),
  ]);
  const isChecked = issueCheck.isChecked;
  /** 点保存时调用：记录当前所有问题，返回是否有问题。 */
  function checkIssues() {
    const hasIssues = issues.length > 0;
    issueCheck.check(hasIssues && !props.readOnly);
    return hasIssues;
  }
  return {
    editor,
    setEditor,
    currency,
    canAddPayment,
    showMixedPaymentHint,
    accountPickerKey,
    setAccountPickerKey,
    openAddPayment,
    pickerAccounts,
    pickerSelectedAccount,
    previousCurrency:
      form.isMultiAccount || addingPayment ? undefined : previousCurrency,
    selectAccount,
    paymentAmountKey,
    setPaymentAmountKey,
    removePayment,
    issues,
    checkIssues,
    isChecked,
    pulseCount: issueCheck.pulseCount,
    firstIssueRef: issueCheck.firstIssueRef,
    markedItems: invalidItems.filter((item) => isChecked(itemMarkKey(item.id))),
    markedPaymentKeys: invalidPaymentKeys.filter((key) =>
      isChecked(paymentMarkKey(key)),
    ),
  };
}

const itemMarkKey = (id: number) => `item:${id}`;
const paymentMarkKey = (key: number) => `payment:${key}`;
