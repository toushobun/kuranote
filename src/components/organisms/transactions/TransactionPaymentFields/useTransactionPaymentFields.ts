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

/** 按最小单位换算金额；无效或留空时按 0 计。 */
function toValidMoneyUnits(amount: string, currency: string | undefined) {
  const units = isValidMoneyText(amount, { currency })
    ? toRefundMinorUnits(amount)
    : null;
  return units ?? BigInt(0);
}

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
 *
 * 多账户金额的自动分配（#930）按最小单位计算；参与计算的行金额无效或留空时按 0 计，
 * 与对账条的合计口径一致，无效输入仍由提交时的 `validateTransactionPayments` 提示。
 */
export function useTransactionPaymentFields(
  initialPayments: readonly TransactionPayment[] | undefined,
) {
  const [payments, setPayments] = useState(() =>
    createInitialRows(initialPayments),
  );
  const nextKeyRef = useRef(payments.length + 1);
  const isMultiAccount = payments.length > 1;

  /** 展开为多账户时首行预填 `primaryAmount`；新增行金额为 "0"，已有行不变。 */
  function addPayment(primaryAmount: string) {
    const key = nextKeyRef.current;
    nextKeyRef.current += 1;
    setPayments((current) => [
      ...(current.length === 1
        ? [{ ...current[0]!, amount: primaryAmount }]
        : current),
      { accountId: "", amount: "0", key },
    ]);
  }

  /** 被删行的金额加到上一行；删除首行时加到新的首行。 */
  function removePayment(key: number, currency: string | undefined) {
    setPayments((current) => {
      const removedIndex = current.findIndex((payment) => payment.key === key);
      if (removedIndex < 0) return current;
      const remaining = current.filter((payment) => payment.key !== key);
      if (remaining.length === 1) return [{ ...remaining[0]!, amount: "" }];
      const receiverIndex = Math.max(removedIndex - 1, 0);
      return remaining.map((payment, index) =>
        index === receiverIndex
          ? {
              ...payment,
              amount: formatRefundMinorUnits(
                toValidMoneyUnits(payment.amount, currency) +
                  toValidMoneyUnits(current[removedIndex]!.amount, currency),
              ),
            }
          : payment,
      );
    });
  }

  function changeAccount(key: number, accountId: string) {
    setPayments((current) =>
      current.map((payment) =>
        payment.key === key ? { ...payment, accountId } : payment,
      ),
    );
  }

  /** 输入过程中只更新本行金额，不联动其他行（#930）。 */
  function changeAmount(key: number, amount: string) {
    setPayments((current) =>
      current.map((payment) =>
        payment.key === key ? { ...payment, amount } : payment,
      ),
    );
  }

  /**
   * 确定第 i 行金额（输入框失焦）时，第 i+1 行 = 明细合计 − 其他所有行合计（负数取 0）；
   * 金额未变化也重新计算。确定最后一行时不联动，差额由对账条提示。
   */
  function commitAmount(
    key: number,
    {
      currency,
      itemTotal,
    }: { currency: string | undefined; itemTotal: string },
  ) {
    setPayments((current) => {
      const followingIndex =
        current.findIndex((payment) => payment.key === key) + 1;
      if (followingIndex <= 0 || followingIndex >= current.length) {
        return current;
      }
      const otherUnits = current.reduce(
        (sum, payment, index) =>
          index === followingIndex
            ? sum
            : sum + toValidMoneyUnits(payment.amount, currency),
        BigInt(0),
      );
      const remainingUnits =
        toValidMoneyUnits(itemTotal, currency) - otherUnits;
      const next = [...current];
      next[followingIndex] = {
        ...next[followingIndex]!,
        amount: formatRefundMinorUnits(
          remainingUnits > BigInt(0) ? remainingUnits : BigInt(0),
        ),
      };
      return next;
    });
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
    commitAmount,
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
 * 能否再添加一行付款账户：可选的同币种账户（`isPaymentAccountSelectable` 按新增一行判断）
 * 要多于尚未选择账户的行，否则新增行没有账户可选。
 */
export function canAddPaymentRow({
  accountOptions,
  payments,
  primaryCurrency,
}: {
  accountOptions: readonly TransactionAccountOption[];
  payments: readonly TransactionPaymentRow[];
  primaryCurrency: string | undefined;
}) {
  const selectableCount = accountOptions.filter((account) =>
    isPaymentAccountSelectable({ account, payments, primaryCurrency }),
  ).length;
  const unselectedRowCount = payments.filter(
    (payment) => !payment.accountId,
  ).length;
  return selectableCount > unselectedRowCount;
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
    amounts.reduce(
      (sum, amount) => sum + toValidMoneyUnits(amount, currency),
      BigInt(0),
    );
  const paymentUnits = sumValidUnits(payments.map((payment) => payment.amount));
  const itemUnits = sumValidUnits(itemAmounts);

  return {
    difference: formatRefundMinorUnits(itemUnits - paymentUnits),
    isBalanced: paymentUnits === itemUnits,
    itemTotal: formatRefundMinorUnits(itemUnits),
    paymentTotal: formatRefundMinorUnits(paymentUnits),
  };
}
