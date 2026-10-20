"use client";

import { useRef, useState } from "react";

import {
  formatRefundMinorUnits,
  toRefundMinorUnits,
  type TransactionPayment,
} from "internal/transaction";
import type { TransactionAccountOption } from "types/transactions";
import { isValidMoneyText } from "utils/transactionAmountInput";

/** 表单中的一行付款明细；`amount` 为输入框原文，单账户时不使用。 */
export type TransactionPaymentRow = {
  accountId: string;
  amount: string;
  key: number;
};

export type TransactionPaymentReconciliation = {
  /** 明细合计 − 付款合计，平衡时为 "0"。 */
  difference: string;
  isBalanced: boolean;
  itemTotal: string;
  paymentTotal: string;
};

function createInitialRows(
  initialPayments: readonly TransactionPayment[] | undefined,
): TransactionPaymentRow[] {
  const payments =
    initialPayments && initialPayments.length > 0
      ? initialPayments
      : [{ accountId: "", amount: null }];
  // 单账户时金额由明细推导，不作为输入回填。
  const isMultiAccount = payments.length > 1;
  return payments.map((payment, index) => ({
    accountId: payment.accountId,
    amount: isMultiAccount ? (payment.amount ?? "") : "",
    key: index + 1,
  }));
}

/**
 * 付款明细的表单状态。多账户模式由行数派生（> 1 行），不另设状态；
 * 删到只剩 1 行时自动回到单账户并丢弃该行金额。
 */
export function useTransactionPaymentFields(
  initialPayments: readonly TransactionPayment[] | undefined,
) {
  const [payments, setPayments] = useState(() =>
    createInitialRows(initialPayments),
  );
  const nextKeyRef = useRef(payments.length + 1);
  const isMultiAccount = payments.length > 1;

  /** 展开为多账户时首行预填 `primaryAmount`，新增行金额留空，之后不再自动计算。 */
  function addPayment(primaryAmount: string) {
    const key = nextKeyRef.current;
    nextKeyRef.current += 1;
    setPayments((current) => [
      ...(current.length === 1
        ? [{ ...current[0]!, amount: primaryAmount }]
        : current),
      { accountId: "", amount: "", key },
    ]);
  }

  function removePayment(key: number) {
    setPayments((current) => {
      const remaining = current.filter((payment) => payment.key !== key);
      return remaining.length === 1
        ? [{ ...remaining[0]!, amount: "" }]
        : remaining;
    });
  }

  function changeAccount(key: number, accountId: string) {
    setPayments((current) =>
      current.map((payment) =>
        payment.key === key ? { ...payment, accountId } : payment,
      ),
    );
  }

  function changeAmount(key: number, amount: string) {
    setPayments((current) =>
      current.map((payment) =>
        payment.key === key ? { ...payment, amount } : payment,
      ),
    );
  }

  /** 交给 `validateTransactionPayments` 的付款明细，与表单提交字段一致。 */
  const submittedPayments: TransactionPayment[] = payments.map((payment) => ({
    accountId: payment.accountId,
    amount:
      isMultiAccount && payment.amount.trim() ? payment.amount.trim() : null,
  }));

  return {
    addPayment,
    changeAccount,
    changeAmount,
    isMultiAccount,
    payments,
    primaryAccountId: payments[0]?.accountId ?? "",
    removePayment,
    submittedPayments,
  };
}

/**
 * 付款行中可以选择的账户：未被其他行选中，且与首行币种一致（首行本身、首行未选时不限币种）。
 * 省略 `rowKey` 时按「新增一行」判断。
 */
export function isPaymentAccountSelectable({
  account,
  payments,
  primaryCurrency,
  rowKey,
}: {
  account: TransactionAccountOption;
  payments: readonly TransactionPaymentRow[];
  primaryCurrency: string | undefined;
  rowKey?: number;
}) {
  const isSelectedElsewhere = payments.some(
    (payment) => payment.key !== rowKey && payment.accountId === account.id,
  );
  if (isSelectedElsewhere) return false;
  const isPrimaryRow = rowKey !== undefined && payments[0]?.key === rowKey;
  return (
    isPrimaryRow || !primaryCurrency || account.currency === primaryCurrency
  );
}

/**
 * 「付款合计 / 明细合计」对账：按最小单位求和，避免浮点误差。
 * 金额无效或留空的行按 0 计入付款合计；这些行由提交时的
 * `validateTransactionPayments` 提示。
 */
export function reconcileTransactionPayments({
  currency,
  itemAmounts,
  payments,
}: {
  currency: string | undefined;
  itemAmounts: readonly string[];
  payments: readonly TransactionPaymentRow[];
}): TransactionPaymentReconciliation {
  const sumValidUnits = (amounts: readonly string[]) =>
    amounts.reduce((sum, amount) => {
      const units = isValidMoneyText(amount, { currency })
        ? toRefundMinorUnits(amount)
        : null;
      return units === null ? sum : sum + units;
    }, BigInt(0));
  const paymentUnits = sumValidUnits(payments.map((payment) => payment.amount));
  const itemUnits = sumValidUnits(itemAmounts);

  return {
    difference: formatRefundMinorUnits(itemUnits - paymentUnits),
    isBalanced: paymentUnits === itemUnits,
    itemTotal: formatRefundMinorUnits(itemUnits),
    paymentTotal: formatRefundMinorUnits(paymentUnits),
  };
}
