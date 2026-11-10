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
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [picker, setPicker] = useState<TransferSide | null>(null);
  const [amountOpen, setAmountOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const dateTime = useLocalTransactionDateTime(initialValues?.transactionAt);
  const issueCheck = useReceiptIssueCheck();

  useDirtySnapshot(
    JSON.stringify([
      sourceId,
      targetId,
      amount,
      note,
      dateTime.transactionAtValue,
    ]),
    useEditTransactionDirty(),
    Boolean(dateTime.transactionAtValue),
  );

  const source = accountOptions.find((account) => account.id === sourceId);
  const target = accountOptions.find((account) => account.id === targetId);
  const currency = source?.currency ?? target?.currency ?? "";
  // 选账户抽屉里不显示另一边已选的账户，转出与转入不会相同。
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
    ...(source && target && source.currency !== target.currency
      ? [
          {
            id: "currency",
            message: t.currencyMismatch,
            onClick: () => setPicker("target"),
          },
        ]
      : []),
    ...(!isValidPositiveMoneyText(amount, { currency })
      ? [
          {
            id: "amount",
            message: amount.trim() ? t.invalidAmount : t.missingAmount,
            onClick: () => setAmountOpen(true),
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
    amount,
    note,
    dateTime,
    picker,
    setPicker,
    pickerAccounts,
    pickerSelectedAccount: picker === "source" ? source : target,
    selectAccount(account: TransactionAccountOption) {
      if (picker === "source") setSourceId(account.id);
      if (picker === "target") setTargetId(account.id);
      setPicker(null);
    },
    amountOpen,
    setAmountOpen,
    confirmAmount(value: string) {
      setAmount(value);
      setAmountOpen(false);
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
    /** 点保存时调用：记录当前所有问题，返回是否有问题。 */
    checkIssues() {
      const hasIssues = issues.length > 0;
      issueCheck.check(
        issues.map((issue) => issue.id),
        hasIssues && !readOnly,
      );
      return hasIssues;
    },
  };
}
