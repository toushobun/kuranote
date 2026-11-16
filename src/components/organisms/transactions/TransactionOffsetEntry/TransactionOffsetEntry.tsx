"use client";
import { createContext, useContext } from "react";
import UndoRounded from "@mui/icons-material/UndoRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import Alert from "@mui/material/Alert";
import type { TransactionOffsetEntry } from "internal/transaction";
import { formatTransactionMonthDay } from "utils/transactions";
import { offsetEntryMessages } from "config/transactionStepFlowMessages";
import { formatStepCurrencyAmount } from "../transactionStepFlowFormat";
import { offsetEntryCandidates } from "./offsetEntryDraft";

export const TransactionOffsetEntryContext =
  createContext<TransactionOffsetEntry | null>(null);
export const useTransactionOffsetEntry = () =>
  useContext(TransactionOffsetEntryContext);
export function TransactionOffsetEntryNotice() {
  const entry = useTransactionOffsetEntry();
  if (!entry) return null;
  const candidate = offsetEntryCandidates(entry)[0] ?? entry.candidates[0];
  return (
    <Alert
      severity="info"
      icon={entry.kind === "refund" ? <UndoRounded /> : <ReceiptLongRounded />}
      sx={{ mb: 1.5 }}
    >
      {offsetEntryMessages[entry.kind]}：
      {candidate
        ? `${candidate.merchantName ?? ""} ${formatTransactionMonthDay(candidate.transactionAt)} ${candidate.note?.trim() || candidate.categoryName} ${formatStepCurrencyAmount(candidate.amount, candidate.accountCurrency)}`
        : ""}
    </Alert>
  );
}
