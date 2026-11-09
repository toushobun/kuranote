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
  // 单账户点 × 清空后，只保留换币种确认需要的原币种。
  const [previousCurrency, setPreviousCurrency] = useState<string>();
  // 点保存时记录的问题快照（#1016 / #1040）：顶部提示与内联红标都只显示快照中仍未解决的问题，
  // 之后新出现的问题等下一次保存才显示。
  const [checkedKeys, setCheckedKeys] = useState<readonly string[]>([]);
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
  const pickerSelectedAccount = props.accountOptions.find(
    (account) => account.id === pickerPayment?.accountId,
  );
  function selectAccount(account: TransactionAccountOption) {
    if (accountPickerKey === null) return;
    form.handlePaymentAccountChange(accountPickerKey, account.id);
    props.onAccountSelect?.(account);
    setPreviousCurrency(undefined);
    setAccountPickerKey(null);
  }
  // 只剩一个付款账户时删除即清空账户，支付行回到「选择收支账户」。
  function removePayment(key: number) {
    if (form.isMultiAccount) form.handleRemovePayment(key);
    else {
      setPreviousCurrency(currency ?? previousCurrency);
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
  // 内联红标按行判定：明细按每条明细、付款按每个付款行（未选账户，或多账户时未填金额）。
  const invalidPaymentKeys = form.payments
    .filter(
      (payment) =>
        !props.accountOptions.some(
          (account) => account.id === payment.accountId,
        ) ||
        (form.isMultiAccount && !payment.amount.trim()),
    )
    .map((payment) => payment.key);
  const isChecked = (key: string) => checkedKeys.includes(key);
  /** 点保存时调用：记录当前所有问题，返回是否有问题。 */
  function checkIssues() {
    setCheckedKeys([
      ...issues.map((issue) => issue.id),
      ...invalidItems.map((item) => itemMarkKey(item.id)),
      ...invalidPaymentKeys.map(paymentMarkKey),
    ]);
    return issues.length > 0;
  }
  return {
    editor,
    setEditor,
    currency,
    canAddPayment,
    accountPickerKey,
    setAccountPickerKey,
    pickerPayment,
    pickerAccounts,
    pickerSelectedAccount,
    previousCurrency: form.isMultiAccount ? undefined : previousCurrency,
    selectAccount,
    paymentAmountKey,
    setPaymentAmountKey,
    removePayment,
    issues,
    checkIssues,
    isChecked,
    markedItems: invalidItems.filter((item) => isChecked(itemMarkKey(item.id))),
    markedPaymentKeys: invalidPaymentKeys.filter((key) =>
      isChecked(paymentMarkKey(key)),
    ),
  };
}

const itemMarkKey = (id: number) => `item:${id}`;
const paymentMarkKey = (key: number) => `payment:${key}`;
