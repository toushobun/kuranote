"use client";
import { useState, type ChangeEvent } from "react";

import { transferReceiptMessages as t } from "config/transactionStepFlowMessages";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";
import type { ReceiptIssue } from "organisms/transactions/ReceiptParts/ReceiptIssueAlerts";
import { useLocalTransactionDateTime } from "organisms/transactions/ReceiptParts/useLocalTransactionDateTime";
import { useReceiptIssueCheck } from "organisms/transactions/ReceiptParts/useReceiptIssueCheck";
import type {
  TransactionAccountOption,
  TransferEditInitialValues,
} from "types/transactions";
import { isValidPositiveMoneyText } from "utils/transactionAmountInput";

import { useEditTransactionDirty } from "../EditTransactionDirtyContext/EditTransactionDirtyContext";
import {
  calculateTransferRate,
  transferAmountsAfterAccountChange,
} from "./transferCurrency";

export type TransferSide = "source" | "target";

export function useTransferReceipt({
  accountOptions,
  initialValues,
  readOnly,
}: {
  accountOptions: readonly TransactionAccountOption[];
  initialValues?: TransferEditInitialValues;
  readOnly: boolean;
}) {
  const [sourceId, setSourceId] = useState(initialValues?.accountId ?? "");
  const [targetId, setTargetId] = useState(
    initialValues?.transferTargetAccountId ?? "",
  );
  const [amount, setAmount] = useState(initialValues?.transferAmount ?? "");
  const [transferTargetAmount, setTransferTargetAmount] = useState(() => {
    const sourceCurrency = accountOptions.find(
      (account) => account.id === initialValues?.accountId,
    )?.currency;
    const targetCurrency = accountOptions.find(
      (account) => account.id === initialValues?.transferTargetAccountId,
    )?.currency;
    // 同币种不展示第二笔金额，也不能让隐藏的初始值触发误报未保存。
    return sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency
      ? (initialValues?.transferTargetAmount ?? "")
      : "";
  });
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [picker, setPicker] = useState<TransferSide | null>(null);
  const [amountSide, setAmountSide] = useState<TransferSide | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const dateTime = useLocalTransactionDateTime(initialValues?.transactionAt);

  useDirtySnapshot(
    JSON.stringify([
      sourceId,
      targetId,
      amount,
      transferTargetAmount,
      note,
      dateTime.transactionAtValue,
    ]),
    useEditTransactionDirty(),
    Boolean(dateTime.transactionAtValue),
  );

  const source = accountOptions.find((account) => account.id === sourceId);
  const target = accountOptions.find((account) => account.id === targetId);
  const currency = source?.currency ?? target?.currency ?? "";
  const targetCurrency = target?.currency ?? "";
  const crossCurrency =
    !!source && !!target && source.currency !== target.currency;
  const rate = crossCurrency
    ? calculateTransferRate(
        amount,
        transferTargetAmount,
        currency,
        targetCurrency,
      )
    : null;
  const pickerAccounts = accountOptions.filter(
    (account) => account.id !== (picker === "source" ? targetId : sourceId),
  );

  const issues: ReceiptIssue[] = [
    ...(!source
      ? [
          {
            id: "source",
            message: t.missingSource,
            onClick: () => setPicker("source"),
          },
        ]
      : []),
    ...(!target
      ? [
          {
            id: "target",
            message: t.missingTarget,
            onClick: () => setPicker("target"),
          },
        ]
      : []),
    ...(!isValidPositiveMoneyText(amount, { currency })
      ? [
          {
            id: "amount",
            message: amount.trim()
              ? crossCurrency
                ? t.invalidSourceAmount
                : t.invalidAmount
              : crossCurrency
                ? t.missingSourceAmount
                : t.missingAmount,
            onClick: () => setAmountSide("source"),
          },
        ]
      : []),
    ...(crossCurrency &&
    !isValidPositiveMoneyText(transferTargetAmount, {
      currency: targetCurrency,
    })
      ? [
          {
            id: "targetAmount",
            message: transferTargetAmount.trim()
              ? t.invalidTargetAmount
              : t.missingTargetAmount,
            onClick: () => setAmountSide("target"),
          },
        ]
      : []),
    ...(!dateTime.transactionAtValue
      ? [
          {
            id: "time",
            message: m.invalidTime,
            onClick: () => setTimeOpen(true),
          },
        ]
      : []),
  ];
  const issueCheck = useReceiptIssueCheck(issues.map((issue) => issue.id));
  const visibleIssues = issues.filter((issue) =>
    issueCheck.isChecked(issue.id),
  );
  const isMarked = (id: string) =>
    visibleIssues.some((issue) => issue.id === id);

  return {
    source,
    target,
    sourceId,
    targetId,
    currency,
    targetCurrency,
    crossCurrency,
    amount,
    transferTargetAmount,
    rate,
    note,
    dateTime,
    picker,
    setPicker,
    pickerAccounts,
    pickerSelectedAccount: picker === "source" ? source : target,
    selectAccount(account: TransactionAccountOption) {
      if (!picker) return;
      const next = transferAmountsAfterAccountChange({
        changedSide: picker,
        sourceCurrency: source?.currency ?? "",
        targetCurrency: target?.currency ?? "",
        nextCurrency: account.currency,
        amount,
        targetAmount: transferTargetAmount,
      });
      setAmount(next.amount);
      setTransferTargetAmount(next.targetAmount);
      if (picker === "source") setSourceId(account.id);
      else setTargetId(account.id);
      setPicker(null);
    },
    amountSide,
    setAmountSide,
    confirmAmount(value: string) {
      if (amountSide === "target") setTransferTargetAmount(value);
      else setAmount(value);
      setAmountSide(null);
    },
    timeOpen,
    setTimeOpen,
    handleNoteChange(
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) {
      setNote(event.target.value);
    },
    visibleIssues,
    isMarked,
    pulseCount: issueCheck.pulseCount,
    firstIssueRef: issueCheck.firstIssueRef,
    checkIssues() {
      const hasIssues = issues.length > 0;
      issueCheck.check(hasIssues && !readOnly);
      return hasIssues;
    },
  };
}
