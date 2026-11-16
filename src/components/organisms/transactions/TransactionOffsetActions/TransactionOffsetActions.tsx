"use client";
import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import UndoRounded from "@mui/icons-material/UndoRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import { routePaths } from "config/paths";
import { offsetEntryMessages } from "config/transactionStepFlowMessages";
import { receiptSectionSx } from "../ReceiptParts/receiptStyles";
import type { TransactionFormInitialValues } from "../TransactionForm/TransactionForm.types";

export function TransactionOffsetActions({
  initialValues,
  canWriteTransactions,
  transactionItemSpecialStatusEnabled,
}: {
  initialValues: Omit<TransactionFormInitialValues, "type"> & {
    type:
      | TransactionFormInitialValues["type"]
      | "transfer"
      | "balance_adjustment";
  };
  canWriteTransactions: boolean;
  transactionItemSpecialStatusEnabled: boolean;
}) {
  if (
    !canWriteTransactions ||
    !transactionItemSpecialStatusEnabled ||
    initialValues.type !== "expense" ||
    !initialValues.transactionRecordId
  )
    return null;
  const pending = initialValues.items.some(
    (item) => item.specialStatus === "pendingReimbursement",
  );
  const href = (kind: "refund" | "reimbursement") =>
    `${routePaths.transactions}/new?${kind}From=${encodeURIComponent(initialValues.transactionRecordId!)}`;
  return (
    <Stack
      direction="row"
      sx={{ ...receiptSectionSx, justifyContent: "space-around" }}
    >
      <Button
        component={Link}
        href={href("refund")}
        startIcon={<UndoRounded />}
        fullWidth
      >
        {offsetEntryMessages.refund}
      </Button>
      {pending && (
        <Button
          component={Link}
          href={href("reimbursement")}
          startIcon={<ReceiptLongRounded />}
          fullWidth
        >
          {offsetEntryMessages.reimbursement}
        </Button>
      )}
    </Stack>
  );
}
